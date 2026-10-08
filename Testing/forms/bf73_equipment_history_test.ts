/**
 * BF-73 unit checks: the "Copy from previous" history is read per site plus
 * project-wide, then merged and ordered, so neither a busy other site nor a run
 * of blank inspections can push usable rows out of the picker. No network, no
 * database (the server-side filter is proven by bf73_equipment_filter_probe.ts).
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf73_equipment_history_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HAS_EQUIPMENT_PATTERN,
  PREVIOUS_EQUIPMENT_LIMIT,
  mergePreviousEquipment,
  orderPreviousEquipment,
  type PreviousEquipment,
} from "@/lib/forms/waterways-previous-equipment";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf-8");

function row(id: string, form_date: string, site_name: string, equipment = `Excavator (${id})`, created_at = "2026-10-08T15:00:00+00:00"): PreviousEquipment {
  return { id, form_date, created_at, site_name, initials: "GD", equipment };
}

/** `count` daily inspections at `site`, newest first, ending the day before `from`. */
function daily(prefix: string, site: string, from: number, count: number): PreviousEquipment[] {
  return Array.from({ length: count }, (_, i) => row(`${prefix}${i}`, `2026-09-${String(from - i).padStart(2, "0")}`, site));
}

const ids = (list: readonly PreviousEquipment[]) => list.map((r) => r.id);

test("an older same-site inspection beats eleven newer ones elsewhere (AC1)", () => {
  // Eastern was inspected on each of the last 11 days, Western last on the 10th.
  const eastern = daily("e", "Eastern Drainage", 30, 11);
  const western = row("w", "2026-09-10", "Western Drainage", "Loader, skid steer");
  // What the reads return, each capped at the limit: project-wide, then per site.
  const projectRead = eastern.slice(0, PREVIOUS_EQUIPMENT_LIMIT);
  const easternRead = eastern.slice(0, PREVIOUS_EQUIPMENT_LIMIT);
  const westernRead = [western];
  assert.ok(!projectRead.includes(western), "the project-wide read alone never reaches it (the BF-70 gap)");

  const picker = orderPreviousEquipment(mergePreviousEquipment([...projectRead, ...easternRead, ...westernRead]), "Western Drainage");
  assert.equal(picker[0].id, "w");
  assert.equal(picker.length, PREVIOUS_EQUIPMENT_LIMIT);
  // The rest are the newest Eastern rows, newest first.
  assert.deepEqual(ids(picker.slice(1)), ids(eastern.slice(0, PREVIOUS_EQUIPMENT_LIMIT - 1)));
});

test("rows from overlapping reads appear once, newest first by date then save time (AC3)", () => {
  const morning = row("m", "2026-10-07", "Eastern Drainage", "Pump", "2026-10-07T15:00:00+00:00");
  const afternoon = row("p", "2026-10-07", "Western Drainage", "Loader", "2026-10-07T21:30:00.5+00:00");
  const older = row("o", "2026-10-06", "Eastern Drainage", "Hand tools", "2026-10-08T09:00:00+00:00");
  // Same record from the project read and from its site read.
  const merged = mergePreviousEquipment([older, morning, afternoon, { ...morning }, older]);
  assert.deepEqual(ids(merged), ["p", "m", "o"]);
  assert.deepEqual(ids(mergePreviousEquipment([])), []);
});

test("each group stays newest first after the merge, same site on top (AC3)", () => {
  const merged = mergePreviousEquipment([
    row("w2", "2026-10-02", "Western Drainage"),
    row("e3", "2026-10-03", "Eastern Drainage"),
    row("w4", "2026-10-04", "Western Drainage"),
    row("e1", "2026-10-01", "Eastern Drainage"),
  ]);
  assert.deepEqual(ids(orderPreviousEquipment(merged, "Western Drainage")), ["w4", "w2", "e3", "e1"]);
  assert.deepEqual(ids(orderPreviousEquipment(merged, "")), ["w4", "e3", "w2", "e1"]);
});

test("the edited record is excluded and the extra row keeps the list full (AC3)", () => {
  // The edit page reads LIMIT + 1 per read; the record being edited is the newest.
  const fetched = daily("w", "Western Drainage", 30, PREVIOUS_EQUIPMENT_LIMIT + 1);
  const picker = orderPreviousEquipment(mergePreviousEquipment(fetched), "Western Drainage", "w0");
  assert.equal(picker.length, PREVIOUS_EQUIPMENT_LIMIT);
  assert.ok(!ids(picker).includes("w0"));
  assert.deepEqual(ids(picker), ids(fetched.slice(1)));
});

test("the picker shows at most the limit, same-site rows first", () => {
  const merged = mergePreviousEquipment([...daily("w", "Western Drainage", 30, 7), ...daily("e", "Eastern Drainage", 29, 7)]);
  const picker = orderPreviousEquipment(merged, "Western Drainage");
  assert.equal(picker.length, PREVIOUS_EQUIPMENT_LIMIT);
  assert.deepEqual(ids(picker), [...ids(daily("w", "Western Drainage", 30, 7)), "e0", "e1", "e2"]);
});

test("the server filter's pattern accepts equipment text and refuses blanks (AC2)", () => {
  // Postgres `~` and JS RegExp agree on \S for ASCII whitespace; the probe checks Postgres itself.
  const hasEquipment = new RegExp(HAS_EQUIPMENT_PATTERN);
  for (const text of ["Loader", "  Pump  ", "\nSkid steer"]) assert.ok(hasEquipment.test(text), JSON.stringify(text));
  for (const text of ["", "   ", "\t\r\n"]) assert.ok(!hasEquipment.test(text), JSON.stringify(text));
});

test("with the ten newest blank, older rows with equipment still fill the picker (AC2)", () => {
  // The filtered read skips the blanks before its limit, so it returns the older usable rows.
  const all = [...daily("b", "Eastern Drainage", 30, 10).map((r) => ({ ...r, equipment: "  " })), ...daily("u", "Eastern Drainage", 20, 3)];
  const hasEquipment = new RegExp(HAS_EQUIPMENT_PATTERN);
  const filteredRead = all.filter((r) => hasEquipment.test(r.equipment ?? "")).slice(0, PREVIOUS_EQUIPMENT_LIMIT);
  const picker = orderPreviousEquipment(mergePreviousEquipment(filteredRead), "Eastern Drainage");
  assert.deepEqual(ids(picker), ["u0", "u1", "u2"]);
  // The BF-70 read (unfiltered, then capped) would have left nothing.
  assert.deepEqual(orderPreviousEquipment(all.slice(0, PREVIOUS_EQUIPMENT_LIMIT), "Eastern Drainage"), []);
});

// --- Static wiring guards ---

test("every history read filters blank equipment before its limit, and reads per site", () => {
  const src = read("lib/queries/projects.ts");
  const fn = src.slice(src.indexOf("export async function getRecentWaterwaysEquipment"));
  const body = fn.slice(0, fn.indexOf("\n}\n"));
  const filterAt = body.indexOf('.filter(EQUIPMENT_PATH, "match", HAS_EQUIPMENT_PATTERN)');
  assert.ok(filterAt > 0, "the equipment filter is applied");
  assert.ok(filterAt < body.indexOf(".limit(limit)"), "the filter comes before the limit");
  assert.match(body, /\.eq\("data->>site_name", siteName\)/);
  assert.match(body, /Promise\.all\(\[read\(\), \.\.\.siteNames\.map\(/);
  assert.match(body, /return mergePreviousEquipment\(/);
});

test("both pages pass the project's sites; the edit page keeps one extra per read", () => {
  const base = "app/dashboard/projects/[id]/forms/working-in-waterways/";
  assert.match(read(base + "new/page.tsx"), /getRecentWaterwaysEquipment\(id, siteNames\)/);
  const edit = read(base + "[submissionId]/edit/page.tsx");
  assert.match(edit, /getRecentWaterwaysEquipment\(id, siteNames, PREVIOUS_EQUIPMENT_LIMIT \+ 1\)/);
  assert.match(edit, /initialData\.site_name\]/);
});
