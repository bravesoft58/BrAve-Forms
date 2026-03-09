import { z } from "zod";

// --- Section 1: General Info + Inspection Details ---

const WEATHER_OPTIONS = [
  "Clear", "Cloudy", "Rain", "Sleet", "Fog", "Snowing", "High Winds", "Other",
] as const;

const INSPECTION_TYPES = ["regular", "post_storm", "other"] as const;
const RAIN_SOURCES = ["rain_gauge", "weather_station"] as const;
const YN = ["Y", "N"] as const;
const YN_NA = ["Y", "N", "NA"] as const;

// --- Section 2: Control Measures (16 items) ---

export const NDEP_CONTROL_MEASURES = [
  "Silt Fence",
  "Straw Wattles/Fiber Rolls",
  "Inlet Protection",
  "Stabilized Construction Entrance",
  "Concrete Washout",
  "Portable Sanitation",
  "Vehicle/Equipment Fueling",
  "Vehicle/Equipment Maintenance",
  "Stockpile Management",
  "Spill Prevention & Control",
  "Solid Waste Management",
  "Hazardous Waste Management",
  "Contaminated Soil Management",
  "Dewatering Operations",
  "Paving & Grinding Operations",
  "Illicit Connection/Discharge",
] as const;

// --- Section 3: Stabilization Items (4 items) ---

export const NDEP_STABILIZATION_ITEMS = [
  "Temporary Seeding",
  "Mulching",
  "Geotextiles & Mats",
  "Permanent Seeding/Planting",
] as const;

// --- Sub-schemas ---

const controlMeasureSchema = z.object({
  name: z.string(),
  implemented: z.enum(YN_NA),
  maintenance_needed: z.enum(YN),
  notes: z.string().optional().default(""),
});

const stabilizationItemSchema = z.object({
  name: z.string(),
  implemented: z.enum(YN_NA),
  maintenance_needed: z.enum(YN),
  notes: z.string().optional().default(""),
});

const correctiveActionSchema = z.object({
  description: z.string().min(1, "Description required"),
  date_to_complete: z.string().min(1, "Date required"),
  completed: z.enum(YN),
});

// --- Main schema ---

export const ndepStormwaterSchema = z.object({
  // Section 1: General Info (auto-filled, but stored)
  project_site_name: z.string().optional().default(""),
  csw_number: z.string().optional().default(""),
  location: z.string().optional().default(""),

  // Section 1: Inspection Details
  inspection_date: z.string().min(1, "Date is required"),
  inspection_time: z.string().min(1, "Time is required"),
  inspector_name: z.string().min(1, "Inspector name is required"),
  inspection_type: z.enum(INSPECTION_TYPES),
  inspection_type_other: z.string().optional().default(""),

  // Storm Event Data
  storm_event_025: z.enum(YN),
  rain_source: z.enum(RAIN_SOURCES).optional(),
  total_rainfall: z.string().optional().default(""),
  storm_start: z.string().optional().default(""),
  storm_duration: z.string().optional().default(""),
  snowmelt_discharge: z.enum(YN),

  // Site Conditions
  weather: z.enum(WEATHER_OPTIONS),
  temperature: z.string().optional().default(""),
  discharge_from_site: z.enum(YN),
  discharge_description: z.string().optional().default(""),
  erosion_evidence: z.enum(YN),
  erosion_description: z.string().optional().default(""),
  previous_corrective_complete: z.enum(YN),
  previous_corrective_description: z.string().optional().default(""),

  // Section 2: SWPPP Elements
  swppp_available: z.enum(YN),
  swppp_current: z.enum(YN),
  site_map_accurate: z.enum(YN),

  // Section 2: Control Measures (16 items)
  control_measures: z.array(controlMeasureSchema),

  // Section 3: Stabilization Items (4 items)
  stabilization_items: z.array(stabilizationItemSchema),

  // Section 3: Corrective Actions (dynamic rows)
  corrective_actions: z.array(correctiveActionSchema).optional().default([]),

  // Section 3: Certification
  inspector_signature: z.string().min(1, "Signature is required"),
  signature_date: z.string().min(1, "Date is required"),
});

export type NdepStormwaterData = z.infer<typeof ndepStormwaterSchema>;
export type ControlMeasureItem = z.infer<typeof controlMeasureSchema>;
export type StabilizationItem = z.infer<typeof stabilizationItemSchema>;
export type CorrectiveActionRow = z.infer<typeof correctiveActionSchema>;

export const WEATHER_OPTIONS_LIST = WEATHER_OPTIONS;
export const INSPECTION_TYPES_LIST = INSPECTION_TYPES;

export function parseNdepStormwaterForm(formData: FormData): unknown {
  const raw = formData.get("data") as string;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
