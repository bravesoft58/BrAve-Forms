"use client";

import { inputClass, labelClass } from "@/components/forms/formStyles";
import type { NdepSadData } from "@/lib/schemas/ndep-sad";

interface Section2Props {
  data: NdepSadData;
  onChange: <K extends keyof NdepSadData>(field: K, value: NdepSadData[K]) => void;
}

export default function Section2Location({ data, onChange }: Section2Props) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 2 — Location Details
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Township</label>
          <input type="text" value={data.township} onChange={(e) => onChange("township", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Range</label>
          <input type="text" value={data.range} onChange={(e) => onChange("range", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Section</label>
          <input type="text" value={data.section} onChange={(e) => onChange("section", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>UTM Easting (NAD83 Zone 11)</label>
          <input type="text" value={data.utm_easting} onChange={(e) => onChange("utm_easting", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>UTM Northing (NAD83 Zone 11)</label>
          <input type="text" value={data.utm_northing} onChange={(e) => onChange("utm_northing", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Hydrographic Basin</label>
          <input type="text" value={data.hydrographic_basin} onChange={(e) => onChange("hydrographic_basin", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>County</label>
          <input type="text" value={data.county} onChange={(e) => onChange("county", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nearest City</label>
          <input type="text" value={data.nearest_city} onChange={(e) => onChange("nearest_city", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Driving Directions to Facility</label>
        <textarea
          value={data.driving_directions}
          onChange={(e) => onChange("driving_directions", e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Directions from nearest major intersection..."
        />
      </div>
    </section>
  );
}
