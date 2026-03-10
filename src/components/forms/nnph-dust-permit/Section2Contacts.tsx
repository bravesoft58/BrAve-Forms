"use client";

import type { NnphDustPermitData, ContactInfo } from "@/lib/schemas/nnph-dust-permit";
import { inputClass, labelClass } from "@/components/forms/formStyles";

interface Section2Props {
  data: NnphDustPermitData;
  onChange: <K extends keyof NnphDustPermitData>(field: K, value: NnphDustPermitData[K]) => void;
}

function ContactFields({
  label,
  contact,
  onUpdate,
}: {
  label: string;
  contact: ContactInfo;
  onUpdate: (updated: ContactInfo) => void;
}) {
  function set(field: keyof ContactInfo, value: string) {
    onUpdate({ ...contact, [field]: value });
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <p className="mb-3 text-sm font-semibold text-[#233B5C] dark:text-zinc-300">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={contact.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input type="text" value={contact.company} onChange={(e) => set("company", e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Address</label>
          <input type="text" value={contact.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" value={contact.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>State</label>
            <input type="text" value={contact.state} onChange={(e) => set("state", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Zip</label>
            <input type="text" value={contact.zip} onChange={(e) => set("zip", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" value={contact.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={contact.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
        </div>
      </div>
    </div>
  );
}

export default function Section2Contacts({ data, onChange }: Section2Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 2 — Contacts
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContactFields
          label="Applicant"
          contact={data.applicant}
          onUpdate={(v) => onChange("applicant", v)}
        />
        <ContactFields
          label="Contractor"
          contact={data.contractor}
          onUpdate={(v) => onChange("contractor", v)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="mb-3 text-sm font-semibold text-[#233B5C] dark:text-zinc-300">Emergency Contact 1</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={data.emergency_contact_1.name}
                onChange={(e) => onChange("emergency_contact_1", { ...data.emergency_contact_1, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={data.emergency_contact_1.phone}
                onChange={(e) => onChange("emergency_contact_1", { ...data.emergency_contact_1, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="mb-3 text-sm font-semibold text-[#233B5C] dark:text-zinc-300">Emergency Contact 2</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={data.emergency_contact_2.name}
                onChange={(e) => onChange("emergency_contact_2", { ...data.emergency_contact_2, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={data.emergency_contact_2.phone}
                onChange={(e) => onChange("emergency_contact_2", { ...data.emergency_contact_2, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
