import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import NdepStormwaterForm from "@/components/forms/ndep-stormwater/NdepStormwaterForm";
import type { NdepStormwaterData } from "@/lib/schemas/ndep-stormwater";

export default async function EditNdepStormwaterPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [project, submission] = await Promise.all([
    getProjectById(id),
    getSubmissionById(submissionId),
  ]);
  if (!project || !submission) notFound();
  if (submission.project_id !== id || submission.form_type !== "ndep_weekly_stormwater") notFound();

  const canEdit = user.role === "admin" || user.id === submission.submitted_by;
  if (!canEdit) {
    redirect(`/dashboard/projects/${id}/forms/ndep-stormwater/${submissionId}`);
  }

  const ndepPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "stormwater_ndep",
  );

  const initialData: NdepStormwaterData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as NdepStormwaterData)
      : null;
  if (!initialData) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Edit NDEP Weekly Stormwater Inspection
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {project.name} — submission {submission.form_date}
      </p>
      <NdepStormwaterForm
        projectId={id}
        projectName={project.name}
        cswNumber={ndepPermit?.permit_number ?? ""}
        location={project.address ?? ""}
        submissionId={submissionId}
        initialData={initialData}
        cancelHref={`/dashboard/projects/${id}/forms/ndep-stormwater/${submissionId}`}
      />
    </div>
  );
}
