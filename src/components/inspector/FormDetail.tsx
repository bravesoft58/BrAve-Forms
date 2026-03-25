"use client";

import { NDEP_CONTROL_MEASURES } from "@/lib/schemas/ndep-stormwater";
import { NDOT_BMP_CATEGORIES } from "@/lib/schemas/ndot-stormwater";
import { NDEP_SAD_BMP_OPTIONS, NDEP_SAD_ATTACHMENT_ITEMS } from "@/lib/schemas/ndep-sad";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>;

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const valueClass = "mt-0.5 text-sm text-zinc-900 dark:text-zinc-100";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <h4 className="mb-3 text-sm font-semibold text-[#233B5C] dark:text-zinc-200">
        {title}
      </h4>
      {children}
    </div>
  );
}

function YNBadge({ value }: { value?: string }) {
  if (value === "Y") return <span className="font-medium text-green-700 dark:text-green-400">Y</span>;
  if (value === "N") return <span className="font-medium text-red-700 dark:text-red-400">N</span>;
  return <span className="text-zinc-400">—</span>;
}

// --- Dust Log (array of entries) ---
function DustLogDetail({ data }: { data: unknown[] }) {
  interface DustEntry {
    date?: string;
    time?: string;
    visible_dust?: string;
    project_soils?: string;
    access_roads?: string;
    trackout?: string;
    corrective_actions?: string;
  }
  const entries = data as DustEntry[];
  if (entries.length === 0) return <p className="text-sm text-zinc-500">No entries recorded.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
        <thead>
          <tr>
            {["Date", "Time", "Visible Dust", "Project Soils", "Access Roads", "Trackout", "Corrective Actions"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {entries.map((entry, idx) => (
            <tr key={idx}>
              <td className="whitespace-nowrap px-3 py-2">{entry.date || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{entry.time || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{entry.visible_dust || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{entry.project_soils || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{entry.access_roads || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{entry.trackout || "—"}</td>
              <td className="px-3 py-2">{entry.corrective_actions || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- NDEP Weekly Stormwater ---
function NdepStormwaterDetail({ data }: { data: FormData }) {
  const controlMeasures: FormData[] = data.control_measures || [];
  const stabilization: FormData[] = data.stabilization || [];
  const corrective: FormData[] = data.corrective_actions || [];

  return (
    <div className="space-y-4">
      <Section title="General Information">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Inspector" value={data.inspector_name} />
          <Field label="Inspection Date" value={data.inspection_date} />
          <Field label="Inspection Type" value={data.inspection_type?.replace("_", " ")} />
          <Field label="Weather" value={data.weather_conditions} />
          <Field label="Rainfall Amount" value={data.rainfall_amount ? `${data.rainfall_amount}"` : "None"} />
          <Field label="Rain Source" value={data.rain_source?.replace("_", " ")} />
          <Field label="Time Since Last Rain" value={data.time_since_last_rain} />
        </div>
      </Section>

      <Section title="Discharge Points">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><p className={labelClass}>Discharge Present?</p><YNBadge value={data.discharge_present} /></div>
          <Field label="Discharge Location" value={data.discharge_location} />
          <div><p className={labelClass}>Turbidity Tested?</p><YNBadge value={data.turbidity_tested} /></div>
          <Field label="Turbidity Value" value={data.turbidity_value ? `${data.turbidity_value} NTU` : undefined} />
        </div>
      </Section>

      {controlMeasures.length > 0 && (
        <Section title="Control Measures">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Measure</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Installed</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Maintained</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {controlMeasures.map((cm, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{NDEP_CONTROL_MEASURES[idx] ?? cm.name ?? `Measure ${idx + 1}`}</td>
                    <td className="px-3 py-2"><YNBadge value={cm.installed} /></td>
                    <td className="px-3 py-2"><YNBadge value={cm.maintained} /></td>
                    <td className="px-3 py-2">{cm.comments || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {stabilization.length > 0 && (
        <Section title="Stabilization">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Required</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Implemented</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stabilization.map((s, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{s.name ?? `Item ${idx + 1}`}</td>
                    <td className="px-3 py-2"><YNBadge value={s.required} /></td>
                    <td className="px-3 py-2"><YNBadge value={s.implemented} /></td>
                    <td className="px-3 py-2">{s.comments || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {corrective.length > 0 && (
        <Section title="Corrective Actions">
          {corrective.map((ca, idx) => (
            <div key={idx} className="mb-2 rounded border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Field label="Description" value={ca.description} />
                <Field label="Date Identified" value={ca.date_identified} />
                <Field label="Date Corrected" value={ca.date_corrected} />
                <Field label="Corrected By" value={ca.corrected_by} />
              </div>
            </div>
          ))}
        </Section>
      )}

      <Section title="Signatures">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inspector Signature" value={data.inspector_signature_name} />
          <Field label="Date" value={data.inspector_signature_date} />
        </div>
      </Section>

      {data.notes && (
        <Section title="Notes">
          <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">{data.notes}</p>
        </Section>
      )}
    </div>
  );
}

// --- NDOT Weekly Stormwater ---
function NdotStormwaterDetail({ data }: { data: FormData }) {
  const bmps: FormData[] = data.bmp_categories || [];
  const photos: FormData[] = data.photos || [];

  return (
    <div className="space-y-4">
      <Section title="Site Information">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Report No." value={data.report_no} />
          <Field label="Project Location" value={data.project_location} />
          <Field label="Contract Number" value={data.contract_number} />
          <Field label="NDOT Inspector" value={data.ndot_inspector} />
          <Field label="Crew Number" value={data.crew_number} />
          <Field label="Resident Engineer" value={data.resident_engineer} />
          <Field label="WPCM" value={data.wpcm} />
          <Field label="Inspection Date" value={data.inspection_date} />
          <Field label="Previous Inspection" value={data.previous_inspection_date} />
        </div>
      </Section>

      <Section title="Conditions">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Weather" value={data.weather_conditions} />
          <Field label="Temperature" value={data.temperature_range} />
          <Field label="Rainfall Intensity" value={data.rainfall_intensity} />
          <Field label="Rainfall Amount" value={data.rainfall_amount ? `${data.rainfall_amount}"` : "None"} />
          <div><p className={labelClass}>Discharge Present?</p><YNBadge value={data.discharge_present} /></div>
          <Field label="Discharge Location" value={data.discharge_description} />
        </div>
      </Section>

      {bmps.length > 0 && (
        <Section title="BMP Categories">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Required</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Implemented</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bmps.map((bmp, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{NDOT_BMP_CATEGORIES[idx] ?? bmp.name ?? `BMP ${idx + 1}`}</td>
                    <td className="px-3 py-2"><YNBadge value={bmp.required} /></td>
                    <td className="px-3 py-2"><YNBadge value={bmp.implemented} /></td>
                    <td className="px-3 py-2">{bmp.comments || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Deficiency Follow-up">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Previous Deficiencies Corrected" value={data.deficiency_followup?.replace("_", " ")} />
          <Field label="Comments" value={data.deficiency_comments} />
        </div>
      </Section>

      {photos.length > 0 && (
        <Section title="Photos">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`} className="h-40 w-full object-cover" />
                {photo.caption && (
                  <p className="p-2 text-xs text-zinc-600 dark:text-zinc-400">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Signatures">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Inspector" value={data.inspector_name} />
          <Field label="Inspector Date" value={data.inspector_date} />
          <Field label="WPCM Reviewer" value={data.wpcm_name} />
          <Field label="WPCM Date" value={data.wpcm_date} />
        </div>
      </Section>
    </div>
  );
}

// --- NDEP SAD Application ---
function NdepSadDetail({ data }: { data: FormData }) {
  const bmps: string[] = data.bmp_measures || [];
  const attachments: FormData[] = data.attachments || [];

  return (
    <div className="space-y-4">
      <Section title="Application Info">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Application Type" value={data.application_type?.replace(/_/g, " ")} />
          <Field label="Existing Permit #" value={data.existing_permit_number} />
          <Field label="Total Acres" value={data.total_acres ? `${data.total_acres} ac` : undefined} />
        </div>
      </Section>

      {["applicant", "property_owner", "contractor", "engineer", "agent", "emergency_contact"].map((role) => {
        const block = data[role] || data[`${role}_name`];
        if (!block) return null;
        if (typeof block === "string") {
          return (
            <Section key={role} title={role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}>
              <Field label="Name" value={block} />
            </Section>
          );
        }
        return (
          <Section key={role} title={role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Name" value={block.name} />
              <Field label="Title" value={block.title} />
              <Field label="Street" value={block.street} />
              <Field label="City" value={block.city} />
              <Field label="State" value={block.state} />
              <Field label="ZIP" value={block.zip} />
              <Field label="Phone" value={block.phone} />
              <Field label="Fax" value={block.fax} />
              <Field label="Email" value={block.email} />
            </div>
          </Section>
        );
      })}

      <Section title="Location Details">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="County" value={data.county} />
          <Field label="Project Description" value={data.project_description} />
          <Field label="Nearest City" value={data.nearest_city} />
          <Field label="NHD Watershed" value={data.nhd_watershed} />
          <Field label="Receiving Water" value={data.receiving_water} />
          <Field label="Section" value={data.section} />
          <Field label="Township" value={data.township} />
          <Field label="Range" value={data.range} />
          <Field label="Latitude" value={data.latitude} />
          <Field label="Longitude" value={data.longitude} />
        </div>
      </Section>

      {bmps.length > 0 && (
        <Section title="Best Management Practices">
          <ul className="space-y-1">
            {bmps.map((bmp, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
                <span className="text-green-600">✓</span>
                {NDEP_SAD_BMP_OPTIONS[idx] ?? bmp}
              </li>
            ))}
          </ul>
          {data.bmp_other && <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Other: {data.bmp_other}</p>}
        </Section>
      )}

      {attachments.length > 0 && (
        <Section title="Attachments Checklist">
          <ul className="space-y-1">
            {attachments.map((att, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className={att.checked ? "text-green-600" : "text-zinc-300"}>
                  {att.checked ? "✓" : "○"}
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {NDEP_SAD_ATTACHMENT_ITEMS[idx] ?? att.label ?? `Item ${idx + 1}`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Certification">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signature" value={data.signature_name} />
          <Field label="Date" value={data.signature_date || data.form_date} />
        </div>
      </Section>
    </div>
  );
}

// --- NNPH Dust Control Permit ---
function NnphDustPermitDetail({ data }: { data: FormData }) {
  const methods: FormData[] = data.dust_control_methods || [];

  return (
    <div className="space-y-4">
      <Section title="Application Info">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Application Type" value={data.application_type} />
          <Field label="Permit Number" value={data.permit_number} />
          <Field label="Project Name" value={data.project_name} />
          <Field label="Project Location" value={data.project_location} />
          <Field label="APN" value={data.apn} />
        </div>
      </Section>

      <Section title="Project Details">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Total Acres" value={data.total_acres ? `${data.total_acres} ac` : undefined} />
          <Field label="Disturbed Acres" value={data.disturbed_acres ? `${data.disturbed_acres} ac` : undefined} />
          <Field label="Start Date" value={data.start_date} />
          <Field label="End Date" value={data.end_date} />
          <Field label="Project Type" value={Array.isArray(data.project_types) ? data.project_types.join(", ") : data.project_type} />
          <Field label="Description" value={data.project_description} />
        </div>
      </Section>

      {["applicant", "property_owner", "contractor"].map((role) => {
        const contact = data[role];
        if (!contact || typeof contact !== "object") return null;
        return (
          <Section key={role} title={role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Name" value={contact.name} />
              <Field label="Company" value={contact.company} />
              <Field label="Address" value={contact.address} />
              <Field label="City" value={contact.city} />
              <Field label="State" value={contact.state} />
              <Field label="ZIP" value={contact.zip} />
              <Field label="Phone" value={contact.phone} />
              <Field label="Email" value={contact.email} />
            </div>
          </Section>
        );
      })}

      {data.emergency_contact && (
        <Section title="Emergency Contact">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={data.emergency_contact.name} />
            <Field label="Phone" value={data.emergency_contact.phone} />
          </div>
        </Section>
      )}

      {methods.length > 0 && (
        <Section title="Dust Control Methods">
          <ul className="space-y-1">
            {methods.map((m, idx) => (
              <li key={idx} className="text-sm text-zinc-900 dark:text-zinc-100">
                <span className={m.enabled ? "text-green-600" : "text-zinc-300"}>
                  {m.enabled ? "✓" : "○"}
                </span>
                <span className="ml-2">{m.method}</span>
                {m.enabled && m.details && (
                  <span className="ml-2 text-zinc-500">— {m.details}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Certification">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signature" value={data.signature_name} />
          <Field label="Date" value={data.signature_date || data.form_date} />
        </div>
      </Section>
    </div>
  );
}

// --- Main dispatcher ---
export default function InspectorFormDetail({
  formType,
  data,
}: {
  formType: string;
  data: Record<string, unknown> | unknown[];
}) {
  if (Array.isArray(data)) {
    return <DustLogDetail data={data} />;
  }

  switch (formType) {
    case "ndep_weekly_stormwater":
      return <NdepStormwaterDetail data={data as FormData} />;
    case "ndot_weekly_stormwater":
      return <NdotStormwaterDetail data={data as FormData} />;
    case "ndep_sad_application":
      return <NdepSadDetail data={data as FormData} />;
    case "nnph_dust_permit":
      return <NnphDustPermitDetail data={data as FormData} />;
    default:
      // Fallback: render as key-value pairs
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(data).map(([key, value]) => (
            <Field
              key={key}
              label={key.replace(/_/g, " ")}
              value={typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}
            />
          ))}
        </div>
      );
  }
}
