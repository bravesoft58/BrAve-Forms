"use client";

import type { NnphDustPermitData } from "@/lib/schemas/nnph-dust-permit";
import { APPLICATION_TYPES_LIST } from "@/lib/schemas/nnph-dust-permit";
import { inputClass, labelClass, selectClass } from "@/components/forms/formStyles";

const APP_TYPE_LABELS: Record<string, string> = {
  new: "New Application",
  renewal: "Renewal",
  modification: "Modification",
};

interface Section1Props {
  data: NnphDustPermitData;
  onChange: <K extends keyof NnphDustPermitData>(field: K, value: NnphDustPermitData[K]) => void;
}

export default function Section1ApplicationInfo({ data, onChange }: Section1Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 1 — Application Info
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Application Type</label>
          <select
            value={data.application_type ?? ""}
            onChange={(e) =>
              onChange(
                "application_type",
                (e.target.value || undefined) as NnphDustPermitData["application_type"]
              )
            }
            className={selectClass}
          >
            <option value="">Select...</option>
            {APPLICATION_TYPES_LIST.map((t) => (
              <option key={t} value={t}>
                {APP_TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </div>

        {(data.application_type === "renewal" || data.application_type === "modification") && (
          <div>
            <label className={labelClass}>Permit Number</label>
            <input
              type="text"
              value={data.permit_number}
              onChange={(e) => onChange("permit_number", e.target.value)}
              className={inputClass}
              placeholder="Existing permit #"
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Project Name</label>
          <input
            type="text"
            value={data.project_name}
            onChange={(e) => onChange("project_name", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass}>APN</label>
          <input
            type="text"
            value={data.apn}
            onChange={(e) => onChange("apn", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Acres</label>
          <input
            type="text"
            value={data.acres}
            onChange={(e) => onChange("acres", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="date"
            value={data.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input
            type="date"
            value={data.end_date}
            onChange={(e) => onChange("end_date", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  );
}
