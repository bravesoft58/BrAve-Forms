import { notFound } from "next/navigation";
import { getProjectById, getLatestSubmission } from "@/lib/queries/projects";
import DailyDustLog from "@/components/forms/dust-log/DailyDustLog";
import type { DustLogEntry } from "@/lib/schemas/dust-log";

export default async function NewDustLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latestSubmission] = await Promise.all([
    getProjectById(id),
    getLatestSubmission(id, "daily_dust_log"),
  ]);
  if (!project) notFound();

  // Find permit number from SAD or dust_control permits
  const dustPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "surface_area_disturbance" || p.permit_type === "dust_control"
  );

  // Extract last entry from previous submission for "Use Previous"
  const prevEntries: DustLogEntry[] = Array.isArray(latestSubmission?.data)
    ? latestSubmission.data
    : [];
  const lastEntry: DustLogEntry | null =
    prevEntries.length > 0 ? prevEntries[prevEntries.length - 1] : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Daily Dust Log — {project.name}
      </h1>
      <DailyDustLog
        projectId={id}
        projectName={project.name}
        permitNumber={dustPermit?.permit_number ?? null}
        companyName={project.superintendent_name ?? null}
        previousEntry={lastEntry}
      />
    </div>
  );
}
