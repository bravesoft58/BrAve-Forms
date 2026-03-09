import {
  inputClass,
  selectClass,
  labelClass,
  headerCellClass,
  cellClass,
} from "@/components/forms/formStyles";
import type {
  NdepStormwaterData,
  StabilizationItem,
  CorrectiveActionRow,
} from "@/lib/schemas/ndep-stormwater";

interface Section3Props {
  data: NdepStormwaterData;
  onChange: <K extends keyof NdepStormwaterData>(field: K, value: NdepStormwaterData[K]) => void;
  fieldErrors?: Record<string, string[]>;
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

export default function Section3Stabilization({ data, onChange, fieldErrors }: Section3Props) {
  function updateStabilization(index: number, field: keyof StabilizationItem, value: string) {
    const updated = data.stabilization_items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange("stabilization_items", updated);
  }

  function updateCorrectiveAction(index: number, field: keyof CorrectiveActionRow, value: string) {
    const updated = (data.corrective_actions ?? []).map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onChange("corrective_actions", updated);
  }

  function addCorrectiveAction() {
    const current = data.corrective_actions ?? [];
    onChange("corrective_actions", [
      ...current,
      { description: "", date_to_complete: "", completed: "N" as const },
    ]);
  }

  function removeCorrectiveAction(index: number) {
    const updated = (data.corrective_actions ?? []).filter((_, i) => i !== index);
    onChange("corrective_actions", updated);
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 3 — Stabilization & Certification
      </h2>

      {/* Stabilization Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className={headerCellClass}>Stabilization Measure</th>
              <th className={`${headerCellClass} w-28`}>Implemented</th>
              <th className={`${headerCellClass} w-28`}>Maint. Needed</th>
              <th className={headerCellClass}>Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.stabilization_items.map((item, i) => (
              <tr key={item.name}>
                <td className={`${cellClass} text-sm font-medium text-zinc-700 dark:text-zinc-300`}>
                  {item.name}
                </td>
                <td className={cellClass}>
                  <select
                    value={item.implemented}
                    onChange={(e) => updateStabilization(i, "implemented", e.target.value)}
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
                    onChange={(e) => updateStabilization(i, "maintenance_needed", e.target.value)}
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
                    onChange={(e) => updateStabilization(i, "notes", e.target.value)}
                    className={`${inputClass} min-w-[150px]`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Corrective Actions */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Corrective Actions Required
      </h3>

      {(data.corrective_actions?.length ?? 0) > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className={headerCellClass}>Description</th>
                <th className={`${headerCellClass} w-40`}>Date to Complete</th>
                <th className={`${headerCellClass} w-28`}>Completed</th>
                <th className={`${headerCellClass} w-16`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.corrective_actions!.map((row, i) => (
                <tr key={i}>
                  <td className={cellClass}>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateCorrectiveAction(i, "description", e.target.value)}
                      className={`${inputClass} min-w-[200px]`}
                      placeholder="Describe corrective action..."
                    />
                    <FieldError errors={fieldErrors} field={`corrective_actions.${i}.description`} />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="date"
                      value={row.date_to_complete}
                      onChange={(e) => updateCorrectiveAction(i, "date_to_complete", e.target.value)}
                      className={inputClass}
                    />
                    <FieldError errors={fieldErrors} field={`corrective_actions.${i}.date_to_complete`} />
                  </td>
                  <td className={cellClass}>
                    <select
                      value={row.completed}
                      onChange={(e) => updateCorrectiveAction(i, "completed", e.target.value)}
                      className={selectClass}
                    >
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                  </td>
                  <td className={cellClass}>
                    <button
                      type="button"
                      onClick={() => removeCorrectiveAction(i)}
                      className="mt-1 rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addCorrectiveAction}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        + Add Corrective Action
      </button>

      {/* Certification / Signature */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Inspector Certification
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Inspector Signature (typed name) *</label>
          <input
            type="text"
            value={data.inspector_signature}
            onChange={(e) => onChange("inspector_signature", e.target.value)}
            className={inputClass}
            placeholder="Type full name as signature"
          />
          <FieldError errors={fieldErrors} field="inspector_signature" />
        </div>
        <div>
          <label className={labelClass}>Signature Date *</label>
          <input
            type="date"
            value={data.signature_date}
            onChange={(e) => onChange("signature_date", e.target.value)}
            className={inputClass}
          />
          <FieldError errors={fieldErrors} field="signature_date" />
        </div>
      </div>
    </section>
  );
}
