/**
 * BF-57 acceptance check (AC 6): every existing NDEP Weekly Stormwater submission
 * must parse under the current Zod schema, because the edit page hydrates the form
 * from `form_submissions.data` and the update action re-validates it on save. A row
 * that fails here would open in edit but could never be saved unchanged.
 *
 * Read-only: one SELECT with the service-role key (bypasses RLS to see every row).
 * Run from the repo root on Node 22.18+ (built-in type stripping):
 *   node Testing/forms/bf57_ndep_edit_readiness.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { ndepStormwaterSchema } from "../../src/lib/schemas/ndep-stormwater.ts";

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(join(REPO_ROOT, ".env.local"), "utf-8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await sb
    .from("form_submissions")
    .select("id, project_id, form_date, submitted_by, data")
    .eq("form_type", "ndep_weekly_stormwater")
    .order("form_date", { ascending: true });
  if (error) throw new Error(`select failed: ${error.message}`);

  let fails = 0;
  for (const row of rows ?? []) {
    const result = ndepStormwaterSchema.safeParse(row.data);
    if (result.success) {
      console.log(`PASS  ${row.id.slice(0, 8)}  ${row.form_date}  parses; inspector=${JSON.stringify(result.data.inspector_name)}`);
    } else {
      fails += 1;
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.log(`FAIL  ${row.id.slice(0, 8)}  ${row.form_date}  ${issues}`);
    }
  }

  console.log(`\n${rows?.length ?? 0} NDEP submissions checked, ${fails} would fail re-validation`);
  console.log(`RESULT: ${fails === 0 ? "PASS" : "FAIL"}`);
  process.exit(fails ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error("ERROR:", e instanceof Error ? e.message : String(e));
  process.exit(2);
});
