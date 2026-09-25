"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import {
  submitWaterways,
  updateWaterways,
  type WaterwaysState,
} from "@/app/dashboard/projects/[id]/forms/working-in-waterways/actions";
import PhotoAttachment from "@/components/forms/shared/PhotoAttachment";
import { inputClass, labelClass, selectClass } from "@/components/forms/formStyles";
import { pacificTime, pacificToday } from "@/lib/dates";
import type { FormPhoto } from "@/lib/schemas/form-photo";
import type { WaterwaySite, WaterwaysData } from "@/lib/schemas/waterways";
import WaterwaysChecks, { type ChecksDraft } from "./WaterwaysChecks";

interface Draft extends ChecksDraft {
  site_name: string;
  inspection_date: string;
  inspection_time: string;
  initials: string;
  equipment_in_use: string;
  photos: FormPhoto[];
}

function emptyDraft(sites: WaterwaySite[]): Draft {
  const blank = { value: "", comment: "" };
  const now = new Date();
  return {
    site_name: sites.length === 1 ? sites[0].name : "",
    inspection_date: pacificToday(now),
    inspection_time: pacificTime(now),
    initials: "",
    water_in_waterway: blank,
    vehicle_inspection: blank,
    bmp_inspection: blank,
    sheen_or_plume: blank,
    equipment_in_use: "",
    photos: [],
  };
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msg = errors?.[field]?.[0];
  return msg ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msg}</p> : null;
}

const initialState: WaterwaysState = { error: "" };

export default function WaterwaysForm({
  projectId,
  sites,
  submissionId,
  initialData,
  cancelHref,
}: {
  projectId: string;
  sites: WaterwaySite[];
  /** When set, the form runs in edit mode against this submission. */
  submissionId?: string;
  initialData?: WaterwaysData;
  cancelHref?: string;
}) {
  const isEdit = Boolean(submissionId);
  const action = isEdit ? updateWaterways.bind(null, submissionId as string) : submitWaterways;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [draft, setDraft] = useState<Draft>(() => initialData ?? emptyDraft(sites));

  // Submit through onSubmit, not <form action>: React 19 resets a form after a
  // form action, which blanks the controlled select and radios on screen while
  // the draft (what is actually sent) keeps its values. BF-58.1 preview finding.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  // A record whose site was later renamed or removed keeps its own site as an option.
  const siteOptions =
    draft.site_name && !sites.some((s) => s.name === draft.site_name)
      ? [...sites, { name: draft.site_name, descriptor: initialData?.site_descriptor ?? "" }]
      : sites;
  const errors = state.fieldErrors;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="data" value={JSON.stringify(draft)} />

      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="site_name" className={labelClass}>Site</label>
          <select
            id="site_name"
            value={draft.site_name}
            onChange={(e) => update("site_name", e.target.value)}
            className={selectClass}
          >
            <option value="">Select a site</option>
            {siteOptions.map((s) => (
              <option key={s.name} value={s.name}>
                {s.descriptor ? `${s.name} (${s.descriptor})` : s.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors} field="site_name" />
        </div>
        <div>
          <label htmlFor="inspection_date" className={labelClass}>Date</label>
          <input
            id="inspection_date"
            type="date"
            value={draft.inspection_date}
            onChange={(e) => update("inspection_date", e.target.value)}
            className={inputClass}
          />
          <FieldError errors={errors} field="inspection_date" />
        </div>
        <div>
          <label htmlFor="inspection_time" className={labelClass}>Time</label>
          <input
            id="inspection_time"
            type="time"
            value={draft.inspection_time}
            onChange={(e) => update("inspection_time", e.target.value)}
            className={inputClass}
          />
          <FieldError errors={errors} field="inspection_time" />
        </div>
        <div>
          <label htmlFor="initials" className={labelClass}>Initials</label>
          <input
            id="initials"
            type="text"
            maxLength={10}
            value={draft.initials}
            onChange={(e) => update("initials", e.target.value)}
            className={inputClass}
          />
          <FieldError errors={errors} field="initials" />
        </div>
      </section>

      <WaterwaysChecks checks={draft} onChange={update} fieldErrors={errors} />

      <section>
        <label htmlFor="equipment_in_use" className={labelClass}>
          Equipment in use in and around the waterway today
        </label>
        <textarea
          id="equipment_in_use"
          rows={4}
          value={draft.equipment_in_use}
          onChange={(e) => update("equipment_in_use", e.target.value)}
          className={inputClass}
        />
        <FieldError errors={errors} field="equipment_in_use" />
      </section>

      <section className="space-y-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          At least one photo is required for every day of in-water work.
        </p>
        <PhotoAttachment
          photos={draft.photos}
          onPhotosChange={(photos) => update("photos", photos)}
          storagePath={`projects/${projectId}/working-in-waterways`}
          disabled={pending}
        />
        <FieldError errors={errors} field="photos" />
      </section>

      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {cancelHref && (
          <a
            href={cancelHref}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </a>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#233B5C] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (isEdit ? "Saving..." : "Submitting...") : isEdit ? "Save Changes" : "Submit Inspection"}
        </button>
      </div>
    </form>
  );
}
