/**
 * BF-70 render checks (added in verify round 1): the sheen/plume hint and the
 * "Copy from previous" picker rendered to static HTML, so the acceptance
 * criteria are proven on the markup a crew member sees rather than on the
 * source text. No network, no database.
 *   node --import ./Testing/forms/tsx-hooks.mjs Testing/forms/bf70_render_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import ReactDOMServer from "react-dom/server";
import WaterwaysChecks, { type ChecksDraft } from "@/components/forms/working-in-waterways/WaterwaysChecks";
import WaterwaysEquipmentPicker from "@/components/forms/working-in-waterways/WaterwaysEquipmentPicker";
import { readWaterwayContact } from "@/lib/schemas/waterways";
import type { PreviousEquipment } from "@/lib/forms/waterways-previous-equipment";

// CommonJS packages: take the functions off the default export (see tsx-hooks.mjs).
const { createElement } = React;
const { renderToStaticMarkup } = ReactDOMServer;

const blank = { value: "", comment: "" };
const checks: ChecksDraft = {
  water_in_waterway: blank,
  vehicle_inspection: blank,
  bmp_inspection: blank,
  sheen_or_plume: blank,
};
const noop = () => {};

function renderChecks(sheenContact?: { name: string; phone: string } | null): string {
  return renderToStaticMarkup(createElement(WaterwaysChecks, { checks, onChange: noop, sheenContact }));
}

/** The visible text of each inspection row (fieldset), tags stripped, in render order. */
function rowTexts(html: string): string[] {
  return html
    .split("<fieldset")
    .slice(1)
    .map((chunk) => `<fieldset${chunk}`.replace(/<[^>]+>/g, ""));
}

// --- Sheen/plume hint (AC 2) ---

test("with a contact and phone, only the sheen/plume row says who to call, with a tel: link", () => {
  const html = renderChecks({ name: "Gracie D", phone: "(775) 555-0101" });
  const rows = rowTexts(html);
  assert.equal(rows.length, 4);
  const hinted = rows.flatMap((text, i) => (text.includes("If yes, call") ? [i] : []));
  assert.deepEqual(hinted, [3], "the hint sits on the fourth row only");
  assert.ok(rows[3].includes("Visible sheen/plume?"));
  assert.ok(rows[3].includes("If yes, call Gracie D at (775) 555-0101 immediately."), rows[3]);
  assert.match(html, /<a href="tel:7755550101"[^>]*>\(775\) 555-0101<\/a>/);
});

test("with a contact but no phone, the hint names the contact without a link", () => {
  const html = renderChecks({ name: "Gracie D", phone: "" });
  assert.ok(rowTexts(html)[3].includes("If yes, call Gracie D immediately."));
  assert.doesNotMatch(html, /href="tel:/);
});

test("with no contact set on the project, no row shows a hint", () => {
  const unset = [
    undefined,
    null,
    readWaterwayContact({ waterway_contact_name: null, waterway_contact_phone: null }),
    readWaterwayContact({ waterway_contact_name: "  ", waterway_contact_phone: "775-555-0101" }),
  ];
  for (const contact of unset) {
    const html = renderChecks(contact);
    assert.doesNotMatch(html, /If yes, call/);
    assert.doesNotMatch(html, /tel:/);
  }
});

// --- "Copy from previous" entry point (AC 4 and AC 5) ---

const usable: PreviousEquipment = {
  id: "a", form_date: "2026-10-07", site_name: "Eastern Drainage", initials: "GD", equipment: "Excavator, pump",
};
const noEquipment: PreviousEquipment = {
  id: "b", form_date: "2026-10-06", site_name: "Eastern Drainage", initials: "GD", equipment: "  ",
};

function renderPicker(props: {
  entries: readonly PreviousEquipment[];
  excludeId?: string;
  disabled?: boolean;
}): string {
  return renderToStaticMarkup(createElement(WaterwaysEquipmentPicker, { currentSite: "", onPick: noop, ...props }));
}

test("no earlier inspection with equipment text: no button at all (AC 5)", () => {
  assert.equal(renderPicker({ entries: [] }), "");
  assert.equal(renderPicker({ entries: [noEquipment] }), "");
  // Edit page: the only earlier record is the one being edited.
  assert.equal(renderPicker({ entries: [usable], excludeId: "a" }), "");
});

test("with an earlier inspection: one closed, non-submitting 'Copy from previous' button", () => {
  const html = renderPicker({ entries: [usable, noEquipment] });
  assert.match(html, /^<div><button type="button"[^>]*aria-expanded="false"[^>]*>Copy from previous<\/button><\/div>$/);
  assert.doesNotMatch(html, /<ul/, "the list opens only on a tap");
});

test("while the form saves, the toggle is disabled", () => {
  assert.match(renderPicker({ entries: [usable], disabled: true }), /<button type="button" disabled=""/);
  assert.doesNotMatch(renderPicker({ entries: [usable], disabled: false }), /disabled=""/);
});
