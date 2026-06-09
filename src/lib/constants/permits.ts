// Permit types — match projects_permits.permit_type CHECK constraint
export const PERMIT_TYPES = [
  "surface_area_disturbance",
  "dust_control",
  "stormwater_ndot",
  "stormwater_ndep",
  "waterway",
  "other",
] as const;
export type PermitType = (typeof PERMIT_TYPES)[number];

// Form types — match project_form_requirements.form_type CHECK constraint
export const FORM_TYPES = [
  "daily_dust_log",
  "ndep_weekly_stormwater",
  "ndot_weekly_stormwater",
  "ndep_sad_application",
  "nnph_dust_permit",
] as const;
export type FormType = (typeof FORM_TYPES)[number];

// Human-readable labels
export const PERMIT_LABELS: Record<PermitType, string> = {
  surface_area_disturbance: "Surface Area Disturbance (SAD) — NDEP",
  dust_control: "Dust Control — NNPH",
  stormwater_ndot: "Stormwater — NDOT",
  stormwater_ndep: "Stormwater — NDEP",
  waterway: "Waterway — NDEP",
  other: "Other",
};

export const FORM_LABELS: Record<FormType, string> = {
  daily_dust_log: "Daily Dust Log",
  ndep_weekly_stormwater: "NDEP Weekly Stormwater",
  ndot_weekly_stormwater: "NDOT Weekly Stormwater",
  ndep_sad_application: "NDEP SAD Application",
  nnph_dust_permit: "NNPH Dust Permit",
};

// Business logic: which permits trigger which forms
export const PERMIT_FORM_MAP: Record<PermitType, FormType[]> = {
  surface_area_disturbance: ["daily_dust_log", "ndep_sad_application"],
  dust_control: ["daily_dust_log", "nnph_dust_permit"],
  stormwater_ndot: ["ndot_weekly_stormwater"],
  stormwater_ndep: ["ndep_weekly_stormwater"],
  waterway: [],
  other: [],
};
