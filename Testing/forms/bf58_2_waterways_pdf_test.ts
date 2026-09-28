/**
 * BF-58.2 checks: the Waterways PDF renders every field and its photo, every
 * form type has a PDF template, both photo signers share one folder map, and
 * the "sites today" rows match sites by name and date. No network, no database.
 *   node --import ./Testing/forms/tsx-hooks.mjs Testing/forms/bf58_2_waterways_pdf_test.ts
 * Set BF58_2_SAMPLE_PDF=<path> to also write the rendered sample PDF there.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { renderToBuffer } from "@react-pdf/renderer";
import { FORM_TYPES } from "@/lib/constants/permits";
import { getPdfComponent } from "@/lib/pdf/registry";
import { FORM_PHOTO_SUBPATH } from "@/lib/forms/photo-paths";
import { waterwaySitesToday } from "@/lib/forms/waterway-sites-today";

const PHOTO = "docs/sprints/sprint-4-qd-go-live/artifacts/BF-58.1/06-view-page-fields-and-photo.jpg";

const sample = {
  site_name: "Western Drainage",
  site_descriptor: "Culvert at station 12+50",
  inspection_date: "2026-09-28",
  inspection_time: "07:45",
  initials: "GRX",
  water_in_waterway: { value: "Yes", comment: "Low flow, about 4 inches" },
  vehicle_inspection: { value: "Pass", comment: "" },
  bmp_inspection: { value: "Fail", comment: "Wattle torn at north end, replaced" },
  sheen_or_plume: { value: "N/A", comment: "" },
  equipment_in_use: "CAT 320 excavator, water truck",
  photos: [{ file_name: "1790602206446-gdson4.jpg", url: PHOTO, caption: "Looking upstream" }],
};

/** Every text string drawn in the PDF, decoded from its Flate content streams. */
function pdfText(buf: Buffer): string {
  const raw = buf.toString("latin1");
  let text = "";
  for (const m of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let body: string;
    try {
      body = inflateSync(Buffer.from(m[1], "latin1")).toString("latin1");
    } catch {
      continue; // not a Flate stream (image data)
    }
    for (const line of body.split("\n")) {
      const hex = [...line.matchAll(/<([0-9a-fA-F]+)>/g)].map((h) => Buffer.from(h[1], "hex").toString("latin1"));
      if (hex.length) text += hex.join("") + "\n";
    }
  }
  return text;
}

async function renderSample(data: Record<string, unknown>): Promise<Buffer> {
  const element = getPdfComponent("working_in_waterways")({
    data,
    projectName: "Microsoft RNO18 Main Campus",
    formDate: "2026-09-28",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

test("every form type has a PDF template", () => {
  for (const type of FORM_TYPES) {
    assert.equal(typeof getPdfComponent(type), "function", type);
  }
});

test("the Waterways PDF shows every field, answer, comment and the photo", async () => {
  const buf = await renderSample(sample);
  if (process.env.BF58_2_SAMPLE_PDF) writeFileSync(process.env.BF58_2_SAMPLE_PDF, buf);
  assert.equal(buf.subarray(0, 5).toString(), "%PDF-");

  const text = pdfText(buf);
  for (const expected of [
    "Working in Waters of the State Daily Inspection",
    "Microsoft RNO18 Main Campus",
    "Western Drainage (Culvert at station 12+50)",
    "2026-09-28",
    "07:45",
    "GRX",
    "Is there water in the waterway?",
    "Low flow, about 4 inches",
    "Wattle torn at north end, replaced",
    "CAT 320 excavator, water truck",
    "Looking upstream",
  ]) {
    assert.ok(text.includes(expected), `PDF text is missing: ${expected}`);
  }

  // Each answer sits on its own check's row, not just somewhere on the page.
  const lines = text.split("\n");
  const answerAfter = (label: string) => lines[lines.indexOf(label) + 1];
  assert.equal(answerAfter("Is there water in the waterway?"), "Yes");
  assert.equal(answerAfter("Daily vehicle inspection"), "Pass");
  assert.equal(answerAfter("BMPs visual inspection"), "Fail");
  assert.equal(answerAfter("Visible sheen or plume?"), "N/A");

  // The photo is embedded as an image object, not just captioned.
  assert.match(buf.toString("latin1"), /\/Subtype \/Image/);
});

test("a photo whose signed URL is missing renders a placeholder, not a crash", async () => {
  const buf = await renderSample({ ...sample, photos: [{ file_name: "x.jpg", url: "" }] });
  const text = pdfText(buf);
  assert.ok(text.includes("Photo unavailable"));
  assert.doesNotMatch(buf.toString("latin1"), /\/Subtype \/Image/);
});

test("the PDF route and the inspector sign Waterways photos from the form's own folder", () => {
  assert.equal(FORM_PHOTO_SUBPATH.working_in_waterways, "working-in-waterways");
  assert.equal(FORM_PHOTO_SUBPATH.ndot_weekly_stormwater, "ndot-stormwater");
});

const sites = [
  { name: "Western Drainage", descriptor: "West culvert" },
  { name: "Eastern Drainage", descriptor: "" },
];

test("sites today: each site is matched by its own name and today's date", () => {
  const rows = waterwaySitesToday(
    sites,
    [
      { form_type: "working_in_waterways", form_date: "2026-09-27", site_name: "Western Drainage" },
      { form_type: "working_in_waterways", form_date: "2026-09-28", site_name: "Eastern Drainage" },
      { form_type: "ndot_weekly_stormwater", form_date: "2026-09-28", site_name: "Western Drainage" },
    ],
    "2026-09-28",
  );
  assert.deepEqual(rows, [
    { name: "Western Drainage", descriptor: "West culvert", submittedToday: false },
    { name: "Eastern Drainage", descriptor: "", submittedToday: true },
  ]);
});

test("sites today: a submission for a renamed site is listed under its recorded name", () => {
  const rows = waterwaySitesToday(
    sites,
    [{ form_type: "working_in_waterways", form_date: "2026-09-28", site_name: "West Drainage (old)" }],
    "2026-09-28",
  );
  assert.deepEqual(rows, [
    { name: "Western Drainage", descriptor: "West culvert", submittedToday: false },
    { name: "Eastern Drainage", descriptor: "", submittedToday: false },
    { name: "West Drainage (old)", descriptor: "", submittedToday: true },
  ]);
});

test("sites today: two forms for one site today give one row", () => {
  const today = { form_type: "working_in_waterways", form_date: "2026-09-28", site_name: "Eastern Drainage" };
  const rows = waterwaySitesToday(sites, [today, today], "2026-09-28");
  assert.equal(rows.length, 2);
  assert.equal(rows.filter((r) => r.submittedToday).map((r) => r.name).join(), "Eastern Drainage");
});
