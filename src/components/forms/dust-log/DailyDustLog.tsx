"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDustLog, type DustLogState } from "@/app/dashboard/projects/[id]/forms/dust-log/actions";
import {
  SOIL_CONDITIONS_LIST,
  ROAD_CONDITIONS_LIST,
  type DustLogEntry,
} from "@/lib/schemas/dust-log";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#5C6F8A] focus:outline-none focus:ring-1 focus:ring-[#5C6F8A] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const selectClass = `${inputClass} appearance-auto`;
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const headerCellClass = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400";
const cellClass = "px-3 py-2 align-top";

interface DailyDustLogProps {
  projectId: string;
  projectName: string;
  permitNumber: string | null;
  companyName: string | null;
  previousEntry?: DustLogEntry | null;
}

function makeEmptyEntry(): DustLogEntry {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 5);
  return {
    date,
    time,
    visible_dust: "N",
    project_soils: "Dry",
    access_roads: "Dry",
    trackout: "N",
    corrective_actions: "",
  };
}

const initialState: DustLogState = { error: "" };

export default function DailyDustLog({
  projectId,
  projectName,
  permitNumber,
  companyName,
  previousEntry,
}: DailyDustLogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDustLog, initialState);
  const [entries, setEntries] = useState<DustLogEntry[]>([makeEmptyEntry()]);
  const [usedPrevious, setUsedPrevious] = useState(false);

  function applyPrevious() {
    if (!previousEntry) return;
    const now = new Date();
    setEntries([
      {
        ...previousEntry,
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().slice(0, 5),
        corrective_actions: "",
      },
    ]);
    setUsedPrevious(true);
  }

  function updateEntry(index: number, field: keyof DustLogEntry, value: string) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  }

  function addEntry() {
    setEntries((prev) => [...prev, makeEmptyEntry()]);
  }

  function removeEntry(index: number) {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />

      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Header — read-only project info */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Permit #</label>
          <input type="text" value={permitNumber ?? "—"} readOnly className={`${inputClass} bg-zinc-50 dark:bg-zinc-900`} />
        </div>
        <div>
          <label className={labelClass}>Project Name</label>
          <input type="text" value={projectName} readOnly className={`${inputClass} bg-zinc-50 dark:bg-zinc-900`} />
        </div>
        <div>
          <label className={labelClass}>Company / Contractor</label>
          <input type="text" value={companyName ?? "—"} readOnly className={`${inputClass} bg-zinc-50 dark:bg-zinc-900`} />
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Record inspection results for dust control compliance. Minimum 1 entry per day.
        </p>
        {previousEntry && !usedPrevious && (
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
            Pre-filled from last submission (date/time reset)
          </span>
        )}
      </div>

      {/* Entries table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className={headerCellClass}>Date</th>
              <th className={headerCellClass}>Time</th>
              <th className={headerCellClass}>Visible Dust</th>
              <th className={headerCellClass}>Project Soils</th>
              <th className={headerCellClass}>Access Roads</th>
              <th className={headerCellClass}>Trackout</th>
              <th className={headerCellClass}>Corrective Actions / Comments</th>
              <th className={headerCellClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {entries.map((entry, i) => (
              <tr key={i}>
                <td className={cellClass}>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(i, "date", e.target.value)}
                    className={`${inputClass} min-w-[130px]`}
                  />
                  <EntryError errors={state.fieldErrors} index={i} field="date" />
                </td>
                <td className={cellClass}>
                  <input
                    type="time"
                    value={entry.time}
                    onChange={(e) => updateEntry(i, "time", e.target.value)}
                    className={`${inputClass} min-w-[100px]`}
                  />
                  <EntryError errors={state.fieldErrors} index={i} field="time" />
                </td>
                <td className={cellClass}>
                  <select
                    value={entry.visible_dust}
                    onChange={(e) => updateEntry(i, "visible_dust", e.target.value)}
                    className={`${selectClass} min-w-[72px]`}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className={cellClass}>
                  <select
                    value={entry.project_soils}
                    onChange={(e) => updateEntry(i, "project_soils", e.target.value)}
                    className={`${selectClass} min-w-[110px]`}
                  >
                    {SOIL_CONDITIONS_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className={cellClass}>
                  <select
                    value={entry.access_roads}
                    onChange={(e) => updateEntry(i, "access_roads", e.target.value)}
                    className={`${selectClass} min-w-[100px]`}
                  >
                    {ROAD_CONDITIONS_LIST.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className={cellClass}>
                  <select
                    value={entry.trackout}
                    onChange={(e) => updateEntry(i, "trackout", e.target.value)}
                    className={selectClass}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className={cellClass}>
                  <textarea
                    value={entry.corrective_actions}
                    onChange={(e) => updateEntry(i, "corrective_actions", e.target.value)}
                    rows={2}
                    className={`${inputClass} min-w-[180px]`}
                  />
                </td>
                <td className={cellClass}>
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    disabled={entries.length <= 1}
                    className="mt-1 rounded p-1 text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-red-400"
                    title="Remove entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        + Add Entry
      </button>

      <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={pending}
          className="rounded-md border border-zinc-300 bg-white px-6 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#233B5C] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a2d47] focus:outline-none focus:ring-2 focus:ring-[#5C6F8A] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit Dust Log"}
        </button>
      </div>
    </form>
  );
}

function EntryError({
  errors,
  index,
  field,
}: {
  errors?: Record<string, string[]>;
  index: number;
  field: string;
}) {
  const key = `entries.${index}.${field}`;
  const msgs = errors?.[key];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{msgs[0]}</p>;
}
