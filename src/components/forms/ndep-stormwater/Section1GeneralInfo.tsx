import {
  inputClass,
  selectClass,
  labelClass,
  readOnlyInputClass,
} from "@/components/forms/formStyles";
import {
  WEATHER_OPTIONS_LIST,
  INSPECTION_TYPES_LIST,
  type NdepStormwaterData,
} from "@/lib/schemas/ndep-stormwater";

interface Section1Props {
  data: NdepStormwaterData;
  onChange: <K extends keyof NdepStormwaterData>(field: K, value: NdepStormwaterData[K]) => void;
  fieldErrors?: Record<string, string[]>;
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

export default function Section1GeneralInfo({ data, onChange, fieldErrors }: Section1Props) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 1 — General Information
      </h2>

      {/* Read-only project info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Project / Site Name</label>
          <input type="text" value={data.project_site_name} readOnly className={readOnlyInputClass} />
        </div>
        <div>
          <label className={labelClass}>CSW #</label>
          <input type="text" value={data.csw_number || "—"} readOnly className={readOnlyInputClass} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input type="text" value={data.location || "—"} readOnly className={readOnlyInputClass} />
        </div>
      </div>

      {/* Inspection details */}
      <div className="grid gap-4 sm:grid-cols-3">
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
        <div>
          <label className={labelClass}>Inspection Time *</label>
          <input
            type="time"
            value={data.inspection_time}
            onChange={(e) => onChange("inspection_time", e.target.value)}
            className={inputClass}
          />
          <FieldError errors={fieldErrors} field="inspection_time" />
        </div>
        <div>
          <label className={labelClass}>Inspector Name *</label>
          <input
            type="text"
            value={data.inspector_name}
            onChange={(e) => onChange("inspector_name", e.target.value)}
            className={inputClass}
            placeholder="Full name"
          />
          <FieldError errors={fieldErrors} field="inspector_name" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Inspection Type</label>
          <select
            value={data.inspection_type}
            onChange={(e) => onChange("inspection_type", e.target.value as NdepStormwaterData["inspection_type"])}
            className={selectClass}
          >
            {INSPECTION_TYPES_LIST.map((t) => (
              <option key={t} value={t}>
                {t === "regular" ? "Regular" : t === "post_storm" ? "Post-Storm" : "Other"}
              </option>
            ))}
          </select>
        </div>
        {data.inspection_type === "other" && (
          <div className="sm:col-span-2">
            <label className={labelClass}>Other (describe)</label>
            <input
              type="text"
              value={data.inspection_type_other}
              onChange={(e) => onChange("inspection_type_other", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Storm Event Data */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Storm Event Data
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Storm event &ge; 0.25&quot;?</label>
          <select
            value={data.storm_event_025}
            onChange={(e) => onChange("storm_event_025", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        {data.storm_event_025 === "Y" && (
          <>
            <div>
              <label className={labelClass}>Rain Source</label>
              <select
                value={data.rain_source ?? ""}
                onChange={(e) =>
                  onChange("rain_source", (e.target.value || undefined) as NdepStormwaterData["rain_source"])
                }
                className={selectClass}
              >
                <option value="">Select...</option>
                <option value="rain_gauge">Rain Gauge</option>
                <option value="weather_station">Weather Station</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Total Rainfall (in)</label>
              <input
                type="text"
                value={data.total_rainfall}
                onChange={(e) => onChange("total_rainfall", e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Storm Start (date/time)</label>
              <input
                type="text"
                value={data.storm_start}
                onChange={(e) => onChange("storm_start", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Storm Duration</label>
              <input
                type="text"
                value={data.storm_duration}
                onChange={(e) => onChange("storm_duration", e.target.value)}
                className={inputClass}
                placeholder="e.g. 2 hours"
              />
            </div>
          </>
        )}
        <div>
          <label className={labelClass}>Snowmelt Discharge?</label>
          <select
            value={data.snowmelt_discharge}
            onChange={(e) => onChange("snowmelt_discharge", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {/* Site Conditions */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Site Conditions
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Weather</label>
          <select
            value={data.weather}
            onChange={(e) => onChange("weather", e.target.value as NdepStormwaterData["weather"])}
            className={selectClass}
          >
            {WEATHER_OPTIONS_LIST.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Temperature (&deg;F)</label>
          <input
            type="text"
            value={data.temperature}
            onChange={(e) => onChange("temperature", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Discharge from Site?</label>
          <select
            value={data.discharge_from_site}
            onChange={(e) => onChange("discharge_from_site", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
          {data.discharge_from_site === "Y" && (
            <textarea
              value={data.discharge_description}
              onChange={(e) => onChange("discharge_description", e.target.value)}
              rows={2}
              className={`${inputClass} mt-2`}
              placeholder="Describe discharge..."
            />
          )}
        </div>
        <div>
          <label className={labelClass}>Evidence of Erosion?</label>
          <select
            value={data.erosion_evidence}
            onChange={(e) => onChange("erosion_evidence", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
          {data.erosion_evidence === "Y" && (
            <textarea
              value={data.erosion_description}
              onChange={(e) => onChange("erosion_description", e.target.value)}
              rows={2}
              className={`${inputClass} mt-2`}
              placeholder="Describe erosion..."
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Previous Corrective Actions Complete?</label>
          <select
            value={data.previous_corrective_complete}
            onChange={(e) => onChange("previous_corrective_complete", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
          {data.previous_corrective_complete === "N" && (
            <textarea
              value={data.previous_corrective_description}
              onChange={(e) => onChange("previous_corrective_description", e.target.value)}
              rows={2}
              className={`${inputClass} mt-2`}
              placeholder="Describe outstanding items..."
            />
          )}
        </div>
      </div>
    </section>
  );
}
