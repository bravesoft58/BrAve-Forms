/**
 * BF-72 unit checks: when a sheen/plume alert is sent, what it says, how the
 * inspection page describes it, and runSheenAlert end to end against a fake
 * Supabase REST API and fake Microsoft endpoints (claim, send once, record).
 * No network, no database.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf72_sheen_alert_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

process.env.EMAIL_SETTINGS_KEY = randomBytes(32).toString("base64");
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
process.env.NEXT_PUBLIC_SITE_URL = "https://forms.example.test/";

const { shouldSendSheenAlert, buildSheenAlertEmail, inspectionLink, describeSheenAlert, SENDING_STALE_MS } =
  await import("@/lib/alerts/sheen-alert-message");
const { runSheenAlert } = await import("@/lib/alerts/run-sheen-alert");
const { encryptSecret } = await import("@/lib/email/secret-box");

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf-8");

const yes = { sheen_or_plume: { value: "Yes", comment: "rainbow sheen by outfall" } };
const no = { sheen_or_plume: { value: "No", comment: "" } };
const na = { sheen_or_plume: { value: "N/A", comment: "" } };

// ---------------------------------------------------------------- decision

test("sends on a new Yes, and on an edit that turns the answer to Yes", () => {
  assert.equal(shouldSendSheenAlert(null, yes), true);
  assert.equal(shouldSendSheenAlert(undefined, yes), true);
  assert.equal(shouldSendSheenAlert(no, yes), true);
  assert.equal(shouldSendSheenAlert(na, yes), true);
});

test("never sends for No or N/A, or for an edit that keeps or removes Yes", () => {
  assert.equal(shouldSendSheenAlert(null, no), false);
  assert.equal(shouldSendSheenAlert(null, na), false);
  assert.equal(shouldSendSheenAlert(yes, yes), false, "comment fix on a Yes record");
  assert.equal(shouldSendSheenAlert(yes, no), false);
  assert.equal(shouldSendSheenAlert(null, {}), false);
});

// ---------------------------------------------------------------- message

const facts = {
  projectName: "17446 Microsoft NVE Easement",
  siteName: "Western Drainage",
  inspectionDate: "2026-10-08",
  inspectionTime: "14:05",
  initials: "FD",
  comment: "rainbow sheen by outfall",
  contactName: "Gracie D",
  link: "https://forms.example.test/dashboard/projects/p1/forms/working-in-waterways/s1",
};

test("the email names project, site, date and carries the facts and the link", () => {
  const { subject, text } = buildSheenAlertEmail(facts);
  assert.equal(subject, "Sheen/plume reported: 17446 Microsoft NVE Easement / Western Drainage / 2026-10-08");
  for (const piece of ["Gracie D, a visible sheen", "Site: Western Drainage", "2026-10-08 14:05", "FD", "rainbow sheen by outfall", facts.link]) {
    assert.ok(text.includes(piece), `body contains ${piece}`);
  }
  const blank = buildSheenAlertEmail({ ...facts, comment: "  ", contactName: null });
  assert.ok(blank.text.startsWith("A visible sheen"));
  assert.ok(blank.text.includes("Comment: (none)"));
});

test("the link points at the inspection, with or without a configured site URL", () => {
  assert.equal(
    inspectionLink("https://forms.example.test/", "p1", "s1"),
    "https://forms.example.test/dashboard/projects/p1/forms/working-in-waterways/s1",
  );
  assert.equal(
    inspectionLink(undefined, "p1", "s1"),
    "https://brave-forms.vercel.app/dashboard/projects/p1/forms/working-in-waterways/s1",
  );
});

// ---------------------------------------------------------------- page line

const contact = { name: "Gracie D", phone: "775-555-0101" };
const fmt = () => "Oct 8, 2:06 PM";
const NOW = Date.parse("2026-10-08T21:10:00Z");

test("each alert status reads as one plain line; failures name who to call", () => {
  const row = (status: string, updated_at = "2026-10-08T21:06:00Z") =>
    ({ status, recipient: "gracie@example.test", updated_at }) as Parameters<typeof describeSheenAlert>[0];
  assert.deepEqual(describeSheenAlert(row("sent"), true, contact, fmt, NOW), {
    tone: "ok",
    text: "Alert emailed to gracie@example.test at Oct 8, 2:06 PM.",
  });
  assert.equal(describeSheenAlert(row("failed"), true, contact, fmt, NOW)?.text,
    "The alert email to gracie@example.test failed. Call Gracie D at 775-555-0101.");
  assert.equal(describeSheenAlert(row("not_configured"), true, contact, fmt, NOW)?.text,
    "Email alerts are not set up for this organization. Call Gracie D at 775-555-0101.");
  assert.equal(describeSheenAlert(row("no_contact"), true, { name: null, phone: null }, fmt, NOW)?.tone, "warn");
  assert.equal(describeSheenAlert(row("sending"), true, contact, fmt, NOW)?.text, "The alert email is being sent.");
  const stale = new Date(NOW - SENDING_STALE_MS - 1000).toISOString();
  assert.equal(describeSheenAlert(row("sending", stale), true, contact, fmt, NOW)?.text,
    "The alert email could not be confirmed. Call Gracie D at 775-555-0101.");
});

test("no alert row: nothing for a No answer, a warning for a Yes answer", () => {
  assert.equal(describeSheenAlert(null, false, contact, fmt, NOW), null);
  assert.equal(describeSheenAlert(null, true, { name: "Gracie D", phone: null }, fmt, NOW)?.text,
    "No alert email was recorded for this inspection. Call Gracie D.");
});

// Verify round 1 (BF-72): Next renders the page a Server Action redirects to
// before after() runs, so right after an edit to Yes there is no alert row yet.
test("no alert row just after the save that turned the answer to Yes reads as pending", () => {
  const ago = (ms: number) => new Date(NOW - ms).toISOString();
  const pending = { tone: "ok", text: "The alert email is being sent.", pending: true };
  assert.deepEqual(describeSheenAlert(null, true, contact, fmt, NOW, ago(2000)), pending);
  assert.deepEqual(describeSheenAlert(null, true, contact, fmt, NOW, ago(SENDING_STALE_MS)), pending, "window edge");
  assert.deepEqual(describeSheenAlert(null, true, contact, fmt, NOW, ago(SENDING_STALE_MS + 1)), {
    tone: "warn",
    text: "No alert email was recorded for this inspection. Call Gracie D at 775-555-0101.",
  });
  assert.equal(describeSheenAlert(null, false, contact, fmt, NOW, ago(2000)), null, "a recent No save says nothing");
  assert.equal(describeSheenAlert(null, true, contact, fmt, NOW, "not a time")?.tone, "warn", "unreadable save time");
});

test("only an unresolved alert asks the page to refresh", () => {
  const row = (status: string, updated_at: string) =>
    ({ status, recipient: "gracie@example.test", updated_at }) as Parameters<typeof describeSheenAlert>[0];
  const recent = new Date(NOW - 2000).toISOString();
  assert.equal(describeSheenAlert(row("sending", recent), true, contact, fmt, NOW)?.pending, true);
  for (const status of ["sent", "failed", "not_configured", "no_contact"]) {
    assert.equal(describeSheenAlert(row(status, recent), true, contact, fmt, NOW, recent)?.pending, undefined, status);
  }
  const stale = describeSheenAlert(row("sending", new Date(NOW - SENDING_STALE_MS - 1).toISOString()), true, contact, fmt, NOW);
  assert.deepEqual(stale, { tone: "warn", text: "The alert email could not be confirmed. Call Gracie D at 775-555-0101." });
  assert.equal(describeSheenAlert(row("sending", "not a time"), true, contact, fmt, NOW)?.tone, "warn", "unreadable row time");
});

// ---------------------------------------------- runSheenAlert, end to end

const ORG = "11111111-1111-4111-8111-111111111111";
const PROJECT = "22222222-2222-4222-8222-222222222222";
const SUB = "33333333-3333-4333-8333-333333333333";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

interface World {
  alertExists: boolean;
  contactEmail: string | null;
  emailConfigured: boolean;
  graphStatus: number;
}

/**
 * A fake of the three services runSheenAlert reaches through fetch: Supabase
 * REST (alert claim and status, project, email settings), the Microsoft token
 * endpoint and Graph sendMail. The claim honours ON CONFLICT DO NOTHING: once
 * the row exists, a second claim returns no rows.
 */
function fakeWorld(w: World) {
  const calls: { url: string; method: string; body: string }[] = [];
  const statusWrites: Record<string, unknown>[] = [];
  const mails: { to: string; subject: string; text: string }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    const method = (init.method ?? "GET").toUpperCase();
    const body = typeof init.body === "string" ? init.body : "";
    calls.push({ url, method, body });
    if (url.includes("/rest/v1/submission_alerts")) {
      if (method === "POST") {
        if (w.alertExists) return json(201, []);
        w.alertExists = true;
        return json(201, [{ submission_id: SUB }]);
      }
      if (method === "PATCH") {
        statusWrites.push(JSON.parse(body));
        return new Response(null, { status: 204 });
      }
    }
    if (url.includes("/rest/v1/projects")) {
      return json(200, {
        organization_id: ORG,
        name: "17446 Microsoft NVE Easement",
        waterway_contact_name: "Gracie D",
        waterway_contact_email: w.contactEmail,
      });
    }
    if (url.includes("/rest/v1/organization_email_settings")) {
      return w.emailConfigured
        ? json(200, {
            tenant_id: "tenant",
            client_id: "client",
            sender_mailbox: "forms-alerts@example.test",
            client_secret_ciphertext: encryptSecret("s3cret", ORG),
          })
        : json(200, null);
    }
    if (url.includes("login.microsoftonline.com")) return json(200, { access_token: "tok", expires_in: 3600 });
    if (url.startsWith("https://graph.microsoft.com/")) {
      const msg = JSON.parse(body).message;
      mails.push({ to: msg.toRecipients[0].emailAddress.address, subject: msg.subject, text: msg.body.content });
      return w.graphStatus === 202 ? new Response(null, { status: 202 }) : json(w.graphStatus, { error: { code: "ErrorX", message: "no" } });
    }
    return new Response("unexpected " + url, { status: 599 });
  }) as typeof fetch;
  return { calls, statusWrites, mails, restore: () => void (globalThis.fetch = original) };
}

const inspection = {
  site_name: "Western Drainage",
  site_descriptor: "",
  inspection_date: "2026-10-08",
  inspection_time: "14:05",
  initials: "FD",
  water_in_waterway: { value: "Yes", comment: "" },
  vehicle_inspection: { value: "Pass", comment: "" },
  bmp_inspection: { value: "Pass", comment: "" },
  sheen_or_plume: { value: "Yes", comment: "rainbow sheen by outfall" },
  equipment_in_use: "",
  photos: [],
} as Parameters<typeof runSheenAlert>[2];

test("claims, sends one email to the project contact, and records it as sent", async () => {
  const f = fakeWorld({ alertExists: false, contactEmail: "gracie@example.test", emailConfigured: true, graphStatus: 202 });
  try {
    assert.equal(await runSheenAlert(SUB, PROJECT, inspection), "sent");
    const claim = f.calls.find((c) => c.url.includes("submission_alerts") && c.method === "POST");
    assert.ok(claim, "the claim is an insert");
    assert.ok(claim.url.includes("on_conflict=submission_id"), "on the (submission, kind) key");
    assert.deepEqual(JSON.parse(claim.body), { submission_id: SUB, kind: "sheen_plume", status: "sending" });
    assert.equal(f.mails.length, 1);
    assert.equal(f.mails[0].to, "gracie@example.test");
    assert.ok(f.mails[0].subject.startsWith("Sheen/plume reported: 17446 Microsoft NVE Easement / Western Drainage"));
    assert.ok(f.mails[0].text.includes(`https://forms.example.test/dashboard/projects/${PROJECT}/forms/working-in-waterways/${SUB}`));
    assert.deepEqual(f.statusWrites, [{ status: "sent", recipient: "gracie@example.test", reason: null, detail: null }]);
  } finally {
    f.restore();
  }
});

test("a second run for the same inspection sends nothing (retried submit)", async () => {
  const f = fakeWorld({ alertExists: false, contactEmail: "gracie@example.test", emailConfigured: true, graphStatus: 202 });
  try {
    assert.equal(await runSheenAlert(SUB, PROJECT, inspection), "sent");
    assert.equal(await runSheenAlert(SUB, PROJECT, inspection), "already_claimed");
    assert.equal(f.mails.length, 1, "exactly one email across both runs");
  } finally {
    f.restore();
  }
});

test("no contact email: records no_contact and contacts nobody", async () => {
  const f = fakeWorld({ alertExists: false, contactEmail: "  ", emailConfigured: true, graphStatus: 202 });
  try {
    assert.equal(await runSheenAlert(SUB, PROJECT, inspection), "no_contact");
    assert.equal(f.mails.length, 0);
    assert.ok(!f.calls.some((c) => c.url.includes("microsoftonline")));
    assert.deepEqual(f.statusWrites, [{ status: "no_contact" }]);
  } finally {
    f.restore();
  }
});

test("email not set up: records not_configured without calling Microsoft", async () => {
  const f = fakeWorld({ alertExists: false, contactEmail: "gracie@example.test", emailConfigured: false, graphStatus: 202 });
  try {
    assert.equal(await runSheenAlert(SUB, PROJECT, inspection), "not_configured");
    assert.equal(f.statusWrites.at(-1)?.status, "not_configured");
    assert.equal(f.statusWrites.at(-1)?.reason, "not_configured");
    assert.ok(!f.calls.some((c) => c.url.includes("microsoftonline")));
  } finally {
    f.restore();
  }
});

test("Microsoft refuses: records failed with the reason, and never throws", async () => {
  const f = fakeWorld({ alertExists: false, contactEmail: "gracie@example.test", emailConfigured: true, graphStatus: 403 });
  try {
    assert.equal(await runSheenAlert(SUB, PROJECT, inspection), "failed");
    const last = f.statusWrites.at(-1) as { status: string; reason: string; recipient: string };
    assert.equal(last.status, "failed");
    assert.equal(last.recipient, "gracie@example.test");
    assert.ok(last.reason && last.reason !== "not_configured");
  } finally {
    f.restore();
  }
});

// ---------------------------------------------------------------- wiring

test("both actions schedule the alert with after(), before redirect", () => {
  const src = read("app/dashboard/projects/[id]/forms/working-in-waterways/actions.ts");
  assert.match(src, /import \{ after \} from "next\/server"/);
  for (const fn of ["submitWaterways", "updateWaterways"]) {
    const body = src.slice(src.indexOf(`export async function ${fn}`));
    const end = body.indexOf("\nexport async function", 10);
    const scope = end === -1 ? body : body.slice(0, end);
    const scheduled = scope.indexOf("after(() => runSheenAlert(");
    assert.ok(scheduled > 0, `${fn} schedules the alert`);
    assert.ok(scheduled < scope.indexOf("redirect("), `${fn} schedules before redirect`);
  }
  assert.match(src, /shouldSendSheenAlert\(stored, data\)/, "the edit compares with the stored answer");
});

test("the inspection page dates the line by the last save and refreshes only while pending", () => {
  const page = read("app/dashboard/projects/[id]/forms/working-in-waterways/[submissionId]/page.tsx");
  assert.match(page, /nevadaTime,\s*undefined,[^\n]*\s*submission\.updated_at,\s*\)/, "describeSheenAlert gets the save time");
  assert.match(page, /\{alertLine\?\.pending && <RefreshWhilePending \/>\}/, "refresher mounted only while pending");
  const refresher = read("components/refresh-while-pending.tsx");
  assert.match(refresher, /^"use client";/);
  assert.match(refresher, /const id = setInterval\(\(\) => router\.refresh\(\), REFRESH_MS\);\s*return \(\) => clearInterval\(id\);/,
    "the timer is cleared when the result is known and the server stops rendering it");
});

test("alert state never touches form_submissions (BF-61 version, BF-63 history)", () => {
  for (const rel of ["lib/alerts/run-sheen-alert.ts", "lib/alerts/sheen-alert-message.ts"]) {
    assert.doesNotMatch(read(rel), /form_submissions/, rel);
  }
});
