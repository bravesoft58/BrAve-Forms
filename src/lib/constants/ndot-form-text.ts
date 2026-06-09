// Official NDOT Form 018-001 WPCM (Rev. 1/04/2017) explanatory text.
//
// Verbatim from the official form (State of Nevada DOT, "Construction Site
// Stormwater Inspection Form For Water Pollution Control Managers"). Mirrored so
// the digital form "looks" similar to NDOT's — NDOT reviewers are picky about
// visual parity even when functionality is identical (Gracie Damele, BF-51).
//
// PRESENTATIONAL ONLY. These strings are display copy keyed by field/category;
// they do NOT change the submission JSON shape or any schema key. The BMP map is
// keyed by the canonical category `name` stored in `bmp_categories[].name`, so
// existing submissions render unchanged.

import { NDOT_BMP_CATEGORIES } from "@/lib/schemas/ndot-stormwater";

type BmpCategoryName = (typeof NDOT_BMP_CATEGORIES)[number];

// --- Form header instructions (official p.1) ---

export const NDOT_INSTRUCTIONS =
  `Conduct the inspection in the presence of the Department designated personnel and discuss your observations. Ask clarifying questions when needed. Provide a brief description of deficiencies in the appropriate "Comment Section." Utilize the "Additional Comments" section at the end of the document as necessary. Attach digital photographs of deficiencies or other noted issues of concern with the inspection form. Areas disturbed by construction activities that are not permanently stabilized and discharge into a receiving waterway or storm drain system shall have inspection priority. For projects that do not have a Resident Engineer, list the individual(s) responsible for construction administration.`;

// --- Canonical certification statement [40 CFR 122.22(d)] (official p.3) ---
// Single source of truth — entry form, read-only view, and PDF all render this
// exact string. Replaces three previously-divergent hand-typed variants.

export const NDOT_CERT_TEXT =
  `I certify under penalty of law, that this document and all attachments were prepared under my direction or supervision in accordance with a system designed to assure that qualified personnel properly gathered and evaluated the information submitted. Based on my inquiry of the person or persons who manage the system, or those persons directly responsible for gathering information, the information submitted is, to the best of my knowledge and belief, true, accurate, and complete. I am aware that there are significant penalties for submitting false information, including the possibility of fine and imprisonment for knowing violations. [40 CFR 122.22(d)]`;

// --- BMP sub-section prompts (official p.1-2) ---
// `displayName` overrides the on-screen/PDF heading WITHOUT changing the stored
// `name` key (only Track-Out differs from the official sub-section header).

export interface BmpPrompt {
  /** Override the visible heading; stored `name` is unaffected. */
  displayName?: string;
  /** "Are X required? If no, proceed to next sub-section." */
  required: string;
  /** "Are BMPs/X measures properly implemented?" */
  implemented: string;
}

export const NDOT_BMP_PROMPTS: Record<BmpCategoryName, BmpPrompt> = {
  "Sediment Control": {
    required: "Are sediment control measures required? If no, proceed to next sub-section.",
    implemented: "Are sediment control measures properly implemented?",
  },
  "Erosion Control": {
    required: "Are erosion control measures required? If no, proceed to next sub-section.",
    implemented: "Are erosion control measures properly implemented?",
  },
  "Track-Out": {
    displayName: "Track-Out Control",
    required: "Are track-out measures required? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Material Stockpiles": {
    required: "Are there material stockpiles? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Concrete Washout": {
    required: "Are concrete washout areas required? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Construction Material Storage": {
    required: "Are construction materials stored onsite? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Chemical Storage": {
    required:
      "Are chemicals, e.g. equipment fluids, paints, solvents, etc., stored onsite? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Fueling Areas": {
    required: "Is there a temporary fueling area onsite? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Construction Equipment": {
    // Only sub-section whose official wording reads "the next sub-section".
    required: "Is there evidence of equipment leaks and/or spills? If no, proceed to the next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Waste Material Storage": {
    required: "Are waste materials stored onsite? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
  "Sanitation Facilities": {
    required: "Are portable toilets staged onsite? If no, proceed to next sub-section.",
    implemented: "Are BMPs properly implemented?",
  },
};

// --- Section 1: Site Information field hints (official p.1) ---

export const NDOT_SITE_INFO_HINTS = {
  project_location: "Description from Contract Documents",
  csw_tracking: "Construction General Permit CSW/Tracking Number",
  precip_total: "Total identified from the precipitation event preceding this inspection",
} as const;

// --- Section 1: Conditional question prompts (official p.1) ---

export const NDOT_SECTION1_PROMPTS = {
  tmdl_waterway:
    "Is there a potential for construction stormwater runoff to discharge into an impaired or TMDL listed waterway? (See SWPPP)",
  tmdl_waterway_names: "If yes, which waterway(s):",
  deficiency_followup:
    "Were deficiencies identified during the previous inspection? If yes, describe the corrective action(s) implemented, or the steps taken in the non-compliance escalation process.",
  erosion_evidence:
    "Are there areas exhibiting significant erosion (rills, gullies, sheet erosion, etc.) as a result from construction activities?",
  erosion_discharge: "If yes, do any of these areas discharge into a waterway?",
  erosion_waterway: "If yes, which waterway(s) (if name is known)?",
  adjacent_runoff: "Is stormwater runoff being discharged onto the project area from adjacent areas?",
  pollutant_concerns:
    "Are there any noticeable pollutant-related concerns regarding stormwater discharging from and/or onto the project area? If yes, briefly explain.",
} as const;

// --- Section 1: SWPPP element prompts (official p.1) ---

export const NDOT_SWPPP_PROMPTS = {
  swppp_onsite: "Is the SWPPP onsite & available?",
  swppp_signed: "Is the SWPPP signed and certified?",
  swppp_current: "Is the SWPPP complete and up-to-date?",
  swppp_posted: "Is the Construction General Permit information properly posted at the construction site?",
} as const;

// --- Section 3: Batch plants / Illicit discharge / Final check prompts (official p.3) ---

export const NDOT_SECTION3_PROMPTS = {
  batch_plant_present:
    "Are there temporary batch plants associated with the project? If no, proceed to next sub-section.",
  batch_plant_location: "Location of temporary batch plants?",
  illicit_discharges: "Are there any illicit discharges? If yes, briefly describe the discharge in question.",
  reportable_spills:
    "Are there any spills meeting the reportable quantity threshold for the current inspection period? If yes, briefly describe the spill in question.",
  spill_action: "Was appropriate action taken to address the illicit discharge or spill?",
  ndep_report_filed: "Was a spill report filed with NDEP?",
  non_reportable_spills:
    "Was a non-reportable spill report completed during the inspection period? If yes, briefly describe the spill and actions taken.",
  all_areas_inspected:
    "Were all non-stabilized and construction staging areas inspected? If no, provide a brief explanation.",
  non_structural_bmps:
    "Have non-structural BMPs been implemented during the inspection period (i.e. Sweeping, drip pan, equipment diapers, etc.)? If yes, briefly describe.",
} as const;
