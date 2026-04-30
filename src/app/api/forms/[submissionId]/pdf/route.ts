import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { signFileUrlServer } from "@/lib/supabase/signed-urls";
import { getPdfComponent, getPdfFilename } from "@/lib/pdf/registry";
import type { FormType } from "@/lib/constants/permits";
import { FORM_TYPES } from "@/lib/constants/permits";

// Maps form_type to the per-form subfolder used by PhotoAttachment.
const PHOTO_SUBPATH: Partial<Record<FormType, string>> = {
  ndot_weekly_stormwater: "ndot-stormwater",
};

interface PhotoLike {
  file_name?: string;
  url?: string;
  caption?: string;
  uploaded_at?: string;
}

async function signPhotosInPlace(
  data: Record<string, unknown>,
  formType: FormType,
  projectId: string,
): Promise<Record<string, unknown>> {
  const subPath = PHOTO_SUBPATH[formType];
  if (!subPath) return data;

  const photos = (data as { photos?: PhotoLike[] }).photos;
  if (!Array.isArray(photos) || photos.length === 0) return data;

  const signed = await Promise.all(
    photos.map(async (p) =>
      p.file_name
        ? await signFileUrlServer(
            "form-attachments",
            `projects/${projectId}/${subPath}/${p.file_name}`,
          )
        : null,
    ),
  );

  const nextPhotos = photos.map((p, i) => ({ ...p, url: signed[i] ?? "" }));
  return { ...data, photos: nextPhotos };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;

  // Auth check — require a valid session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch submission + project (RLS ensures user has access)
  const { data: submission, error: subErr } = await supabase
    .from("form_submissions")
    .select("*, project_id, projects(name, project_permits(permit_type, permit_number))")
    .eq("id", submissionId)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const formType = submission.form_type as FormType;
  if (!FORM_TYPES.includes(formType)) {
    return NextResponse.json({ error: "Unknown form type" }, { status: 400 });
  }

  const renderFn = getPdfComponent(formType);
  if (!renderFn) {
    return NextResponse.json({ error: "PDF template not available" }, { status: 400 });
  }

  const project = submission.projects as { name: string; project_permits: Array<{ permit_type: string; permit_number: string | null }> } | null;
  const projectName = project?.name ?? "Unknown Project";

  // Find the relevant permit number
  const permitTypeMap: Partial<Record<FormType, string>> = {
    ndep_weekly_stormwater: "stormwater_ndep",
    ndot_weekly_stormwater: "stormwater_ndot",
    daily_dust_log: "dust_control",
    ndep_sad_application: "surface_area_disturbance",
    nnph_dust_permit: "dust_control",
  };
  const permitType = permitTypeMap[formType];
  const permit = project?.project_permits?.find((p) => p.permit_type === permitType);

  const rawFormData = (submission.data ?? {}) as Record<string, unknown>;
  const formDate = submission.form_date ?? new Date().toISOString().slice(0, 10);
  const formData = await signPhotosInPlace(rawFormData, formType, submission.project_id);

  const element = renderFn({
    data: formData,
    projectName,
    permitNumber: permit?.permit_number ?? undefined,
    companyName: projectName,
    formDate,
  });

  let buffer: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer = await renderToBuffer(element as any);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PDF render failed", { submissionId, formType, error: message });
    return NextResponse.json(
      { error: "PDF render failed", detail: message },
      { status: 500 }
    );
  }

  const filename = getPdfFilename(formType, projectName, formDate);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
