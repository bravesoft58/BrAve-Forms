"use client";

import { inputClass, labelClass } from "@/components/forms/formStyles";
import { NDEP_SAD_BMP_OPTIONS, type NdepSadData } from "@/lib/schemas/ndep-sad";

interface Section3Props {
  data: NdepSadData;
  onChange: <K extends keyof NdepSadData>(field: K, value: NdepSadData[K]) => void;
}

export default function Section3SadDetails({ data, onChange }: Section3Props) {
  function toggleBmp(option: string) {
    const current = data.bmp_checkboxes ?? {};
    onChange("bmp_checkboxes", { ...current, [option]: !current[option] });
  }

  const waterTrucksChecked = data.bmp_checkboxes?.["Water trucks"] ?? false;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 3 — Surface Area Disturbance Details
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Project Name</label>
          <input type="text" value={data.project_name} onChange={(e) => onChange("project_name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Total Acres Disturbed</label>
          <input type="text" value={data.total_acres} onChange={(e) => onChange("total_acres", e.target.value)} className={inputClass} placeholder="e.g. 5.0" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Best Management Practices (BMPs)
        </h3>
        <p className="mt-1 mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Check all BMPs that will be employed at this site.
        </p>
        <div className="space-y-2">
          {NDEP_SAD_BMP_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={data.bmp_checkboxes?.[opt] ?? false}
                onChange={() => toggleBmp(opt)}
                className="mt-0.5 rounded border-zinc-300"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {waterTrucksChecked && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Number of Water Trucks</label>
            <input type="text" value={data.water_truck_count} onChange={(e) => onChange("water_truck_count", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Capacity (gallons each)</label>
            <input type="text" value={data.water_truck_capacity} onChange={(e) => onChange("water_truck_capacity", e.target.value)} className={inputClass} />
          </div>
        </div>
      )}
    </section>
  );
}
