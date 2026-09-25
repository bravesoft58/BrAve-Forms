import { notFound } from "next/navigation";
import FormActions from "@/components/form-actions";
import { headerCellClass, cellClass } from "@/components/forms/formStyles";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import type { FormPhoto } from "@/lib/schemas/form-photo";
import { WATERWAY_CHECKS, type WaterwaysData } from "@/lib/schemas/waterways";
import { signFileUrlServer } from "@/lib/supabase/signed-urls";

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-1 text-sm text-zinc-900 dark:text-zinc-100";

// Adverse answers stand out; neutral ones stay plain.
const ADVERSE: Record<string, string> = {
  vehicle_inspection: "Fail",
  bmp_inspection: "Fail",
  sheen_or_plume: "Yes",
};

export default async function WaterwaysViewPage({
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
  if (submission.project_id !== id || submission.form_type !== "working_in_waterways") notFound();

  const data: WaterwaysData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as WaterwaysData)
      : null;
  if (!data) notFound();

  const canEdit = user?.role === "admin" || (!!user && user.id === submission.submitted_by);

  const photos: FormPhoto[] = await Promise.all(
    (data.photos ?? []).map(async (photo) => ({
      ...photo,
      url:
        (await signFileUrlServer(
          "form-attachments",
          `projects/${id}/working-in-waterways/${photo.file_name}`,
        )) ?? "",
    })),
  );

  const meta = [
    { label: "Site", value: data.site_name },
    { label: "Site Descriptor", value: data.site_descriptor || "—" },
    {
      label: "Date",
      value: new Date(submission.form_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      }),
    },
    { label: "Time", value: data.inspection_time },
    { label: "Initials", value: data.initials },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
          Working in Waterways Daily Inspection
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{project.name}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:grid-cols-5">
        {meta.map((m) => (
          <div key={m.label}>
            <p className={labelClass}>{m.label}</p>
            <p className={valueClass}>{m.value}</p>
          </div>
        ))}
      </div>

      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">Inspection</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className={headerCellClass}>Item</th>
                <th className={headerCellClass}>Answer</th>
                <th className={headerCellClass}>Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {WATERWAY_CHECKS.map((item) => {
                const check = data[item.key];
                const adverse = ADVERSE[item.key] === check?.value;
                return (
                  <tr key={item.key}>
                    <td className={cellClass}>{item.label}</td>
                    <td className={`${cellClass} font-medium ${adverse ? "text-red-700 dark:text-red-400" : ""}`}>
                      {check?.value ?? "—"}
                    </td>
                    <td className={cellClass}>{check?.comment || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 space-y-2">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Equipment in Use In and Around the Waterway
        </h2>
        <p className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
          {data.equipment_in_use || "None recorded."}
        </p>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">Photos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, i) => (
            <div
              key={photo.file_name}
              className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
              <img
                src={photo.url}
                alt={photo.caption || `Photo ${i + 1}`}
                className="h-48 w-full rounded object-cover"
              />
              {photo.caption && (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <FormActions
        backHref={`/dashboard/projects/${id}?tab=working_in_waterways`}
        submissionId={submissionId}
        formType="working_in_waterways"
        editHref={`/dashboard/projects/${id}/forms/working-in-waterways/${submissionId}/edit`}
        canEdit={canEdit}
      />
    </div>
  );
}
