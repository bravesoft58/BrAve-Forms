/**
 * Deep equality for JSON values, ignoring object key order. Postgres jsonb
 * stores keys in its own order, so a row read back never has the same key
 * order as the object the action built; a string compare would call every
 * retry "different". Arrays stay order-sensitive (entry and photo order is
 * part of the record). BF-65/BF-61.
 */
export function sameData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    const other = b as unknown[];
    return a.length === other.length && a.every((item, i) => sameData(item, other[i]));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && sameData(left[key], right[key]))
  );
}
