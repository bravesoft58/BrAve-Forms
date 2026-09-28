import type { SiteToday } from "@/lib/forms/waterway-sites-today";

/** "Sites with a form today" for the Working in Waterways tab (Nevada date). */
export default function WaterwaySitesToday({ rows, today }: { rows: SiteToday[]; today: string }) {
  if (rows.length === 0) return null;

  const label = new Date(today + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Sites today ({label})</h3>
      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              {row.name}
              {row.descriptor && <span className="text-zinc-500 dark:text-zinc-400"> ({row.descriptor})</span>}
            </span>
            <span className={row.submittedToday ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}>
              {row.submittedToday ? "Submitted today" : "No form today"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
