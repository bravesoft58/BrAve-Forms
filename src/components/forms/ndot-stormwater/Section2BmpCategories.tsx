import {
  selectClass,
  inputClass,
  headerCellClass,
  cellClass,
} from "@/components/forms/formStyles";
import type {
  NdotStormwaterData,
  BmpCategory,
} from "@/lib/schemas/ndot-stormwater";
import { NDOT_BMP_PROMPTS } from "@/lib/constants/ndot-form-text";

const promptClass = "mt-0.5 text-xs font-normal leading-snug text-zinc-500 dark:text-zinc-400";

interface Section2Props {
  data: NdotStormwaterData;
  onChange: <K extends keyof NdotStormwaterData>(field: K, value: NdotStormwaterData[K]) => void;
}

export default function Section2BmpCategories({ data, onChange }: Section2Props) {
  function updateBmp(index: number, field: keyof BmpCategory, value: string) {
    const updated = data.bmp_categories.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange("bmp_categories", updated);
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 2 — BMP Categories
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className={headerCellClass}>BMP Category</th>
              <th className={`${headerCellClass} w-28`}>Required</th>
              <th className={`${headerCellClass} w-28`}>Implemented</th>
              <th className={headerCellClass}>Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.bmp_categories.map((item, i) => {
              const prompt = NDOT_BMP_PROMPTS[item.name as keyof typeof NDOT_BMP_PROMPTS];
              const reqId = `bmp-${i}-required`;
              const implId = `bmp-${i}-implemented`;
              return (
              <tr key={item.name}>
                <td className={`${cellClass} max-w-md`}>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {prompt?.displayName ?? item.name}
                  </span>
                  {prompt && (
                    <>
                      <p id={reqId} className={promptClass}>{prompt.required}</p>
                      <p id={implId} className={`${promptClass} mt-1`}>{prompt.implemented}</p>
                    </>
                  )}
                </td>
                <td className={cellClass}>
                  <select
                    value={item.required}
                    onChange={(e) => updateBmp(i, "required", e.target.value)}
                    className={selectClass}
                    aria-label={`${item.name} — required`}
                    aria-describedby={prompt ? reqId : undefined}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className={cellClass}>
                  <select
                    value={item.implemented}
                    onChange={(e) => updateBmp(i, "implemented", e.target.value)}
                    className={selectClass}
                    aria-label={`${item.name} — implemented`}
                    aria-describedby={prompt ? implId : undefined}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className={cellClass}>
                  <input
                    type="text"
                    value={item.comments}
                    onChange={(e) => updateBmp(i, "comments", e.target.value)}
                    className={`${inputClass} min-w-[150px]`}
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
