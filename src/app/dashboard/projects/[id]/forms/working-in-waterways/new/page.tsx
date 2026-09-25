import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/lib/queries/projects";
import { readProjectSites } from "@/lib/schemas/waterways";
import WaterwaysForm from "@/components/forms/working-in-waterways/WaterwaysForm";

export default async function NewWaterwaysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, user] = await Promise.all([getProjectById(id), getCurrentUser()]);
  if (!project) notFound();

  const sites = readProjectSites(project.waterway_sites);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        Working in Waterways Daily Inspection — {project.name}
      </h1>
      {sites.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This project has no waterway sites yet. An administrator adds them in project setup, under
            the Waterway NDEP permit.
          </p>
          {user?.role === "admin" && (
            <Link
              href={`/dashboard/projects/${id}/edit`}
              className="mt-4 inline-block text-sm font-medium text-[#233B5C] hover:underline dark:text-zinc-300"
            >
              Add waterway sites
            </Link>
          )}
        </div>
      ) : (
        <WaterwaysForm projectId={id} sites={sites} />
      )}
    </div>
  );
}
