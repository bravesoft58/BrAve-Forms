"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// BF-56: one stable inspector QR per project. Admin-only in two places:
// the role check here (lessons-learned: admin UI must check server-side) and
// the qr_tokens write policies (org admins and super admins only).

export type StableQrResult = {
  token?: string;
  issuedAt?: string;
  error?: string;
};

const NOT_ADMIN = "Only project administrators can manage the inspector QR code.";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." } as const;
  if (user.role !== "admin") return { error: NOT_ADMIN } as const;
  return { user } as const;
}

type Db = Awaited<ReturnType<typeof createClient>>;

async function findActiveStable(supabase: Db, projectId: string) {
  return supabase
    .from("qr_tokens")
    .select("token, created_at")
    .eq("project_id", projectId)
    .is("expires_at", null)
    .is("revoked_at", null)
    .maybeSingle();
}

async function insertStable(supabase: Db, projectId: string, userId: string) {
  return supabase
    .from("qr_tokens")
    .insert({ project_id: projectId, expires_at: null, created_by: userId })
    .select("token, created_at")
    .single();
}

/** Returns the project's stable QR token, creating it the first time. */
export async function getOrCreateStableQrToken(
  projectId: string,
): Promise<StableQrResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const supabase = await createClient();

  const existing = await findActiveStable(supabase, projectId);
  if (existing.error) return { error: existing.error.message };
  if (existing.data) {
    return { token: existing.data.token, issuedAt: existing.data.created_at };
  }

  const created = await insertStable(supabase, projectId, auth.user.id);
  if (created.error) {
    // 23505: another admin created it between our read and insert.
    if (created.error.code === "23505") {
      const again = await findActiveStable(supabase, projectId);
      if (again.data) return { token: again.data.token, issuedAt: again.data.created_at };
    }
    return { error: created.error.message };
  }
  return { token: created.data.token, issuedAt: created.data.created_at };
}

/**
 * Revokes every active token on the project (the stable code and any legacy
 * 30-day codes) and issues a new stable code, atomically, in the
 * reissue_inspector_qr database function. `expectedToken` is the code the
 * admin was looking at: if it is no longer the current one (a retry, or
 * another admin reissued first) nothing is revoked and the current code is
 * returned. Open inspector sessions end on their next page load, because the
 * portal re-checks the token each time.
 */
export async function revokeAndReissueQrToken(
  projectId: string,
  expectedToken: string,
): Promise<StableQrResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("reissue_inspector_qr", {
      p_project_id: projectId,
      p_expected_token: expectedToken,
    })
    .single<{ qr_token: string; issued_at: string; reissued: boolean }>();

  if (error) return { error: error.code === "42501" ? NOT_ADMIN : error.message };
  return { token: data.qr_token, issuedAt: data.issued_at };
}
