"use client";

import { NDEP_CONTROL_MEASURES, NDEP_STABILIZATION_ITEMS } from "@/lib/schemas/ndep-stormwater";
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

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={checked ? "text-green-600 dark:text-green-400" : "text-zinc-300 dark:text-zinc-600"}>
        {checked ? "\u2713" : "\u2717"}
      </span>
      <span className={checked ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
        {label}
      </span>
    </div>
  );
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
  const stabilizationItems: FormData[] = data.stabilization_items || [];
  const corrective: FormData[] = data.corrective_actions || [];

  return (
    <div className="space-y-4">
      <Section title="General Information">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Inspector" value={data.inspector_name} />
          <Field label="Inspection Date" value={data.inspection_date} />
          <Field label="Inspection Type" value={data.inspection_type?.replace("_", " ")} />
          <Field label="Weather" value={data.weather} />
          <Field label="Temperature" value={data.temperature} />
          <div><p className={labelClass}>Storm Event ≥ 0.25″</p><YNBadge value={data.storm_event_025} /></div>
        </div>
        {data.storm_event_025 === "Y" && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Rain Source" value={data.rain_source?.replace("_", " ")} />
            <Field label="Total Rainfall" value={data.total_rainfall} />
            <Field label="Storm Start" value={data.storm_start} />
            <Field label="Storm Duration" value={data.storm_duration} />
          </div>
        )}
      </Section>

      <Section title="Site Conditions">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div><p className={labelClass}>Discharge from Site?</p><YNBadge value={data.discharge_from_site} /></div>
          {data.discharge_from_site === "Y" && (
            <Field label="Discharge Description" value={data.discharge_description} />
          )}
          <div><p className={labelClass}>Erosion Evidence?</p><YNBadge value={data.erosion_evidence} /></div>
          {data.erosion_evidence === "Y" && (
            <Field label="Erosion Description" value={data.erosion_description} />
          )}
          <div><p className={labelClass}>Previous Corrective Complete?</p><YNBadge value={data.previous_corrective_complete} /></div>
          <div><p className={labelClass}>Snowmelt Discharge?</p><YNBadge value={data.snowmelt_discharge} /></div>
        </div>
      </Section>

      <Section title="SWPPP Elements">
        <div className="grid grid-cols-3 gap-3">
          <div><p className={labelClass}>SWPPP Available?</p><YNBadge value={data.swppp_available} /></div>
          <div><p className={labelClass}>SWPPP Current?</p><YNBadge value={data.swppp_current} /></div>
          <div><p className={labelClass}>Site Map Accurate?</p><YNBadge value={data.site_map_accurate} /></div>
        </div>
      </Section>

      {controlMeasures.length > 0 && (
        <Section title="Control Measures">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Measure</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Implemented</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Maint. Needed</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {controlMeasures.map((cm, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{NDEP_CONTROL_MEASURES[idx] ?? cm.name ?? `Measure ${idx + 1}`}</td>
                    <td className="px-3 py-2"><YNBadge value={cm.implemented} /></td>
                    <td className="px-3 py-2"><YNBadge value={cm.maintenance_needed} /></td>
                    <td className="px-3 py-2">{cm.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {stabilizationItems.length > 0 && (
        <Section title="Stabilization">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Implemented</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Maint. Needed</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-zinc-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stabilizationItems.map((s, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{NDEP_STABILIZATION_ITEMS[idx] ?? s.name ?? `Item ${idx + 1}`}</td>
                    <td className="px-3 py-2"><YNBadge value={s.implemented} /></td>
                    <td className="px-3 py-2"><YNBadge value={s.maintenance_needed} /></td>
                    <td className="px-3 py-2">{s.notes || "—"}</td>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field label="Description" value={ca.description} />
                <Field label="Date to Complete" value={ca.date_to_complete} />
                <div><p className={labelClass}>Completed?</p><YNBadge value={ca.completed} /></div>
              </div>
            </div>
          ))}
        </Section>
      )}

      <Section title="Certification">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inspector Signature" value={data.inspector_signature} />
          <Field label="Signature Date" value={data.signature_date} />
        </div>
      </Section>
    </div>
  );
}

// --- NDOT Weekly Stormwater ---
function NdotStormwaterDetail({ data }: { data: FormData }) {
  const bmps: FormData[] = data.bmp_categories || [];
  const photos: FormData[] = data.photos || [];

  const INTENSITY_LABELS: Record<string, string> = {
    none: "None", light: "Light", moderate: "Moderate", heavy: "Heavy",
  };
  const TEMP_LABELS: Record<string, string> = {
    "<32": "< 32°F", "32-50": "32–50°F", "51-75": "51–75°F", ">75": "> 75°F",
  };
  const DEFICIENCY_LABELS: Record<string, string> = {
    na: "N/A", yes: "Yes", no: "No",
  };

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

      <Section title="Weather & Conditions">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Weather" value={Array.isArray(data.weather) ? data.weather.join(", ") : data.weather} />
          <Field label="Precip Intensity" value={INTENSITY_LABELS[data.precip_intensity ?? ""] ?? "—"} />
          <Field label="Wind" value={INTENSITY_LABELS[data.wind ?? ""] ?? "—"} />
          <Field label="Temperature" value={TEMP_LABELS[data.temp_range ?? ""] ?? "—"} />
        </div>
        {!data.precip_na && data.precip_total && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Precip Total" value={data.precip_total} />
            <Field label="Precip Reference" value={[data.precip_reference_type, data.precip_reference_location].filter(Boolean).join(" — ")} />
          </div>
        )}
      </Section>

      <Section title="Site Assessment">
        <div className="grid grid-cols-2 gap-3">
          <div><p className={labelClass}>TMDL Waterway?</p><YNBadge value={data.tmdl_waterway} /></div>
          <div><p className={labelClass}>Erosion Evidence?</p><YNBadge value={data.erosion_evidence} /></div>
          <div><p className={labelClass}>Adjacent Runoff?</p><YNBadge value={data.adjacent_runoff} /></div>
          <div><p className={labelClass}>Pollutant Concerns?</p><YNBadge value={data.pollutant_concerns} /></div>
          <Field label="Deficiency Follow-up" value={DEFICIENCY_LABELS[data.deficiency_followup ?? ""] ?? "—"} />
          {data.deficiency_followup === "yes" && (
            <Field label="Deficiency Actions" value={data.deficiency_actions} />
          )}
        </div>
      </Section>

      <Section title="SWPPP Elements">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><p className={labelClass}>On-site?</p><YNBadge value={data.swppp_onsite} /></div>
          <div><p className={labelClass}>Signed?</p><YNBadge value={data.swppp_signed} /></div>
          <div><p className={labelClass}>Current?</p><YNBadge value={data.swppp_current} /></div>
          <div><p className={labelClass}>NOI Posted?</p><YNBadge value={data.swppp_posted} /></div>
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
  const addressBlocks: { label: string; key: string }[] = [
    { label: "Company", key: "company" },
    { label: "Owner / Operator", key: "owner" },
    { label: "Site / Plant Location", key: "site_plant" },
    { label: "Records Location", key: "records_location" },
    { label: "Responsible Official", key: "responsible_official" },
    { label: "Site Manager", key: "site_manager" },
  ];

  return (
    <div className="space-y-4">
      <Section title="Application Info">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Application Type" value={data.application_type?.replace(/_/g, " ")} />
          <Field label="Facility Name" value={data.facility_name} />
          <Field label="Existing Facility ID" value={data.existing_facility_id} />
          <Field label="Existing AQOP #" value={data.existing_aqop} />
        </div>
      </Section>

      <Section title="Company Information">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {addressBlocks.map(({ label, key }) => {
            const block = data[key];
            if (!block || typeof block !== "object") return null;
            return (
              <div key={key} className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#233B5C] dark:text-zinc-300">{label}</p>
                <p className={valueClass}>{block.name || "—"}</p>
                {block.street && <p className="text-sm text-zinc-600 dark:text-zinc-400">{block.street}</p>}
                {(block.city || block.state || block.zip) && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {[block.city, block.state].filter(Boolean).join(", ")} {block.zip}
                  </p>
                )}
                {(block.title || block.phone || block.fax || block.email) && (
                  <div className="mt-2 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {block.title && <p>Title: {block.title}</p>}
                    {block.phone && <p>Phone: {block.phone}</p>}
                    {block.fax && <p>Fax: {block.fax}</p>}
                    {block.email && <p>Email: {block.email}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Location Details">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Township" value={data.township} />
          <Field label="Range" value={data.range} />
          <Field label="Section" value={data.section} />
          <Field label="UTM Easting" value={data.utm_easting} />
          <Field label="UTM Northing" value={data.utm_northing} />
          <Field label="Hydrographic Basin" value={data.hydrographic_basin} />
          <Field label="County" value={data.county} />
          <Field label="Nearest City" value={data.nearest_city} />
        </div>
        {data.driving_directions && (
          <div className="mt-3">
            <Field label="Driving Directions" value={data.driving_directions} />
          </div>
        )}
      </Section>

      <Section title="SAD Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project Name" value={data.project_name} />
          <Field label="Total Acres" value={data.total_acres ? `${data.total_acres} ac` : undefined} />
        </div>
      </Section>

      <Section title="Best Management Practices">
        <div className="space-y-1">
          {NDEP_SAD_BMP_OPTIONS.map((opt) => (
            <CheckItem key={opt} label={opt} checked={data.bmp_checkboxes?.[opt] ?? false} />
          ))}
        </div>
      </Section>

      <Section title="Attachment Checklist">
        <div className="space-y-1">
          {NDEP_SAD_ATTACHMENT_ITEMS.map((item) => (
            <CheckItem key={item} label={item} checked={data.attachment_checklist?.[item] ?? false} />
          ))}
        </div>
      </Section>

      <Section title="Certification">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signature" value={data.signature} />
          <Field label="Signature Date" value={data.signature_date} />
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
          <Field label="APN" value={data.apn} />
          <Field label="Acres" value={data.acres} />
          <Field label="Start Date" value={data.start_date} />
          <Field label="End Date" value={data.end_date} />
        </div>
      </Section>

      <Section title="Project Details">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Project Type" value={data.project_type} />
          <Field label="Project Description" value={data.project_description} />
          <Field label="Fill Material Source" value={data.fill_material_source} />
          <Field label="Excavation Amount" value={data.excavation_amount} />
          <div><p className={labelClass}>Crushing Equipment?</p><YNBadge value={data.crushing_equipment} /></div>
          <Field label="Soil Type" value={data.soil_type} />
        </div>
      </Section>

      {["applicant", "contractor"].map((role) => {
        const contact = data[role];
        if (!contact || typeof contact !== "object") return null;
        return (
          <Section key={role} title={role.replace(/\b\w/g, (c: string) => c.toUpperCase())}>
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

      <Section title="Emergency Contacts">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={labelClass}>Emergency Contact 1</p>
            <p className={valueClass}>{data.emergency_contact_1?.name || "—"}</p>
            {data.emergency_contact_1?.phone && (
              <p className="text-xs text-zinc-500">{data.emergency_contact_1.phone}</p>
            )}
          </div>
          <div>
            <p className={labelClass}>Emergency Contact 2</p>
            <p className={valueClass}>{data.emergency_contact_2?.name || "—"}</p>
            {data.emergency_contact_2?.phone && (
              <p className="text-xs text-zinc-500">{data.emergency_contact_2.phone}</p>
            )}
          </div>
        </div>
      </Section>

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
          <Field label="Signature" value={data.signature} />
          <Field label="Signature Date" value={data.signature_date} />
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
