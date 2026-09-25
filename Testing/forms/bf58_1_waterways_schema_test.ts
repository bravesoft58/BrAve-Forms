/**
 * BF-58.1 unit checks for the Working in Waterways schema, the site rules, the
 * shared photo schema and the Pacific date helper. No network, no database.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf58_1_waterways_schema_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { pacificTime, pacificToday } from "@/lib/dates";
import * as formPhoto from "@/lib/schemas/form-photo";
const { photoSchema } = formPhoto;
// Looked up at call time so a missing export fails its own test, not the whole file.
const removedPhotoNames = (...args: unknown[]) =>
  (formPhoto as unknown as Record<string, (...a: unknown[]) => unknown>).removedPhotoNames(...args);
import { projectCreateSchema } from "@/lib/schemas/project";
import {
  readProjectSites,
  resolveSite,
  waterwaySitesSchema,
  waterwaysSchema,
} from "@/lib/schemas/waterways";

const photo = { file_name: "1758800000000-k3j9x2.jpg", uploaded_at: "2026-09-25T15:00:00Z" };

function validForm(): Record<string, unknown> {
  return {
    site_name: "Western Drainage",
    site_descriptor: "",
    inspection_date: "2026-09-25",
    inspection_time: "07:30",
    initials: "GD",
    water_in_waterway: { value: "Yes", comment: "" },
    vehicle_inspection: { value: "Pass", comment: "" },
    bmp_inspection: { value: "Pass", comment: "wattles ok" },
    sheen_or_plume: { value: "N/A", comment: "" },
    equipment_in_use: "Excavator",
    photos: [photo],
  };
}

function issuePaths(input: unknown): string[] {
  const r = waterwaysSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
}

test("a complete form parses", () => {
  const r = waterwaysSchema.safeParse(validForm());
  assert.equal(r.success, true);
});

test("zero photos is rejected on the photos field", () => {
  assert.deepEqual(issuePaths({ ...validForm(), photos: [] }), ["photos"]);
});

test("a missing photos key is rejected too (no default to empty)", () => {
  const f = validForm();
  delete f.photos;
  assert.deepEqual(issuePaths(f), ["photos"]);
});

test("each unanswered check fails on its own value path", () => {
  const f = {
    ...validForm(),
    water_in_waterway: { value: "", comment: "" },
    vehicle_inspection: { value: "", comment: "" },
    bmp_inspection: { value: "", comment: "" },
    sheen_or_plume: { value: "", comment: "" },
  };
  assert.deepEqual(issuePaths(f).sort(), [
    "bmp_inspection.value",
    "sheen_or_plume.value",
    "vehicle_inspection.value",
    "water_in_waterway.value",
  ]);
});

test("an answer from another item's option set is rejected", () => {
  // Pass/Fail items do not accept Yes, and water-in-waterway does not accept N/A.
  assert.deepEqual(issuePaths({ ...validForm(), vehicle_inspection: { value: "Yes", comment: "" } }), [
    "vehicle_inspection.value",
  ]);
  assert.deepEqual(issuePaths({ ...validForm(), water_in_waterway: { value: "N/A", comment: "" } }), [
    "water_in_waterway.value",
  ]);
});

test("blank initials, bad date and bad time are rejected", () => {
  assert.deepEqual(issuePaths({ ...validForm(), initials: "   " }), ["initials"]);
  assert.deepEqual(issuePaths({ ...validForm(), inspection_date: "2026-02-30" }), ["inspection_date"]);
  assert.deepEqual(issuePaths({ ...validForm(), inspection_time: "24:00" }), ["inspection_time"]);
});

test("photo file names outside the uploader's shape are rejected", () => {
  for (const bad of [
    "../../other-project/ndot-stormwater/1758800000000-k3j9x2.jpg",
    "1758800000000-k3j9x2/../x.jpg",
    "sub/1758800000000-k3j9x2.jpg",
    "1758800000000-k3j9x2.jpg\\x",
    "..jpg",
    "photo.jpg",
    "",
  ]) {
    assert.equal(photoSchema.safeParse({ ...photo, file_name: bad }).success, false, bad);
  }
  for (const good of ["1758800000000-k3j9x2.jpg", "1758800000000-a.JPG", "1758800000000-.heic"]) {
    assert.equal(photoSchema.safeParse({ ...photo, file_name: good }).success, true, good);
  }
});

test("site list rejects duplicates (case-insensitive), blank names and over 20 sites", () => {
  const dup = [{ name: "Western Drainage", descriptor: "" }, { name: "western drainage", descriptor: "x" }];
  assert.equal(waterwaySitesSchema.safeParse(dup).success, false);
  assert.equal(waterwaySitesSchema.safeParse([{ name: "  ", descriptor: "mile 3" }]).success, false);
  const many = Array.from({ length: 21 }, (_, i) => ({ name: `Site ${i}`, descriptor: "" }));
  assert.equal(waterwaySitesSchema.safeParse(many).success, false);
  const ok = waterwaySitesSchema.safeParse([{ name: " Eastern Drainage ", descriptor: " 39.5N " }]);
  assert.deepEqual(ok.success && ok.data, [{ name: "Eastern Drainage", descriptor: "39.5N" }]);
});

test("project form parsing carries the site rows and drops fully blank ones", async () => {
  const { parseProjectForm } = await import("@/lib/schemas/project");
  const fd = new FormData();
  for (const [k, v] of [
    ["name", "RNO 18"], ["address", "Reno"], ["start_date", "2026-01-01"], ["completion_date", "2027-01-01"],
    ["permit_type", "waterway"], ["permit_number", ""],
    ["waterway_site_name", "Western Drainage"], ["waterway_site_descriptor", ""],
    ["waterway_site_name", ""], ["waterway_site_descriptor", ""],
    ["waterway_site_name", "Eastern Drainage"], ["waterway_site_descriptor", "east culvert"],
  ]) fd.append(k, v);
  const parsed = projectCreateSchema.safeParse(parseProjectForm(fd));
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.success && parsed.data.waterway_sites, [
    { name: "Western Drainage", descriptor: "" },
    { name: "Eastern Drainage", descriptor: "east culvert" },
  ]);
});

test("resolveSite: current site wins with the server's descriptor", () => {
  const sites = [{ name: "Western Drainage", descriptor: "server copy" }];
  assert.deepEqual(resolveSite("Western Drainage", sites), { name: "Western Drainage", descriptor: "server copy" });
  assert.equal(resolveSite("Made Up", sites), null);
});

test("resolveSite: a renamed site still resolves to the record's own snapshot on edit", () => {
  const sites = [{ name: "West Drainage (renamed)", descriptor: "" }];
  const snapshot = { name: "Western Drainage", descriptor: "old" };
  assert.deepEqual(resolveSite("Western Drainage", sites, snapshot), snapshot);
  assert.equal(resolveSite("Other", sites, snapshot), null);
});

test("resolveSite: an edit that keeps the site keeps the record's own descriptor (Codex round 1)", () => {
  // The admin later changed the site's descriptor in project setup; correcting
  // only the initials on an old record must not rewrite where it was taken.
  const sites = [{ name: "Western Drainage", descriptor: "mile 4.2 (moved)" }];
  const snapshot = { name: "Western Drainage", descriptor: "mile 3.1" };
  assert.deepEqual(resolveSite("Western Drainage", sites, snapshot), snapshot);
  // An explicit move to a different current site takes that site's current descriptor.
  const two = [...sites, { name: "Eastern Drainage", descriptor: "east culvert" }];
  assert.deepEqual(resolveSite("Eastern Drainage", two, snapshot), { name: "Eastern Drainage", descriptor: "east culvert" });
});

test("removedPhotoNames: only the stored photos the edit dropped, and only valid names", () => {
  const a = { ...photo, file_name: "1758800000000-aaaaaa.jpg" };
  const b = { ...photo, file_name: "1758800000000-bbbbbb.jpg" };
  const c = { ...photo, file_name: "1758800000000-cccccc.jpg" };
  assert.deepEqual(removedPhotoNames([a, b], [b, c]), ["1758800000000-aaaaaa.jpg"]);
  assert.deepEqual(removedPhotoNames([a, b], [a, b]), []);
  // Stored data is not trusted to be well formed: junk never becomes a delete path.
  assert.deepEqual(removedPhotoNames([{ file_name: "../../x/y.jpg" }, null, "str", a], []), ["1758800000000-aaaaaa.jpg"]);
  assert.deepEqual(removedPhotoNames(undefined, [a]), []);
});

test("readProjectSites treats malformed stored values as no sites", () => {
  assert.deepEqual(readProjectSites(null), []);
  assert.deepEqual(readProjectSites({ name: "x" }), []);
  assert.deepEqual(readProjectSites([{ name: "A", descriptor: "" }]), [{ name: "A", descriptor: "" }]);
});

test("pacificToday: the Nevada date, not the UTC date, around 5 pm PDT", () => {
  // PDT is UTC-7: 06:59:59Z on the 25th is 23:59:59 on the 24th in Reno.
  assert.equal(pacificToday(new Date("2026-09-25T06:59:59Z")), "2026-09-24");
  assert.equal(pacificToday(new Date("2026-09-25T07:00:00Z")), "2026-09-25");
  // 5:30 pm PDT on the 24th is already the 25th in UTC.
  assert.equal(pacificToday(new Date("2026-09-25T00:30:00Z")), "2026-09-24");
  // PST is UTC-8 in January.
  assert.equal(pacificToday(new Date("2026-01-15T07:59:59Z")), "2026-01-14");
  assert.equal(pacificToday(new Date("2026-01-15T08:00:00Z")), "2026-01-15");
});

test("pacificTime: 24-hour Nevada time, midnight as 00", () => {
  assert.equal(pacificTime(new Date("2026-09-25T07:05:00Z")), "00:05");
  assert.equal(pacificTime(new Date("2026-09-25T00:30:00Z")), "17:30");
});
