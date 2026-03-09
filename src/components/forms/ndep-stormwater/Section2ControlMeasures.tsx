import {
  selectClass,
  inputClass,
  labelClass,
  headerCellClass,
  cellClass,
} from "@/components/forms/formStyles";
import type {
  NdepStormwaterData,
  ControlMeasureItem,
} from "@/lib/schemas/ndep-stormwater";

interface Section2Props {
  data: NdepStormwaterData;
  onChange: <K extends keyof NdepStormwaterData>(field: K, value: NdepStormwaterData[K]) => void;
}

export default function Section2ControlMeasures({ data, onChange }: Section2Props) {
  function updateMeasure(index: number, field: keyof ControlMeasureItem, value: string) {
    const updated = data.control_measures.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange("control_measures", updated);
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 2 — SWPPP & Control Measures
      </h2>

      {/* SWPPP Y/N questions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>SWPPP Available on Site?</label>
          <select
            value={data.swppp_available}
            onChange={(e) => onChange("swppp_available", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>SWPPP Current?</label>
          <select
            value={data.swppp_current}
            onChange={(e) => onChange("swppp_current", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Site Map Accurate?</label>
          <select
            value={data.site_map_accurate}
            onChange={(e) => onChange("site_map_accurate", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {/* Control Measures Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className={headerCellClass}>Control Measure</th>
              <th className={`${headerCellClass} w-28`}>Implemented</th>
              <th className={`${headerCellClass} w-28`}>Maint. Needed</th>
              <th className={headerCellClass}>Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.control_measures.map((item, i) => (
              <tr key={item.name}>
                <td className={`${cellClass} text-sm font-medium text-zinc-700 dark:text-zinc-300`}>
                  {item.name}
                </td>
                <td className={cellClass}>
                  <select
                    value={item.implemented}
                    onChange={(e) => updateMeasure(i, "implemented", e.target.value)}
                    className={selectClass}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                    <option value="NA">N/A</option>
                  </select>
                </td>
                <td className={cellClass}>
                  <select
                    value={item.maintenance_needed}
                    onChange={(e) => updateMeasure(i, "maintenance_needed", e.target.value)}
                    className={selectClass}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className={cellClass}>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateMeasure(i, "notes", e.target.value)}
                    className={`${inputClass} min-w-[150px]`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
