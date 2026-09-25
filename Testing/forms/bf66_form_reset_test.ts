/**
 * BF-66 regression guard. React 19 resets a <form action={fn}> after every
 * action completion, success or not (react/react#29034). These forms keep
 * their values in React state (selects, radios, checkboxes, dynamic rows) and
 * send that state, so a reset after a rejected submit shows blank controls
 * while the old answers are still sent; the project form's uncontrolled text
 * fields snap back to the saved values instead. Every form must submit through
 * the shared no-reset handler. The on-screen behaviour itself is checked in a
 * browser (see the story's validation section); this test stops the pattern
 * from coming back.
 *   node --import ./Testing/forms/ts-alias-hooks.mjs Testing/forms/bf66_form_reset_test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });
}

const FORM_COMPONENTS = [
  "components/forms/dust-log/DailyDustLog.tsx",
  "components/forms/dust-log/AppendDustLogEntries.tsx",
  "components/forms/ndep-sad/NdepSadApplication.tsx",
  "components/forms/ndep-stormwater/NdepStormwaterForm.tsx",
  "components/forms/ndot-stormwater/NdotStormwaterForm.tsx",
  "components/forms/nnph-dust-permit/NnphDustPermitForm.tsx",
  "components/forms/working-in-waterways/WaterwaysForm.tsx",
  "components/projects/project-form.tsx",
];

// Scope: src/components, where every stateful form lives. The auth forms and
// the users invite form under src/app use <form action> with uncontrolled
// fields only, so a reset shows exactly what would be sent (empty); that is a
// retype-after-error annoyance, not a desync, and out of BF-66's scope.
test("no component under src/components passes an action function to <form action>", () => {
  const offenders = tsxFiles(join(SRC, "components")).filter((f) =>
    /<form\b[^>]*\baction=\{/.test(readFileSync(f, "utf-8")),
  );
  assert.deepEqual(offenders.map((f) => f.slice(SRC.length).replace(/\\/g, "/")), []);
});

test("every stateful form submits through the shared no-reset handler", () => {
  for (const rel of FORM_COMPONENTS) {
    const src = readFileSync(join(SRC, rel), "utf-8");
    assert.match(src, /useNoResetSubmit\(/, `${rel} does not use useNoResetSubmit`);
    assert.match(src, /<form\b[^>]*\bonSubmit=\{/, `${rel} has no onSubmit on its <form>`);
  }
});

test("the shared handler prevents the native submit and runs the action in a transition", async () => {
  const { buildNoResetSubmit } = await import("@/lib/forms/no-reset-submit");
  const calls: string[] = [];
  const sent: FormData[] = [];
  const form = { tagName: "FORM" } as unknown as HTMLFormElement;
  const event = {
    preventDefault: () => calls.push("preventDefault"),
    currentTarget: form,
  } as unknown as Parameters<ReturnType<typeof buildNoResetSubmit>>[0];
  const fd = new FormData();
  fd.append("data", "{\"site_name\":\"Western Drainage\"}");
  const handler = buildNoResetSubmit(
    (formData: FormData) => { calls.push("action"); sent.push(formData); },
    (fn: () => void) => { calls.push("transition"); fn(); },
    (target: HTMLFormElement) => { assert.equal(target, form); return fd; },
  );
  handler(event);
  assert.deepEqual(calls, ["preventDefault", "transition", "action"]);
  // The action receives exactly the form's own data, captured at submit time.
  assert.equal(sent[0], fd);
  assert.equal(sent[0].get("data"), "{\"site_name\":\"Western Drainage\"}");
});
