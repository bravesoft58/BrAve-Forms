import Link from "next/link";
import { pacificToday } from "@/lib/dates";
import { getAdminOrg, getEmailSettingsView } from "@/lib/queries/email-settings";
import { secretExpiryDaysLeft, secretExpiryMessage } from "@/lib/schemas/email-settings";

/** BF-74: shown to org admins from 30 days before the secret's entered expiry date. */
export default async function EmailSecretExpiryBanner() {
  const admin = await getAdminOrg();
  if (!admin) return null;
  const settings = await getEmailSettingsView(admin.orgId).catch((e: unknown) => {
    console.error("[expiry-banner] could not load email settings", { error: String(e) });
    return null;
  });
  if (!settings) return null;

  const daysLeft = secretExpiryDaysLeft(settings.client_secret_expires_on, pacificToday());
  if (daysLeft === null) return null;

  return (
    <div role="alert" className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      {secretExpiryMessage(daysLeft)}{" "}
      <Link href="/dashboard/settings" className="font-medium underline">
        Renew it in Settings
      </Link>
      .
    </div>
  );
}
