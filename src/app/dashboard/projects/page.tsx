import Link from "next/link";
import { Plus } from "lucide-react";
import { getProjects } from "@/lib/queries/projects";
import { getCurrentUser } from "@/lib/auth";
import ProjectCard from "@/components/projects/ProjectCard";

export default async function ProjectsPage() {
  const [projects, user] = await Promise.all([getProjects(), getCurrentUser()]);
  const isAdmin = user?.role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
            Projects
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your construction projects and compliance forms.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#5C6F8A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4a5a6f]"
          >
            <Plus size={16} />
            New Project
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No projects yet.
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/projects/new"
              className="mt-3 text-sm font-medium text-[#5C6F8A] hover:underline"
            >
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
