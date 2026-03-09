import { notFound } from "next/navigation";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import AppendDustLogEntries from "@/components/forms/dust-log/AppendDustLogEntries";

export default async function EditDustLogPage({
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

  const dustPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "surface_area_disturbance" || p.permit_type === "dust_control"
  );

  const existingEntries = Array.isArray(submission.data) ? submission.data : [];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Add Entries — Daily Dust Log
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {project.name} — {existingEntries.length} existing{" "}
        {existingEntries.length === 1 ? "entry" : "entries"}
      </p>
      <AppendDustLogEntries
        projectId={id}
        submissionId={submissionId}
        projectName={project.name}
        permitNumber={dustPermit?.permit_number ?? null}
        companyName={project.superintendent_name ?? null}
        existingEntries={existingEntries}
      />
    </div>
  );
}
