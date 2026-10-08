/**
 * What a form would submit right now, as an ordered list of [name, value]
 * pairs (BF-75). Comparing two snapshots tells Cancel whether anything would be
 * lost. Built from FormData, so it sees every way these forms change: typed
 * fields, selects and radios, and the hidden JSON field the state-backed forms
 * rewrite when a button adds a row, removes a photo or copies equipment.
 *
 * Order and duplicates are kept on purpose: the project form repeats
 * `permit_type`, and a plain object would collapse those into one key.
 */
export type FormSnapshot = ReadonlyArray<readonly [string, string]>;

function asText(value: FormDataEntryValue): string {
  return typeof value === "string" ? value : `file:${value.name}:${value.size}:${value.lastModified}`;
}

export function snapshotFormData(data: FormData): FormSnapshot {
  return Array.from(data.entries(), ([name, value]) => [name, asText(value)] as const);
}

/** FormData skips disabled controls, so take the baseline only once the page is interactive. */
export function snapshotForm(form: HTMLFormElement): FormSnapshot {
  return snapshotFormData(new FormData(form));
}

export function sameFormSnapshot(a: FormSnapshot, b: FormSnapshot): boolean {
  return a.length === b.length && a.every(([name, value], i) => b[i][0] === name && b[i][1] === value);
}
