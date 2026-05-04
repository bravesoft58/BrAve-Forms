import { notFound } from "next/navigation";
import FormActions from "@/components/form-actions";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import {
  NDEP_CONTROL_MEASURES,
  NDEP_STABILIZATION_ITEMS,
  type NdepStormwaterData,
  type ControlMeasureItem,
  type StabilizationItem,
  type CorrectiveActionRow,
} from "@/lib/schemas/ndep-stormwater";
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

function YNBadge({ value }: { value: string }) {
  if (value === "Y") return <span className="text-green-700 dark:text-green-400 font-medium">Y</span>;
  if (value === "N") return <span className="text-red-700 dark:text-red-400 font-medium">N</span>;
  return <span className="text-zinc-400">N/A</span>;
}

export default async function NdepStormwaterViewPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;

  const [project, submission, user] = await Promise.all([
    getProjectById(id),
    getSubmissionById(submissionId),
    getCurrentUser(),
  ]);

  if (!project || !submission) notFound();

  const canEdit = user?.role === "admin" || (!!user && user.id === submission.submitted_by);

  const ndepPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "stormwater_ndep"
  );

  const data: NdepStormwaterData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as NdepStormwaterData)
      : null;

  if (!data) notFound();

  const measures: ControlMeasureItem[] = data.control_measures ?? NDEP_CONTROL_MEASURES.map((name) => ({
    name, implemented: "NA" as const, maintenance_needed: "N" as const, notes: "",
  }));

  const stabilization: StabilizationItem[] = data.stabilization_items ?? NDEP_STABILIZATION_ITEMS.map((name) => ({
    name, implemented: "NA" as const, maintenance_needed: "N" as const, notes: "",
  }));

  const correctiveActions: CorrectiveActionRow[] = data.corrective_actions ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            NDEP Weekly Stormwater Inspection
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
          <p className={labelClass}>CSW #</p>
          <p className={valueClass}>{ndepPermit?.permit_number ?? "N/A"}</p>
        </div>
        <div>
          <p className={labelClass}>Location</p>
          <p className={valueClass}>{data.location || "N/A"}</p>
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

      {/* Section 1 — General Information */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 1 — General Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Inspector</p><p className={valueClass}>{data.inspector_name}</p></div>
          <div><p className={labelClass}>Inspection Date</p><p className={valueClass}>{data.inspection_date}</p></div>
          <div><p className={labelClass}>Inspection Time</p><p className={valueClass}>{data.inspection_time}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Inspection Type</p><p className={valueClass}>{data.inspection_type === "other" ? `Other: ${data.inspection_type_other}` : data.inspection_type === "post_storm" ? "Post-Storm" : "Regular"}</p></div>
          <div><p className={labelClass}>Storm Event ≥ 0.25″</p><p className={valueClass}><YNBadge value={data.storm_event_025} /></p></div>
          <div><p className={labelClass}>Snowmelt Discharge</p><p className={valueClass}><YNBadge value={data.snowmelt_discharge} /></p></div>
        </div>

        {data.storm_event_025 === "Y" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div><p className={labelClass}>Rain Source</p><p className={valueClass}>{data.rain_source === "rain_gauge" ? "Rain Gauge" : data.rain_source === "weather_station" ? "Weather Station" : "—"}</p></div>
            <div><p className={labelClass}>Total Rainfall</p><p className={valueClass}>{data.total_rainfall || "—"}</p></div>
            <div><p className={labelClass}>Storm Start</p><p className={valueClass}>{data.storm_start || "—"}</p></div>
            <div><p className={labelClass}>Storm Duration</p><p className={valueClass}>{data.storm_duration || "—"}</p></div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Weather</p><p className={valueClass}>{data.weather}</p></div>
          <div><p className={labelClass}>Temperature</p><p className={valueClass}>{data.temperature || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className={labelClass}>Discharge from Site</p>
            <p className={valueClass}><YNBadge value={data.discharge_from_site} /></p>
            {data.discharge_from_site === "Y" && data.discharge_description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.discharge_description}</p>
            )}
          </div>
          <div>
            <p className={labelClass}>Evidence of Erosion</p>
            <p className={valueClass}><YNBadge value={data.erosion_evidence} /></p>
            {data.erosion_evidence === "Y" && data.erosion_description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.erosion_description}</p>
            )}
          </div>
          <div>
            <p className={labelClass}>Previous Corrective Actions Complete</p>
            <p className={valueClass}><YNBadge value={data.previous_corrective_complete} /></p>
            {data.previous_corrective_complete === "N" && data.previous_corrective_description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{data.previous_corrective_description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Section 2 — SWPPP & Control Measures */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 2 — SWPPP & Control Measures
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>SWPPP Available</p><p className={valueClass}><YNBadge value={data.swppp_available} /></p></div>
          <div><p className={labelClass}>SWPPP Current</p><p className={valueClass}><YNBadge value={data.swppp_current} /></p></div>
          <div><p className={labelClass}>Site Map Accurate</p><p className={valueClass}><YNBadge value={data.site_map_accurate} /></p></div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className={headerCellClass}>Control Measure</th>
                <th className={`${headerCellClass} w-28`}>Implemented</th>
                <th className={`${headerCellClass} w-28`}>Maint. Needed</th>
                <th className={headerCellClass}>Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {measures.map((item) => (
                <tr key={item.name}>
                  <td className={`${cellClass} text-sm font-medium text-zinc-700 dark:text-zinc-300`}>{item.name}</td>
                  <td className={cellClass}><YNBadge value={item.implemented} /></td>
                  <td className={cellClass}><YNBadge value={item.maintenance_needed} /></td>
                  <td className={`${cellClass} text-sm text-zinc-600 dark:text-zinc-400`}>{item.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3 — Stabilization & Certification */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Section 3 — Stabilization & Certification
        </h2>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className={headerCellClass}>Stabilization Measure</th>
                <th className={`${headerCellClass} w-28`}>Implemented</th>
                <th className={`${headerCellClass} w-28`}>Maint. Needed</th>
                <th className={headerCellClass}>Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stabilization.map((item) => (
                <tr key={item.name}>
                  <td className={`${cellClass} text-sm font-medium text-zinc-700 dark:text-zinc-300`}>{item.name}</td>
                  <td className={cellClass}><YNBadge value={item.implemented} /></td>
                  <td className={cellClass}><YNBadge value={item.maintenance_needed} /></td>
                  <td className={`${cellClass} text-sm text-zinc-600 dark:text-zinc-400`}>{item.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {correctiveActions.length > 0 && (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Corrective Actions
            </h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className={headerCellClass}>Description</th>
                    <th className={`${headerCellClass} w-40`}>Date to Complete</th>
                    <th className={`${headerCellClass} w-28`}>Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {correctiveActions.map((row, i) => (
                    <tr key={i}>
                      <td className={`${cellClass} text-sm text-zinc-700 dark:text-zinc-300`}>{row.description}</td>
                      <td className={`${cellClass} text-sm text-zinc-600 dark:text-zinc-400`}>{row.date_to_complete}</td>
                      <td className={cellClass}><YNBadge value={row.completed} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <p className={labelClass}>Inspector Signature</p>
            <p className="mt-1 text-sm font-medium italic text-zinc-900 dark:text-zinc-100">{data.inspector_signature}</p>
          </div>
          <div>
            <p className={labelClass}>Signature Date</p>
            <p className={valueClass}>{data.signature_date}</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <FormActions
        backHref={`/dashboard/projects/${id}?tab=ndep_weekly_stormwater`}
        submissionId={submissionId}
        formType="ndep_weekly_stormwater"
        canEdit={canEdit}
      />
    </div>
  );
}
