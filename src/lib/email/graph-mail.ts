import type { OrgEmail, SendFailureReason, SendResult } from "./send-result";

// Microsoft Graph app-only send (BF-74): a client-credentials token from Entra,
// then POST /users/{mailbox}/sendMail. Plain fetch; @azure/msal-node was
// considered and not used (two calls, no token cache worth having on
// serverless). Graph answers 202 Accepted when the message is queued, which is
// not proof of delivery.

export type GraphCredentials = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  senderMailbox: string;
};

type Fetch = typeof fetch;

const TIMEOUT_MS = Number(process.env.EMAIL_HTTP_TIMEOUT_MS) || 10_000;
const DETAIL_MAX = 300;

// Entra token-endpoint codes (Microsoft Entra error code reference, checked 2026-10-08).
const TOKEN_ERRORS: Record<string, SendFailureReason> = {
  "90002": "bad_tenant",
  "900023": "bad_tenant",
  "700016": "bad_client_id",
  "7000215": "bad_secret",
  "7000222": "secret_expired",
};

function fail(reason: SendFailureReason, detail?: string): SendResult {
  return { ok: false, reason, ...(detail ? { detail: detail.slice(0, DETAIL_MAX) } : {}) };
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function getToken(creds: GraphCredentials, fetchImpl: Fetch): Promise<string | SendResult> {
  const res = await fetchImpl(
    `https://login.microsoftonline.com/${encodeURIComponent(creds.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const json = await readJson(res);
  if (res.ok && typeof json.access_token === "string") return json.access_token;

  const codes = Array.isArray(json.error_codes) ? json.error_codes.map(String) : [];
  const known = codes.find((c) => c in TOKEN_ERRORS);
  const detail = codes.length ? `AADSTS${codes[0]}` : `token ${res.status} ${String(json.error ?? "")}`.trim();
  return fail(known ? TOKEN_ERRORS[known] : "microsoft_error", detail);
}

function sendFailure(status: number, json: Record<string, unknown>): SendResult {
  const err = (json.error ?? {}) as { code?: unknown; message?: unknown };
  const detail = [status, err.code, err.message].filter(Boolean).join(" ");
  if (status === 403) return fail("mailbox_not_permitted", detail);
  if (status === 404) return fail("mailbox_not_found", detail);
  if (status === 429) return fail("throttled", detail);
  return fail("microsoft_error", detail);
}

/** Sends one plain-text message. Never throws. */
export async function sendViaGraph(
  creds: GraphCredentials,
  email: OrgEmail,
  fetchImpl: Fetch = fetch,
): Promise<SendResult> {
  try {
    const token = await getToken(creds, fetchImpl);
    if (typeof token !== "string") return token;

    const res = await fetchImpl(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(creds.senderMailbox)}/sendMail`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            subject: email.subject,
            body: { contentType: "Text", content: email.text },
            toRecipients: [{ emailAddress: { address: email.to } }],
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (res.ok) return { ok: true };
    return sendFailure(res.status, await readJson(res));
  } catch (e) {
    return fail("network_error", e instanceof Error ? e.name : String(e));
  }
}
