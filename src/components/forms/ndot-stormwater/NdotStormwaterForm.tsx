"use client";

import { useActionState, useState } from "react";
import {
  submitNdotStormwater,
  type NdotStormwaterState,
} from "@/app/dashboard/projects/[id]/forms/ndot-stormwater/actions";
import {
  NDOT_BMP_CATEGORIES,
  type NdotStormwaterData,
  type BmpCategory,
} from "@/lib/schemas/ndot-stormwater";
import Section1SiteInfo from "./Section1SiteInfo";
import Section2BmpCategories from "./Section2BmpCategories";
import Section3DischargeSignatures from "./Section3DischargeSignatures";
import PhotoAttachment from "@/components/forms/shared/PhotoAttachment";
import type { FormPhoto } from "@/lib/schemas/ndot-stormwater";

interface NdotStormwaterFormProps {
  projectId: string;
  projectName: string;
  contractNumber: string;
  location: string;
  previousData?: NdotStormwaterData | null;
}

function makeDefaultBmpCategories(): BmpCategory[] {
  return NDOT_BMP_CATEGORIES.map((name) => ({
    name,
    required: "N" as const,
    implemented: "N" as const,
    comments: "",
  }));
}

function makeEmptyData(projectName: string, contractNumber: string, location: string): NdotStormwaterData {
  const now = new Date();
  return {
    report_no: "",
    project_location: location,
    contract_number: contractNumber,
    csw_tracking: "",
    csw_na: false,
    ndot_inspector: "",
    crew_number: "",
    resident_engineer: "",
    wpcm: "",
    inspection_date: now.toISOString().split("T")[0],
    previous_inspection_date: "",
    weather: [],
    precip_intensity: undefined,
    precip_reference_type: "",
    precip_reference_location: "",
    precip_total: "",
    precip_na: false,
    wind: undefined,
    temp_range: undefined,
    tmdl_waterway: undefined,
    tmdl_waterway_names: "",
    deficiency_followup: undefined,
    deficiency_actions: "",
    erosion_evidence: undefined,
    erosion_discharge: undefined,
    erosion_waterway: "",
    adjacent_runoff: undefined,
    pollutant_concerns: undefined,
    pollutant_explain: "",
    swppp_onsite: undefined,
    swppp_signed: undefined,
    swppp_current: undefined,
    swppp_posted: undefined,
    bmp_categories: makeDefaultBmpCategories(),
    batch_plant_present: undefined,
    batch_plant_location: undefined,
    batch_plant_bmps: "",
    batch_plant_comments: "",
    illicit_discharges: undefined,
    reportable_spills: undefined,
    spill_action: "",
    ndep_report_filed: undefined,
    non_reportable_spills: undefined,
    non_structural_bmps: "",
    all_areas_inspected: undefined,
    additional_comments: "",
    photos: [],
    inspector_name: "",
    inspector_date: now.toISOString().split("T")[0],
    wpcm_name: "",
    wpcm_date: "",
  };
}

const initialState: NdotStormwaterState = { error: "" };

export default function NdotStormwaterForm({
  projectId,
  projectName,
  contractNumber,
  location,
  previousData,
}: NdotStormwaterFormProps) {
  const [state, formAction, pending] = useActionState(submitNdotStormwater, initialState);
  const [data, setData] = useState<NdotStormwaterData>(() =>
    makeEmptyData(projectName, contractNumber, location)
  );
  const [usedPrevious, setUsedPrevious] = useState(false);

  function applyPrevious() {
    if (!previousData) return;
    const now = new Date();
    setData({
      ...previousData,
      project_location: location,
      contract_number: contractNumber,
      inspection_date: now.toISOString().split("T")[0],
      previous_inspection_date: "",
      // Clear signatures and photos from previous submission
      photos: [],
      inspector_name: "",
      inspector_date: now.toISOString().split("T")[0],
      wpcm_name: "",
      wpcm_date: "",
    });
    setUsedPrevious(true);
  }

  function update<K extends keyof NdotStormwaterData>(field: K, value: NdotStormwaterData[K]) {
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
          Weekly stormwater inspection checklist per NDOT requirements.
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
            Pre-filled from last submission (date/signatures cleared)
          </span>
        )}
      </div>

      <Section1SiteInfo data={data} onChange={update} fieldErrors={state.fieldErrors} />
      <Section2BmpCategories data={data} onChange={update} />

      <PhotoAttachment
        photos={data.photos}
        onPhotosChange={(photos: FormPhoto[]) => update("photos", photos)}
        storagePath={`projects/${projectId}/ndot-stormwater`}
      />

      <Section3DischargeSignatures data={data} onChange={update} fieldErrors={state.fieldErrors} />

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
