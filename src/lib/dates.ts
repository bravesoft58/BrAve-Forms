// Q&D's projects are in Nevada. Server functions run in UTC and field crews
// work into the evening, so "today" must be computed in Pacific time; a UTC
// date is already tomorrow after 5 pm PDT (4 pm PST).
const PROJECT_TIME_ZONE = "America/Los_Angeles";

const pacificParts = new Intl.DateTimeFormat("en-US", {
  timeZone: PROJECT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partsOf(now: Date): Record<string, string> {
  const parts: Record<string, string> = {};
  for (const { type, value } of pacificParts.formatToParts(now)) {
    parts[type] = value;
  }
  return parts;
}

/** Today's date in Nevada as YYYY-MM-DD. Built from parts, not a locale's layout. */
export function pacificToday(now: Date = new Date()): string {
  const p = partsOf(now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** The time of day in Nevada as HH:MM (24-hour), the same on server and browser. */
export function pacificTime(now: Date = new Date()): string {
  const p = partsOf(now);
  return `${p.hour}:${p.minute}`;
}
