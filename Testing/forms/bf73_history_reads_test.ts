/**
 * BF-73 verify: the real getRecentWaterwaysEquipment over a stubbed PostgREST
 * transport, so the per-site wiring is proven by behaviour rather than by the
 * source text. Checks the requests it sends (one project read plus one per
 * site, each with the equipment filter, newest-first order and the limit), the
 * merged result the picker receives, and that one failed read fails the whole
 * history (the page then hides the picker). The stub evaluates the filters in
 * JS; Postgres's own `~ '\S'` is proven by bf73_equipment_filter_probe.ts.
 * No network, no database.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf73_history_reads_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { createClient } from "@supabase/supabase-js";
import {
  PREVIOUS_EQUIPMENT_LIMIT,
  orderPreviousEquipment,
  previousEquipmentUnavailable,
} from "@/lib/forms/waterways-previous-equipment";

// The app's server client needs Next's request cookies; hand the query a plain
// supabase-js client whose fetch is the stub below instead.
const STUB_URL = "file:///bf73-stub/supabase-server.mjs";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/supabase/server") return { url: STUB_URL, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url !== STUB_URL) return nextLoad(url, context);
    return { format: "module", source: "export const createClient = async () => globalThis.__bf73Client;", shortCircuit: true };
  },
});

interface Submission {
  id: string;
  project_id: string;
  form_type: string;
  form_date: string;
  created_at: string;
  site_name: string | null;
  equipment: string | null;
}

let table: Submission[] = [];
let failSite: string | null = null;
let requests: URLSearchParams[] = [];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Just enough PostgREST for these reads: eq, match, the two-key order, limit. */
async function stubFetch(input: string | URL | Request): Promise<Response> {
  const q = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).searchParams;
  requests.push(q);
  const site = q.get("data->>site_name")?.replace(/^eq\./, "");
  if (site !== undefined && site === failSite) return json({ message: `read failed for ${site}`, code: "57014" }, 500);
  const pattern = new RegExp((q.get("data->>equipment_in_use") ?? "").replace(/^match\./, ""));
  const rows = table
    .filter((r) => q.get("project_id") === `eq.${r.project_id}` && q.get("form_type") === `eq.${r.form_type}`)
    .filter((r) => r.equipment !== null && pattern.test(r.equipment))
    .filter((r) => site === undefined || r.site_name === site)
    .sort((a, b) => b.form_date.localeCompare(a.form_date) || b.created_at.localeCompare(a.created_at))
    .slice(0, Number(q.get("limit")))
    .map(({ id, form_date, created_at, site_name, equipment }) => ({ id, form_date, created_at, site_name, initials: "GD", equipment }));
  return json(rows);
}

Object.assign(globalThis, {
  __bf73Client: createClient("https://stub.supabase.co", "stub-anon-key", {
    global: { fetch: stubFetch },
    auth: { persistSession: false },
  }),
});
const { getRecentWaterwaysEquipment } = await import("@/lib/queries/projects");

function inspection(id: string, form_date: string, site_name: string | null, equipment: string | null, project_id = "P1"): Submission {
  return { id, project_id, form_type: "working_in_waterways", form_date, created_at: `${form_date}T15:00:00.123456+00:00`, site_name, equipment };
}

/** `count` daily inspections at `site`, newest first, starting on September `from`. */
const daily = (prefix: string, site: string, from: number, count: number, equipment: string | null = "Excavator") =>
  Array.from({ length: count }, (_, i) => inspection(`${prefix}${i}`, `2026-09-${String(from - i).padStart(2, "0")}`, site, equipment));

function reset(rows: Submission[]): void {
  table = rows;
  failSite = null;
  requests = [];
}

test("one project read plus one per site, each filtered, ordered newest first and capped (AC1)", async () => {
  reset([
    ...daily("e", "Eastern Drainage", 30, 11),
    inspection("w", "2026-09-10", "Western Drainage", "Loader, skid steer"),
    inspection("other-project", "2026-10-01", "Western Drainage", "Pump", "P2"),
    { ...inspection("other-form", "2026-10-02", "Western Drainage", "Pump"), form_type: "daily_dust_log" },
  ]);
  const rows = await getRecentWaterwaysEquipment("P1", ["Eastern Drainage", "Western Drainage"]);

  assert.equal(requests.length, 3);
  for (const q of requests) {
    assert.equal(q.get("project_id"), "eq.P1");
    assert.equal(q.get("form_type"), "eq.working_in_waterways");
    assert.equal(q.get("data->>equipment_in_use"), "match.\\S");
    assert.equal(q.get("order"), "form_date.desc,created_at.desc");
    assert.equal(q.get("limit"), String(PREVIOUS_EQUIPMENT_LIMIT));
    assert.match(q.get("select") ?? "", /created_at/);
  }
  assert.deepEqual(requests.map((q) => String(q.get("data->>site_name"))).sort(), [
    "eq.Eastern Drainage",
    "eq.Western Drainage",
    "null",
  ]);
  // Merged: the ten newest Eastern rows once each (project and site reads overlap) plus the Western row.
  assert.deepEqual(rows.map((r) => r.id), [...daily("e", "", 30, 10).map((r) => r.id), "w"]);
  const picker = orderPreviousEquipment(rows, "Western Drainage");
  assert.equal(picker[0].id, "w");
  assert.equal(picker.length, PREVIOUS_EQUIPMENT_LIMIT);
});

test("behind ten blank inspections the older ones with equipment still come back (AC2)", async () => {
  reset([
    ...daily("blank", "Eastern Drainage", 30, 4, ""),
    ...daily("null", "Eastern Drainage", 26, 3, null),
    ...daily("spaces", "Eastern Drainage", 23, 3, "  \n "),
    ...daily("u", "Eastern Drainage", 20, 3, "Hand tools"),
  ]);
  const rows = await getRecentWaterwaysEquipment("P1", ["Eastern Drainage"]);
  assert.deepEqual(rows.map((r) => r.id), ["u0", "u1", "u2"]);
});

test("the edit page's one extra applies to every read", async () => {
  reset(daily("w", "Western Drainage", 30, 12));
  const rows = await getRecentWaterwaysEquipment("P1", ["Western Drainage"], PREVIOUS_EQUIPMENT_LIMIT + 1);
  assert.deepEqual(requests.map((q) => q.get("limit")), [String(PREVIOUS_EQUIPMENT_LIMIT + 1), String(PREVIOUS_EQUIPMENT_LIMIT + 1)]);
  assert.equal(rows.length, PREVIOUS_EQUIPMENT_LIMIT + 1);
  assert.deepEqual(orderPreviousEquipment(rows, "Western Drainage", "w0").map((r) => r.id), daily("w", "", 30, 11).slice(1).map((r) => r.id));
});

test("a site name with commas, brackets, & and % reaches the server intact", async () => {
  const site = "North, (old) & 50% bank";
  reset([inspection("n", "2026-09-30", site, "Pump"), ...daily("e", "Eastern Drainage", 29, 10)]);
  const rows = await getRecentWaterwaysEquipment("P1", [site]);
  assert.ok(requests.some((q) => q.get("data->>site_name") === `eq.${site}`));
  assert.equal(orderPreviousEquipment(rows, site)[0].id, "n");
});

test("with no sites only the project read runs", async () => {
  reset([inspection("r", "2026-09-30", "Renamed Site", "Loader")]);
  const rows = await getRecentWaterwaysEquipment("P1", []);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].get("data->>site_name"), null);
  assert.deepEqual(rows.map((r) => r.id), ["r"]);
});

test("one failed read fails the whole history; the page fallback hides the picker", async () => {
  reset(daily("e", "Eastern Drainage", 30, 3));
  failSite = "Western Drainage";
  await assert.rejects(getRecentWaterwaysEquipment("P1", ["Eastern Drainage", "Western Drainage"]), /read failed for Western Drainage/);
  const silenced = console.error;
  console.error = () => {};
  try {
    const fallback = await getRecentWaterwaysEquipment("P1", ["Western Drainage"]).catch(previousEquipmentUnavailable);
    assert.deepEqual(fallback, []);
  } finally {
    console.error = silenced;
  }
});
