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
import { ndotStormwaterSchema, parseNdotStormwaterForm } from "@/lib/schemas/ndot-stormwater";

export type NdotStormwaterState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitNdotStormwater(
  _prevState: NdotStormwaterState,
  formData: FormData
): Promise<NdotStormwaterState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const raw = parseNdotStormwaterForm(formData);
  const result = ndotStormwaterSchema.safeParse(raw);

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
    { project_id: projectId, form_type: "ndot_weekly_stormwater", data, form_date: data.inspection_date, submitted_by: user.id },
    readClientKey(formData),
  );
  if (!saved.ok) {
    return { error: saved.error };
  }

  // Insert photo records into form_photos table (best-effort — form data JSONB is the source of truth).
  // A replay's first attempt already wrote them.
  if (!saved.replay && data.photos.length > 0) {
    const photoRows = data.photos.map((p) => ({
      submission_id: saved.id,
      file_path: p.file_name,
      caption: p.caption || null,
    }));
    await supabase.from("form_photos").insert(photoRows);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}?tab=ndot_weekly_stormwater`);
}

export async function updateNdotStormwater(
  submissionId: string,
  _prevState: NdotStormwaterState,
  formData: FormData,
): Promise<NdotStormwaterState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const supabasePre = await createClient();
  const { data: existing } = await supabasePre
    .from("form_submissions")
    .select("submitted_by")
    .eq("id", submissionId)
    .maybeSingle();

  if (!existing) {
    return { error: "Submission not found." };
  }

  if (user.role !== "admin" && existing.submitted_by !== user.id) {
    return { error: "You can only edit submissions you created." };
  }

  const raw = parseNdotStormwaterForm(formData);
  const result = ndotStormwaterSchema.safeParse(raw);

  if (!result.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: collectFieldErrors(result.error.issues),
    };
  }

  const data = result.data;
  const supabase = supabasePre;

  const saved = await updateSubmissionIfUnchanged(
    supabase,
    { id: submissionId, project_id: projectId, form_type: "ndot_weekly_stormwater" },
    { data, form_date: data.inspection_date },
    readVersion(formData),
  );
  if (!saved.ok) {
    return { error: saved.error };
  }

  // Replace photo rows so deletes propagate. JSONB stays authoritative.
  // A replay's first attempt already replaced them.
  if (!saved.replay) {
    await supabase.from("form_photos").delete().eq("submission_id", submissionId);
  }
  if (!saved.replay && data.photos.length > 0) {
    const photoRows = data.photos.map((p) => ({
      submission_id: submissionId,
      file_path: p.file_name,
      caption: p.caption || null,
    }));
    await supabase.from("form_photos").insert(photoRows);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/forms/ndot-stormwater/${submissionId}`);
  redirect(`/dashboard/projects/${projectId}/forms/ndot-stormwater/${submissionId}`);
}
