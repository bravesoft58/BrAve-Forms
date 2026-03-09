import { notFound } from "next/navigation";
import { getProjectById, getLatestSubmission } from "@/lib/queries/projects";
import NdepStormwaterForm from "@/components/forms/ndep-stormwater/NdepStormwaterForm";
import type { NdepStormwaterData } from "@/lib/schemas/ndep-stormwater";

export default async function NewNdepStormwaterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latestSubmission] = await Promise.all([
    getProjectById(id),
    getLatestSubmission(id, "ndep_weekly_stormwater"),
  ]);
  if (!project) notFound();

  // Find NDEP stormwater permit
  const ndepPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "stormwater_ndep"
  );

  // Previous data for "Use Previous"
  const previousData: NdepStormwaterData | null =
    latestSubmission?.data && typeof latestSubmission.data === "object" && !Array.isArray(latestSubmission.data)
      ? (latestSubmission.data as NdepStormwaterData)
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        NDEP Weekly Stormwater Inspection — {project.name}
      </h1>
      <NdepStormwaterForm
        projectId={id}
        projectName={project.name}
        cswNumber={ndepPermit?.permit_number ?? ""}
        location={project.address ?? ""}
        previousData={previousData}
      />
    </div>
  );
}
