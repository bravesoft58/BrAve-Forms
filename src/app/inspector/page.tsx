import { cookies } from "next/headers";
import { getSessionProjectId } from "@/lib/inspector/session";
import { INSPECTOR_SESSION_COOKIE } from "@/lib/inspector/constants";
import { getPortalData } from "@/lib/queries/inspector";
import InspectorPortal from "@/components/inspector/InspectorPortal";

// BF-56: the portal is gated on the inspector session cookie set by the scan
// route, checked here on every load (not in proxy.ts). An expired session, a
// revoked token or no cookie at all renders a message and no project data.

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{body}</p>
      </div>
    </div>
  );
}

export default async function InspectorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const { link } = await searchParams;
  if (link === "invalid") {
    return (
      <Notice
        title="QR Code Not Valid"
        body="This inspection QR code is no longer valid. Please contact the project administrator."
      />
    );
  }

  const cookieStore = await cookies();
  const projectId = await getSessionProjectId(
    cookieStore.get(INSPECTOR_SESSION_COOKIE)?.value,
  );
  if (!projectId) {
    return (
      <Notice
        title="Session Expired"
        body="Your inspection session has ended. Scan the QR code on site again to continue."
      />
    );
  }

  const data = await getPortalData(projectId);
  if (!data) {
    return (
      <Notice
        title="Project Not Found"
        body="The project associated with this QR code could not be loaded."
      />
    );
  }

  return <InspectorPortal data={data} />;
}
