import { createServiceClient } from "@/lib/supabase/service";
import { signFileUrlsService } from "@/lib/supabase/signed-urls";

// Token validation lives in src/lib/inspector/session.ts (BF-56): the portal
// is gated on an inspector session, not on the token URL itself.

export interface PortalData {
  project: {
    id: string;
    name: string;
    address: string | null;
    status: string;
    start_date: string;
    completion_date: string | null;
    description: string | null;
    acres_disturbed: number | null;
    soil_type: string | null;
    superintendent_name: string | null;
    superintendent_phone: string | null;
    foreman_name: string | null;
    foreman_phone: string | null;
    pm_name: string | null;
    pm_phone: string | null;
  };
  permits: {
    id: string;
    permit_type: string;
    permit_number: string | null;
  }[];
  documents: {
    id: string;
    name: string;
    category: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    download_url: string | null;
  }[];
  submissions: {
    id: string;
    form_type: string;
    form_date: string;
    status: string;
    submitted_at: string | null;
    data: Record<string, unknown> | unknown[];
  }[];
}

// BF-32: form_submissions.data may carry a `photos` array whose items are
// `{ file_name, ... }`. We reconstruct the storage path per form_type and
// inject a freshly signed `url` for client-side <img> render.
const PHOTO_STORAGE_PATHS: Record<string, string> = {
  ndot_weekly_stormwater: "ndot-stormwater",
};

interface PhotoLike {
  file_name?: string;
  url?: string;
  caption?: string;
  uploaded_at?: string;
}

async function signSubmissionPhotos(
  submissions: PortalData["submissions"],
  projectId: string,
  ttlSec: number,
): Promise<PortalData["submissions"]> {
  // Collect every photo path across submissions, sign in one batch, then
  // splice the signed URLs back in by index. Avoids N+1 round-trips when
  // many submissions each carry photos.
  type Loc = { subIdx: number; photoIdx: number };
  const paths: string[] = [];
  const locs: Loc[] = [];

  submissions.forEach((sub, subIdx) => {
    const subPath = PHOTO_STORAGE_PATHS[sub.form_type];
    if (!subPath) return;
    const data = sub.data;
    if (!data || Array.isArray(data)) return;
    const photos = (data as { photos?: PhotoLike[] }).photos;
    if (!Array.isArray(photos)) return;

    photos.forEach((photo, photoIdx) => {
      if (!photo?.file_name) return;
      paths.push(`projects/${projectId}/${subPath}/${photo.file_name}`);
      locs.push({ subIdx, photoIdx });
    });
  });

  if (paths.length === 0) return submissions;

  const signed = await signFileUrlsService("form-attachments", paths, ttlSec);

  // Clone the affected submissions/photos so we don't mutate query results.
  const cloned = submissions.map((sub) => ({ ...sub, data: sub.data }));
  locs.forEach(({ subIdx, photoIdx }, i) => {
    const sub = cloned[subIdx];
    const data = sub.data as { photos?: PhotoLike[] };
    if (!data.photos) return;
    const nextPhotos = [...data.photos];
    nextPhotos[photoIdx] = { ...nextPhotos[photoIdx], url: signed[i] ?? "" };
    cloned[subIdx] = { ...sub, data: { ...data, photos: nextPhotos } };
  });

  return cloned;
}

/**
 * `ttlSec` bounds every signed photo and document URL. The portal passes the
 * inspector session's remaining lifetime (capped at an hour), so no link
 * outlives the session that rendered it (BF-56 AC 7).
 */
export async function getPortalData(
  projectId: string,
  ttlSec: number,
): Promise<PortalData | null> {
  const supabase = createServiceClient();

  const [projectRes, permitsRes, documentsRes, submissionsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, address, status, start_date, completion_date, description, acres_disturbed, soil_type, superintendent_name, superintendent_phone, foreman_name, foreman_phone, pm_name, pm_phone")
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_permits")
      .select("id, permit_type, permit_number")
      .eq("project_id", projectId),
    supabase
      .from("project_documents")
      .select("id, name, category, file_path, file_size, mime_type, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("form_submissions")
      .select("id, form_type, form_date, status, submitted_at, data")
      .eq("project_id", projectId)
      .order("form_date", { ascending: false }),
  ]);

  if (projectRes.error || !projectRes.data) return null;

  const rawDocuments = documentsRes.data ?? [];
  const docPaths = rawDocuments.map((d) => d.file_path);
  const signedDocUrls = await signFileUrlsService("project-documents", docPaths, ttlSec);
  const documents = rawDocuments.map((doc, i) => ({
    ...doc,
    download_url: signedDocUrls[i],
  }));

  const submissions = await signSubmissionPhotos(
    submissionsRes.data ?? [],
    projectId,
    ttlSec,
  );

  return {
    project: projectRes.data,
    permits: permitsRes.data ?? [],
    documents,
    submissions,
  };
}
