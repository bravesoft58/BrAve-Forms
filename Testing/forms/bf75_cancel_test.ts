/**
 * BF-75 checks: the form snapshot that decides whether Cancel asks first, and
 * static guards that every form renders the shared Cancel with a fixed
 * destination. The on-screen behaviour (straight out when untouched, asks after
 * a change, Keep editing keeps values) is checked in a browser.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf75_cancel_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { sameFormSnapshot, snapshotFormData } from "@/lib/forms/form-snapshot";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf-8");

function fd(pairs: [string, string | File][]): FormData {
  const data = new FormData();
  for (const [k, v] of pairs) data.append(k, v);
  return data;
}

const snap = (pairs: [string, string | File][]) => snapshotFormData(fd(pairs));

// ---------------------------------------------------------------- snapshot

test("an untouched form compares equal to its baseline", () => {
  const pairs: [string, string][] = [["project_id", "p1"], ["data", '{"a":1}'], ["version", ""]];
  assert.equal(sameFormSnapshot(snap(pairs), snap(pairs)), true);
});

test("a change to the hidden JSON field (a button-driven change) is seen", () => {
  const before = snap([["project_id", "p1"], ["entries", '[{"time":"07:00"}]']]);
  const added = snap([["project_id", "p1"], ["entries", '[{"time":"07:00"},{"time":"09:00"}]']]);
  assert.equal(sameFormSnapshot(before, added), false);
});

test("duplicate names are kept: a change to only the second value is seen", () => {
  const before = snap([["permit_type", "stormwater_ndep"], ["permit_type", "waterway"]]);
  const after = snap([["permit_type", "stormwater_ndep"], ["permit_type", "dust_control"]]);
  assert.equal(sameFormSnapshot(before, after), false);
  // An object keyed by name would have kept only the last value and still differed here,
  // so also prove the first value is compared.
  const firstChanged = snap([["permit_type", "dust_control"], ["permit_type", "waterway"]]);
  assert.equal(sameFormSnapshot(before, firstChanged), false);
});

test("an added field (a permit ticked) and a removed field are seen", () => {
  const base = snap([["name", "Deodar St"]]);
  assert.equal(sameFormSnapshot(base, snap([["name", "Deodar St"], ["permit_type", "waterway"]])), false);
  assert.equal(sameFormSnapshot(snap([["name", "Deodar St"], ["permit_type", "waterway"]]), base), false);
});

test("reordered values are a change", () => {
  const a = snap([["waterway_site_name", "Western"], ["waterway_site_name", "Eastern"]]);
  const b = snap([["waterway_site_name", "Eastern"], ["waterway_site_name", "Western"]]);
  assert.equal(sameFormSnapshot(a, b), false);
});

test("a file field is compared by name, size and date, never as an empty string", () => {
  const f1 = new File(["abc"], "photo.jpg", { lastModified: 1 });
  const f2 = new File(["abcd"], "photo.jpg", { lastModified: 1 });
  assert.equal(sameFormSnapshot(snap([["upload", f1]]), snap([["upload", f1]])), true);
  assert.equal(sameFormSnapshot(snap([["upload", f1]]), snap([["upload", f2]])), false);
});

// ---------------------------------------------------------------- wiring

const FORMS: Record<string, RegExp> = {
  "components/forms/dust-log/DailyDustLog.tsx": /tab=daily_dust_log/,
  "components/forms/dust-log/AppendDustLogEntries.tsx": /forms\/dust-log\/\$\{submissionId\}/,
  "components/forms/ndep-sad/NdepSadApplication.tsx": /tab=ndep_sad_application/,
  "components/forms/ndep-stormwater/NdepStormwaterForm.tsx": /tab=ndep_weekly_stormwater/,
  "components/forms/ndot-stormwater/NdotStormwaterForm.tsx": /tab=ndot_weekly_stormwater/,
  "components/forms/nnph-dust-permit/NnphDustPermitForm.tsx": /tab=nnph_dust_permit/,
  "components/forms/working-in-waterways/WaterwaysForm.tsx": /tab=working_in_waterways/,
  "components/projects/project-form.tsx": /cancelHref = "\/dashboard\/projects"/,
};

test("every form renders the shared Cancel inside its form with a fixed destination", () => {
  for (const [rel, destination] of Object.entries(FORMS)) {
    const src = read(rel);
    assert.match(src, /import FormCancel from "@\/components\/forms\/shared\/FormCancel"/, rel);
    const form = src.slice(src.indexOf("<form"), src.lastIndexOf("</form>"));
    assert.match(form, /<FormCancel\b[^>]*\bready=\{ready\}[^>]*disabled=\{pending\}/s, `${rel}: inside the form, ready + pending`);
    assert.match(src, destination, `${rel}: destination`);
    assert.doesNotMatch(src, /router\.back\(\)/, `${rel}: no browser Back`);
    assert.doesNotMatch(src, />\s*Cancel\s*</, `${rel}: no hand-made Cancel left`);
  }
});

test("the project edit page sends Cancel back to the project", () => {
  assert.match(read("app/dashboard/projects/[id]/edit/page.tsx"), /cancelHref=\{`\/dashboard\/projects\/\$\{id\}`\}/);
});

test("every button in FormCancel is type=\"button\" and it never uses window.confirm", () => {
  const src = read("components/forms/shared/FormCancel.tsx");
  const buttons = [...src.matchAll(/<button\b[^>]*>/gs)].map(([tag]) => tag);
  assert.equal(buttons.length, 3, "Cancel, Keep editing, Discard");
  assert.deepEqual(buttons.filter((tag) => !/type="button"/.test(tag)), []);
  assert.doesNotMatch(src, /window\.confirm|confirm\(/);
  assert.match(src, /sameFormSnapshot\(baseline\.current, snapshotForm\(el\)\)/, "compares against the baseline");
  assert.match(src, /if \(ready && el && !baseline\.current\)/, "baseline only once ready");
});
