/**
 * BF-70 unit checks: the project schema's waterway contact fields, the
 * contact reader the form hint uses, the "Copy from previous" ordering, and
 * static guards on the form wiring (photo wording once; picker buttons are
 * type="button" so Enter never submits through them). No network, no database.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf70_waterway_contact_picker_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseProjectForm, projectCreateSchema } from "@/lib/schemas/project";
import { readWaterwayContact } from "@/lib/schemas/waterways";
import {
  equipmentPreview,
  orderPreviousEquipment,
  previousEquipmentUnavailable,
  type PreviousEquipment,
} from "@/lib/forms/waterways-previous-equipment";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf-8");

function validProject(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "17254 NDOT 4541 7 Bridges",
    address: "Reno, NV",
    start_date: "2026-01-05",
    completion_date: "2026-12-18",
    superintendent_name: "", superintendent_phone: "", superintendent_email: "",
    foreman_name: "", foreman_phone: "", foreman_email: "",
    pm_name: "", pm_phone: "", pm_email: "",
    owner_rep_name: "", owner_rep_phone: "", owner_rep_email: "", owner_rep_address: "",
    acres_disturbed: "", soil_type: "", parcel_numbers: "", description: "",
    permits: [{ permit_type: "waterway", permit_number: "" }],
    waterway_sites: [{ name: "drainage 1", descriptor: "" }],
    waterway_contact_name: "", waterway_contact_phone: "", waterway_contact_email: "",
    ...extra,
  };
}

// --- Project schema: the three contact fields ---

test("waterway contact fields are accepted, trimmed, and optional", () => {
  const r = projectCreateSchema.safeParse(
    validProject({
      waterway_contact_name: "  Gracie D  ",
      waterway_contact_phone: " (775) 555-0101 ",
      waterway_contact_email: " gracie@example.com ",
    }),
  );
  assert.ok(r.success, JSON.stringify(r.success ? null : r.error.issues));
  assert.equal(r.data.waterway_contact_name, "Gracie D");
  assert.equal(r.data.waterway_contact_phone, "(775) 555-0101");
  assert.equal(r.data.waterway_contact_email, "gracie@example.com");

  const blank = projectCreateSchema.safeParse(validProject());
  assert.ok(blank.success);
  assert.equal(blank.data.waterway_contact_name, "");
});

test("a bad waterway contact email or phone is refused on its own field", () => {
  const bad = projectCreateSchema.safeParse(
    validProject({ waterway_contact_email: "not-an-email", waterway_contact_phone: "12" }),
  );
  assert.ok(!bad.success);
  const paths = bad.error.issues.map((i) => i.path.join(".")).sort();
  assert.deepEqual(paths, ["waterway_contact_email", "waterway_contact_phone"]);
});

test("parseProjectForm reads the contact fields from the posted form", () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validProject())) {
    if (k === "permits" || k === "waterway_sites") continue;
    fd.set(k, String(v));
  }
  fd.set("waterway_contact_name", "Gracie D");
  fd.set("waterway_contact_phone", "775-555-0101");
  fd.set("waterway_contact_email", "gracie@example.com");
  const raw = parseProjectForm(fd) as Record<string, unknown>;
  assert.equal(raw.waterway_contact_name, "Gracie D");
  assert.equal(raw.waterway_contact_phone, "775-555-0101");
  assert.equal(raw.waterway_contact_email, "gracie@example.com");
});

// --- Contact reader (what the sheen hint renders from) ---

test("readWaterwayContact needs a name; phone is optional; nothing else leaks", () => {
  assert.equal(readWaterwayContact({ waterway_contact_name: null, waterway_contact_phone: "775" }), null);
  assert.equal(readWaterwayContact({ waterway_contact_name: "  ", waterway_contact_phone: "775" }), null);
  assert.deepEqual(
    readWaterwayContact({
      waterway_contact_name: " Gracie D ",
      waterway_contact_phone: " 775-555-0101 ",
      waterway_contact_email: "gracie@example.com",
    }),
    { name: "Gracie D", phone: "775-555-0101" },
  );
  assert.deepEqual(readWaterwayContact({ waterway_contact_name: "Gracie D", waterway_contact_phone: null }), {
    name: "Gracie D",
    phone: "",
  });
});

// --- "Copy from previous" ordering ---

const at = "2026-10-08T15:00:00+00:00";
const rows: PreviousEquipment[] = [
  { id: "a", form_date: "2026-10-07", created_at: at, site_name: "Eastern Drainage", initials: "GD", equipment: "Excavator, pump" },
  { id: "b", form_date: "2026-10-06", created_at: at, site_name: "Western Drainage", initials: "FD", equipment: "Loader" },
  { id: "c", form_date: "2026-10-05", created_at: at, site_name: "Eastern Drainage", initials: "GD", equipment: "   " },
  { id: "d", form_date: "2026-10-04", created_at: at, site_name: "Western Drainage", initials: "FD", equipment: "Loader\nSkid steer" },
  { id: "e", form_date: "2026-10-03", created_at: at, site_name: null, initials: null, equipment: "Hand tools" },
];

test("same-site rows come first, newest first within each group; empties dropped", () => {
  const ids = orderPreviousEquipment(rows, "Western Drainage").map((r) => r.id);
  assert.deepEqual(ids, ["b", "d", "a", "e"]);
});

test("no current site keeps the incoming order; the edited record is excluded", () => {
  assert.deepEqual(orderPreviousEquipment(rows, "").map((r) => r.id), ["a", "b", "d", "e"]);
  assert.deepEqual(orderPreviousEquipment(rows, "Western Drainage", "b").map((r) => r.id), ["d", "a", "e"]);
  assert.deepEqual(orderPreviousEquipment([], "Western Drainage"), []);
});

test("equipmentPreview shows the first line only and cuts long text", () => {
  assert.equal(equipmentPreview("Loader\nSkid steer"), "Loader");
  assert.equal(equipmentPreview(null), "");
  const long = "x".repeat(100);
  const preview = equipmentPreview(long, 20);
  assert.equal(preview.length, 20);
  assert.ok(preview.endsWith("…"));
});

// --- Static wiring guards ---

test("the waterways form passes its own photo wording and no longer repeats the photo rule", () => {
  const form = read("components/forms/working-in-waterways/WaterwaysForm.tsx");
  assert.match(form, /hint="Attach at least one overview photo of the waterway work today\."/);
  assert.doesNotMatch(form, /At least one photo is required/);
  const photo = read("components/forms/shared/PhotoAttachment.tsx");
  assert.match(photo, /Attach digital photographs of deficiencies or other noted issues of concern\./);
});

test("every button in the equipment picker is type=\"button\"", () => {
  const picker = read("components/forms/working-in-waterways/WaterwaysEquipmentPicker.tsx");
  const buttons = [...picker.matchAll(/<button\b[^>]*>/gs)].map(([tag]) => tag);
  assert.ok(buttons.length >= 2, "expected the toggle and the row buttons");
  assert.deepEqual(buttons.filter((tag) => !/type="button"/.test(tag)), []);
});

test("the sheen hint renders from the project contact in WaterwaysChecks", () => {
  const checks = read("components/forms/working-in-waterways/WaterwaysChecks.tsx");
  assert.match(checks, /If yes, call/);
  assert.match(checks, /href=\{`tel:/);
});

// --- Verify round 1 fixes ---

test("every button in the equipment picker is disabled while the form saves (verify C1)", () => {
  const picker = read("components/forms/working-in-waterways/WaterwaysEquipmentPicker.tsx");
  // Whole elements, not `<button[^>]*>`: an onClick arrow's `=>` would end that match early.
  const buttons = picker.split("<button").slice(1).map((chunk) => chunk.split("</button>")[0]);
  assert.equal(buttons.length, 2, "the toggle and the row button");
  assert.deepEqual(buttons.filter((el) => !el.includes("disabled={disabled}")), []);
});

test("a failed history read is logged and yields no picker rows, not a broken page (verify C3)", () => {
  const logged: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => void logged.push(args);
  try {
    assert.deepEqual(previousEquipmentUnavailable(new Error("statement timeout")), []);
    assert.deepEqual(previousEquipmentUnavailable("network down"), []);
  } finally {
    console.error = original;
  }
  assert.equal(logged.length, 2);
  assert.match(String(logged[0][0]), /\[waterways-equipment\]/);
  assert.deepEqual(logged[0][1], { error: "statement timeout" });
  assert.deepEqual(logged[1][1], { error: "network down" });
});

test("both form pages read the history through the fallback (verify C3)", () => {
  const base = "app/dashboard/projects/[id]/forms/working-in-waterways/";
  for (const page of ["new/page.tsx", "[submissionId]/edit/page.tsx"]) {
    const src = read(base + page);
    assert.match(src, /getRecentWaterwaysEquipment\([^)]*\)\s*\.catch\(\s*previousEquipmentUnavailable,?\s*\)/, page);
  }
});
