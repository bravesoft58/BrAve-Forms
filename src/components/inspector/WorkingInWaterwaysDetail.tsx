import { WATERWAY_CHECKS } from "@/lib/schemas/waterways";

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-0.5 text-sm text-zinc-900 dark:text-zinc-100";

interface CheckLike {
  value?: string;
  comment?: string;
}

interface PhotoLike {
  file_name?: string;
  url?: string;
  caption?: string;
}

/**
 * Read-only Working in Waterways record for the inspector portal. Photo URLs
 * are signed by getPortalData and end with the inspector's session (BF-56).
 */
export default function WorkingInWaterwaysDetail({ data }: { data: Record<string, unknown> }) {
  const text = (key: string) => (typeof data[key] === "string" && data[key] ? (data[key] as string) : "—");
  const photos = (Array.isArray(data.photos) ? data.photos : []) as PhotoLike[];

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

      {photos.length > 0 && (
        <div>
          <p className={`${labelClass} mb-2`}>Photos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                {photo.url ? (
                  <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`} className="h-40 w-full object-cover" />
                ) : (
                  <p className="flex h-40 items-center justify-center text-xs text-zinc-500">Photo unavailable</p>
                )}
                {photo.caption && (
                  <p className="p-2 text-xs text-zinc-600 dark:text-zinc-400">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
