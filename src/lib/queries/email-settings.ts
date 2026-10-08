import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// BF-74. The settings table has no grants for signed-in users, so every read
// goes through the service client, and only after the caller is confirmed as
// an admin of the organization through is_org_admin on their own session.
// profiles.role is not used here: it is the legacy app role, while
// organization_members.role is what RLS treats as org admin (BF-31).

export type OrgAdmin = { userId: string; email: string; orgId: string };

/** The signed-in user's organization, if they are its owner or admin; else null. */
export async function getAdminOrg(): Promise<OrgAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  // The database decides, on the caller's own session (auth.uid()).
  const { data: isAdmin } = await supabase.rpc("is_org_admin", { p_org_id: membership.org_id });
  if (isAdmin !== true) return null;

  return { userId: user.id, email: user.email, orgId: membership.org_id };
}

/** What the settings page may show. Never includes the secret or its ciphertext. */
export type EmailSettingsView = {
  tenant_id: string;
  client_id: string;
  sender_mailbox: string;
  client_secret_expires_on: string;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_error: string | null;
};

export async function getEmailSettingsView(orgId: string): Promise<EmailSettingsView | null> {
  const { data, error } = await createServiceClient()
    .from("organization_email_settings")
    .select(
      "tenant_id, client_id, sender_mailbox, client_secret_expires_on, last_test_at, last_test_ok, last_test_error",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load email settings: ${error.message}`);
  return data;
}
