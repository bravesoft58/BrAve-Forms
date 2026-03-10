"use client";

import { inputClass, labelClass } from "@/components/forms/formStyles";
import { NDEP_SAD_ATTACHMENT_ITEMS, type NdepSadData } from "@/lib/schemas/ndep-sad";

interface Section4Props {
  data: NdepSadData;
  onChange: <K extends keyof NdepSadData>(field: K, value: NdepSadData[K]) => void;
  fieldErrors?: Record<string, string[]>;
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

export default function Section4Certification({ data, onChange, fieldErrors }: Section4Props) {
  function toggleAttachment(item: string) {
    const current = data.attachment_checklist ?? {};
    onChange("attachment_checklist", { ...current, [item]: !current[item] });
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 4 — Certification & Attachments
      </h2>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Attachment Checklist
        </h3>
        <div className="mt-3 space-y-2">
          {NDEP_SAD_ATTACHMENT_ITEMS.map((item) => (
            <label key={item} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={data.attachment_checklist?.[item] ?? false}
                onChange={() => toggleAttachment(item)}
                className="mt-0.5 rounded border-zinc-300"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div>
          <label className={labelClass}>Signature (type full name) *</label>
          <input
            type="text"
            value={data.signature}
            onChange={(e) => onChange("signature", e.target.value)}
            className={inputClass}
            placeholder="Full legal name"
          />
          <FieldError errors={fieldErrors} field="signature" />
        </div>
        <div>
          <label className={labelClass}>Date *</label>
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
