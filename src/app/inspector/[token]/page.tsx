import { validateToken, getPortalData } from "@/lib/queries/inspector";
import InspectorPortal from "@/components/inspector/InspectorPortal";

export default async function InspectorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const projectId = await validateToken(token);
  if (!projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Token Expired or Invalid
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            This inspection link is no longer valid. Please contact the project
            administrator for a new QR code.
          </p>
        </div>
      </div>
    );
  }

  const data = await getPortalData(projectId);
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Project Not Found
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The project associated with this link could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return <InspectorPortal data={data} />;
}
