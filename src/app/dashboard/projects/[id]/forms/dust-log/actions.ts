"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { collectFieldErrors } from "@/lib/forms/field-errors";
import {
  APPEND_ALREADY_SAVED_ERROR,
  appendRetryState,
  FORBIDDEN_ERROR,
  insertSubmissionOnce,
  readClientKey,
} from "@/lib/forms/submission-writes";
import { dustLogSchema, parseDustLogForm } from "@/lib/schemas/dust-log";

export type DustLogState = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

const FORM_TYPE = "daily_dust_log";

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

  const saved = await insertSubmissionOnce(
    supabase,
    { project_id: projectId, form_type: FORM_TYPE, data: entries, form_date: entries[0].date, submitted_by: user.id },
    readClientKey(formData),
  );
  if (!saved.ok) {
    return { error: saved.error };
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

  // BF-65: each appended entry carries the submit's key, so a retry whose first
  // attempt landed finds its own entries already there and adds nothing. A
  // retry with edited entries is refused rather than reported as saved.
  const appendKey = readClientKey(formData);
  const newEntries = appendKey
    ? result.data.entries.map((entry) => ({ ...entry, append_key: appendKey }))
    : result.data.entries;
  const supabase = await createClient();
  const readLog = () =>
    supabase
      .from("form_submissions")
      .select("data, updated_at")
      .eq("id", submissionId)
      .eq("project_id", projectId)
      .eq("form_type", FORM_TYPE)
      .maybeSingle();

  // BF-61: the update only applies to the version just read. Appends from two
  // people never contradict each other, so on a concurrent change read and
  // merge once more instead of refusing.
  let appended = false;
  for (let attempt = 0; attempt < 2 && !appended; attempt++) {
    const { data: existing } = await readLog();
    if (!existing) return { error: "Submission not found." };

    const existingEntries: unknown[] = Array.isArray(existing.data) ? existing.data : [];
    const retry = appendRetryState(existingEntries, newEntries, appendKey);
    if (retry === "replay") break;
    if (retry === "changed") return { error: APPEND_ALREADY_SAVED_ERROR };

    const { data: updated, error: updateError } = await supabase
      .from("form_submissions")
      .update({ data: [...existingEntries, ...newEntries] })
      .eq("id", submissionId)
      .eq("updated_at", existing.updated_at)
      .select("id")
      .maybeSingle();
    if (updateError) return { error: updateError.message };
    appended = Boolean(updated);

    // Zero rows with the version unchanged means RLS refused the update.
    if (!appended && (await readLog()).data?.updated_at === existing.updated_at) {
      return { error: FORBIDDEN_ERROR };
    }
    if (!appended && attempt === 1) {
      return { error: "The log changed while saving. Please try again." };
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}/forms/dust-log/${submissionId}`);
}
