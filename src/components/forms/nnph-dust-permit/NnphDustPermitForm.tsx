"use client";

import { useActionState, useState } from "react";
import {
  submitNnphDustPermit,
  type NnphDustPermitState,
} from "@/app/dashboard/projects/[id]/forms/nnph-dust-permit/actions";
import {
  NNPH_DUST_CONTROL_METHODS,
  type NnphDustPermitData,
} from "@/lib/schemas/nnph-dust-permit";
import Section1ApplicationInfo from "./Section1ApplicationInfo";
import Section2Contacts from "./Section2Contacts";
import Section3ProjectDetails from "./Section3ProjectDetails";

interface NnphDustPermitFormProps {
  projectId: string;
  project: {
    name: string;
    parcel_numbers?: string | null;
    acres_disturbed?: number | null;
    start_date?: string | null;
    completion_date?: string | null;
    soil_type?: string | null;
    company_name?: string | null;
    pm_name?: string | null;
    pm_phone?: string | null;
    pm_email?: string | null;
    superintendent_name?: string | null;
    superintendent_phone?: string | null;
    foreman_name?: string | null;
    foreman_phone?: string | null;
  };
  previousData?: NnphDustPermitData | null;
}

function makeEmptyData(project: NnphDustPermitFormProps["project"]): NnphDustPermitData {
  const now = new Date();
  const companyName = project.company_name || "Q&D Construction";
  return {
    application_type: undefined as unknown as NnphDustPermitData["application_type"],
    permit_number: "",
    project_name: project.name,
    apn: project.parcel_numbers ?? "",
    acres: project.acres_disturbed?.toString() ?? "",
    start_date: project.start_date ?? "",
    end_date: project.completion_date ?? "",
    applicant: {
      name: project.pm_name ?? "",
      company: companyName,
      address: "",
      city: "",
      state: "NV",
      zip: "",
      phone: project.pm_phone ?? "",
      email: project.pm_email ?? "",
    },
    contractor: {
      name: "",
      company: companyName,
      address: "",
      city: "",
      state: "NV",
      zip: "",
      phone: "",
      email: "",
    },
    emergency_contact_1: {
      name: project.superintendent_name ?? "",
      phone: project.superintendent_phone ?? "",
    },
    emergency_contact_2: {
      name: project.foreman_name ?? "",
      phone: project.foreman_phone ?? "",
    },
    project_description: "",
    project_type: "",
    fill_material_source: "",
    excavation_amount: "",
    crushing_equipment: undefined,
    stationary_source_permit: "",
    soil_type: project.soil_type ?? "",
    soil_analysis_available: undefined,
    dust_control_methods: NNPH_DUST_CONTROL_METHODS.map((method) => ({
      method,
      enabled: false,
      details: "",
    })),
    temporary_irrigation: undefined,
    irrigation_details: "",
    speed_limit: "",
    trackout_control: "",
    unauthorized_traffic_prevention: "",
    signature: "",
    signature_date: now.toISOString().split("T")[0],
  };
}

const initialState: NnphDustPermitState = { error: "" };

export default function NnphDustPermitForm({
  projectId,
  project,
  previousData,
}: NnphDustPermitFormProps) {
  const [state, formAction, pending] = useActionState(submitNnphDustPermit, initialState);
  const [data, setData] = useState<NnphDustPermitData>(() => makeEmptyData(project));
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

  function update<K extends keyof NnphDustPermitData>(field: K, value: NnphDustPermitData[K]) {
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
          NNPH Dust Control Permit application.
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

      <Section1ApplicationInfo data={data} onChange={update} />
      <Section2Contacts data={data} onChange={update} />
      <Section3ProjectDetails data={data} onChange={update} />

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
