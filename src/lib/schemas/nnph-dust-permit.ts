import { z } from "zod";

const YN = ["Y", "N"] as const;
const APPLICATION_TYPES = ["new", "renewal", "modification"] as const;

// --- Project Type Options (7) ---

export const NNPH_PROJECT_TYPES = [
  "Commercial",
  "Road Rehab",
  "Municipal",
  "Single Family",
  "Utilities",
  "New Road",
  "Residential",
] as const;

// --- Dust Control Methods (7) ---

export const NNPH_DUST_CONTROL_METHODS = [
  "Watering",
  "Chemical Stabilization",
  "Gravel/Aggregate Surfacing",
  "Paving",
  "Wind Barriers/Fencing",
  "Covering (Tarps/Mulch)",
  "Other",
] as const;

// --- Sub-schemas ---

const contactInfoSchema = z.object({
  name: z.string().optional().default(""),
  company: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
});

const emergencyContactSchema = z.object({
  name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

const dustControlMethodSchema = z.object({
  method: z.string(),
  enabled: z.boolean().default(false),
  details: z.string().optional().default(""),
});

// --- Main schema ---

export const nnphDustPermitSchema = z.object({
  // Application Info
  application_type: z.enum(APPLICATION_TYPES),
  permit_number: z.string().optional().default(""),
  project_name: z.string().optional().default(""),
  apn: z.string().optional().default(""),
  acres: z.string().optional().default(""),
  start_date: z.string().optional().default(""),
  end_date: z.string().optional().default(""),

  // Contacts
  applicant: contactInfoSchema,
  contractor: contactInfoSchema,
  emergency_contact_1: emergencyContactSchema,
  emergency_contact_2: emergencyContactSchema,

  // Project Details
  project_description: z.string().optional().default(""),
  project_type: z.string().optional().default(""),
  fill_material_source: z.string().optional().default(""),
  excavation_amount: z.string().optional().default(""),
  crushing_equipment: z.enum(YN).optional(),
  stationary_source_permit: z.string().optional().default(""),
  soil_type: z.string().optional().default(""),
  soil_analysis_available: z.enum(YN).optional(),

  // Dust Control Methods (7)
  dust_control_methods: z.array(dustControlMethodSchema).optional().default([]),

  // Additional
  temporary_irrigation: z.enum(YN).optional(),
  irrigation_details: z.string().optional().default(""),
  speed_limit: z.string().optional().default(""),
  trackout_control: z.string().optional().default(""),
  unauthorized_traffic_prevention: z.string().optional().default(""),

  // Signature
  signature: z.string().optional().default(""),
  signature_date: z.string().optional().default(""),
});

export type NnphDustPermitData = z.infer<typeof nnphDustPermitSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type DustControlMethod = z.infer<typeof dustControlMethodSchema>;

export const APPLICATION_TYPES_LIST = APPLICATION_TYPES;
export const PROJECT_TYPES_LIST = NNPH_PROJECT_TYPES;
export const DUST_CONTROL_METHODS_LIST = NNPH_DUST_CONTROL_METHODS;

export function parseNnphDustPermitForm(formData: FormData): unknown {
  const raw = formData.get("data") as string;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
