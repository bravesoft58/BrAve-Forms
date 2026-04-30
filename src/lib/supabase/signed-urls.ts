import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type SignedBucket = "form-attachments" | "project-documents";

const DEFAULT_TTL_SEC = 3600;

/**
 * Sign a file URL using the authenticated server client. Storage RLS applies —
 * the user must have read access to the underlying object's project.
 */
export async function signFileUrlServer(
  bucket: SignedBucket,
  path: string,
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSec);

  if (error || !data) {
    console.error("[signed-urls] server sign failed", { bucket, path, error: error?.message });
    return null;
  }
  return data.signedUrl;
}

/**
 * Sign a file URL using the service-role client (bypasses RLS). Use only
 * where the URL acts as a capability — e.g. inspector portal validated by
 * QR token, or PDF render path that has already verified caller auth.
 */
export async function signFileUrlService(
  bucket: SignedBucket,
  path: string,
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSec);

  if (error || !data) {
    console.error("[signed-urls] service sign failed", { bucket, path, error: error?.message });
    return null;
  }
  return data.signedUrl;
}

/**
 * Batch-sign a list of paths with the service-role client. Used by the
 * inspector page where many docs/photos sign at once. Preserves input order;
 * a per-path failure surfaces as `null` for that index.
 */
export async function signFileUrlsService(
  bucket: SignedBucket,
  paths: string[],
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<(string | null)[]> {
  if (paths.length === 0) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, ttlSec);

  if (error || !data) {
    console.error("[signed-urls] service batch sign failed", { bucket, count: paths.length, error: error?.message });
    return paths.map(() => null);
  }

  // createSignedUrls preserves input order. Map per-row error to null.
  return data.map((row) => (row.error || !row.signedUrl ? null : row.signedUrl));
}
