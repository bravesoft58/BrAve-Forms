"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import {
  parseWaterwaysForm,
  readProjectSites,
  resolveSite,
  waterwaysSchema,
  type WaterwaysData,
} from "@/lib/schemas/waterways";

export type WaterwaysState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

const FORM_TYPE = "working_in_waterways";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function loadProjectSites(supabase: Supabase, projectId: string) {
  const { data } = await supabase
    .from("projects")
    .select("waterway_sites")
    .eq("id", projectId)
    .maybeSingle();
  return data ? readProjectSites(data.waterway_sites) : null;
}

// form_photos mirrors data.photos for queries by photo; the JSONB copy stays
// authoritative, so a failure here does not fail the submission (as NDOT).
async function replacePhotoRows(supabase: Supabase, submissionId: string, data: WaterwaysData) {
  await supabase.from("form_photos").delete().eq("submission_id", submissionId);
  await supabase.from("form_photos").insert(
    data.photos.map((p) => ({
      submission_id: submissionId,
      file_path: p.file_name,
      caption: p.caption || null,
    })),
  );
}

const SITE_ERROR = {
  error: "Please fix the errors below.",
  fieldErrors: { site_name: ["Select one of the project's waterway sites"] },
};

export async function submitWaterways(
  _prevState: WaterwaysState,
  formData: FormData,
): Promise<WaterwaysState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const projectId = formData.get("project_id") as string;
  if (!projectId) return { error: "Missing project ID." };

  const result = waterwaysSchema.safeParse(parseWaterwaysForm(formData));
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(result.error.issues) };
  }

  const supabase = await createClient();
  const sites = await loadProjectSites(supabase, projectId);
  if (!sites) return { error: "Project not found." };

  const site = resolveSite(result.data.site_name, sites);
  if (!site) return SITE_ERROR;

  const data: WaterwaysData = { ...result.data, site_name: site.name, site_descriptor: site.descriptor };

  const { data: submission, error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      project_id: projectId,
      form_type: FORM_TYPE,
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

  await replacePhotoRows(supabase, submission.id, data);

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}?tab=${FORM_TYPE}`);
}

export async function updateWaterways(
  submissionId: string,
  _prevState: WaterwaysState,
  formData: FormData,
): Promise<WaterwaysState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const projectId = formData.get("project_id") as string;
  if (!projectId) return { error: "Missing project ID." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("form_submissions")
    .select("submitted_by, data")
    .eq("id", submissionId)
    .eq("project_id", projectId)
    .eq("form_type", FORM_TYPE)
    .maybeSingle();

  if (!existing) return { error: "Submission not found." };
  if (user.role !== "admin" && existing.submitted_by !== user.id) {
    return { error: "You can only edit submissions you created." };
  }

  const result = waterwaysSchema.safeParse(parseWaterwaysForm(formData));
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(result.error.issues) };
  }

  const sites = await loadProjectSites(supabase, projectId);
  if (!sites) return { error: "Project not found." };

  const stored = existing.data as Partial<WaterwaysData> | null;
  const snapshot = stored?.site_name
    ? { name: stored.site_name, descriptor: stored.site_descriptor ?? "" }
    : undefined;
  const site = resolveSite(result.data.site_name, sites, snapshot);
  if (!site) return SITE_ERROR;

  const data: WaterwaysData = { ...result.data, site_name: site.name, site_descriptor: site.descriptor };

  // An RLS-denied UPDATE affects zero rows without raising, so select the row back
  // and treat "nothing came back" as a rejection rather than a silent no-op.
  const { data: updated, error: updateError } = await supabase
    .from("form_submissions")
    .update({ data, form_date: data.inspection_date })
    .eq("id", submissionId)
    .eq("project_id", projectId)
    .eq("form_type", FORM_TYPE)
    .select("id")
    .maybeSingle();

  if (updateError) return { error: updateError.message };
  if (!updated) return { error: "You do not have permission to edit this submission." };

  await replacePhotoRows(supabase, submissionId, data);

  const viewPath = `/dashboard/projects/${projectId}/forms/working-in-waterways/${submissionId}`;
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(viewPath);
  redirect(viewPath);
}
