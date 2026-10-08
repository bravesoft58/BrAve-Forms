/**
 * "Copy from previous" for the Working in Waterways equipment box (BF-70).
 * Pure ordering over the project's recent inspections: the crew picks one and
 * its equipment text drops into the form. Also the fallback the form pages use
 * when that history cannot be read.
 */

export interface PreviousEquipment {
  id: string;
  form_date: string;
  site_name: string | null;
  initials: string | null;
  equipment: string | null;
}

/** How many recent inspections the picker offers. */
export const PREVIOUS_EQUIPMENT_LIMIT = 10;

/**
 * Rows worth offering, in the order the picker shows them. Inspections at
 * `currentSite` come first, then the rest; within each group the incoming
 * order (newest first, as the query sorts) is kept. Rows with no equipment
 * text, and the record being edited (`excludeId`), are left out.
 */
export function orderPreviousEquipment(
  entries: readonly PreviousEquipment[],
  currentSite: string,
  excludeId?: string,
): PreviousEquipment[] {
  const usable = entries.filter(
    (row) => row.id !== excludeId && (row.equipment ?? "").trim() !== "",
  );
  const sameSite = usable.filter((row) => currentSite !== "" && row.site_name === currentSite);
  const others = usable.filter((row) => !sameSite.includes(row));
  return [...sameSite, ...others];
}

/**
 * The picker is a convenience, so its history must never stop a crew from
 * opening the inspection: the new and edit pages read it with
 * `.catch(previousEquipmentUnavailable)`. The failure is logged and the form
 * renders without "Copy from previous"; equipment can still be typed.
 */
export function previousEquipmentUnavailable(error: unknown): PreviousEquipment[] {
  console.error("[waterways-equipment] recent equipment could not be read; picker hidden", {
    error: error instanceof Error ? error.message : String(error),
  });
  return [];
}

/** First line of the equipment text, cut to `max` characters for the list. */
export function equipmentPreview(text: string | null, max = 80): string {
  const firstLine = (text ?? "").trim().split(/\r?\n/)[0] ?? "";
  return firstLine.length > max ? `${firstLine.slice(0, max - 1).trimEnd()}…` : firstLine;
}
