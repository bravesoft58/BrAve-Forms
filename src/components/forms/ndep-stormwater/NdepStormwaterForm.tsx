"use client";

import { useActionState, useState } from "react";
import {
  submitNdepStormwater,
  type NdepStormwaterState,
} from "@/app/dashboard/projects/[id]/forms/ndep-stormwater/actions";
import {
  NDEP_CONTROL_MEASURES,
  NDEP_STABILIZATION_ITEMS,
  type NdepStormwaterData,
  type ControlMeasureItem,
  type StabilizationItem,
} from "@/lib/schemas/ndep-stormwater";
import Section1GeneralInfo from "./Section1GeneralInfo";
import Section2ControlMeasures from "./Section2ControlMeasures";
import Section3Stabilization from "./Section3Stabilization";

interface NdepStormwaterFormProps {
  projectId: string;
  projectName: string;
  cswNumber: string;
  location: string;
  previousData?: NdepStormwaterData | null;
}

function makeDefaultControlMeasures(): ControlMeasureItem[] {
  return NDEP_CONTROL_MEASURES.map((name) => ({
    name,
    implemented: "NA" as const,
    maintenance_needed: "N" as const,
    notes: "",
  }));
}

function makeDefaultStabilization(): StabilizationItem[] {
  return NDEP_STABILIZATION_ITEMS.map((name) => ({
    name,
    implemented: "NA" as const,
    maintenance_needed: "N" as const,
    notes: "",
  }));
}

function makeEmptyData(projectName: string, cswNumber: string, location: string): NdepStormwaterData {
  const now = new Date();
  return {
    project_site_name: projectName,
    csw_number: cswNumber,
    location,
    inspection_date: now.toISOString().split("T")[0],
    inspection_time: now.toTimeString().slice(0, 5),
    inspector_name: "",
    inspection_type: "regular",
    inspection_type_other: "",
    storm_event_025: "N",
    rain_source: undefined,
    total_rainfall: "",
    storm_start: "",
    storm_duration: "",
    snowmelt_discharge: "N",
    weather: "Clear",
    temperature: "",
    discharge_from_site: "N",
    discharge_description: "",
    erosion_evidence: "N",
    erosion_description: "",
    previous_corrective_complete: "Y",
    previous_corrective_description: "",
    swppp_available: "Y",
    swppp_current: "Y",
    site_map_accurate: "Y",
    control_measures: makeDefaultControlMeasures(),
    stabilization_items: makeDefaultStabilization(),
    corrective_actions: [],
    inspector_signature: "",
    signature_date: now.toISOString().split("T")[0],
  };
}

const initialState: NdepStormwaterState = { error: "" };

export default function NdepStormwaterForm({
  projectId,
  projectName,
  cswNumber,
  location,
  previousData,
}: NdepStormwaterFormProps) {
  const [state, formAction, pending] = useActionState(submitNdepStormwater, initialState);
  const [data, setData] = useState<NdepStormwaterData>(() =>
    makeEmptyData(projectName, cswNumber, location)
  );
  const [usedPrevious, setUsedPrevious] = useState(false);

  function applyPrevious() {
    if (!previousData) return;
    const now = new Date();
    setData({
      ...previousData,
      project_site_name: projectName,
      csw_number: cswNumber,
      location,
      inspection_date: now.toISOString().split("T")[0],
      inspection_time: now.toTimeString().slice(0, 5),
      inspector_signature: "",
      signature_date: now.toISOString().split("T")[0],
    });
    setUsedPrevious(true);
  }

  function update<K extends keyof NdepStormwaterData>(field: K, value: NdepStormwaterData[K]) {
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
          Weekly stormwater inspection checklist per NDEP requirements.
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
            Pre-filled from last submission (date/time/signature cleared)
          </span>
        )}
      </div>

      <Section1GeneralInfo data={data} onChange={update} fieldErrors={state.fieldErrors} />
      <Section2ControlMeasures data={data} onChange={update} />
      <Section3Stabilization data={data} onChange={update} fieldErrors={state.fieldErrors} />

      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#233B5C] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit Inspection"}
        </button>
      </div>
    </form>
  );
}
