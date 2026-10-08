import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";

// BF-74: the Microsoft 365 setup sheet, shown in the app so the customer's
// administrator can follow it without access to the repository. The sheet in
// docs/customer-setup stays the single source; next.config.ts traces it into
// the deployment.
const SHEET = join(process.cwd(), "docs/customer-setup/microsoft-365-email-alerts.md");

export default async function EmailSetupPage() {
  const sheet = await readFile(SHEET, "utf8");

  return (
    <div>
      <Link href="/dashboard/settings" className="text-sm text-[#233B5C] underline dark:text-zinc-200">
        Back to settings
      </Link>
      <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white p-4 font-sans text-sm leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {sheet}
      </pre>
    </div>
  );
}
