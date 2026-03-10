"use client";

import AddressBlockFields from "@/components/forms/shared/AddressBlockFields";
import type { NdepSadData, AddressBlock, ContactBlock } from "@/lib/schemas/ndep-sad";

interface Section1Props {
  data: NdepSadData;
  onChange: <K extends keyof NdepSadData>(field: K, value: NdepSadData[K]) => void;
}

export default function Section1CompanyInfo({ data, onChange }: Section1Props) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
        Section 1 — General Company Information
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddressBlockFields
          legend="Company"
          prefix="Company"
          value={data.company}
          onChange={(v) => onChange("company", v as AddressBlock)}
        />
        <AddressBlockFields
          legend="Owner / Operator"
          prefix="Owner"
          value={data.owner}
          onChange={(v) => onChange("owner", v as AddressBlock)}
        />
        <AddressBlockFields
          legend="Site / Plant Location"
          prefix="Site"
          value={data.site_plant}
          onChange={(v) => onChange("site_plant", v as AddressBlock)}
        />
        <AddressBlockFields
          legend="Records Location"
          prefix="Records"
          value={data.records_location}
          onChange={(v) => onChange("records_location", v as AddressBlock)}
        />
        <AddressBlockFields
          legend="Responsible Official"
          prefix="Official"
          value={data.responsible_official}
          onChange={(v) => onChange("responsible_official", v as ContactBlock)}
          contact
        />
        <AddressBlockFields
          legend="Site Manager"
          prefix="Manager"
          value={data.site_manager}
          onChange={(v) => onChange("site_manager", v as ContactBlock)}
          contact
        />
      </div>
    </section>
  );
}
