/**
 * BF-54 verify (round 3): read-only confirmation of the production database end-state.
 *
 * Independently re-checks the acceptance criteria for the test-project cleanup:
 *   - exactly the three kept projects remain, all under Q&D Construction;
 *   - no child row references any removed project id;
 *   - the kept submissions are intact (18 total; 9 / 3 / 6 per project);
 *   - no dangling form_submissions.based_on_id link survives.
 *
 * Read-only: only SELECT/count queries. Uses the service-role key to bypass RLS.
 * Run: node Testing/security/bf54_verify_dbstate.mjs
 *
 * Point-in-time check. The expected totals (18 submissions, 9/3/6 per project) are the
 * production snapshot right after the 2026-09-21 cleanup. They will drift as soon as Q&D
 * submits new forms, so a later FAIL on the AC4 count lines is expected and not a regression.
 * The AC1, AC2 and integrity checks stay valid indefinitely.
 * Written by verify round 3 (2026-09-21); last run PASS 2026-09-22T12:06:32Z (15/15).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

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

const REMOVED = [
  "4dff54b4-c8f2-4d1f-8e59-b4bf764cba9c",
  "06c0610c-6d41-4008-8d24-08f8c3d6cd49",
  "f0244e03-fb12-48ba-b307-fc8495c545e1",
  "6a92e761-bcc4-42fa-8043-4d5938a77c04",
  "1ef41705-68ae-46c1-8eee-ff7cbdceec5c",
  "1a5c83b5-3798-45ca-b88b-2accda53151f",
  "00000000-0000-0000-0000-000000000001",
];
const KEEP_NAMES = [
  "17254 NDOT 4541 7 Bridges",
  "17446 - Deodar St",
  "17446 - Microsoft NVE Easement",
];
const CHILD_TABLES = [
  "form_submissions",
  "project_documents",
  "project_form_requirements",
  "project_permits",
  "project_users",
  "qr_tokens",
];

async function countIn(sb, table, col, ids) {
  const { count, error } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .in(col, ids);
  if (error) throw new Error(`${table}.${col} count failed: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let fails = 0;
  const check = (label, ok, detail) => {
    fails += ok ? 0 : 1;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  :: " + detail : ""}`);
  };

  // AC1 -- exactly the three kept projects remain, all Q&D Construction
  const { data: projects, error: pErr } = await sb
    .from("projects")
    .select("id, name, organization_id, organizations(name)");
  if (pErr) throw new Error(`projects select failed: ${pErr.message}`);
  const names = projects.map((p) => p.name).sort();
  check("AC1 project count == 3", projects.length === 3, `got ${projects.length}: [${names.join(" | ")}]`);
  check(
    "AC1 names are exactly the kept set",
    JSON.stringify(names) === JSON.stringify([...KEEP_NAMES].sort()),
    `[${names.join(" | ")}]`,
  );
  const orgs = [...new Set(projects.map((p) => p.organizations?.name ?? "?"))];
  check("AC1 all kept projects under one org (Q&D)", orgs.length === 1, `orgs: ${orgs.join(", ")}`);
  const removedStillPresent = projects.filter((p) => REMOVED.includes(p.id));
  check("AC1 no removed id still a project row", removedStillPresent.length === 0, `${removedStillPresent.length} present`);

  // AC2 -- no child row references any removed project id
  for (const t of CHILD_TABLES) {
    const c = await countIn(sb, t, "project_id", REMOVED);
    check(`AC2 ${t} rows referencing removed ids == 0`, c === 0, `count=${c}`);
  }

  // AC4 -- kept submissions intact
  const { count: subTotal, error: sErr } = await sb
    .from("form_submissions")
    .select("*", { count: "exact", head: true });
  if (sErr) throw new Error(`form_submissions count failed: ${sErr.message}`);
  check("AC4 form_submissions total == 18", subTotal === 18, `count=${subTotal}`);

  const keptIds = projects.map((p) => p.id);
  const perProject = {};
  for (const p of projects) {
    const { count } = await sb
      .from("form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("project_id", p.id);
    perProject[p.name] = count ?? 0;
  }
  console.log("      per-kept-project submission counts:", JSON.stringify(perProject));
  check(
    "AC4 per-project submissions == 9/3/6",
    perProject["17254 NDOT 4541 7 Bridges"] === 9 &&
      perProject["17446 - Deodar St"] === 3 &&
      perProject["17446 - Microsoft NVE Easement"] === 6,
    JSON.stringify(perProject),
  );

  // AC2/integrity -- no dangling based_on_id (a kept submission pointing at a deleted one)
  const { data: basedRows, error: bErr } = await sb
    .from("form_submissions")
    .select("id, based_on_id")
    .not("based_on_id", "is", null);
  if (bErr) throw new Error(`based_on_id select failed: ${bErr.message}`);
  const existing = new Set((await sb.from("form_submissions").select("id")).data.map((r) => r.id));
  const dangling = basedRows.filter((r) => !existing.has(r.based_on_id));
  check("integrity: no dangling based_on_id link", dangling.length === 0, `${dangling.length} dangling`);
  const basedIntoRemoved = basedRows.filter((r) => REMOVED.includes(r.based_on_id));
  check("integrity: no based_on_id into a removed project", basedIntoRemoved.length === 0, `${basedIntoRemoved.length}`);

  console.log(`\nRESULT: ${fails === 0 ? "PASS (all DB acceptance checks confirmed)" : fails + " FAIL"}`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(2);
});
