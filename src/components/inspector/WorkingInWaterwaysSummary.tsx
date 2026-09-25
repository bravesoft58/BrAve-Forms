import { WATERWAY_CHECKS } from "@/lib/schemas/waterways";

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-0.5 text-sm text-zinc-900 dark:text-zinc-100";

interface CheckLike {
  value?: string;
  comment?: string;
}

/**
 * Read-only text summary of a Working in Waterways record for the inspector
 * portal. Photos are counted, not shown. TODO(BF-58.2): replace with the full
 * renderer, including signed photo links.
 */
export default function WorkingInWaterwaysSummary({ data }: { data: Record<string, unknown> }) {
  const text = (key: string) => (typeof data[key] === "string" && data[key] ? (data[key] as string) : "—");
  const photoCount = Array.isArray(data.photos) ? data.photos.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Site", text("site_name")],
          ["Site Descriptor", text("site_descriptor")],
          ["Time", text("inspection_time")],
          ["Initials", text("initials")],
        ].map(([label, value]) => (
          <div key={label}>
            <p className={labelClass}>{label}</p>
            <p className={valueClass}>{value}</p>
          </div>
        ))}
      </div>

      <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
        {WATERWAY_CHECKS.map((item) => {
          const check = (data[item.key] ?? {}) as CheckLike;
          return (
            <li key={item.key} className="py-2 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{check.value || "—"}</span>
              {check.comment && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{check.comment}</p>
              )}
            </li>
          );
        })}
      </ul>

      <div>
        <p className={labelClass}>Equipment in use</p>
        <p className={`${valueClass} whitespace-pre-wrap`}>{text("equipment_in_use")}</p>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {photoCount} {photoCount === 1 ? "photo" : "photos"} attached.
      </p>
    </div>
  );
}
