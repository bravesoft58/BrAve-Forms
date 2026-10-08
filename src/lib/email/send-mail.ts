import { createServiceClient } from "@/lib/supabase/service";
import { sendViaGraph } from "./graph-mail";
import { decryptSecret } from "./secret-box";
import type { OrgEmail, SendResult } from "./send-result";

// The one way the app sends email (BF-74): from the organization's own
// Microsoft 365 mailbox, as configured by its admin on /dashboard/settings.
// Callers decide when to send and what to say; this decides how. A second
// provider goes behind this function when a customer needs one.

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function loadAndSend(orgId: string, email: OrgEmail): Promise<SendResult> {
  const { data, error } = await createServiceClient()
    .from("organization_email_settings")
    .select("tenant_id, client_id, sender_mailbox, client_secret_ciphertext")
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) return { ok: false, reason: "settings_unavailable", detail: error.message };
  if (!data) return { ok: false, reason: "not_configured" };

  let clientSecret: string;
  try {
    clientSecret = decryptSecret(data.client_secret_ciphertext, orgId);
  } catch (e) {
    return { ok: false, reason: "secret_unreadable", detail: message(e) };
  }
  return sendViaGraph(
    {
      tenantId: data.tenant_id,
      clientId: data.client_id,
      senderMailbox: data.sender_mailbox,
      clientSecret,
    },
    email,
  );
}

/** Never throws: every failure comes back as `{ ok: false, reason }`. */
export async function sendOrgEmail(orgId: string, email: OrgEmail): Promise<SendResult> {
  let result: SendResult;
  try {
    result = await loadAndSend(orgId, email);
  } catch (e) {
    result = { ok: false, reason: "settings_unavailable", detail: message(e) };
  }
  if (!result.ok && result.reason !== "not_configured") {
    console.error("[send-mail] send failed", { orgId, reason: result.reason, detail: result.detail });
  }
  return result;
}
