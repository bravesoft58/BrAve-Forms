/**
 * BF-74 unit checks: the client-secret encryption, the Graph client against a
 * stubbed fetch, sendOrgEmail end to end with stubbed Supabase and Microsoft
 * endpoints, the settings schema, the expiry warning, and static wiring guards.
 * No network, no database.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf74_email_settings_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = randomBytes(32).toString("base64");
process.env.EMAIL_SETTINGS_KEY = KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";

const { encryptSecret, decryptSecret, SecretKeyMissingError } = await import("@/lib/email/secret-box");
const { sendViaGraph } = await import("@/lib/email/graph-mail");
const { sendOrgEmail } = await import("@/lib/email/send-mail");
const { describeSendFailure } = await import("@/lib/email/send-result");
const { emailSettingsSchema, parseEmailSettingsForm, secretExpiryDaysLeft, secretExpiryMessage } = await import(
  "@/lib/schemas/email-settings"
);

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf-8");

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";
const SECRET = "Qx8~secret.value_with+special/chars=";
const EMAIL = { to: "andy@example.com", subject: "Test", text: "Hello" };
const CREDS = {
  tenantId: "aaaaaaaa-0000-4000-8000-000000000001",
  clientId: "bbbbbbbb-0000-4000-8000-000000000002",
  clientSecret: SECRET,
  senderMailbox: "forms-alerts@qdconstruction.com",
};

// --- Secret encryption ---

test("a secret round-trips, and each encryption uses a fresh IV", () => {
  const a = encryptSecret(SECRET, ORG);
  const b = encryptSecret(SECRET, ORG);
  assert.match(a, /^v1:[^:]+:[^:]+:[^:]+$/);
  assert.notEqual(a, b);
  assert.ok(!a.includes(SECRET));
  assert.equal(decryptSecret(a, ORG), SECRET);
  assert.equal(decryptSecret(b, ORG), SECRET);
});

test("a ciphertext moved to another organization, or read with another key, does not decrypt", () => {
  const stored = encryptSecret(SECRET, ORG);
  assert.throws(() => decryptSecret(stored, OTHER_ORG));
  assert.throws(() => decryptSecret(stored, ORG, randomBytes(32).toString("base64")));
});

test("tampering with the body, tag or IV is detected; a truncated tag is refused", () => {
  const [v, iv, tag, body] = encryptSecret(SECRET, ORG).split(":");
  const flip = (b64: string) => {
    const buf = Buffer.from(b64, "base64");
    buf[0] ^= 1;
    return buf.toString("base64");
  };
  assert.throws(() => decryptSecret([v, iv, tag, flip(body)].join(":"), ORG));
  assert.throws(() => decryptSecret([v, iv, flip(tag), body].join(":"), ORG));
  assert.throws(() => decryptSecret([v, flip(iv), tag, body].join(":"), ORG));
  const shortTag = Buffer.from(tag, "base64").subarray(0, 4).toString("base64");
  assert.throws(() => decryptSecret([v, iv, shortTag, body].join(":"), ORG));
  assert.throws(() => decryptSecret(["v2", iv, tag, body].join(":"), ORG), /format/);
});

test("a missing or wrong-length key refuses to encrypt", () => {
  assert.throws(() => encryptSecret(SECRET, ORG, ""), SecretKeyMissingError);
  assert.throws(() => encryptSecret(SECRET, ORG, randomBytes(16).toString("base64")), SecretKeyMissingError);
});

// --- Graph client against a stubbed fetch ---

type Call = { url: string; init: RequestInit };

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
  return { fn, calls };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const tokenOk = () => json(200, { access_token: "token-123", token_type: "Bearer", expires_in: 3599 });
const tokenError = (code: number) =>
  json(401, { error: "invalid_client", error_description: `AADSTS${code}: something`, error_codes: [code] });

test("a send gets an app-only token from the tenant, then posts sendMail as the mailbox", async () => {
  const { fn, calls } = stubFetch((url) => (url.includes("login.microsoftonline.com") ? tokenOk() : new Response(null, { status: 202 })));
  assert.deepEqual(await sendViaGraph(CREDS, EMAIL, fn), { ok: true });
  assert.equal(calls.length, 2);

  const [token, send] = calls;
  assert.equal(token.url, `https://login.microsoftonline.com/${CREDS.tenantId}/oauth2/v2.0/token`);
  const form = new URLSearchParams(String(token.init.body));
  assert.equal(form.get("grant_type"), "client_credentials");
  assert.equal(form.get("scope"), "https://graph.microsoft.com/.default");
  assert.equal(form.get("client_id"), CREDS.clientId);
  assert.equal(form.get("client_secret"), SECRET, "special characters survive form encoding");

  assert.equal(send.url, "https://graph.microsoft.com/v1.0/users/forms-alerts%40qdconstruction.com/sendMail");
  assert.equal((send.init.headers as Record<string, string>).Authorization, "Bearer token-123");
  const body = JSON.parse(String(send.init.body));
  assert.deepEqual(body.message.toRecipients, [{ emailAddress: { address: EMAIL.to } }]);
  assert.equal(body.message.subject, EMAIL.subject);
  assert.deepEqual(body.message.body, { contentType: "Text", content: EMAIL.text });
});

test("Entra token errors map to plain reasons, and sendMail is never attempted", async () => {
  const cases: [number, string][] = [
    [7000215, "bad_secret"],
    [7000222, "secret_expired"],
    [700016, "bad_client_id"],
    [90002, "bad_tenant"],
    [900023, "bad_tenant"],
    [7000112, "microsoft_error"],
  ];
  for (const [code, reason] of cases) {
    const { fn, calls } = stubFetch(() => tokenError(code));
    const r = await sendViaGraph(CREDS, EMAIL, fn);
    assert.deepEqual(r, { ok: false, reason, detail: `AADSTS${code}` }, String(code));
    assert.equal(calls.length, 1);
  }
});

test("sendMail refusals map to plain reasons with Microsoft's code kept", async () => {
  const cases: [number, string][] = [
    [403, "mailbox_not_permitted"],
    [404, "mailbox_not_found"],
    [429, "throttled"],
    [500, "microsoft_error"],
  ];
  for (const [status, reason] of cases) {
    const { fn } = stubFetch((url) =>
      url.includes("login.") ? tokenOk() : json(status, { error: { code: "ErrorX", message: "Access is denied." } }),
    );
    const r = await sendViaGraph(CREDS, EMAIL, fn);
    assert.deepEqual(r, { ok: false, reason, detail: `${status} ErrorX Access is denied.` }, String(status));
  }
});

test("network failures and non-JSON replies come back as results, never throws", async () => {
  const down = stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  assert.deepEqual(await sendViaGraph(CREDS, EMAIL, down.fn), { ok: false, reason: "network_error", detail: "TypeError" });

  const html = stubFetch(() => new Response("<html>bad gateway</html>", { status: 502 }));
  const r = await sendViaGraph(CREDS, EMAIL, html.fn);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.reason, "microsoft_error");
});

test("no failure detail ever carries the secret or the access token", async () => {
  const echo = stubFetch((url) =>
    url.includes("login.")
      ? tokenOk()
      : json(403, { error: { code: "ErrorAccessDenied", message: "Access is denied." } }),
  );
  const r = await sendViaGraph(CREDS, EMAIL, echo.fn);
  const text = JSON.stringify(r) + (r.ok ? "" : describeSendFailure(r.reason, r.detail));
  assert.ok(!text.includes(SECRET) && !text.includes("token-123"));

  const tokenEcho = stubFetch(() =>
    json(401, { error: "invalid_client", error_description: `bad secret ${SECRET}`, error_codes: [7000215] }),
  );
  const t = await sendViaGraph(CREDS, EMAIL, tokenEcho.fn);
  assert.ok(!JSON.stringify(t).includes(SECRET), "error_description is never copied into detail");
});

// --- sendOrgEmail end to end: stubbed Supabase REST + Microsoft ---

function withGlobalFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const stub = stubFetch(handler);
  const original = globalThis.fetch;
  globalThis.fetch = stub.fn;
  return { calls: stub.calls, restore: () => void (globalThis.fetch = original) };
}

function settingsRow(orgForCiphertext: string) {
  return {
    tenant_id: CREDS.tenantId,
    client_id: CREDS.clientId,
    sender_mailbox: CREDS.senderMailbox,
    client_secret_ciphertext: encryptSecret(SECRET, orgForCiphertext),
  };
}

async function quietly<T>(fn: () => Promise<T>): Promise<{ value: T; logged: unknown[][] }> {
  const logged: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => void logged.push(args);
  try {
    return { value: await fn(), logged };
  } finally {
    console.error = original;
  }
}

const supabaseReturns = (rows: unknown[]) => (url: string) => {
  if (url.startsWith("http://supabase.test/rest/v1/organization_email_settings")) return json(200, rows);
  if (url.includes("login.microsoftonline.com")) return tokenOk();
  if (url.startsWith("https://graph.microsoft.com/")) return new Response(null, { status: 202 });
  return new Response("unexpected", { status: 599 });
};

test("sendOrgEmail: no settings row is not_configured, and Microsoft is never contacted", async () => {
  const g = withGlobalFetch(supabaseReturns([]));
  try {
    const { value, logged } = await quietly(() => sendOrgEmail(ORG, EMAIL));
    assert.deepEqual(value, { ok: false, reason: "not_configured" });
    assert.equal(logged.length, 0, "not configured is normal, not an error");
    assert.ok(g.calls[0].url.includes(`org_id=eq.${ORG}`), "the query is scoped to the organization");
    assert.ok(!g.calls[0].url.includes("select=*"), "explicit columns");
    assert.equal(g.calls.filter((c) => !c.url.startsWith("http://supabase.test")).length, 0);
  } finally {
    g.restore();
  }
});

test("sendOrgEmail: a configured organization sends with its decrypted secret", async () => {
  const g = withGlobalFetch(supabaseReturns([settingsRow(ORG)]));
  try {
    assert.deepEqual(await sendOrgEmail(ORG, EMAIL), { ok: true });
    const token = g.calls.find((c) => c.url.includes("login.microsoftonline.com"));
    assert.equal(new URLSearchParams(String(token?.init.body)).get("client_secret"), SECRET);
    assert.ok(g.calls.some((c) => c.url.endsWith("/users/forms-alerts%40qdconstruction.com/sendMail")));
  } finally {
    g.restore();
  }
});

test("sendOrgEmail: a ciphertext from another organization is unreadable and nothing is sent", async () => {
  const g = withGlobalFetch(supabaseReturns([settingsRow(OTHER_ORG)]));
  try {
    const { value, logged } = await quietly(() => sendOrgEmail(ORG, EMAIL));
    assert.equal(value.ok, false);
    assert.equal(!value.ok && value.reason, "secret_unreadable");
    assert.equal(g.calls.filter((c) => !c.url.startsWith("http://supabase.test")).length, 0);
    assert.equal(logged.length, 1);
  } finally {
    g.restore();
  }
});

test("sendOrgEmail never throws: database error, network failure, missing key", async () => {
  const dbError = withGlobalFetch(() => json(500, { message: "boom", code: "XX000" }));
  try {
    const { value } = await quietly(() => sendOrgEmail(ORG, EMAIL));
    assert.equal(!value.ok && value.reason, "settings_unavailable");
  } finally {
    dbError.restore();
  }

  const down = withGlobalFetch(() => {
    throw new TypeError("fetch failed");
  });
  try {
    const { value } = await quietly(() => sendOrgEmail(ORG, EMAIL));
    assert.equal(value.ok, false);
  } finally {
    down.restore();
  }

  const g = withGlobalFetch(supabaseReturns([settingsRow(ORG)]));
  delete process.env.EMAIL_SETTINGS_KEY;
  try {
    const { value } = await quietly(() => sendOrgEmail(ORG, EMAIL));
    assert.equal(!value.ok && value.reason, "secret_unreadable");
  } finally {
    process.env.EMAIL_SETTINGS_KEY = KEY;
    g.restore();
  }
});

// --- Settings schema ---

const valid = {
  tenant_id: " aaaaaaaa-0000-4000-8000-000000000001 ",
  client_id: "bbbbbbbb-0000-4000-8000-000000000002",
  sender_mailbox: "forms-alerts@qdconstruction.com",
  client_secret: "",
  client_secret_expires_on: "2027-10-08",
};

test("the settings schema trims, accepts a GUID or domain tenant, and allows a blank secret", () => {
  const r = emailSettingsSchema.safeParse(valid);
  assert.ok(r.success);
  assert.equal(r.data.tenant_id, "aaaaaaaa-0000-4000-8000-000000000001");
  assert.equal(r.data.client_secret, "");
  assert.ok(emailSettingsSchema.safeParse({ ...valid, tenant_id: "qdconstruction.onmicrosoft.com" }).success);
});

test("bad tenant, client ID, mailbox and date are refused on their own fields", () => {
  const r = emailSettingsSchema.safeParse({
    tenant_id: "not a tenant",
    client_id: "abc",
    sender_mailbox: "nope",
    client_secret: "",
    client_secret_expires_on: "10/08/2027",
  });
  assert.ok(!r.success);
  const paths = r.error.issues.map((i) => i.path.join(".")).sort();
  assert.deepEqual(paths, ["client_id", "client_secret_expires_on", "sender_mailbox", "tenant_id"]);
});

test("parseEmailSettingsForm reads exactly the five fields", () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(valid)) fd.set(k, v);
  fd.set("org_id", OTHER_ORG);
  const raw = parseEmailSettingsForm(fd);
  assert.deepEqual(Object.keys(raw).sort(), Object.keys(valid).sort());
});

// --- Expiry warning ---

test("the expiry warning starts 30 days before the date, and stays once expired", () => {
  assert.equal(secretExpiryDaysLeft("2026-11-08", "2026-10-08"), null); // 31 days
  assert.equal(secretExpiryDaysLeft("2026-11-07", "2026-10-08"), 30);
  assert.equal(secretExpiryDaysLeft("2026-10-09", "2026-10-08"), 1);
  assert.equal(secretExpiryDaysLeft("2026-10-08", "2026-10-08"), 0);
  assert.equal(secretExpiryDaysLeft("2026-10-01", "2026-10-08"), -7);
  assert.equal(secretExpiryDaysLeft("not a date", "2026-10-08"), null);
  assert.match(secretExpiryMessage(30), /expires in 30 days/);
  assert.match(secretExpiryMessage(1), /expires in 1 day\./);
  assert.match(secretExpiryMessage(0), /expires today/);
  assert.match(secretExpiryMessage(-7), /has expired/);
});

// --- Static wiring guards ---

test("what the page loads never includes the ciphertext; the secret input has no value", () => {
  const queries = read("lib/queries/email-settings.ts");
  const view = queries.slice(queries.indexOf("getEmailSettingsView"));
  assert.doesNotMatch(view, /ciphertext/);
  const form = read("app/dashboard/settings/email-settings-form.tsx");
  const secretInput = form.slice(form.indexOf('id="client_secret"'), form.indexOf("/>", form.indexOf('id="client_secret"')));
  assert.match(secretInput, /type="password"/);
  assert.doesNotMatch(secretInput, /defaultValue|value=/);
});

test("every settings action confirms the org admin before touching the service client", () => {
  const actions = read("app/dashboard/settings/actions.ts");
  const bodies = actions.split(/export async function /).slice(1);
  assert.equal(bodies.length, 2);
  for (const body of bodies) {
    const guard = body.indexOf("await getAdminOrg()");
    assert.ok(guard > 0, body.slice(0, 40));
    for (const use of ["createServiceClient()", "sendOrgEmail("]) {
      const at = body.indexOf(use);
      if (at >= 0) assert.ok(at > guard, `${use} before the admin check in ${body.slice(0, 30)}`);
    }
  }
  assert.doesNotMatch(actions, /\.role\b|profiles/, "profiles.role is not the org-admin test");
  assert.match(read("lib/queries/email-settings.ts"), /rpc\("is_org_admin", \{ p_org_id: membership\.org_id \}\)/);
});
