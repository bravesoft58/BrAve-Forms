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
//
// Each form keeps `action={formAction}` (verify round 1, F1): before hydration
// the browser posts to the server action, as before BF-66. After hydration the
// onSubmit handler calls preventDefault, and react-dom 19.2.3's form-action
// listener then skips the action and its automatic reset (it runs a no-op host
// transition). Without the action prop, a pre-hydration submit is a plain GET
// that saves nothing and puts the fields in the URL.
test("every <form> under src/components pairs its action with the no-reset onSubmit", () => {
  const offenders = tsxFiles(join(SRC, "components")).filter((f) => {
    const src = readFileSync(f, "utf-8");
    return [...src.matchAll(/<form\b[^>]*>/g)].some(
      ([tag]) => /\baction=\{/.test(tag) !== /\bonSubmit=\{/.test(tag),
    );
  });
  assert.deepEqual(offenders.map((f) => f.slice(SRC.length).replace(/\\/g, "/")), []);
});

test("each stateful form wires onSubmit to the handler built from its own formAction (F2)", () => {
  for (const rel of FORM_COMPONENTS) {
    const src = readFileSync(join(SRC, rel), "utf-8");
    // The handler must come from useNoResetSubmit(formAction), and the <form>
    // must use that same variable for onSubmit and formAction for its action.
    const hook = src.match(/const \{ submit: (\w+), ready \} = useNoResetSubmit\(formAction\);|const \{ (submit), ready \} = useNoResetSubmit\(formAction\);/);
    assert.ok(hook, `${rel}: no \`const { submit, ready } = useNoResetSubmit(formAction);\``);
    const handler = hook[1] ?? hook[2];
    const tags = [...src.matchAll(/<form\b[^>]*>/g)].map(([t]) => t);
    assert.equal(tags.length, 1, `${rel}: expected exactly one <form>`);
    assert.match(tags[0], new RegExp(`\\baction=\\{formAction\\}`), `${rel}: <form> lost action={formAction}`);
    assert.match(tags[0], new RegExp(`\\bonSubmit=\\{${handler}\\}`), `${rel}: onSubmit is not the useNoResetSubmit handler`);
  }
});

// Verify round 2, F3: these forms send one hidden JSON field built from React
// state. Before hydration that field still holds the server-rendered values, so
// a pre-hydration POST would save the old answers while the screen shows the
// new ones. Submit stays disabled until the page has hydrated. Each form has
// exactly one submit button (the form's default button), so disabling it also
// blocks implicit submission with the Enter key.
test("each stateful form's single submit button is disabled until hydrated (F3)", () => {
  for (const rel of FORM_COMPONENTS) {
    const src = readFileSync(join(SRC, rel), "utf-8");
    const buttons = [...src.matchAll(/<button\b[\s\S]*?>/g)].map(([t]) => t).filter((t) => /type="submit"/.test(t));
    assert.equal(buttons.length, 1, `${rel}: expected exactly one submit button`);
    assert.match(buttons[0], /disabled=\{pending \|\| !ready\}/, `${rel}: submit is not gated on hydration`);
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
