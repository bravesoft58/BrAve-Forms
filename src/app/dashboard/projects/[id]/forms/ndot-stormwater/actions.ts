"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ndotStormwaterSchema, parseNdotStormwaterForm } from "@/lib/schemas/ndot-stormwater";

export type NdotStormwaterState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

function collectFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

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

  const { data: submission, error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      project_id: projectId,
      form_type: "ndot_weekly_stormwater",
      data,
      form_date: data.inspection_date,
      status: "submitted",
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !submission) {
    return { error: insertError?.message ?? "Failed to create submission." };
  }

  // Insert photo records into form_photos table (best-effort — form data JSONB is the source of truth)
  if (data.photos.length > 0) {
    const photoRows = data.photos.map((p) => ({
      submission_id: submission.id,
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

  const { error: updateError } = await supabase
    .from("form_submissions")
    .update({
      data,
      form_date: data.inspection_date,
    })
    .eq("id", submissionId)
    .eq("project_id", projectId)
    .eq("form_type", "ndot_weekly_stormwater");

  if (updateError) {
    return { error: updateError.message };
  }

  // Replace photo rows so deletes propagate. JSONB stays authoritative.
  await supabase.from("form_photos").delete().eq("submission_id", submissionId);
  if (data.photos.length > 0) {
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
