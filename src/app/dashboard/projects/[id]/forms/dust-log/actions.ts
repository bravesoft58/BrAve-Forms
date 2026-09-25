"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import { dustLogSchema, parseDustLogForm } from "@/lib/schemas/dust-log";

export type DustLogState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitDustLog(
  _prevState: DustLogState,
  formData: FormData
): Promise<DustLogState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  if (!projectId) {
    return { error: "Missing project ID." };
  }

  const raw = parseDustLogForm(formData);
  const result = dustLogSchema.safeParse(raw);

  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(result.error.issues) };
  }

  const { entries } = result.data;
  const supabase = await createClient();

  const { error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      project_id: projectId,
      form_type: "daily_dust_log",
      data: entries,
      form_date: entries[0].date,
      status: "submitted",
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}?tab=daily_dust_log`);
}

export async function appendDustLogEntries(
  _prevState: DustLogState,
  formData: FormData
): Promise<DustLogState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const projectId = formData.get("project_id") as string;
  const submissionId = formData.get("submission_id") as string;
  if (!projectId || !submissionId) {
    return { error: "Missing project or submission ID." };
  }

  const raw = parseDustLogForm(formData);
  const result = dustLogSchema.safeParse(raw);

  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(result.error.issues) };
  }

  const { entries: newEntries } = result.data;
  const supabase = await createClient();

  // Fetch existing submission to get current entries
  const { data: existing, error: fetchError } = await supabase
    .from("form_submissions")
    .select("data")
    .eq("id", submissionId)
    .single();

  if (fetchError || !existing) {
    return { error: "Submission not found." };
  }

  const existingEntries = Array.isArray(existing.data) ? existing.data : [];
  const merged = [...existingEntries, ...newEntries];

  const { error: updateError } = await supabase
    .from("form_submissions")
    .update({
      data: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}/forms/dust-log/${submissionId}`);
}
