"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ndepStormwaterSchema, parseNdepStormwaterForm } from "@/lib/schemas/ndep-stormwater";

export type NdepStormwaterState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

const FORM_TYPE = "ndep_weekly_stormwater";

function collectFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

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

  const { error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      project_id: projectId,
      form_type: FORM_TYPE,
      data,
      form_date: data.inspection_date,
      status: "submitted",
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    });

  if (insertError) {
    return { error: insertError.message };
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

  // An RLS-denied UPDATE affects zero rows without raising, so select the row back
  // and treat "nothing came back" as a rejection rather than a silent no-op.
  const { data: updated, error: updateError } = await supabase
    .from("form_submissions")
    .update({
      data,
      form_date: data.inspection_date,
    })
    .eq("id", submissionId)
    .eq("project_id", projectId)
    .eq("form_type", FORM_TYPE)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }
  if (!updated) {
    return { error: "You do not have permission to edit this submission." };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/forms/ndep-stormwater/${submissionId}`);
  redirect(`/dashboard/projects/${projectId}/forms/ndep-stormwater/${submissionId}`);
}
