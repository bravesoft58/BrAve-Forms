import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById, getProjectSubmissions, getProjectDocuments } from "@/lib/queries/projects";
import { getCurrentUser } from "@/lib/auth";
import { signFileUrlServer } from "@/lib/supabase/signed-urls";
import ProjectTabs from "@/components/projects/ProjectTabs";
import QrCodeModal from "@/components/inspector/QrCodeModal";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  archived: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700/30 dark:text-zinc-400",
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const [project, user] = await Promise.all([
    getProjectById(id),
    getCurrentUser(),
  ]);
  if (!project) notFound();

  const [submissions, rawDocuments] = await Promise.all([
    getProjectSubmissions(id),
    getProjectDocuments(id),
  ]);

  const documents = await Promise.all(
    rawDocuments.map(async (doc) => ({
      ...doc,
      download_url: await signFileUrlServer("project-documents", doc.file_path),
    })),
  );

  const activeTab = tab || "permits";
  const badgeClass = statusColors[project.status] ?? statusColors.archived;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
              {project.name}
            </h1>
            {project.address && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {project.address}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {user?.role === "admin" && <QrCodeModal projectId={project.id} />}
            <Link
              href={`/dashboard/projects/${project.id}/edit`}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit Project
            </Link>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <ProjectTabs
        projectId={project.id}
        activeTab={activeTab}
        permits={project.project_permits ?? []}
        formRequirements={project.project_form_requirements ?? []}
        submissions={submissions}
        documents={documents}
        userRole={user?.role ?? "user"}
      />
    </div>
  );
}
