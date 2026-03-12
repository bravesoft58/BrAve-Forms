import { notFound, redirect } from "next/navigation";
import { getProjectById } from "@/lib/queries/projects";
import { getCurrentUser } from "@/lib/auth";
import { updateProject } from "@/app/dashboard/projects/actions";
import ProjectForm from "@/components/projects/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, user] = await Promise.all([
    getProjectById(id),
    getCurrentUser(),
  ]);
  if (!project || !user) notFound();
  if (user.role !== "admin") redirect(`/dashboard/projects/${id}`);

  const boundUpdate = updateProject.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Edit Project
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Update project details, contacts, and permits.
      </p>
      <div className="mt-6">
        <ProjectForm
          action={boundUpdate}
          submitLabel="Save Changes"
          pendingLabel="Saving..."
          defaults={project}
          existingPermits={project.project_permits ?? []}
        />
      </div>
    </div>
  );
}
