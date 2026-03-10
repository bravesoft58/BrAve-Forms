"use client";

import type { NnphDustPermitData, DustControlMethod } from "@/lib/schemas/nnph-dust-permit";
import { PROJECT_TYPES_LIST } from "@/lib/schemas/nnph-dust-permit";
import { inputClass, labelClass, selectClass } from "@/components/forms/formStyles";

interface Section3Props {
  data: NnphDustPermitData;
  onChange: <K extends keyof NnphDustPermitData>(field: K, value: NnphDustPermitData[K]) => void;
}

function YNRadio({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: "Y" | "N" | undefined;
  onSelect: (v: "Y" | "N") => void;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex gap-4">
        {(["Y", "N"] as const).map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onSelect(opt)}
              className="accent-[#233B5C]"
            />
            {opt === "Y" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Section3ProjectDetails({ data, onChange }: Section3Props) {
  function updateMethod(index: number, patch: Partial<DustControlMethod>) {
    const updated = data.dust_control_methods.map((m, i) =>
      i === index ? { ...m, ...patch } : m
    );
    onChange("dust_control_methods", updated);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 3 — Project Details
      </h2>

      <div>
        <label className={labelClass}>Project Description</label>
        <textarea
          value={data.project_description}
          onChange={(e) => onChange("project_description", e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Project Type</label>
          <select
            value={data.project_type}
            onChange={(e) => onChange("project_type", e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {PROJECT_TYPES_LIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fill Material Source</label>
          <input
            type="text"
            value={data.fill_material_source}
            onChange={(e) => onChange("fill_material_source", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Excavation Amount</label>
          <input
            type="text"
            value={data.excavation_amount}
            onChange={(e) => onChange("excavation_amount", e.target.value)}
            className={inputClass}
            placeholder="e.g. 5,000 CY"
          />
        </div>
      </div>

      {/* Crushing Equipment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <YNRadio
          label="Crushing Equipment on Site?"
          value={data.crushing_equipment}
          onSelect={(v) => onChange("crushing_equipment", v)}
        />
        {data.crushing_equipment === "Y" && (
          <div>
            <label className={labelClass}>Stationary Source Permit #</label>
            <input
              type="text"
              value={data.stationary_source_permit}
              onChange={(e) => onChange("stationary_source_permit", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Soil */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Soil Type</label>
          <input
            type="text"
            value={data.soil_type}
            onChange={(e) => onChange("soil_type", e.target.value)}
            className={inputClass}
          />
        </div>
        <YNRadio
          label="Soil Analysis Available?"
          value={data.soil_analysis_available}
          onSelect={(v) => onChange("soil_analysis_available", v)}
        />
      </div>

      {/* Dust Control Methods */}
      <div>
        <p className="mb-2 text-sm font-semibold text-[#233B5C] dark:text-zinc-300">
          Dust Control Methods
        </p>
        <div className="space-y-3">
          {data.dust_control_methods.map((m, i) => (
            <div key={m.method} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={m.enabled}
                  onChange={(e) => updateMethod(i, { enabled: e.target.checked })}
                  className="accent-[#233B5C]"
                />
                {m.method}
              </label>
              {m.enabled && (
                <textarea
                  value={m.details}
                  onChange={(e) => updateMethod(i, { details: e.target.value })}
                  placeholder="Details / frequency / coverage..."
                  rows={2}
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Temporary Irrigation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <YNRadio
          label="Temporary Irrigation?"
          value={data.temporary_irrigation}
          onSelect={(v) => onChange("temporary_irrigation", v)}
        />
        {data.temporary_irrigation === "Y" && (
          <div>
            <label className={labelClass}>Irrigation Details</label>
            <input
              type="text"
              value={data.irrigation_details}
              onChange={(e) => onChange("irrigation_details", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Additional Controls */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Speed Limit (mph)</label>
          <input
            type="text"
            value={data.speed_limit}
            onChange={(e) => onChange("speed_limit", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Trackout Control</label>
          <input
            type="text"
            value={data.trackout_control}
            onChange={(e) => onChange("trackout_control", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Unauthorized Traffic Prevention</label>
          <input
            type="text"
            value={data.unauthorized_traffic_prevention}
            onChange={(e) => onChange("unauthorized_traffic_prevention", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Signature */}
      <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div>
          <label className={labelClass}>Signature (type full name)</label>
          <input
            type="text"
            value={data.signature}
            onChange={(e) => onChange("signature", e.target.value)}
            className={inputClass}
            placeholder="Type full name as signature"
          />
        </div>
        <div>
          <label className={labelClass}>Signature Date</label>
          <input
            type="date"
            value={data.signature_date}
            onChange={(e) => onChange("signature_date", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  );
}
