import { notFound } from "next/navigation";
import { getProjectById, getLatestSubmission } from "@/lib/queries/projects";
import NnphDustPermitForm from "@/components/forms/nnph-dust-permit/NnphDustPermitForm";
import type { NnphDustPermitData } from "@/lib/schemas/nnph-dust-permit";

export default async function NewNnphDustPermitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, latestSubmission] = await Promise.all([
    getProjectById(id),
    getLatestSubmission(id, "nnph_dust_permit"),
  ]);
  if (!project) notFound();

  const previousData: NnphDustPermitData | null =
    latestSubmission?.data && typeof latestSubmission.data === "object" && !Array.isArray(latestSubmission.data)
      ? (latestSubmission.data as NnphDustPermitData)
      : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
        NNPH Dust Control Permit — {project.name}
      </h1>
      <NnphDustPermitForm
        projectId={id}
        project={project}
        previousData={previousData}
      />
    </div>
  );
}
