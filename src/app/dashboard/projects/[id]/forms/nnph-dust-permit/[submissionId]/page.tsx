import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import {
  type NnphDustPermitData,
  type ContactInfo,
  type DustControlMethod,
} from "@/lib/schemas/nnph-dust-permit";

const statusBadge: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  revised: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-1 text-sm text-zinc-900 dark:text-zinc-100";

const APP_TYPE_LABELS: Record<string, string> = {
  new: "New Application",
  renewal: "Renewal",
  modification: "Modification",
};

function ContactView({ label, contact }: { label: string; contact: ContactInfo }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#233B5C] dark:text-zinc-300">{label}</p>
      <p className={valueClass}>{contact.name || "—"}</p>
      {contact.company && <p className="text-sm text-zinc-600 dark:text-zinc-400">{contact.company}</p>}
      {contact.address && <p className="text-sm text-zinc-600 dark:text-zinc-400">{contact.address}</p>}
      {(contact.city || contact.state || contact.zip) && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {[contact.city, contact.state].filter(Boolean).join(", ")} {contact.zip}
        </p>
      )}
      {(contact.phone || contact.email) && (
        <div className="mt-2 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {contact.phone && <p>Phone: {contact.phone}</p>}
          {contact.email && <p>Email: {contact.email}</p>}
        </div>
      )}
    </div>
  );
}

function YNBadge({ value }: { value: "Y" | "N" | undefined }) {
  if (!value) return <span className="text-zinc-400">—</span>;
  return value === "Y" ? (
    <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
  ) : (
    <span className="text-zinc-500">No</span>
  );
}

function DustMethodView({ m }: { m: DustControlMethod }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={m.enabled ? "text-green-600 dark:text-green-400" : "text-zinc-300 dark:text-zinc-600"}>
        {m.enabled ? "\u2713" : "\u2717"}
      </span>
      <div>
        <span className={m.enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
          {m.method}
        </span>
        {m.enabled && m.details && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{m.details}</p>
        )}
      </div>
    </div>
  );
}

export default async function NnphDustPermitViewPage({
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

  const data: NnphDustPermitData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as NnphDustPermitData)
      : null;

  if (!data) notFound();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            NNPH Dust Control Permit
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
          <p className={valueClass}>{data.application_type ? APP_TYPE_LABELS[data.application_type] ?? data.application_type : "N/A"}</p>
        </div>
        {data.permit_number && (
          <div>
            <p className={labelClass}>Permit #</p>
            <p className={valueClass}>{data.permit_number}</p>
          </div>
        )}
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

      {/* Section 1 — Application Info */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 1 — Application Info
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Project Name</p><p className={valueClass}>{data.project_name || "—"}</p></div>
          <div><p className={labelClass}>APN</p><p className={valueClass}>{data.apn || "—"}</p></div>
          <div><p className={labelClass}>Acres</p><p className={valueClass}>{data.acres || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className={labelClass}>Start Date</p><p className={valueClass}>{data.start_date || "—"}</p></div>
          <div><p className={labelClass}>End Date</p><p className={valueClass}>{data.end_date || "—"}</p></div>
        </div>
      </section>

      {/* Section 2 — Contacts */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 2 — Contacts
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ContactView label="Applicant" contact={data.applicant} />
          <ContactView label="Contractor" contact={data.contractor} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#233B5C] dark:text-zinc-300">Emergency Contact 1</p>
            <p className={valueClass}>{data.emergency_contact_1.name || "—"}</p>
            {data.emergency_contact_1.phone && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Phone: {data.emergency_contact_1.phone}</p>
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#233B5C] dark:text-zinc-300">Emergency Contact 2</p>
            <p className={valueClass}>{data.emergency_contact_2.name || "—"}</p>
            {data.emergency_contact_2.phone && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Phone: {data.emergency_contact_2.phone}</p>
            )}
          </div>
        </div>
      </section>

      {/* Section 3 — Project Details */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 3 — Project Details
        </h2>
        {data.project_description && (
          <div>
            <p className={labelClass}>Project Description</p>
            <p className={`${valueClass} whitespace-pre-wrap`}>{data.project_description}</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Project Type</p><p className={valueClass}>{data.project_type || "—"}</p></div>
          <div><p className={labelClass}>Fill Material Source</p><p className={valueClass}>{data.fill_material_source || "—"}</p></div>
          <div><p className={labelClass}>Excavation Amount</p><p className={valueClass}>{data.excavation_amount || "—"}</p></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Crushing Equipment</p>
            <p className={valueClass}><YNBadge value={data.crushing_equipment} /></p>
          </div>
          {data.crushing_equipment === "Y" && data.stationary_source_permit && (
            <div>
              <p className={labelClass}>Stationary Source Permit #</p>
              <p className={valueClass}>{data.stationary_source_permit}</p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className={labelClass}>Soil Type</p><p className={valueClass}>{data.soil_type || "—"}</p></div>
          <div>
            <p className={labelClass}>Soil Analysis Available</p>
            <p className={valueClass}><YNBadge value={data.soil_analysis_available} /></p>
          </div>
        </div>

        {/* Dust Control Methods */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Dust Control Methods
          </p>
          <div className="space-y-1">
            {(data.dust_control_methods ?? []).map((m) => (
              <DustMethodView key={m.method} m={m} />
            ))}
          </div>
        </div>

        {/* Irrigation & Additional */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Temporary Irrigation</p>
            <p className={valueClass}><YNBadge value={data.temporary_irrigation} /></p>
          </div>
          {data.temporary_irrigation === "Y" && data.irrigation_details && (
            <div>
              <p className={labelClass}>Irrigation Details</p>
              <p className={valueClass}>{data.irrigation_details}</p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Speed Limit</p><p className={valueClass}>{data.speed_limit || "—"}</p></div>
          <div><p className={labelClass}>Trackout Control</p><p className={valueClass}>{data.trackout_control || "—"}</p></div>
          <div><p className={labelClass}>Unauthorized Traffic Prevention</p><p className={valueClass}>{data.unauthorized_traffic_prevention || "—"}</p></div>
        </div>
      </section>

      {/* Signature */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Signature
        </h2>
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
          href={`/dashboard/projects/${id}?tab=nnph_dust_permit`}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
