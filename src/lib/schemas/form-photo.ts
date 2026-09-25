import { z } from "zod";

// PhotoAttachment uploads each photo as `${Date.now()}-${random base36}.${ext}`
// under the form's project folder, and the storage path is rebuilt from
// `file_name` at display time (sometimes with the service-role key, in the
// inspector portal). Accept only that shape so a crafted name cannot point
// outside the folder: no slash, no backslash, no "..".
const PHOTO_FILE_NAME = /^\d+-[a-z0-9]*\.[A-Za-z0-9]+$/;

// BF-32: photos are stored in a private bucket; `url` is never persisted.
// Kept optional so legacy submissions written before BF-32 still parse.
export const photoSchema = z.object({
  url: z.string().optional(),
  caption: z.string().optional().default(""),
  file_name: z.string().regex(PHOTO_FILE_NAME, "Invalid photo file name"),
  uploaded_at: z.string(),
});

export type FormPhoto = z.infer<typeof photoSchema>;

/**
 * File names of stored photos that an edit dropped, for deletion after the
 * edit has saved. Stored data is not trusted: only entries whose name matches
 * the uploader's shape can become a storage path.
 */
export function removedPhotoNames(before: unknown, after: readonly FormPhoto[]): string[] {
  if (!Array.isArray(before)) return [];
  const kept = new Set(after.map((p) => p.file_name));
  return before.flatMap((p) => {
    const parsed = photoSchema.safeParse(p);
    return parsed.success && !kept.has(parsed.data.file_name) ? [parsed.data.file_name] : [];
  });
}
