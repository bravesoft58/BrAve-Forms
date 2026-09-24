/**
 * BF-56 end-to-end check: stable QR -> 12 h inspector session -> portal.
 *
 * Drives the real scan route (/inspector/<token>) and portal (/inspector) of a
 * running app (default http://localhost:3100, e.g. `next start -p 3100`) that
 * points at the production database, and asserts on HTTP responses plus the
 * rows the route writes.
 *
 * Writes to production, but only its own rows: it inserts test qr_tokens
 * (created_by = the claude.test account) and deletes exactly those ids in a
 * finally block; sessions go with them by ON DELETE CASCADE. It never touches
 * a real token. It refuses to run without --run, rejects unknown arguments,
 * and exits 1 on any failed check or on leftover test rows.
 *
 * Run: node Testing/security/bf56_session_e2e.mjs --run [--base-url URL]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const TEST_CREATOR = "284ff2a0-2ce2-4d19-8b71-6b59d35f0db2"; // claude.test (org admin)
const SESSION_HOURS = 12;

function parseArgs(argv) {
  const out = { run: false, baseUrl: "http://localhost:3100" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--run") out.run = true;
    else if (argv[i] === "--base-url" && argv[i + 1]) out.baseUrl = argv[++i];
    else {
      console.error(`unknown argument: ${argv[i]}`);
      process.exit(2);
    }
  }
  return out;
}

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(REPO_ROOT, ".env.local"), "utf-8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const args = parseArgs(process.argv.slice(2));
if (!args.run) {
  console.error("Refusing to run: this writes (and removes) test rows in production. Pass --run.");
  process.exit(2);
}

const env = loadEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const created = [];
let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` -- ${detail}` : ""}`);
}

async function insertToken(projectId, expiresAt) {
  const { data, error } = await db
    .from("qr_tokens")
    .insert({ project_id: projectId, expires_at: expiresAt, created_by: TEST_CREATOR })
    .select("id, token")
    .single();
  if (error) throw new Error(`insert test token: ${error.message}`);
  created.push(data.id);
  return data;
}

async function scan(token) {
  const res = await fetch(`${args.baseUrl}/inspector/${token}`, { redirect: "manual" });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const m = setCookie.match(/inspector_session=([^;]*)/);
  return { status: res.status, location: res.headers.get("location") ?? "", setCookie, session: m ? m[1] : null };
}

/** Expiry (unix s) of every Supabase signed URL embedded in a portal page. */
function signedUrlExpiries(body) {
  const tokens = new Set(
    [...body.matchAll(/token=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g)].map((m) => m[1]),
  );
  return [...tokens].map((t) => JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString()).exp);
}

async function portal(sessionId) {
  const headers = sessionId ? { cookie: `inspector_session=${sessionId}` } : {};
  const res = await fetch(`${args.baseUrl}/inspector`, { headers, redirect: "manual" });
  return { status: res.status, body: await res.text() };
}

async function main() {
  // A Q&D project with no active stable token, so the test never shadows a real one.
  const { data: projects } = await db.from("projects").select("id, name").order("name");
  const { data: stables } = await db
    .from("qr_tokens").select("project_id").is("expires_at", null).is("revoked_at", null);
  const taken = new Set((stables ?? []).map((s) => s.project_id));
  const project = (projects ?? []).find((p) => !taken.has(p.id));
  if (!project) throw new Error("every project already has an active stable token; not touching real ones");
  console.log(`test project: ${project.name}`);

  // AC1/AC2: stable token scan -> session cookie -> portal for the SAME project.
  const stable = await insertToken(project.id, null);
  const s1 = await scan(stable.token);
  check("scan returns 303 to /inspector", s1.status === 303 && new URL(s1.location, args.baseUrl).pathname === "/inspector" && !s1.location.includes("link="), `${s1.status} ${s1.location}`);
  const maxAgeOf = (sc) => Number((sc.match(/Max-Age=(\d+)/i) ?? [])[1] ?? -1);
  check("cookie is HttpOnly, Secure, SameSite=lax, Path=/inspector, Max-Age ~12 h",
    /HttpOnly/i.test(s1.setCookie) && /Secure/i.test(s1.setCookie) && /SameSite=lax/i.test(s1.setCookie) &&
    /Path=\/inspector(;|$)/i.test(s1.setCookie) && maxAgeOf(s1.setCookie) >= 43190 && maxAgeOf(s1.setCookie) <= 43200,
    s1.setCookie);

  const { data: row1 } = await db.from("inspector_sessions").select("qr_token_id, expires_at").eq("id", s1.session).single();
  const hours = row1 ? (new Date(row1.expires_at) - Date.now()) / 3.6e6 : -1;
  check("session row belongs to the scanned token", row1?.qr_token_id === stable.id);
  check("session expires ~12 h from now", Math.abs(hours - SESSION_HOURS) < 0.05, `${hours.toFixed(3)} h`);

  const p1 = await portal(s1.session);
  check("portal with session renders the scanned project", p1.status === 200 && p1.body.includes(project.name));

  // AC7: no signed file URL outlives the session. With 12 h left the cap is
  // one hour; with 2 minutes left every URL must expire within those 2 minutes.
  const nowS = () => Math.floor(Date.now() / 1000);
  const fullExp = signedUrlExpiries(p1.body);
  check("portal carries signed file URLs to test (sentinel)", fullExp.length > 0, `${fullExp.length} URLs`);
  check("with 12 h left, signed URLs last ~1 h (cap)",
    fullExp.length > 0 && fullExp.every((e) => e - nowS() > 3500 && e - nowS() <= 3605),
    fullExp.map((e) => e - nowS()).join(","));
  const shortEnd = nowS() + 120;
  await db.from("inspector_sessions").update({ expires_at: new Date(shortEnd * 1000).toISOString() }).eq("id", s1.session);
  const shortExp = signedUrlExpiries((await portal(s1.session)).body);
  check("with 2 min left, every signed URL expires no later than the session",
    shortExp.length > 0 && shortExp.every((e) => e <= shortEnd && e > nowS()),
    shortExp.map((e) => e - nowS()).join(","));

  const pNone = await portal(null);
  check("portal without cookie shows Session Expired, no project data",
    pNone.body.includes("Session Expired") && !pNone.body.includes(project.name));

  const pForged = await portal(crypto.randomUUID());
  check("portal with unknown session id shows Session Expired", pForged.body.includes("Session Expired") && !pForged.body.includes(project.name));

  // AC3: after the window, refresh shows expired and no data.
  await db.from("inspector_sessions").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("id", s1.session);
  const p2 = await portal(s1.session);
  check("expired session shows Session Expired, no project data", p2.body.includes("Session Expired") && !p2.body.includes(project.name));

  // AC4 + AC1: re-scan the same QR works; the token itself is unchanged.
  const s2 = await scan(stable.token);
  const p3 = await portal(s2.session);
  check("re-scan after expiry opens a new session", s2.session && s2.session !== s1.session && p3.body.includes(project.name));
  const { data: tokAfter } = await db.from("qr_tokens").select("token, expires_at, revoked_at").eq("id", stable.id).single();
  check("stable token unchanged after scans (same URL, never expires)",
    tokAfter.token === stable.token && tokAfter.expires_at === null && tokAfter.revoked_at === null);

  // AC5: revoke ends the open session immediately and the QR stops working.
  await db.from("qr_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", stable.id);
  const p4 = await portal(s2.session);
  check("revoke ends an open session on the next load", p4.body.includes("Session Expired") && !p4.body.includes(project.name));
  const s3 = await scan(stable.token);
  check("revoked QR redirects to link=invalid and clears the cookie",
    s3.status === 303 && s3.location.includes("link=invalid") && /inspector_session=;/.test(s3.setCookie) && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(s3.setCookie), s3.setCookie);
  const pInvalid = await fetch(`${args.baseUrl}/inspector?link=invalid`).then((r) => r.text());
  check("invalid-link page shows QR Code Not Valid", pInvalid.includes("QR Code Not Valid"));

  // AC6: legacy 30-day tokens work until their own expiry, then stop.
  const legacyLive = await insertToken(project.id, new Date(Date.now() + 3600e3).toISOString());
  const s4 = await scan(legacyLive.token);
  check("unexpired legacy token still opens a session", s4.session && (await portal(s4.session)).body.includes(project.name));
  // Verify round 2: a legacy token scanned near its own expiry must not grant
  // access (session, cookie, or signed file URLs) beyond that expiry.
  const nearEnd = Math.floor(Date.now() / 1000) + 90;
  const legacyNear = await insertToken(project.id, new Date(nearEnd * 1000).toISOString());
  const s8 = await scan(legacyNear.token);
  const { data: rowNear } = await db.from("inspector_sessions").select("expires_at").eq("id", s8.session).single();
  const rowNearEnd = rowNear ? Math.floor(new Date(rowNear.expires_at).getTime() / 1000) : Infinity;
  check("session from a near-expiry legacy token ends with the token",
    s8.session && rowNearEnd <= nearEnd, `session end - token end = ${rowNearEnd - nearEnd} s`);
  check("its cookie lives no longer than the token", maxAgeOf(s8.setCookie) > 0 && maxAgeOf(s8.setCookie) <= 90,
    `Max-Age=${maxAgeOf(s8.setCookie)}`);
  const nearExp = signedUrlExpiries((await portal(s8.session)).body);
  check("its signed URLs expire no later than the token",
    nearExp.length > 0 && nearExp.every((e) => e <= nearEnd), nearExp.map((e) => e - nowS()).join(","));

  const legacyDead = await insertToken(project.id, new Date(Date.now() - 3600e3).toISOString());
  const s5 = await scan(legacyDead.token);
  check("expired legacy token is refused", s5.location.includes("link=invalid") && !s5.session);

  // Malformed and unknown tokens never reach a session.
  const s6 = await scan("not-a-uuid");
  const s7 = await scan(crypto.randomUUID());
  check("malformed and unknown tokens are refused", s6.location.includes("link=invalid") && s7.location.includes("link=invalid"));
}

try {
  await main();
} catch (e) {
  failed++;
  console.log(`FAIL harness error -- ${e.message}`);
} finally {
  if (created.length) {
    const { error } = await db.from("qr_tokens").delete().in("id", created);
    if (error) console.log(`FAIL cleanup -- ${error.message}`);
    const { count: left } = await db.from("qr_tokens").select("id", { count: "exact", head: true }).in("id", created);
    const { count: sess } = await db.from("inspector_sessions").select("id", { count: "exact", head: true }).in("qr_token_id", created);
    check("cleanup removed every test token and session", left === 0 && sess === 0, `tokens ${left}, sessions ${sess}`);
  }
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
