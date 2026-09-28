"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import {
  insertSubmissionOnce,
  readClientKey,
  readVersion,
  updateSubmissionIfUnchanged,
} from "@/lib/forms/submission-writes";
import { ndepStormwaterSchema, parseNdepStormwaterForm } from "@/lib/schemas/ndep-stormwater";

export type NdepStormwaterState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

const FORM_TYPE = "ndep_weekly_stormwater";

export async function submitNdepStormwater(
  _prevState: NdepStormwaterState,
  formData: FormData
): Promise<NdepStormwaterState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const raw = parseNdepStormwaterForm(formData);
  const result = ndepStormwaterSchema.safeParse(raw);

  if (!result.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: collectFieldErrors(result.error.issues),
    };
  }

  const data = result.data;
  const supabase = await createClient();

  const saved = await insertSubmissionOnce(
    supabase,
    { project_id: projectId, form_type: FORM_TYPE, data, form_date: data.inspection_date, submitted_by: user.id },
    readClientKey(formData),
  );
  if (!saved.ok) {
    return { error: saved.error };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}?tab=${FORM_TYPE}`);
}

export async function updateNdepStormwater(
  submissionId: string,
  _prevState: NdepStormwaterState,
  formData: FormData,
): Promise<NdepStormwaterState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("submitted_by")
    .eq("id", submissionId)
    .eq("project_id", projectId)
    .eq("form_type", FORM_TYPE)
    .maybeSingle();

  if (!existing) {
    return { error: "Submission not found." };
  }

  if (user.role !== "admin" && existing.submitted_by !== user.id) {
    return { error: "You can only edit submissions you created." };
  }

  const raw = parseNdepStormwaterForm(formData);
  const result = ndepStormwaterSchema.safeParse(raw);

  if (!result.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: collectFieldErrors(result.error.issues),
    };
  }

  const data = result.data;

  const saved = await updateSubmissionIfUnchanged(
    supabase,
    { id: submissionId, project_id: projectId, form_type: FORM_TYPE },
    { data, form_date: data.inspection_date },
    readVersion(formData),
  );
  if (!saved.ok) {
    return { error: saved.error };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/forms/ndep-stormwater/${submissionId}`);
  redirect(`/dashboard/projects/${projectId}/forms/ndep-stormwater/${submissionId}`);
}
