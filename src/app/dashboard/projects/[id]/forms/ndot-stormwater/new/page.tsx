import { notFound } from "next/navigation";
import { getProjectById, getLatestSubmission } from "@/lib/queries/projects";
import NdotStormwaterForm from "@/components/forms/ndot-stormwater/NdotStormwaterForm";
import type { NdotStormwaterData } from "@/lib/schemas/ndot-stormwater";

export default async function NewNdotStormwaterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latestSubmission] = await Promise.all([
    getProjectById(id),
    getLatestSubmission(id, "ndot_weekly_stormwater"),
  ]);
  if (!project) notFound();

  // Find NDOT stormwater permit
  const ndotPermit = project.project_permits?.find(
    (p: { permit_type: string; permit_number: string | null }) =>
      p.permit_type === "stormwater_ndot"
  );

  // Previous data for "Use Previous"
  const previousData: NdotStormwaterData | null =
    latestSubmission?.data && typeof latestSubmission.data === "object" && !Array.isArray(latestSubmission.data)
      ? (latestSubmission.data as NdotStormwaterData)
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        NDOT Weekly Stormwater Inspection — {project.name}
      </h1>
      <NdotStormwaterForm
        projectId={id}
        projectName={project.name}
        contractNumber={ndotPermit?.permit_number ?? ""}
        location={project.address ?? ""}
        previousData={previousData}
      />
    </div>
  );
}
