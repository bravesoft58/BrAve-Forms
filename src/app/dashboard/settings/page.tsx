import { getAdminOrg, getEmailSettingsView } from "@/lib/queries/email-settings";
import EmailSettingsForm from "./email-settings-form";

export default async function SettingsPage() {
  const admin = await getAdminOrg();
  const settings = admin ? await getEmailSettingsView(admin.orgId) : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#233B5C] dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Organization settings.
        </p>
      </div>

      {admin ? (
        <EmailSettingsForm settings={settings} />
      ) : (
        <p className="rounded-lg border-2 border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Only organization admins can change settings.
        </p>
      )}
    </div>
  );
}
