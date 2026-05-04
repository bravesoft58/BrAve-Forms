import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import NdotStormwaterForm from "@/components/forms/ndot-stormwater/NdotStormwaterForm";
import type { NdotStormwaterData } from "@/lib/schemas/ndot-stormwater";

export default async function EditNdotStormwaterPage({
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

  const canEdit = user.role === "admin" || user.id === submission.submitted_by;
  if (!canEdit) {
    redirect(`/dashboard/projects/${id}/forms/ndot-stormwater/${submissionId}`);
  }

  const ndotPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "stormwater_ndot",
  );

  const initialData: NdotStormwaterData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as NdotStormwaterData)
      : null;
  if (!initialData) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Edit NDOT Weekly Stormwater Inspection
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {project.name} — submission {submission.form_date}
      </p>
      <NdotStormwaterForm
        projectId={id}
        projectName={project.name}
        contractNumber={ndotPermit?.permit_number ?? ""}
        location={project.address ?? ""}
        submissionId={submissionId}
        initialData={initialData}
        cancelHref={`/dashboard/projects/${id}/forms/ndot-stormwater/${submissionId}`}
      />
    </div>
  );
}
