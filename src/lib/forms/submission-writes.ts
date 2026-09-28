import type { createClient } from "@/lib/supabase/server";
import { sameData } from "@/lib/forms/same-data";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WriteResult = { ok: true; id: string; replay: boolean } | { ok: false; error: string };

export const DUPLICATE_KEY_INDEX = "form_submissions_submitter_client_key";
export const ALREADY_SAVED_ERROR =
  "This inspection was already saved. Open it from the project's form list to make changes.";
export const CONFLICT_ERROR = "This submission changed since you opened it. Reload to see the latest version.";
export const FORBIDDEN_ERROR = "You do not have permission to edit this submission.";
export const APPEND_ALREADY_SAVED_ERROR =
  "These entries were already saved, and what you sent now is different. Open the log to check them, then add any changes as new entries.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The submit's idempotency key from the form, or null when absent or malformed (old browser bundle). */
export function readClientKey(formData: FormData): string | null {
  const value = formData.get("client_key");
  return typeof value === "string" && UUID.test(value) ? value : null;
}

/** The form's loaded `updated_at`, exactly as the database printed it (never via Date: microseconds). */
export function readVersion(formData: FormData): string | null {
  const value = formData.get("version");
  return typeof value === "string" && value !== "" ? value : null;
}

// What the database will store: JSON drops undefined-valued keys, so compare
// against the JSON form of what was sent, not the parsed object.
const asStored = (data: unknown): unknown => JSON.parse(JSON.stringify(data));

/**
 * Dust-log append retry check (BF-65). "new": nothing is saved under this key
 * yet. "replay": the entries saved under it are exactly the ones being sent
 * again, so the first attempt landed. "changed": the key was used, but the user
 * edited the entries before resending (the form stays up after a lost reply);
 * that must be refused, never reported as saved.
 */
export function appendRetryState(
  existingEntries: readonly unknown[],
  newEntries: readonly unknown[],
  appendKey: string | null,
): "new" | "replay" | "changed" {
  if (!appendKey) return "new";
  const saved = existingEntries.filter((entry) => (entry as { append_key?: unknown })?.append_key === appendKey);
  if (saved.length === 0) return "new";
  return sameData(saved, asStored(newEntries)) ? "replay" : "changed";
}

export interface NewSubmission {
  project_id: string;
  form_type: string;
  form_date: string;
  submitted_by: string;
  data: unknown;
}

/**
 * Inserts a new submission once per client key (BF-65). A retry whose first
 * attempt already committed hits the unique index and gets the saved row back
 * as a replay. The same key with different content is refused, never merged
 * or dropped silently. Without a key it inserts as before.
 */
export async function insertSubmissionOnce(
  supabase: Supabase,
  row: NewSubmission,
  clientKey: string | null,
): Promise<WriteResult> {
  const { data: inserted, error } = await supabase
    .from("form_submissions")
    .insert({ ...row, status: "submitted", submitted_at: new Date().toISOString(), client_key: clientKey })
    .select("id")
    .single();

  if (inserted) return { ok: true, id: inserted.id, replay: false };
  if (!clientKey || error?.code !== "23505" || !error.message.includes(DUPLICATE_KEY_INDEX)) {
    return { ok: false, error: error?.message ?? "Failed to create submission." };
  }

  const { data: saved } = await supabase
    .from("form_submissions")
    .select("id, project_id, form_type, form_date, data")
    .eq("submitted_by", row.submitted_by)
    .eq("client_key", clientKey)
    .maybeSingle();

  const isRetry =
    saved &&
    saved.project_id === row.project_id &&
    saved.form_type === row.form_type &&
    saved.form_date === row.form_date &&
    sameData(saved.data, asStored(row.data));
  return isRetry ? { ok: true, id: saved.id, replay: true } : { ok: false, error: ALREADY_SAVED_ERROR };
}

export interface SubmissionTarget {
  id: string;
  project_id: string;
  form_type: string;
}

/**
 * Updates a submission only if it is unchanged since the form loaded it
 * (BF-61). Zero rows back means one of three things, told apart by re-reading
 * the row: not visible or not editable by this user, a retry of this same
 * save that already landed (success), or someone else saved first (conflict).
 * Without a version (old browser bundle) it updates as before.
 */
export async function updateSubmissionIfUnchanged(
  supabase: Supabase,
  target: SubmissionTarget,
  patch: { data: unknown; form_date: string },
  version: string | null,
): Promise<WriteResult> {
  let update = supabase
    .from("form_submissions")
    .update(patch)
    .eq("id", target.id)
    .eq("project_id", target.project_id)
    .eq("form_type", target.form_type);
  if (version) update = update.eq("updated_at", version);

  // An RLS-denied UPDATE affects zero rows without raising, hence the read-back.
  const { data: updated, error } = await update.select("id").maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (updated) return { ok: true, id: updated.id, replay: false };
  if (!version) return { ok: false, error: FORBIDDEN_ERROR };

  const { data: current } = await supabase
    .from("form_submissions")
    .select("updated_at, form_date, data")
    .eq("id", target.id)
    .eq("project_id", target.project_id)
    .eq("form_type", target.form_type)
    .maybeSingle();

  if (!current || current.updated_at === version) return { ok: false, error: FORBIDDEN_ERROR };
  if (current.form_date === patch.form_date && sameData(current.data, asStored(patch.data))) {
    return { ok: true, id: target.id, replay: true };
  }
  return { ok: false, error: CONFLICT_ERROR };
}
