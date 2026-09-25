/**
 * BF-58.1 readiness check: BF-58.1 moved the photo schema to a shared module
 * and constrained `file_name` to the uploader's shape. The NDOT edit action
 * re-validates `form_submissions.data`, so every existing NDOT photo name must
 * still pass, or an old record would open in edit but could never be saved.
 *
 * Read-only: one SELECT with the service-role key (bypasses RLS to see every row).
 * Run from the repo root on Node 24:
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf58_1_ndot_photo_readiness.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { photoSchema } from "@/lib/schemas/form-photo";

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
    .select("id, form_date, data")
    .eq("form_type", "ndot_weekly_stormwater")
    .order("form_date", { ascending: true });
  if (error) throw new Error(`select failed: ${error.message}`);

  let photos = 0;
  let fails = 0;
  for (const row of rows ?? []) {
    const list: unknown[] = Array.isArray(row.data?.photos) ? row.data.photos : [];
    for (const p of list) {
      photos += 1;
      const r = photoSchema.safeParse(p);
      if (!r.success) {
        fails += 1;
        const name = (p as { file_name?: unknown })?.file_name;
        console.log(`FAIL  ${row.id.slice(0, 8)}  ${row.form_date}  file_name=${JSON.stringify(name)}`);
      }
    }
  }

  console.log(`${rows?.length ?? 0} NDOT submissions, ${photos} photos checked, ${fails} would fail the new schema`);
  console.log(`RESULT: ${fails === 0 ? "PASS" : "FAIL"}`);
  process.exit(fails ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error("ERROR:", e instanceof Error ? e.message : String(e));
  process.exit(2);
});
