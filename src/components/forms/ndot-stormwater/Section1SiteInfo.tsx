import {
  inputClass,
  selectClass,
  labelClass,
  readOnlyInputClass,
} from "@/components/forms/formStyles";
import {
  WEATHER_OPTIONS_LIST,
  INTENSITY_OPTIONS_LIST,
  TEMP_RANGES_LIST,
  type NdotStormwaterData,
} from "@/lib/schemas/ndot-stormwater";
import {
  NDOT_SECTION1_PROMPTS,
  NDOT_SWPPP_PROMPTS,
  NDOT_SITE_INFO_HINTS,
} from "@/lib/constants/ndot-form-text";

const hintClass = "mt-0.5 text-xs font-normal italic text-zinc-400 dark:text-zinc-500";

interface Section1Props {
  data: NdotStormwaterData;
  onChange: <K extends keyof NdotStormwaterData>(field: K, value: NdotStormwaterData[K]) => void;
  fieldErrors?: Record<string, string[]>;
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

export default function Section1SiteInfo({ data, onChange, fieldErrors }: Section1Props) {
  function toggleWeather(opt: (typeof WEATHER_OPTIONS_LIST)[number]) {
    const current = data.weather ?? [];
    const next = current.includes(opt)
      ? current.filter((w) => w !== opt)
      : [...current, opt];
    onChange("weather", next);
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 1 — Site Information
      </h2>

      {/* Row 1: Report No, Project Location, Contract Number */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Report No.</label>
          <input
            type="text"
            value={data.report_no}
            onChange={(e) => onChange("report_no", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Project Location</label>
          <input
            type="text"
            value={data.project_location}
            readOnly
            className={readOnlyInputClass}
          />
          <p className={hintClass}>{NDOT_SITE_INFO_HINTS.project_location}</p>
        </div>
        <div>
          <label className={labelClass}>Contract Number</label>
          <input
            type="text"
            value={data.contract_number}
            readOnly
            className={readOnlyInputClass}
          />
        </div>
      </div>

      {/* Row 2: CSW Tracking, NDOT Inspector, Crew Number */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <div className={`${labelClass} flex items-center`}>
            <span>CSW Tracking #</span>
            <label className="ml-3 inline-flex items-center gap-1 text-xs font-normal text-zinc-500">
              <input
                type="checkbox"
                checked={data.csw_na}
                onChange={(e) => onChange("csw_na", e.target.checked)}
                className="rounded border-zinc-300"
              />
              N/A
            </label>
          </div>
          <input
            type="text"
            value={data.csw_tracking}
            onChange={(e) => onChange("csw_tracking", e.target.value)}
            disabled={data.csw_na}
            className={`${inputClass} ${data.csw_na ? "opacity-50" : ""}`}
          />
          <p className={hintClass}>{NDOT_SITE_INFO_HINTS.csw_tracking}</p>
        </div>
        <div>
          <label className={labelClass}>NDOT Inspector</label>
          <input
            type="text"
            value={data.ndot_inspector}
            onChange={(e) => onChange("ndot_inspector", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Crew Number</label>
          <input
            type="text"
            value={data.crew_number}
            onChange={(e) => onChange("crew_number", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 3: Resident Engineer, WPCM, Inspection Date */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Resident Engineer</label>
          <input
            type="text"
            value={data.resident_engineer}
            onChange={(e) => onChange("resident_engineer", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>WPCM</label>
          <input
            type="text"
            value={data.wpcm}
            onChange={(e) => onChange("wpcm", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Inspection Date *</label>
          <input
            type="date"
            value={data.inspection_date}
            onChange={(e) => onChange("inspection_date", e.target.value)}
            className={inputClass}
          />
          <FieldError errors={fieldErrors} field="inspection_date" />
        </div>
      </div>

      {/* Previous Inspection Date */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Previous Inspection Date</label>
          <input
            type="date"
            value={data.previous_inspection_date}
            onChange={(e) => onChange("previous_inspection_date", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Weather & Conditions */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Weather &amp; Conditions
      </h3>

      {/* Weather multi-select checkboxes */}
      <div>
        <label className={labelClass}>Weather (select all that apply)</label>
        <div className="mt-2 flex flex-wrap gap-4">
          {WEATHER_OPTIONS_LIST.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={data.weather?.includes(opt) ?? false}
                onChange={() => toggleWeather(opt)}
                className="rounded border-zinc-300"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {/* Precip Intensity, Wind, Temp */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <div className={`${labelClass} flex items-center`}>
            <span>Precipitation Intensity</span>
            <label className="ml-3 inline-flex items-center gap-1 text-xs font-normal text-zinc-500">
              <input
                type="checkbox"
                checked={data.precip_na}
                onChange={(e) => onChange("precip_na", e.target.checked)}
                className="rounded border-zinc-300"
              />
              N/A
            </label>
          </div>
          <select
            value={data.precip_intensity ?? ""}
            onChange={(e) =>
              onChange("precip_intensity", (e.target.value || undefined) as NdotStormwaterData["precip_intensity"])
            }
            disabled={data.precip_na}
            className={`${selectClass} ${data.precip_na ? "opacity-50" : ""}`}
          >
            <option value="">Select...</option>
            {INTENSITY_OPTIONS_LIST.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Wind</label>
          <select
            value={data.wind ?? ""}
            onChange={(e) =>
              onChange("wind", (e.target.value || undefined) as NdotStormwaterData["wind"])
            }
            className={selectClass}
          >
            <option value="">Select...</option>
            {INTENSITY_OPTIONS_LIST.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Temperature Range</label>
          <select
            value={data.temp_range ?? ""}
            onChange={(e) =>
              onChange("temp_range", (e.target.value || undefined) as NdotStormwaterData["temp_range"])
            }
            className={selectClass}
          >
            <option value="">Select...</option>
            {TEMP_RANGES_LIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Precip detail fields (disabled when precip_na) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Precip Reference Type</label>
          <input
            type="text"
            value={data.precip_reference_type}
            onChange={(e) => onChange("precip_reference_type", e.target.value)}
            disabled={data.precip_na}
            className={`${inputClass} ${data.precip_na ? "opacity-50" : ""}`}
            placeholder="e.g. rain gauge"
          />
        </div>
        <div>
          <label className={labelClass}>Precip Reference Location</label>
          <input
            type="text"
            value={data.precip_reference_location}
            onChange={(e) => onChange("precip_reference_location", e.target.value)}
            disabled={data.precip_na}
            className={`${inputClass} ${data.precip_na ? "opacity-50" : ""}`}
          />
        </div>
        <div>
          <label className={labelClass}>Precip Total (in)</label>
          <input
            type="text"
            value={data.precip_total}
            onChange={(e) => onChange("precip_total", e.target.value)}
            disabled={data.precip_na}
            className={`${inputClass} ${data.precip_na ? "opacity-50" : ""}`}
            placeholder="0.00"
          />
          <p className={hintClass}>{NDOT_SITE_INFO_HINTS.precip_total}</p>
        </div>
      </div>

      {/* Conditional Questions */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Conditional Questions
      </h3>

      {/* Q1: TMDL Waterway */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{NDOT_SECTION1_PROMPTS.tmdl_waterway}</label>
          <select
            value={data.tmdl_waterway ?? ""}
            onChange={(e) => onChange("tmdl_waterway", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        {data.tmdl_waterway === "Y" && (
          <div>
            <label className={labelClass}>{NDOT_SECTION1_PROMPTS.tmdl_waterway_names}</label>
            <input
              type="text"
              value={data.tmdl_waterway_names}
              onChange={(e) => onChange("tmdl_waterway_names", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Q2: Deficiency Follow-up */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{NDOT_SECTION1_PROMPTS.deficiency_followup}</label>
          <select
            value={data.deficiency_followup ?? ""}
            onChange={(e) =>
              onChange("deficiency_followup", (e.target.value || undefined) as NdotStormwaterData["deficiency_followup"])
            }
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="na">N/A</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {(data.deficiency_followup === "yes" || data.deficiency_followup === "no") && (
          <div>
            <label className={labelClass}>Actions Taken / Planned</label>
            <textarea
              value={data.deficiency_actions}
              onChange={(e) => onChange("deficiency_actions", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Describe actions..."
            />
          </div>
        )}
      </div>

      {/* Q3: Erosion Evidence */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>{NDOT_SECTION1_PROMPTS.erosion_evidence}</label>
          <select
            value={data.erosion_evidence ?? ""}
            onChange={(e) => onChange("erosion_evidence", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        {data.erosion_evidence === "Y" && (
          <>
            <div>
              <label className={labelClass}>{NDOT_SECTION1_PROMPTS.erosion_discharge}</label>
              <select
                value={data.erosion_discharge ?? ""}
                onChange={(e) => onChange("erosion_discharge", e.target.value as "Y" | "N")}
                className={selectClass}
              >
                <option value="">Select...</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{NDOT_SECTION1_PROMPTS.erosion_waterway}</label>
              <input
                type="text"
                value={data.erosion_waterway}
                onChange={(e) => onChange("erosion_waterway", e.target.value)}
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>

      {/* Q4: Adjacent Runoff */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{NDOT_SECTION1_PROMPTS.adjacent_runoff}</label>
          <select
            value={data.adjacent_runoff ?? ""}
            onChange={(e) => onChange("adjacent_runoff", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {/* Q5: Pollutant Concerns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{NDOT_SECTION1_PROMPTS.pollutant_concerns}</label>
          <select
            value={data.pollutant_concerns ?? ""}
            onChange={(e) => onChange("pollutant_concerns", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        {data.pollutant_concerns === "Y" && (
          <div>
            <label className={labelClass}>Explain</label>
            <textarea
              value={data.pollutant_explain}
              onChange={(e) => onChange("pollutant_explain", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Describe concerns..."
            />
          </div>
        )}
      </div>

      {/* SWPPP Elements */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        SWPPP Elements
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <label className={labelClass}>{NDOT_SWPPP_PROMPTS.swppp_onsite}</label>
          <select
            value={data.swppp_onsite ?? ""}
            onChange={(e) => onChange("swppp_onsite", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{NDOT_SWPPP_PROMPTS.swppp_signed}</label>
          <select
            value={data.swppp_signed ?? ""}
            onChange={(e) => onChange("swppp_signed", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{NDOT_SWPPP_PROMPTS.swppp_current}</label>
          <select
            value={data.swppp_current ?? ""}
            onChange={(e) => onChange("swppp_current", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{NDOT_SWPPP_PROMPTS.swppp_posted}</label>
          <select
            value={data.swppp_posted ?? ""}
            onChange={(e) => onChange("swppp_posted", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>
    </section>
  );
}
