// Result of an organization email send (BF-74). Callers branch on `reason`;
// `detail` is Microsoft's own code and message, kept for the settings page and
// logs. Neither ever contains the client secret or an access token.

export type SendFailureReason =
  | "not_configured"
  | "settings_unavailable"
  | "secret_unreadable"
  | "bad_tenant"
  | "bad_client_id"
  | "bad_secret"
  | "secret_expired"
  | "mailbox_not_permitted"
  | "mailbox_not_found"
  | "throttled"
  | "network_error"
  | "microsoft_error";

export type SendResult =
  | { ok: true }
  | { ok: false; reason: SendFailureReason; detail?: string };

export type OrgEmail = { to: string; subject: string; text: string };

const PLAIN_WORDS: Record<SendFailureReason, string> = {
  not_configured: "Email alerts are not set up for this organization.",
  settings_unavailable: "The email settings could not be read. Try again in a minute.",
  secret_unreadable:
    "The stored client secret cannot be read by this deployment. Paste the client secret again and save.",
  bad_tenant: "Microsoft does not recognise the tenant ID. Check the Directory (tenant) ID.",
  bad_client_id:
    "Microsoft cannot find that app in your tenant. Check the Application (client) ID, and that it belongs to the same tenant.",
  bad_secret:
    "Microsoft rejected the client secret. Paste the secret's Value (not its Secret ID), or create a new secret.",
  secret_expired: "The client secret has expired. Create a new secret in Entra and paste it here.",
  mailbox_not_permitted:
    "Microsoft refused to send from that mailbox. Check the sender mailbox address and the Exchange permission (setup sheet Step 3). A new permission can take up to 2 hours to apply.",
  mailbox_not_found: "Microsoft cannot find the sender mailbox. Check the address.",
  throttled: "Microsoft is limiting sends from this mailbox right now. Try again in a few minutes.",
  network_error: "Microsoft could not be reached. Try again in a minute.",
  microsoft_error: "Microsoft returned an error.",
};

export function describeSendFailure(reason: SendFailureReason, detail?: string): string {
  return detail ? `${PLAIN_WORDS[reason]} (${detail})` : PLAIN_WORDS[reason];
}
