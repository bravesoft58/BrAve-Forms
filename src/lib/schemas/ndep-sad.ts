import { z } from "zod";

// --- Sub-schemas ---

const addressBlockSchema = z.object({
  name: z.string().optional().default(""),
  street: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
});

const contactBlockSchema = addressBlockSchema.extend({
  title: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  fax: z.string().optional().default(""),
  email: z.string().optional().default(""),
});

// Application types from actual NDEP SAD form
export const NDEP_SAD_APPLICATION_TYPES = [
  "new_standalone",
  "revision_standalone",
  "renewal_standalone",
  "revision_within_class_ii",
] as const;

// BMP checkboxes from actual NDEP SAD Application PDF (verbatim)
export const NDEP_SAD_BMP_OPTIONS = [
  "Water trucks",
  "Graveling/paving of roadway storage areas and staging areas",
  "Dust palliatives",
  "Posting and limiting vehicle speeds",
  "Ceasing operations during high wind events",
  "Fencing or berming to prevent unauthorized access to disturbed areas",
  "Application of water sprays on material storage piles on a regular basis",
  "Covering material storage piles with tarpaulin or geo-textiles; tenting",
  "Use of overhead water spray racks or water hoses",
  "Track-out controls (graveled entrance, exit area, and street sweeping)",
  "Landscape preservation and impact avoidance",
  "Wind fence",
  "Pre-watering of areas to be disturbed (including all unpaved onsite roads and staging areas)",
  "Inform all subcontractors of their responsibilities for the control of fugitive dust",
  "Training of equipment operators to recognize fugitive dust generation",
  "Other",
] as const;

// Certification attachment checklist from actual form
export const NDEP_SAD_ATTACHMENT_ITEMS = [
  "General Company Information Form",
  "Surface Area Disturbance Form",
  "Vicinity Map of where the site is located in the State",
  "Area Map of the Surface Area Disturbance (including site boundary)",
  "Application Fee Attached or Electronically Submitted",
  "Digital Copy of Application on CD or USB Flash Drive",
  "Application Certification Document with Original Signature",
] as const;

// --- Main schema ---

export const ndepSadSchema = z.object({
  // Header fields from actual form
  facility_name: z.string().optional().default(""),
  existing_facility_id: z.string().optional().default(""),
  existing_aqop: z.string().optional().default(""),
  application_type: z.enum(NDEP_SAD_APPLICATION_TYPES).optional(),

  // Section 1: General Company Info (6 address blocks)
  company: addressBlockSchema,
  owner: addressBlockSchema,
  site_plant: addressBlockSchema,
  records_location: addressBlockSchema,
  responsible_official: contactBlockSchema,
  site_manager: contactBlockSchema,

  // Section 2: Location Details
  township: z.string().optional().default(""),
  range: z.string().optional().default(""),
  section: z.string().optional().default(""),
  utm_easting: z.string().optional().default(""),
  utm_northing: z.string().optional().default(""),
  hydrographic_basin: z.string().optional().default(""),
  county: z.string().optional().default(""),
  nearest_city: z.string().optional().default(""),
  driving_directions: z.string().optional().default(""),

  // Section 3: SAD Details
  project_name: z.string().optional().default(""),
  total_acres: z.string().optional().default(""),
  bmp_checkboxes: z.record(z.string(), z.boolean()).optional().default({}),
  water_truck_count: z.string().optional().default(""),
  water_truck_capacity: z.string().optional().default(""),

  // Section 4: Certification
  attachment_checklist: z.record(z.string(), z.boolean()).optional().default({}),
  signature: z.string().optional().default(""),
  signature_date: z.string().optional().default(""),
});

export type NdepSadData = z.infer<typeof ndepSadSchema>;
export type AddressBlock = z.infer<typeof addressBlockSchema>;
export type ContactBlock = z.infer<typeof contactBlockSchema>;

export const NDEP_SAD_APP_TYPE_LABELS: Record<string, string> = {
  new_standalone: "New — Standalone SAD",
  revision_standalone: "Revision — Standalone SAD",
  renewal_standalone: "Renewal — Standalone SAD",
  revision_within_class_ii: "Revision — Within Class II Air Quality Permit",
};

export function parseNdepSadForm(formData: FormData): unknown {
  const raw = formData.get("data") as string;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
