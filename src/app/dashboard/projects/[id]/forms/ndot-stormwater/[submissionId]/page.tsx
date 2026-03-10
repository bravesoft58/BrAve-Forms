import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import {
  NDOT_BMP_CATEGORIES,
  type NdotStormwaterData,
  type BmpCategory,
  type FormPhoto,
} from "@/lib/schemas/ndot-stormwater";
import {
  headerCellClass,
  cellClass,
} from "@/components/forms/formStyles";

const statusBadge: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  revised: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-1 text-sm text-zinc-900 dark:text-zinc-100";

function YNBadge({ value }: { value?: string }) {
  if (value === "Y") return <span className="text-green-700 dark:text-green-400 font-medium">Y</span>;
  if (value === "N") return <span className="text-red-700 dark:text-red-400 font-medium">N</span>;
  return <span className="text-zinc-400">N/A</span>;
}

const INTENSITY_LABELS: Record<string, string> = {
  none: "None", light: "Light", moderate: "Moderate", heavy: "Heavy",
};
const TEMP_LABELS: Record<string, string> = {
  "<32": "< 32°F", "32-50": "32–50°F", "51-75": "51–75°F", ">75": "> 75°F",
};
const DEFICIENCY_LABELS: Record<string, string> = {
  na: "N/A", yes: "Yes", no: "No",
};

export default async function NdotStormwaterViewPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;

  const [project, submission] = await Promise.all([
    getProjectById(id),
    getSubmissionById(submissionId),
  ]);

  if (!project || !submission) notFound();

  const ndotPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "stormwater_ndot"
  );

  const data: NdotStormwaterData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as NdotStormwaterData)
      : null;

  if (!data) notFound();

  const bmps: BmpCategory[] = data.bmp_categories ?? NDOT_BMP_CATEGORIES.map((name) => ({
    name, required: "N" as const, implemented: "N" as const, comments: "",
  }));

  const photos: FormPhoto[] = data.photos ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            NDOT Weekly Stormwater Inspection
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{project.name}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${
            statusBadge[submission.status] ?? statusBadge.draft
          }`}
        >
          {submission.status}
        </span>
      </div>

      {/* Metadata Card */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:grid-cols-4">
        <div>
          <p className={labelClass}>Report No.</p>
          <p className={valueClass}>{data.report_no || "N/A"}</p>
        </div>
        <div>
          <p className={labelClass}>Permit #</p>
          <p className={valueClass}>{ndotPermit?.permit_number ?? "N/A"}</p>
        </div>
        <div>
          <p className={labelClass}>Form Date</p>
          <p className={valueClass}>
            {new Date(submission.form_date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className={labelClass}>Submitted At</p>
          <p className={valueClass}>
            {submission.submitted_at
              ? new Date(submission.submitted_at).toLocaleString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                })
              : "Not submitted"}
          </p>
        </div>
      </div>

      {/* Section 1 — Site Information */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 1 — Site Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Project Location</p><p className={valueClass}>{data.project_location || "—"}</p></div>
          <div><p className={labelClass}>Contract Number</p><p className={valueClass}>{data.contract_number || "—"}</p></div>
          <div><p className={labelClass}>CSW / Tracking #</p><p className={valueClass}>{data.csw_na ? "N/A" : data.csw_tracking || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>NDOT Inspector</p><p className={valueClass}>{data.ndot_inspector || "—"}</p></div>
          <div><p className={labelClass}>Crew Number</p><p className={valueClass}>{data.crew_number || "—"}</p></div>
          <div><p className={labelClass}>Resident Engineer</p><p className={valueClass}>{data.resident_engineer || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>WPCM</p><p className={valueClass}>{data.wpcm || "—"}</p></div>
          <div><p className={labelClass}>Inspection Date</p><p className={valueClass}>{data.inspection_date}</p></div>
          <div><p className={labelClass}>Previous Inspection Date</p><p className={valueClass}>{data.previous_inspection_date || "—"}</p></div>
        </div>

        {/* Weather & Conditions */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Weather &amp; Conditions
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div><p className={labelClass}>Weather</p><p className={valueClass}>{(data.weather ?? []).join(", ") || "—"}</p></div>
          <div><p className={labelClass}>Precip Intensity</p><p className={valueClass}>{INTENSITY_LABELS[data.precip_intensity ?? ""] ?? "—"}</p></div>
          <div><p className={labelClass}>Wind</p><p className={valueClass}>{INTENSITY_LABELS[data.wind ?? ""] ?? "—"}</p></div>
          <div><p className={labelClass}>Temperature</p><p className={valueClass}>{TEMP_LABELS[data.temp_range ?? ""] ?? "—"}</p></div>
        </div>
        {!data.precip_na && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className={labelClass}>Precip Reference</p><p className={valueClass}>{[data.precip_reference_type, data.precip_reference_location].filter(Boolean).join(" — ") || "—"}</p></div>
            <div><p className={labelClass}>Precip Total</p><p className={valueClass}>{data.precip_total || "—"}</p></div>
          </div>
        )}

        {/* Conditional Questions */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Site Assessment
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Discharge to TMDL Waterway?</p>
            <p className={valueClass}><YNBadge value={data.tmdl_waterway} /></p>
            {data.tmdl_waterway === "Y" && data.tmdl_waterway_names && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.tmdl_waterway_names}</p>
            )}
          </div>
          <div>
            <p className={labelClass}>Deficiency Follow-up?</p>
            <p className={valueClass}>{DEFICIENCY_LABELS[data.deficiency_followup ?? ""] ?? "—"}</p>
            {data.deficiency_followup === "yes" && data.deficiency_actions && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.deficiency_actions}</p>
            )}
          </div>
          <div>
            <p className={labelClass}>Evidence of Erosion?</p>
            <p className={valueClass}><YNBadge value={data.erosion_evidence} /></p>
            {data.erosion_evidence === "Y" && (
              <>
                <p className="mt-1 text-xs text-zinc-500">Discharge: <YNBadge value={data.erosion_discharge} /></p>
                {data.erosion_waterway && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.erosion_waterway}</p>
                )}
              </>
            )}
          </div>
          <div>
            <p className={labelClass}>Adjacent Property Runoff?</p>
            <p className={valueClass}><YNBadge value={data.adjacent_runoff} /></p>
          </div>
          <div>
            <p className={labelClass}>Pollutant Concerns?</p>
            <p className={valueClass}><YNBadge value={data.pollutant_concerns} /></p>
            {data.pollutant_concerns === "Y" && data.pollutant_explain && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.pollutant_explain}</p>
            )}
          </div>
        </div>

        {/* SWPPP Elements */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          SWPPP Elements
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div><p className={labelClass}>On-site?</p><p className={valueClass}><YNBadge value={data.swppp_onsite} /></p></div>
          <div><p className={labelClass}>Signed?</p><p className={valueClass}><YNBadge value={data.swppp_signed} /></p></div>
          <div><p className={labelClass}>Current?</p><p className={valueClass}><YNBadge value={data.swppp_current} /></p></div>
          <div><p className={labelClass}>NOI Posted?</p><p className={valueClass}><YNBadge value={data.swppp_posted} /></p></div>
        </div>
      </section>

      {/* Section 2 — BMP Categories */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 2 — BMP Categories
        </h2>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className={headerCellClass}>Category</th>
                <th className={`${headerCellClass} w-24`}>Required</th>
                <th className={`${headerCellClass} w-28`}>Implemented</th>
                <th className={headerCellClass}>Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {bmps.map((bmp) => (
                <tr key={bmp.name}>
                  <td className={`${cellClass} text-sm font-medium text-zinc-700 dark:text-zinc-300`}>{bmp.name}</td>
                  <td className={cellClass}><YNBadge value={bmp.required} /></td>
                  <td className={cellClass}><YNBadge value={bmp.implemented} /></td>
                  <td className={`${cellClass} text-sm text-zinc-600 dark:text-zinc-400`}>{bmp.comments || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Photo Attachments */}
      {photos.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
            Photo Attachments
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, i) => (
              <div
                key={photo.file_name}
                className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${i + 1}`}
                  className="h-48 w-full rounded object-cover"
                />
                {photo.caption && (
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{photo.caption}</p>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {new Date(photo.uploaded_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3 — Additional Items & Certification */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 3 — Additional Items &amp; Certification
        </h2>

        {/* Batch Plants */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Temporary Batch Plants
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Present?</p><p className={valueClass}><YNBadge value={data.batch_plant_present} /></p></div>
          {data.batch_plant_present === "Y" && (
            <>
              <div><p className={labelClass}>Location</p><p className={valueClass}>{data.batch_plant_location === "onsite" ? "On-site" : data.batch_plant_location === "offsite" ? "Off-site" : "—"}</p></div>
              <div><p className={labelClass}>BMPs</p><p className={valueClass}>{data.batch_plant_bmps || "—"}</p></div>
            </>
          )}
        </div>
        {data.batch_plant_present === "Y" && data.batch_plant_comments && (
          <div><p className={labelClass}>Batch Plant Comments</p><p className={valueClass}>{data.batch_plant_comments}</p></div>
        )}

        {/* Illicit Discharge / Spill Response */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Illicit Discharge / Spill Response
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Illicit Discharges?</p><p className={valueClass}><YNBadge value={data.illicit_discharges} /></p></div>
          <div><p className={labelClass}>Reportable Spills?</p><p className={valueClass}><YNBadge value={data.reportable_spills} /></p></div>
          <div><p className={labelClass}>NDEP Report Filed?</p><p className={valueClass}><YNBadge value={data.ndep_report_filed} /></p></div>
        </div>
        {data.reportable_spills === "Y" && data.spill_action && (
          <div><p className={labelClass}>Spill Action Taken</p><p className={valueClass}>{data.spill_action}</p></div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className={labelClass}>Non-reportable Spills?</p><p className={valueClass}><YNBadge value={data.non_reportable_spills} /></p></div>
        </div>

        {/* Additional */}
        {data.non_structural_bmps && (
          <div><p className={labelClass}>Non-structural BMPs</p><p className={valueClass}>{data.non_structural_bmps}</p></div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className={labelClass}>All Areas Inspected?</p><p className={valueClass}><YNBadge value={data.all_areas_inspected} /></p></div>
        </div>
        {data.additional_comments && (
          <div><p className={labelClass}>Additional Comments</p><p className={valueClass}>{data.additional_comments}</p></div>
        )}

        {/* Dual Signatures */}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Certification
        </h3>
        <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
          I certify under penalty of law that this document and all attachments were prepared under my
          direction or supervision in accordance with a system designed to assure that qualified personnel
          properly gather and evaluate the information submitted. (40 CFR 122.22(d))
        </p>
        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <p className={labelClass}>Inspector</p>
            <p className="mt-1 text-sm font-medium italic text-zinc-900 dark:text-zinc-100">{data.inspector_name}</p>
            <p className="text-xs text-zinc-500">{data.inspector_date}</p>
          </div>
          <div>
            <p className={labelClass}>WPCM Reviewer</p>
            <p className="mt-1 text-sm font-medium italic text-zinc-900 dark:text-zinc-100">{data.wpcm_name || "—"}</p>
            <p className="text-xs text-zinc-500">{data.wpcm_date || "—"}</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link
          href={`/dashboard/projects/${id}?tab=ndot_weekly_stormwater`}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
