"use client";

import { useActionState, useState } from "react";
import {
  submitNdepSad,
  type NdepSadState,
} from "@/app/dashboard/projects/[id]/forms/ndep-sad/actions";
import {
  NDEP_SAD_APPLICATION_TYPES,
  NDEP_SAD_APP_TYPE_LABELS,
  type NdepSadData,
} from "@/lib/schemas/ndep-sad";
import { selectClass, labelClass, inputClass } from "@/components/forms/formStyles";
import Section1CompanyInfo from "./Section1CompanyInfo";
import Section2Location from "./Section2Location";
import Section3SadDetails from "./Section3SadDetails";
import Section4Certification from "./Section4Certification";


interface NdepSadApplicationProps {
  projectId: string;
  project: {
    name: string;
    address?: string | null;
    acres_disturbed?: number | null;
    pm_name?: string | null;
    pm_phone?: string | null;
    pm_email?: string | null;
    superintendent_name?: string | null;
    superintendent_phone?: string | null;
    superintendent_email?: string | null;
    owner_rep_name?: string | null;
    owner_rep_address?: string | null;
    company_name?: string | null;
  };
  previousData?: NdepSadData | null;
}

function makeEmptyData(project: NdepSadApplicationProps["project"]): NdepSadData {
  const now = new Date();
  const companyName = project.company_name || "Q&D Construction";
  return {
    facility_name: project.name,
    existing_facility_id: "",
    existing_aqop: "",
    application_type: undefined,
    company: { name: companyName, street: "", city: "", state: "NV", zip: "" },
    owner: {
      name: project.owner_rep_name ?? "",
      street: project.owner_rep_address ?? "",
      city: "",
      state: "",
      zip: "",
    },
    site_plant: { name: project.name, street: project.address ?? "", city: "", state: "NV", zip: "" },
    records_location: { name: "", street: "", city: "", state: "NV", zip: "" },
    responsible_official: {
      name: project.pm_name ?? "",
      street: "",
      city: "",
      state: "NV",
      zip: "",
      title: "",
      phone: project.pm_phone ?? "",
      fax: "",
      email: project.pm_email ?? "",
    },
    site_manager: {
      name: project.superintendent_name ?? "",
      street: "",
      city: "",
      state: "NV",
      zip: "",
      title: "",
      phone: project.superintendent_phone ?? "",
      fax: "",
      email: project.superintendent_email ?? "",
    },
    township: "",
    range: "",
    section: "",
    utm_easting: "",
    utm_northing: "",
    hydrographic_basin: "",
    county: "",
    nearest_city: "",
    driving_directions: "",
    project_name: project.name,
    total_acres: project.acres_disturbed?.toString() ?? "",
    bmp_checkboxes: {},
    water_truck_count: "",
    water_truck_capacity: "",
    attachment_checklist: {},
    signature: "",
    signature_date: now.toISOString().split("T")[0],
  };
}

const initialState: NdepSadState = { error: "" };

export default function NdepSadApplication({
  projectId,
  project,
  previousData,
}: NdepSadApplicationProps) {
  const [state, formAction, pending] = useActionState(submitNdepSad, initialState);
  const [data, setData] = useState<NdepSadData>(() => makeEmptyData(project));
  const [usedPrevious, setUsedPrevious] = useState(false);

  function applyPrevious() {
    if (!previousData) return;
    const now = new Date();
    setData({
      ...previousData,
      signature: "",
      signature_date: now.toISOString().split("T")[0],
    });
    setUsedPrevious(true);
  }

  function update<K extends keyof NdepSadData>(field: K, value: NdepSadData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="data" value={JSON.stringify(data)} />

      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          NDEP Surface Area Disturbance permit application.
        </p>
        {previousData && !usedPrevious && (
          <button
            type="button"
            onClick={applyPrevious}
            className="rounded-md border border-[#5C6F8A] px-3 py-1.5 text-sm font-medium text-[#233B5C] shadow-sm hover:bg-[#5C6F8A]/10 dark:border-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Use Previous
          </button>
        )}
        {usedPrevious && (
          <span className="text-xs text-green-600 dark:text-green-400">
            Pre-filled from last submission (signature cleared)
          </span>
        )}
      </div>

      {/* Header fields */}
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Application Type</label>
            <select
              value={data.application_type ?? ""}
              onChange={(e) =>
                update(
                  "application_type",
                  (e.target.value || undefined) as NdepSadData["application_type"]
                )
              }
              className={selectClass}
            >
              <option value="">Select...</option>
              {NDEP_SAD_APPLICATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {NDEP_SAD_APP_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Facility Name</label>
            <input
              type="text"
              value={data.facility_name}
              onChange={(e) => update("facility_name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Existing Facility ID</label>
            <input
              type="text"
              value={data.existing_facility_id}
              onChange={(e) => update("existing_facility_id", e.target.value)}
              className={inputClass}
              placeholder="If applicable"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Existing AQOP #</label>
            <input
              type="text"
              value={data.existing_aqop}
              onChange={(e) => update("existing_aqop", e.target.value)}
              className={inputClass}
              placeholder="If applicable"
            />
          </div>
        </div>
      </section>

      <Section1CompanyInfo data={data} onChange={update} />
      <Section2Location data={data} onChange={update} />
      <Section3SadDetails data={data} onChange={update} />
      <Section4Certification data={data} onChange={update} fieldErrors={state.fieldErrors} />

      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#233B5C] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
