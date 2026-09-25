import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getSubmissionById } from "@/lib/queries/projects";
import { readProjectSites, type WaterwaysData } from "@/lib/schemas/waterways";
import WaterwaysForm from "@/components/forms/working-in-waterways/WaterwaysForm";

export default async function EditWaterwaysPage({
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
  if (submission.project_id !== id || submission.form_type !== "working_in_waterways") notFound();

  const viewHref = `/dashboard/projects/${id}/forms/working-in-waterways/${submissionId}`;
  const canEdit = user.role === "admin" || user.id === submission.submitted_by;
  if (!canEdit) redirect(viewHref);

  const initialData: WaterwaysData | null =
    submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? (submission.data as WaterwaysData)
      : null;
  if (!initialData) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Edit Working in Waterways Inspection
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {project.name} — {initialData.site_name}, {submission.form_date}
      </p>
      <WaterwaysForm
        projectId={id}
        sites={readProjectSites(project.waterway_sites)}
        submissionId={submissionId}
        initialData={initialData}
        cancelHref={viewHref}
      />
    </div>
  );
}
