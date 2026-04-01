import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getPdfComponent, getPdfFilename } from "@/lib/pdf/registry";
import type { FormType } from "@/lib/constants/permits";
import { FORM_TYPES } from "@/lib/constants/permits";

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
    .select("*, projects(name, project_permits(permit_type, permit_number))")
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

  const formData = (submission.data ?? {}) as Record<string, unknown>;
  const formDate = submission.form_date ?? new Date().toISOString().slice(0, 10);

  const element = renderFn({
    data: formData,
    projectName,
    permitNumber: permit?.permit_number ?? undefined,
    companyName: projectName,
    formDate,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

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
