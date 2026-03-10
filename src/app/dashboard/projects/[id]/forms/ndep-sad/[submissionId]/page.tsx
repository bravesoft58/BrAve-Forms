import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import {
  NDEP_SAD_APPLICATION_TYPES,
  NDEP_SAD_APP_TYPE_LABELS,
  NDEP_SAD_BMP_OPTIONS,
  NDEP_SAD_ATTACHMENT_ITEMS,
  type NdepSadData,
} from "@/lib/schemas/ndep-sad";

const statusBadge: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  revised: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-1 text-sm text-zinc-900 dark:text-zinc-100";


function AddressView({ label, block }: { label: string; block: { name: string; street: string; city: string; state: string; zip: string; title?: string; phone?: string; fax?: string; email?: string } }) {
  const hasContact = block.title || block.phone || block.fax || block.email;
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#233B5C] dark:text-zinc-300">{label}</p>
      <p className={valueClass}>{block.name || "—"}</p>
      {block.street && <p className="text-sm text-zinc-600 dark:text-zinc-400">{block.street}</p>}
      {(block.city || block.state || block.zip) && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {[block.city, block.state].filter(Boolean).join(", ")} {block.zip}
        </p>
      )}
      {hasContact && (
        <div className="mt-2 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {block.title && <p>Title: {block.title}</p>}
          {block.phone && <p>Phone: {block.phone}</p>}
          {block.fax && <p>Fax: {block.fax}</p>}
          {block.email && <p>Email: {block.email}</p>}
        </div>
      )}
    </div>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={checked ? "text-green-600 dark:text-green-400" : "text-zinc-300 dark:text-zinc-600"}>
        {checked ? "\u2713" : "\u2717"}
      </span>
      <span className={checked ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
        {label}
      </span>
    </div>
  );
}

export default async function NdepSadViewPage({
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

  const data: NdepSadData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as NdepSadData)
      : null;

  if (!data) notFound();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            NDEP SAD Application
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
          <p className={labelClass}>Application Type</p>
          <p className={valueClass}>{data.application_type ? NDEP_SAD_APP_TYPE_LABELS[data.application_type] ?? data.application_type : "N/A"}</p>
        </div>
        <div>
          <p className={labelClass}>Facility Name</p>
          <p className={valueClass}>{data.facility_name || "N/A"}</p>
        </div>
        <div>
          <p className={labelClass}>Form Date</p>
          <p className={valueClass}>
            {submission.form_date
              ? new Date(submission.form_date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric",
                })
              : "N/A"}
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

      {/* Existing IDs */}
      {(data.existing_facility_id || data.existing_aqop) && (
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <p className={labelClass}>Existing Facility ID</p>
            <p className={valueClass}>{data.existing_facility_id || "—"}</p>
          </div>
          <div>
            <p className={labelClass}>Existing AQOP #</p>
            <p className={valueClass}>{data.existing_aqop || "—"}</p>
          </div>
        </div>
      )}

      {/* Section 1 — Company Info */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 1 — General Company Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AddressView label="Company" block={data.company} />
          <AddressView label="Owner / Operator" block={data.owner} />
          <AddressView label="Site / Plant Location" block={data.site_plant} />
          <AddressView label="Records Location" block={data.records_location} />
          <AddressView label="Responsible Official" block={data.responsible_official} />
          <AddressView label="Site Manager" block={data.site_manager} />
        </div>
      </section>

      {/* Section 2 — Location */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 2 — Location Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Township</p><p className={valueClass}>{data.township || "—"}</p></div>
          <div><p className={labelClass}>Range</p><p className={valueClass}>{data.range || "—"}</p></div>
          <div><p className={labelClass}>Section</p><p className={valueClass}>{data.section || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className={labelClass}>UTM Easting (NAD83 Zone 11)</p><p className={valueClass}>{data.utm_easting || "—"}</p></div>
          <div><p className={labelClass}>UTM Northing (NAD83 Zone 11)</p><p className={valueClass}>{data.utm_northing || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Hydrographic Basin</p><p className={valueClass}>{data.hydrographic_basin || "—"}</p></div>
          <div><p className={labelClass}>County</p><p className={valueClass}>{data.county || "—"}</p></div>
          <div><p className={labelClass}>Nearest City</p><p className={valueClass}>{data.nearest_city || "—"}</p></div>
        </div>
        {data.driving_directions && (
          <div>
            <p className={labelClass}>Driving Directions</p>
            <p className={`${valueClass} whitespace-pre-wrap`}>{data.driving_directions}</p>
          </div>
        )}
      </section>

      {/* Section 3 — SAD Details */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 3 — Surface Area Disturbance Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className={labelClass}>Project Name</p><p className={valueClass}>{data.project_name || "—"}</p></div>
          <div><p className={labelClass}>Total Acres</p><p className={valueClass}>{data.total_acres || "—"}</p></div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Best Management Practices
          </p>
          <div className="space-y-1">
            {NDEP_SAD_BMP_OPTIONS.map((opt) => (
              <CheckItem key={opt} label={opt} checked={data.bmp_checkboxes?.[opt] ?? false} />
            ))}
          </div>
        </div>

        {data.bmp_checkboxes?.["Water trucks"] && (
          <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div><p className={labelClass}>Water Trucks</p><p className={valueClass}>{data.water_truck_count || "—"}</p></div>
            <div><p className={labelClass}>Capacity (gal)</p><p className={valueClass}>{data.water_truck_capacity || "—"}</p></div>
          </div>
        )}
      </section>

      {/* Section 4 — Certification */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 4 — Certification & Attachments
        </h2>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Attachment Checklist
          </p>
          <div className="space-y-1">
            {NDEP_SAD_ATTACHMENT_ITEMS.map((item) => (
              <CheckItem key={item} label={item} checked={data.attachment_checklist?.[item] ?? false} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <p className={labelClass}>Signature</p>
            <p className="mt-1 text-sm font-medium italic text-zinc-900 dark:text-zinc-100">{data.signature || "—"}</p>
          </div>
          <div>
            <p className={labelClass}>Signature Date</p>
            <p className={valueClass}>{data.signature_date || "—"}</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link
          href={`/dashboard/projects/${id}?tab=ndep_sad_application`}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
