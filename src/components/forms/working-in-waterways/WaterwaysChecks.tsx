"use client";

import { inputClass } from "@/components/forms/formStyles";
import { WATERWAY_CHECKS, type WaterwayCheckKey } from "@/lib/schemas/waterways";

export interface CheckDraft {
  value: string;
  comment: string;
}

export type ChecksDraft = Record<WaterwayCheckKey, CheckDraft>;

/** The four inspection items: an answer and a comment each, as on the paper form. */
export default function WaterwaysChecks({
  checks,
  onChange,
  fieldErrors,
}: {
  checks: ChecksDraft;
  onChange: (key: WaterwayCheckKey, next: CheckDraft) => void;
  fieldErrors?: Record<string, string[]>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">Inspection</h2>
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
        {WATERWAY_CHECKS.map((item) => {
          const current = checks[item.key];
          const error = fieldErrors?.[`${item.key}.value`]?.[0];
          return (
            <fieldset key={item.key} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <legend className="sr-only">{item.label}</legend>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</p>
                {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
              <div className="flex gap-4">
                {item.options.map((option) => (
                  <label key={option} className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name={`check_${item.key}`}
                      value={option}
                      checked={current.value === option}
                      onChange={() => onChange(item.key, { ...current, value: option })}
                      className="h-4 w-4 border-zinc-300 text-[#233B5C] focus:ring-[#5C6F8A]"
                    />
                    {option}
                  </label>
                ))}
              </div>
              <input
                type="text"
                aria-label={`${item.label} comments`}
                placeholder="Comments"
                value={current.comment}
                onChange={(e) => onChange(item.key, { ...current, comment: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
