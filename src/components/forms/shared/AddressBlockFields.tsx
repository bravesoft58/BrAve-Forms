"use client";

import { inputClass, labelClass } from "@/components/forms/formStyles";

interface AddressBlockFieldsProps {
  legend: string;
  prefix: string;
  value: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    title?: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  onChange: (updated: AddressBlockFieldsProps["value"]) => void;
  /** Show title/phone/fax/email fields (contact block) */
  contact?: boolean;
}

export default function AddressBlockFields({
  legend,
  prefix,
  value,
  onChange,
  contact = false,
}: AddressBlockFieldsProps) {
  function set(field: string, v: string) {
    onChange({ ...value, [field]: v });
  }

  return (
    <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <legend className="px-2 text-sm font-semibold text-[#233B5C] dark:text-zinc-200">
        {legend}
      </legend>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{prefix} Name</label>
          <input type="text" value={value.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </div>
        {contact && (
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input type="text" value={value.title ?? ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={labelClass}>Street Address</label>
          <input type="text" value={value.street} onChange={(e) => set("street", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" value={value.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>State</label>
            <input type="text" value={value.state} onChange={(e) => set("state", e.target.value)} className={inputClass} maxLength={2} />
          </div>
          <div>
            <label className={labelClass}>Zip</label>
            <input type="text" value={value.zip} onChange={(e) => set("zip", e.target.value)} className={inputClass} />
          </div>
        </div>
        {contact && (
          <>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={value.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fax</label>
              <input type="tel" value={value.fax ?? ""} onChange={(e) => set("fax", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Email</label>
              <input type="email" value={value.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
          </>
        )}
      </div>
    </fieldset>
  );
}
