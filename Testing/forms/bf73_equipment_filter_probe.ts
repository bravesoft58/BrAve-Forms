/**
 * BF-73 acceptance probe (AC 1, AC 2): the "Copy from previous" history reads
 * filter blank equipment on the server, before their limit, and the per-site
 * read returns only that site. All over PostgREST, the path the app uses:
 *   1. The filter on a JSON key no row has (NULL everywhere) returns no rows.
 *   2. On every project's real Working in Waterways rows, the app's filter
 *      keeps exactly the rows whose equipment text has a non-space character
 *      (`\S` is `[^[:space:]]` in Postgres, as in JS for ASCII whitespace), a
 *      capped read returns min(limit, usable) rows all with equipment, and each
 *      site read returns only that site's usable rows, newest first.
 * The data counts printed first say how many NULL / blank rows were covered.
 *
 * Read-only: SELECTs only, with the service-role key to see every row. Prints
 * counts, never equipment text or site names. Env from BF_ENV_FILE, else the
 * repo's .env.local. Run from the repo root on Node 24:
 *   BF_ENV_FILE=<path to .env.local> node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf73_equipment_filter_probe.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  EQUIPMENT_PATH,
  HAS_EQUIPMENT_PATTERN,
  PREVIOUS_EQUIPMENT_LIMIT,
} from "@/lib/forms/waterways-previous-equipment";

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
let failures = 0;

function check(ok: boolean, label: string): void {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures++;
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const file = process.env.BF_ENV_FILE ?? join(REPO_ROOT, ".env.local");
  for (const line of readFileSync(file, "utf-8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

/**
 * Control for when the Waterways rows alone do not exercise both outcomes: the
 * same `match` filter on the string JSON key, across all forms, with the most
 * rows. The server's id set must equal the rows JS finds non-blank.
 */
async function checkControlPath(sb: SupabaseClient, hasText: RegExp): Promise<void> {
  const all = await sb.from("form_submissions").select("id, data");
  if (all.error) throw new Error(all.error.message);
  const rows = (all.data ?? []) as { id: string; data: Record<string, unknown> | null }[];
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.data ?? {})) if (typeof v === "string") counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const key = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!key || !/^[a-z0-9_]+$/.test(key)) return check(false, "control: a plain string JSON key exists");
  const expected = rows.filter((r) => typeof r.data?.[key] === "string" && hasText.test(r.data[key] as string));
  const server = await sb.from("form_submissions").select("id").filter(`data->>${key}`, "match", HAS_EQUIPMENT_PATTERN);
  if (server.error) throw new Error(server.error.message);
  const got = new Set(server.data.map((r) => r.id));
  check(
    expected.length > 0 && got.size === expected.length && expected.every((r) => got.has(r.id)),
    `control: the filter on a ${counts.get(key)}-row key keeps exactly the ${expected.length} non-blank rows (${counts.get(key)! - expected.length} blank)`,
  );
}

interface Row {
  id: string;
  project_id: string;
  form_date: string;
  site_name: string | null;
  equipment: string | null;
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const select = "id, project_id, form_date, site_name:data->>site_name, equipment:data->>equipment_in_use";
  const base = () =>
    sb.from("form_submissions").select(select).eq("form_type", "working_in_waterways");
  const hasEquipment = new RegExp(HAS_EQUIPMENT_PATTERN);

  const all = await base();
  if (all.error) throw new Error(all.error.message);
  const rows = (all.data ?? []) as Row[];
  const projects = [...new Set(rows.map((r) => r.project_id))];
  const nullCount = rows.filter((r) => r.equipment === null).length;
  const blankCount = rows.filter((r) => r.equipment !== null && !hasEquipment.test(r.equipment)).length;
  console.log(
    `rows=${rows.length} projects=${projects.length} usable=${rows.length - nullCount - blankCount} null=${nullCount} blank=${blankCount}`,
  );

  const missingKey = await base().filter("data->>bf73_no_such_key", "match", HAS_EQUIPMENT_PATTERN);
  if (missingKey.error) throw new Error(missingKey.error.message);
  check(rows.length > 0 && missingKey.data.length === 0, "a NULL JSON value never passes the filter");
  await checkControlPath(sb, hasEquipment);

  for (const projectId of projects) {
    const tag = `project ${projectId.slice(0, 8)}`;
    const usable = rows.filter((r) => r.project_id === projectId && hasEquipment.test(r.equipment ?? ""));

    const filtered = await base().eq("project_id", projectId).filter(EQUIPMENT_PATH, "match", HAS_EQUIPMENT_PATTERN);
    if (filtered.error) throw new Error(filtered.error.message);
    const got = new Set((filtered.data as Row[]).map((r) => r.id));
    check(
      got.size === usable.length && usable.every((r) => got.has(r.id)),
      `${tag}: server filter keeps exactly the ${usable.length} rows with equipment`,
    );

    const capped = await base()
      .eq("project_id", projectId)
      .filter(EQUIPMENT_PATH, "match", HAS_EQUIPMENT_PATTERN)
      .order("form_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(PREVIOUS_EQUIPMENT_LIMIT);
    if (capped.error) throw new Error(capped.error.message);
    const cappedRows = capped.data as Row[];
    check(
      cappedRows.length === Math.min(PREVIOUS_EQUIPMENT_LIMIT, usable.length) &&
        cappedRows.every((r) => hasEquipment.test(r.equipment ?? "")),
      `${tag}: capped read returns ${cappedRows.length} usable rows (limit counts usable rows only)`,
    );

    for (const site of [...new Set(usable.map((r) => r.site_name).filter((s): s is string => !!s))]) {
      const siteRead = await base()
        .eq("project_id", projectId)
        .filter(EQUIPMENT_PATH, "match", HAS_EQUIPMENT_PATTERN)
        .eq("data->>site_name", site)
        .order("form_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(PREVIOUS_EQUIPMENT_LIMIT);
      if (siteRead.error) throw new Error(siteRead.error.message);
      const siteRows = siteRead.data as Row[];
      const expected = usable.filter((r) => r.site_name === site);
      const dates = siteRows.map((r) => r.form_date);
      check(
        siteRows.length === Math.min(PREVIOUS_EQUIPMENT_LIMIT, expected.length) &&
          siteRows.every((r) => r.site_name === site && hasEquipment.test(r.equipment ?? "")) &&
          dates.every((d, i) => i === 0 || dates[i - 1] >= d),
        `${tag}: site read returns ${siteRows.length} of the site's ${expected.length} usable rows, that site only, newest first`,
      );
    }
  }

  console.log(failures === 0 ? "ALL CHECKS PASS" : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("probe error:", error instanceof Error ? error.message : error);
  process.exit(2);
});
