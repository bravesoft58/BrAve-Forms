"use client";

import { useState } from "react";
import {
  equipmentPreview,
  orderPreviousEquipment,
  type PreviousEquipment,
} from "@/lib/forms/waterways-previous-equipment";

function dateLabel(formDate: string): string {
  return new Date(formDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * "Copy from previous" for the equipment box: a button that opens an inline
 * list of the project's recent inspections (same site first). Picking one
 * hands its equipment text to the form; the crew edits before submitting.
 * Inline rather than a dialog or popover: nothing to trap focus or scroll on
 * a phone, and the Popover API is still partial on iOS Safari (2026-10-08).
 */
export default function WaterwaysEquipmentPicker({
  entries,
  currentSite,
  excludeId,
  disabled,
  onPick,
}: {
  entries: readonly PreviousEquipment[];
  currentSite: string;
  excludeId?: string;
  disabled?: boolean;
  onPick: (equipment: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rows = orderPreviousEquipment(entries, currentSite, excludeId);
  if (rows.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-controls="previous-equipment-list"
        className="rounded-md border border-[#5C6F8A] px-3 py-1.5 text-sm font-medium text-[#233B5C] shadow-sm hover:bg-[#5C6F8A]/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        {open ? "Close" : "Copy from previous"}
      </button>
      {open && (
        <ul
          id="previous-equipment-list"
          className="mt-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700"
        >
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => {
                  onPick((row.equipment ?? "").trim());
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {dateLabel(row.form_date)}
                  {row.site_name ? ` · ${row.site_name}` : ""}
                  {row.initials ? ` · ${row.initials}` : ""}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {equipmentPreview(row.equipment)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
