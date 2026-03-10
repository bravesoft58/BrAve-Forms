"use client";

import { useActionState, useState } from "react";
import { createProject, type ProjectState } from "@/app/dashboard/projects/actions";
import {
  PERMIT_TYPES,
  PERMIT_LABELS,
  PERMIT_FORM_MAP,
  FORM_LABELS,
  type PermitType,
  type FormType,
} from "@/lib/constants/permits";

const initialState: ProjectState = { error: "" };

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}

function ContactGroup({
  title,
  prefix,
  errors,
  showAddress,
  defaults,
}: {
  title: string;
  prefix: string;
  errors?: Record<string, string[]>;
  showAddress?: boolean;
  defaults?: Record<string, string | null>;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${prefix}_name`} className={labelClass}>Name</label>
          <input id={`${prefix}_name`} name={`${prefix}_name`} type="text" defaultValue={defaults?.[`${prefix}_name`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_name`} />
        </div>
        <div>
          <label htmlFor={`${prefix}_phone`} className={labelClass}>Phone</label>
          <input id={`${prefix}_phone`} name={`${prefix}_phone`} type="tel" defaultValue={defaults?.[`${prefix}_phone`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_phone`} />
        </div>
        <div>
          <label htmlFor={`${prefix}_email`} className={labelClass}>Email</label>
          <input id={`${prefix}_email`} name={`${prefix}_email`} type="email" defaultValue={defaults?.[`${prefix}_email`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_email`} />
        </div>
      </div>
      {showAddress && (
        <div>
          <label htmlFor={`${prefix}_address`} className={labelClass}>Address</label>
          <input id={`${prefix}_address`} name={`${prefix}_address`} type="text" defaultValue={defaults?.[`${prefix}_address`] ?? ""} className={inputClass} />
          <FieldError errors={errors} field={`${prefix}_address`} />
        </div>
      )}
    </div>
  );
}

interface Permit {
  permit_type: string;
  permit_number: string | null;
}

interface ProjectFormProps {
  action?: (prev: ProjectState, formData: FormData) => Promise<ProjectState>;
  submitLabel?: string;
  pendingLabel?: string;
  defaults?: Record<string, string | number | null>;
  existingPermits?: Permit[];
}

export default function ProjectForm({
  action,
  submitLabel = "Create Project",
  pendingLabel = "Creating...",
  defaults,
  existingPermits,
}: ProjectFormProps = {}) {
  const serverAction = action ?? createProject;
  const [state, formAction, pending] = useActionState(serverAction, initialState);

  const initialPermits = new Set<PermitType>(
    (existingPermits ?? []).map((p) => p.permit_type as PermitType)
  );
  const [selectedPermits, setSelectedPermits] = useState<Set<PermitType>>(initialPermits);

  // Build permit number lookup from existing data
  const permitNumbers: Record<string, string> = {};
  for (const p of existingPermits ?? []) {
    if (p.permit_number) permitNumbers[p.permit_type] = p.permit_number;
  }

  function togglePermit(permit: PermitType) {
    setSelectedPermits((prev) => {
      const next = new Set(prev);
      if (next.has(permit)) next.delete(permit);
      else next.add(permit);
      return next;
    });
  }

  // Derive required forms from selected permits
  const requiredForms = new Set<FormType>();
  for (const permit of selectedPermits) {
    for (const form of PERMIT_FORM_MAP[permit]) {
      requiredForms.add(form);
    }
  }

  const d = defaults ?? {};

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Basic Information
        </h3>

        <div>
          <label htmlFor="name" className={labelClass}>
            Project Name <span className="text-red-500">*</span>
          </label>
          <input id="name" name="name" type="text" required defaultValue={String(d.name ?? "")} className={inputClass} />
          <FieldError errors={state.fieldErrors} field="name" />
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            Address <span className="text-red-500">*</span>
          </label>
          <input id="address" name="address" type="text" required defaultValue={String(d.address ?? "")} className={inputClass} />
          <FieldError errors={state.fieldErrors} field="address" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className={labelClass}>
              Start Date <span className="text-red-500">*</span>
            </label>
            <input id="start_date" name="start_date" type="date" required defaultValue={String(d.start_date ?? "")} className={inputClass} />
            <FieldError errors={state.fieldErrors} field="start_date" />
          </div>
          <div>
            <label htmlFor="completion_date" className={labelClass}>
              Completion Date <span className="text-red-500">*</span>
            </label>
            <input id="completion_date" name="completion_date" type="date" required defaultValue={String(d.completion_date ?? "")} className={inputClass} />
            <FieldError errors={state.fieldErrors} field="completion_date" />
          </div>
        </div>
      </section>

      {/* Section 2: Contacts */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Contacts
        </h3>
        <ContactGroup title="Superintendent" prefix="superintendent" errors={state.fieldErrors} defaults={d as Record<string, string | null>} />
        <ContactGroup title="Foreman" prefix="foreman" errors={state.fieldErrors} defaults={d as Record<string, string | null>} />
        <ContactGroup title="Project Manager" prefix="pm" errors={state.fieldErrors} defaults={d as Record<string, string | null>} />
        <ContactGroup title="Owner Representative" prefix="owner_rep" errors={state.fieldErrors} showAddress defaults={d as Record<string, string | null>} />
      </section>

      {/* Section 3: Site Details */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Site Details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="acres_disturbed" className={labelClass}>Acres Disturbed</label>
            <input id="acres_disturbed" name="acres_disturbed" type="number" step="0.01" min="0" defaultValue={d.acres_disturbed != null ? String(d.acres_disturbed) : ""} className={inputClass} />
            <FieldError errors={state.fieldErrors} field="acres_disturbed" />
          </div>
          <div>
            <label htmlFor="soil_type" className={labelClass}>Soil Type</label>
            <input id="soil_type" name="soil_type" type="text" defaultValue={String(d.soil_type ?? "")} className={inputClass} />
            <FieldError errors={state.fieldErrors} field="soil_type" />
          </div>
        </div>

        <div>
          <label htmlFor="parcel_numbers" className={labelClass}>Parcel Numbers</label>
          <input id="parcel_numbers" name="parcel_numbers" type="text" defaultValue={String(d.parcel_numbers ?? "")} className={inputClass} />
          <FieldError errors={state.fieldErrors} field="parcel_numbers" />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={String(d.description ?? "")}
            className={inputClass}
          />
          <FieldError errors={state.fieldErrors} field="description" />
        </div>
      </section>

      {/* Section 4: Permits */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[#233B5C] dark:text-zinc-100">
          Permits
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Select applicable permits. Required forms will be auto-assigned.
        </p>

        <div className="space-y-3">
          {PERMIT_TYPES.map((permit) => (
            <div key={permit} className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedPermits.has(permit)}
                  onChange={() => togglePermit(permit)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#233B5C] focus:ring-[#5C6F8A]"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {PERMIT_LABELS[permit]}
                </span>
              </label>

              {selectedPermits.has(permit) && (
                <div className="ml-7">
                  {/* Hidden inputs to submit permit data */}
                  <input type="hidden" name="permit_type" value={permit} />
                  <input
                    name="permit_number"
                    type="text"
                    placeholder="Permit number (optional)"
                    defaultValue={permitNumbers[permit] ?? ""}
                    className={`${inputClass} max-w-xs`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {requiredForms.size > 0 && (
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
            <p className="text-sm font-medium text-[#233B5C] dark:text-blue-300">
              Required forms:
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
              {Array.from(requiredForms).map((form) => (
                <li key={form}>{FORM_LABELS[form]}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#233B5C] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
