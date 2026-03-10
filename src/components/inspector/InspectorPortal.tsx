"use client";

import { useState } from "react";
import { PERMIT_LABELS, type PermitType } from "@/lib/constants/permits";
import type { PortalData } from "@/lib/queries/inspector";
import InspectorFormsTab from "./FormsTab";
import InspectorDocumentsTab from "./DocumentsTab";

const tabs = [
  { key: "forms", label: "Forms" },
  { key: "documents", label: "Documents" },
  { key: "permits", label: "Permits" },
  { key: "info", label: "Project Info" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function InspectorPortal({ data }: { data: PortalData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("forms");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#5C6F8A]">
            Inspector Portal
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#233B5C] dark:text-zinc-100">
            {data.project.name}
          </h1>
          {data.project.address && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {data.project.address}
            </p>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-[#5C6F8A] text-[#233B5C] dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {activeTab === "forms" && (
          <InspectorFormsTab submissions={data.submissions} />
        )}
        {activeTab === "documents" && (
          <InspectorDocumentsTab documents={data.documents} />
        )}
        {activeTab === "permits" && (
          <PermitsContent permits={data.permits} />
        )}
        {activeTab === "info" && (
          <ProjectInfoContent project={data.project} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            BrAve Forms — Q&D Construction Compliance
          </p>
        </div>
      </footer>
    </div>
  );
}

function PermitsContent({ permits }: { permits: PortalData["permits"] }) {
  if (permits.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-12 dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No permits assigned.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
      {permits.map((permit) => (
        <li key={permit.id} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {PERMIT_LABELS[permit.permit_type as PermitType] ?? permit.permit_type}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {permit.permit_number || "No permit number"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProjectInfoContent({ project }: { project: PortalData["project"] }) {
  const fields: { label: string; value: string | null }[] = [
    { label: "Status", value: project.status?.replace("_", " ") },
    { label: "Address", value: project.address },
    { label: "Start Date", value: project.start_date ? new Date(project.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null },
    { label: "Completion Date", value: project.completion_date ? new Date(project.completion_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null },
    { label: "Description", value: project.description },
    { label: "Acres Disturbed", value: project.acres_disturbed ? `${project.acres_disturbed} acres` : null },
    { label: "Soil Type", value: project.soil_type },
    { label: "Superintendent", value: project.superintendent_name },
    { label: "Superintendent Phone", value: project.superintendent_phone },
    { label: "Foreman", value: project.foreman_name },
    { label: "Foreman Phone", value: project.foreman_phone },
    { label: "Project Manager", value: project.pm_name },
    { label: "PM Phone", value: project.pm_phone },
  ];

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
      <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {fields.map((field) => (
          <div key={field.label} className="flex justify-between px-4 py-3">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {field.label}
            </dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-100 capitalize">
              {field.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
