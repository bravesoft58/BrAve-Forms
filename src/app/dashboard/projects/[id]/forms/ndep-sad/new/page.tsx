import { notFound } from "next/navigation";
import { getProjectById, getLatestSubmission } from "@/lib/queries/projects";
import NdepSadApplication from "@/components/forms/ndep-sad/NdepSadApplication";
import type { NdepSadData } from "@/lib/schemas/ndep-sad";

export default async function NewNdepSadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latestSubmission] = await Promise.all([
    getProjectById(id),
    getLatestSubmission(id, "ndep_sad_application"),
  ]);
  if (!project) notFound();

  const previousData: NdepSadData | null =
    latestSubmission?.data && typeof latestSubmission.data === "object" && !Array.isArray(latestSubmission.data)
      ? (latestSubmission.data as NdepSadData)
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        NDEP SAD Application — {project.name}
      </h1>
      <NdepSadApplication
        projectId={id}
        project={project}
        previousData={previousData}
      />
    </div>
  );
}
