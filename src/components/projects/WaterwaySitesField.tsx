"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { inputClass } from "@/components/forms/formStyles";
import { MAX_WATERWAY_SITES, type WaterwaySite } from "@/lib/schemas/waterways";

interface Row {
  key: number;
  name: string;
  descriptor: string;
}

function firstError(errors: Record<string, string[]> | undefined, prefix: string): string | undefined {
  if (!errors) return undefined;
  const key = Object.keys(errors).find((k) => k === prefix || k.startsWith(`${prefix}.`));
  return key ? errors[key][0] : undefined;
}

/**
 * The project's waterway sites, edited inside the Waterway permit block of the
 * project form. Each row submits a waterway_site_name / waterway_site_descriptor
 * pair; parseProjectForm reads them back with getAll.
 */
export default function WaterwaySitesField({
  initialSites,
  errors,
}: {
  initialSites: WaterwaySite[];
  errors?: Record<string, string[]>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (initialSites.length > 0 ? initialSites : [{ name: "", descriptor: "" }]).map((s, i) => ({
      key: i,
      name: s.name,
      descriptor: s.descriptor,
    })),
  );
  const [nextKey, setNextKey] = useState(rows.length);

  function updateRow(key: number, field: "name" | "descriptor", value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey, name: "", descriptor: "" }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const error = firstError(errors, "waterway_sites");

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Waterway sites</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        One Working in Waterways form is filled in per site on days of in-water work. The descriptor
        is optional (for example coordinates or mile markers). Each submitted form keeps its own copy
        of the site, so later changes here do not alter past records.
      </p>

      {rows.map((row, i) => (
        <div key={row.key} className="flex items-start gap-2">
          <input
            name="waterway_site_name"
            type="text"
            aria-label={`Site ${i + 1} name`}
            placeholder="Site name, e.g. Western Drainage"
            value={row.name}
            onChange={(e) => updateRow(row.key, "name", e.target.value)}
            className={inputClass}
          />
          <input
            name="waterway_site_descriptor"
            type="text"
            aria-label={`Site ${i + 1} descriptor`}
            placeholder="Descriptor (optional)"
            value={row.descriptor}
            onChange={(e) => updateRow(row.key, "descriptor", e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            aria-label={`Remove site ${i + 1}`}
            className="mt-2.5 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {rows.length < MAX_WATERWAY_SITES && (
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#233B5C] hover:underline dark:text-zinc-300"
        >
          <Plus className="h-4 w-4" />
          Add site
        </button>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
