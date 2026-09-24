import { createServiceClient } from "@/lib/supabase/service";
import { INSPECTOR_SESSION_HOURS } from "@/lib/inspector/constants";

// BF-56: the printed QR token is only an entry point. Scanning it mints an
// inspector_sessions row; the portal is gated on that session, and every
// portal load re-checks the token too, so revoking a token ends its sessions.
// Service client only: inspector_sessions has RLS on with no policies.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return !!value && UUID_RE.test(value);
}

interface TokenRow {
  id: string;
  project_id: string;
  expires_at: string | null;
  revoked_at: string | null;
}

/** Stable tokens (expires_at NULL) never lapse; legacy tokens lapse at expires_at. */
function tokenIsUsable(token: TokenRow, now: Date): boolean {
  if (token.revoked_at) return false;
  return token.expires_at === null || new Date(token.expires_at) > now;
}

/**
 * Validates a scanned QR token and opens a session for it.
 * Returns the new session id, or null when the token is unknown, revoked or
 * expired. Never consumes the token: link previewers issue GETs too.
 */
export async function openSessionForToken(token: string): Promise<string | null> {
  if (!isUuid(token)) return null;
  const supabase = createServiceClient();

  const { data: row, error } = await supabase
    .from("qr_tokens")
    .select("id, project_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle<TokenRow>();

  if (error) {
    console.error("[inspector] Token lookup failed:", error.message);
    return null;
  }
  if (!row || !tokenIsUsable(row, new Date())) return null;

  const expiresAt = new Date(Date.now() + INSPECTOR_SESSION_HOURS * 3600 * 1000);
  const { data: session, error: insertError } = await supabase
    .from("inspector_sessions")
    .insert({ qr_token_id: row.id, expires_at: expiresAt.toISOString() })
    .select("id")
    .single();

  if (insertError || !session) {
    console.error("[inspector] Session insert failed:", insertError?.message);
    return null;
  }
  return session.id;
}

export interface ActiveSession {
  projectId: string;
  expiresAt: Date;
}

/**
 * Resolves a session cookie to its project and expiry. Null when the session
 * is missing or expired, or when its token has since been revoked or expired.
 */
export async function getActiveSession(
  sessionId: string | undefined,
): Promise<ActiveSession | null> {
  if (!isUuid(sessionId)) return null;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("inspector_sessions")
    .select("expires_at, qr_tokens!inner(id, project_id, expires_at, revoked_at)")
    .eq("id", sessionId)
    .maybeSingle<{ expires_at: string; qr_tokens: TokenRow }>();

  if (error) {
    console.error("[inspector] Session lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  if (expiresAt <= now) return null;
  if (!tokenIsUsable(data.qr_tokens, now)) return null;
  return { projectId: data.qr_tokens.project_id, expiresAt };
}

/** Longest a portal file link may live: one hour, never past the session. */
const MAX_SIGNED_URL_SEC = 3600;

export function signedUrlTtlSec(session: ActiveSession, now = Date.now()): number {
  const remaining = Math.floor((session.expiresAt.getTime() - now) / 1000);
  return Math.max(1, Math.min(MAX_SIGNED_URL_SEC, remaining));
}
