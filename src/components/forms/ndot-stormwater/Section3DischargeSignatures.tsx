import {
  inputClass,
  selectClass,
  labelClass,
} from "@/components/forms/formStyles";
import type { NdotStormwaterData } from "@/lib/schemas/ndot-stormwater";
import { NDOT_SECTION3_PROMPTS, NDOT_CERT_TEXT } from "@/lib/constants/ndot-form-text";

interface Section3Props {
  data: NdotStormwaterData;
  onChange: <K extends keyof NdotStormwaterData>(field: K, value: NdotStormwaterData[K]) => void;
  fieldErrors?: Record<string, string[]>;
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

// Y/N select with an optional leading N/A choice — mirrors the official Form
// 018-001 spill-response controls (N/A | Y | N). Caller casts the value to the
// field's enum on the way out. (BF-53)
function YnSelect({
  label,
  value,
  onChange,
  na = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  na?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={selectClass}
      >
        <option value="">Select...</option>
        {na && <option value="NA">N/A</option>}
        <option value="Y">Y</option>
        <option value="N">N</option>
      </select>
    </div>
  );
}

export default function Section3DischargeSignatures({ data, onChange, fieldErrors }: Section3Props) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 3 — Batch Plants, Discharge &amp; Signatures
      </h2>

      {/* Batch Plants */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Batch Plants
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{NDOT_SECTION3_PROMPTS.batch_plant_present}</label>
          <select
            value={data.batch_plant_present ?? ""}
            onChange={(e) => onChange("batch_plant_present", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        {data.batch_plant_present === "Y" && (
          <div>
            <label className={labelClass}>{NDOT_SECTION3_PROMPTS.batch_plant_location}</label>
            <select
              value={data.batch_plant_location ?? ""}
              onChange={(e) =>
                onChange("batch_plant_location", (e.target.value || undefined) as NdotStormwaterData["batch_plant_location"])
              }
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="onsite">On-Site</option>
              <option value="offsite">Off-Site</option>
            </select>
          </div>
        )}
      </div>
      {data.batch_plant_present === "Y" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>BMPs in Place</label>
            <textarea
              value={data.batch_plant_bmps}
              onChange={(e) => onChange("batch_plant_bmps", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Describe BMPs..."
            />
          </div>
          <div>
            <label className={labelClass}>Comments</label>
            <textarea
              value={data.batch_plant_comments}
              onChange={(e) => onChange("batch_plant_comments", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Illicit Discharge / Spill Response — official Form 018-001 parity (BF-53) */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Illicit Discharge / Spill Response
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.illicit_discharges}
          value={data.illicit_discharges}
          onChange={(v) => onChange("illicit_discharges", v as "Y" | "N" | undefined)}
        />
        {data.illicit_discharges === "Y" && (
          <div>
            <label className={labelClass}>Describe the discharge</label>
            <textarea
              value={data.illicit_discharges_desc}
              onChange={(e) => onChange("illicit_discharges_desc", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Briefly describe the discharge in question..."
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.reportable_spills}
          value={data.reportable_spills}
          onChange={(v) => onChange("reportable_spills", v as "Y" | "N" | undefined)}
        />
        {data.reportable_spills === "Y" && (
          <div>
            <label className={labelClass}>Describe the spill</label>
            <textarea
              value={data.reportable_spills_desc}
              onChange={(e) => onChange("reportable_spills_desc", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Briefly describe the spill in question..."
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.spill_action}
          value={data.spill_action}
          na
          onChange={(v) => onChange("spill_action", v as "Y" | "N" | "NA" | undefined)}
        />
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.ndep_report_filed}
          value={data.ndep_report_filed}
          na
          onChange={(v) => onChange("ndep_report_filed", v as "Y" | "N" | "NA" | undefined)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.non_reportable_spills}
          value={data.non_reportable_spills}
          na
          onChange={(v) => onChange("non_reportable_spills", v as "Y" | "N" | "NA" | undefined)}
        />
        {data.non_reportable_spills === "Y" && (
          <div>
            <label className={labelClass}>Describe the spill &amp; actions taken</label>
            <textarea
              value={data.non_reportable_spills_desc}
              onChange={(e) => onChange("non_reportable_spills_desc", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Briefly describe the spill and actions taken..."
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.non_structural_bmps}
          value={data.non_structural_bmps}
          na
          onChange={(v) => onChange("non_structural_bmps", v as "Y" | "N" | "NA" | undefined)}
        />
        {data.non_structural_bmps === "Y" && (
          <div>
            <label className={labelClass}>Describe the non-structural BMPs</label>
            <textarea
              value={data.non_structural_bmps_desc}
              onChange={(e) => onChange("non_structural_bmps_desc", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Briefly describe..."
            />
          </div>
        )}
      </div>

      {/* Final Check */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Final Check
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <YnSelect
          label={NDOT_SECTION3_PROMPTS.all_areas_inspected}
          value={data.all_areas_inspected}
          onChange={(v) => onChange("all_areas_inspected", v as "Y" | "N" | undefined)}
        />
        {data.all_areas_inspected === "N" && (
          <div>
            <label className={labelClass}>Explanation</label>
            <textarea
              value={data.all_areas_inspected_explain}
              onChange={(e) => onChange("all_areas_inspected_explain", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Provide a brief explanation..."
            />
          </div>
        )}
      </div>
      <div>
        <label className={labelClass}>Additional Comments</label>
        <textarea
          value={data.additional_comments}
          onChange={(e) => onChange("additional_comments", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      {/* Certification */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Certification
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {NDOT_CERT_TEXT}
      </p>

      {/* Dual Signatures */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Inspector Signature
          </h4>
          <div>
            <label className={labelClass}>Name (typed) *</label>
            <input
              type="text"
              value={data.inspector_name}
              onChange={(e) => onChange("inspector_name", e.target.value)}
              className={inputClass}
              placeholder="Full name as signature"
            />
            <FieldError errors={fieldErrors} field="inspector_name" />
          </div>
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              value={data.inspector_date}
              onChange={(e) => onChange("inspector_date", e.target.value)}
              className={inputClass}
            />
            <FieldError errors={fieldErrors} field="inspector_date" />
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            WPCM Reviewer Signature
            <span className="ml-2 text-xs font-normal text-zinc-400">(optional)</span>
          </h4>
          <div>
            <label className={labelClass}>Name (typed)</label>
            <input
              type="text"
              value={data.wpcm_name}
              onChange={(e) => onChange("wpcm_name", e.target.value)}
              className={inputClass}
              placeholder="Full name as signature"
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={data.wpcm_date}
              onChange={(e) => onChange("wpcm_date", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
