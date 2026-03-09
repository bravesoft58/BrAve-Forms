import {
  inputClass,
  selectClass,
  labelClass,
} from "@/components/forms/formStyles";
import type { NdotStormwaterData } from "@/lib/schemas/ndot-stormwater";

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
          <label className={labelClass}>Batch plant present?</label>
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
            <label className={labelClass}>Location</label>
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

      {/* Illicit Discharge / Spill Response */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Illicit Discharge / Spill Response
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Illicit discharges observed?</label>
          <select
            value={data.illicit_discharges ?? ""}
            onChange={(e) => onChange("illicit_discharges", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Reportable spills?</label>
          <select
            value={data.reportable_spills ?? ""}
            onChange={(e) => onChange("reportable_spills", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {data.reportable_spills === "Y" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Spill Action Taken</label>
            <textarea
              value={data.spill_action}
              onChange={(e) => onChange("spill_action", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Describe response actions..."
            />
          </div>
          <div>
            <label className={labelClass}>NDEP report filed?</label>
            <select
              value={data.ndep_report_filed ?? ""}
              onChange={(e) => onChange("ndep_report_filed", e.target.value as "Y" | "N")}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Non-reportable spills?</label>
          <select
            value={data.non_reportable_spills ?? ""}
            onChange={(e) => onChange("non_reportable_spills", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {/* Additional */}
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        Additional
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Non-structural BMPs</label>
          <textarea
            value={data.non_structural_bmps}
            onChange={(e) => onChange("non_structural_bmps", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>All areas inspected?</label>
          <select
            value={data.all_areas_inspected ?? ""}
            onChange={(e) => onChange("all_areas_inspected", e.target.value as "Y" | "N")}
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
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
        I certify under penalty of law that this document and all attachments were prepared under my
        direction or supervision in accordance with a system designed to assure that qualified
        personnel properly gather and evaluate the information submitted. Based on my inquiry of the
        person or persons who manage the system, or those persons directly responsible for gathering
        the information, the information submitted is, to the best of my knowledge and belief, true,
        accurate, and complete. I am aware that there are significant penalties for submitting false
        information, including the possibility of fine and imprisonment for knowing violations.
        (40 CFR 122.22(d))
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
