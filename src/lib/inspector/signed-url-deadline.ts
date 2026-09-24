// BF-56: signed file URL lifetimes for the inspector portal. Pure functions,
// no imports, so the deadline rules can be tested directly under Node.

/** Longest a portal file link may live: one hour, never past the access deadline. */
const MAX_SIGNED_URL_SEC = 3600;

/**
 * Storage stamps a signed URL's expiry when its server signs it, not when we
 * pick the lifetime, so signing latency pushes the expiry later. Leave this
 * much headroom; `signedUrlWithin` catches anything that still overruns.
 */
const SIGNING_MARGIN_SEC = 10;

/**
 * Signed-URL lifetime computed at the moment of signing, from the absolute
 * deadline. Null when too little access remains to sign safely, so the caller
 * signs nothing rather than overrunning.
 */
export function signedUrlTtlSec(accessUntil: Date, now = Date.now()): number | null {
  const remaining = Math.floor((accessUntil.getTime() - now) / 1000) - SIGNING_MARGIN_SEC;
  if (remaining < 1) return null;
  return Math.min(MAX_SIGNED_URL_SEC, remaining);
}

/**
 * True when a Supabase signed URL's own expiry (the `exp` claim of its
 * `token` query parameter) is no later than `accessUntil`. Fails closed:
 * anything unparsable counts as overrunning.
 */
export function signedUrlWithin(url: string | null | undefined, accessUntil: Date): boolean {
  if (!url) return false;
  try {
    const token = new URL(url).searchParams.get("token");
    const payload = token?.split(".")[1];
    if (!payload) return false;
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return typeof exp === "number" && exp * 1000 <= accessUntil.getTime();
  } catch {
    return false;
  }
}
