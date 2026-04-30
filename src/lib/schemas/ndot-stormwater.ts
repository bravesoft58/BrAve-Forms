import { z } from "zod";

const YN = ["Y", "N"] as const;

// --- Weather & Conditions ---

const WEATHER_OPTIONS = ["CLEAR", "P.CLOUDY", "OVERCAST", "RAIN"] as const;
const INTENSITY_OPTIONS = ["none", "light", "moderate", "heavy"] as const;
const TEMP_RANGES = ["<32", "32-50", "51-75", ">75"] as const;
const DEFICIENCY_FOLLOWUP = ["na", "yes", "no"] as const;

// --- BMP Categories (11 total) ---

export const NDOT_BMP_CATEGORIES = [
  "Sediment Control",
  "Erosion Control",
  "Track-Out",
  "Material Stockpiles",
  "Concrete Washout",
  "Construction Material Storage",
  "Chemical Storage",
  "Fueling Areas",
  "Construction Equipment",
  "Waste Material Storage",
  "Sanitation Facilities",
] as const;

// --- Sub-schemas ---

const bmpCategorySchema = z.object({
  name: z.string(),
  required: z.enum(YN),
  implemented: z.enum(YN),
  comments: z.string().optional().default(""),
});

// `url` is deprecated as of BF-32 (storage privatized). Renderers reconstruct
// the storage path from `${storagePath}/${file_name}` and sign at display
// time. Kept optional so legacy submissions written before BF-32 still parse.
const photoSchema = z.object({
  url: z.string().optional(),
  caption: z.string().optional().default(""),
  file_name: z.string(),
  uploaded_at: z.string(),
});

// --- Main schema ---

export const ndotStormwaterSchema = z.object({
  // Section 1: Site Information
  report_no: z.string().optional().default(""),
  project_location: z.string().optional().default(""),
  contract_number: z.string().optional().default(""),
  csw_tracking: z.string().optional().default(""),
  csw_na: z.boolean().optional().default(false),
  ndot_inspector: z.string().optional().default(""),
  crew_number: z.string().optional().default(""),
  resident_engineer: z.string().optional().default(""),
  wpcm: z.string().optional().default(""),
  inspection_date: z.string().min(1, "Inspection date is required"),
  previous_inspection_date: z.string().optional().default(""),

  // Conditions
  weather: z.array(z.enum(WEATHER_OPTIONS)).optional().default([]),
  precip_intensity: z.enum(INTENSITY_OPTIONS).optional(),
  precip_reference_type: z.string().optional().default(""),
  precip_reference_location: z.string().optional().default(""),
  precip_total: z.string().optional().default(""),
  precip_na: z.boolean().optional().default(false),
  wind: z.enum(INTENSITY_OPTIONS).optional(),
  temp_range: z.enum(TEMP_RANGES).optional(),

  // Conditional Questions
  tmdl_waterway: z.enum(YN).optional(),
  tmdl_waterway_names: z.string().optional().default(""),
  deficiency_followup: z.enum(DEFICIENCY_FOLLOWUP).optional(),
  deficiency_actions: z.string().optional().default(""),
  erosion_evidence: z.enum(YN).optional(),
  erosion_discharge: z.enum(YN).optional(),
  erosion_waterway: z.string().optional().default(""),
  adjacent_runoff: z.enum(YN).optional(),
  pollutant_concerns: z.enum(YN).optional(),
  pollutant_explain: z.string().optional().default(""),

  // SWPPP Elements (4 items)
  swppp_onsite: z.enum(YN).optional(),
  swppp_signed: z.enum(YN).optional(),
  swppp_current: z.enum(YN).optional(),
  swppp_posted: z.enum(YN).optional(),

  // BMP Categories (11 total)
  bmp_categories: z.array(bmpCategorySchema),

  // Section 3: Batch Plants
  batch_plant_present: z.enum(YN).optional(),
  batch_plant_location: z.enum(["onsite", "offsite"]).optional(),
  batch_plant_bmps: z.string().optional().default(""),
  batch_plant_comments: z.string().optional().default(""),

  // Illicit Discharge / Spill Response
  illicit_discharges: z.enum(YN).optional(),
  reportable_spills: z.enum(YN).optional(),
  spill_action: z.string().optional().default(""),
  ndep_report_filed: z.enum(YN).optional(),
  non_reportable_spills: z.enum(YN).optional(),

  // Additional
  non_structural_bmps: z.string().optional().default(""),
  all_areas_inspected: z.enum(YN).optional(),
  additional_comments: z.string().optional().default(""),

  // Photos
  photos: z.array(photoSchema).optional().default([]),

  // Dual Signatures
  inspector_name: z.string().min(1, "Inspector name is required"),
  inspector_date: z.string().min(1, "Inspector date is required"),
  wpcm_name: z.string().optional().default(""),
  wpcm_date: z.string().optional().default(""),
});

export type NdotStormwaterData = z.infer<typeof ndotStormwaterSchema>;
export type BmpCategory = z.infer<typeof bmpCategorySchema>;
export type FormPhoto = z.infer<typeof photoSchema>;

export const WEATHER_OPTIONS_LIST = WEATHER_OPTIONS;
export const INTENSITY_OPTIONS_LIST = INTENSITY_OPTIONS;
export const TEMP_RANGES_LIST = TEMP_RANGES;

export function parseNdotStormwaterForm(formData: FormData): unknown {
  const raw = formData.get("data") as string;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
