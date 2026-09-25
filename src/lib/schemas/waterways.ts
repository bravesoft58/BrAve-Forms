import { z } from "zod";
import { photoSchema } from "@/lib/schemas/form-photo";

// --- Project setup: the project's fixed list of waterway sites ---

export const MAX_WATERWAY_SITES = 20;

export const waterwaySiteSchema = z.object({
  name: z.string().trim().min(1, "Site name is required").max(100, "Site name is too long"),
  descriptor: z.string().trim().max(200, "Descriptor is too long").default(""),
});

export const waterwaySitesSchema = z
  .array(waterwaySiteSchema)
  .max(MAX_WATERWAY_SITES, `At most ${MAX_WATERWAY_SITES} sites`)
  .refine(
    (sites) => new Set(sites.map((s) => s.name.toLowerCase())).size === sites.length,
    "Each site name must be different",
  );

export type WaterwaySite = z.infer<typeof waterwaySiteSchema>;

// --- The daily inspection form ---

// Gracie, 2026-09-24: the paper form's "Photo taken?" row is dropped because
// photos are attached directly; at least one photo is required instead.
export const WATERWAY_CHECKS = [
  { key: "water_in_waterway", label: "Is there water in the waterway?", options: ["Yes", "No"] },
  { key: "vehicle_inspection", label: "Daily vehicle inspection", options: ["Pass", "Fail"] },
  { key: "bmp_inspection", label: "BMPs visual inspection", options: ["Pass", "Fail"] },
  { key: "sheen_or_plume", label: "Visible sheen or plume?", options: ["Yes", "No", "N/A"] },
] as const;

export type WaterwayCheckKey = (typeof WATERWAY_CHECKS)[number]["key"];

function checkItem<T extends readonly [string, ...string[]]>(options: T) {
  return z.object({
    // No default answer: an untouched row fails instead of recording a guess.
    value: z.enum(options, { errorMap: () => ({ message: "Select an answer" }) }),
    comment: z.string().trim().max(1000, "Comment is too long").default(""),
  });
}

export const waterwaysSchema = z.object({
  // Snapshot of the project's site at submit time, so later edits to the
  // project's list never rewrite a past record.
  site_name: z.string().trim().min(1, "Select a site"),
  site_descriptor: z.string().trim().default(""),

  inspection_date: z.string().date("Date is required"),
  inspection_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time is required"),
  initials: z.string().trim().min(1, "Initials are required").max(10, "Initials are too long"),

  water_in_waterway: checkItem(WATERWAY_CHECKS[0].options),
  vehicle_inspection: checkItem(WATERWAY_CHECKS[1].options),
  bmp_inspection: checkItem(WATERWAY_CHECKS[2].options),
  sheen_or_plume: checkItem(WATERWAY_CHECKS[3].options),

  equipment_in_use: z.string().trim().max(2000, "Too long").default(""),

  photos: z.array(photoSchema).min(1, "Attach at least one photo").max(10, "At most 10 photos"),
});

export type WaterwaysData = z.infer<typeof waterwaysSchema>;

export function parseWaterwaysForm(formData: FormData): unknown {
  const raw = formData.get("data");
  if (typeof raw !== "string") return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * The site a submission may record. On edit, keeping the record's own site
 * keeps its own snapshot (descriptor included), so a later change in project
 * setup never rewrites where an old inspection was taken, and a renamed or
 * removed site never locks the record. Otherwise the site must be a current
 * project site, and its descriptor comes from the server's list, not the client.
 */
export function resolveSite(
  siteName: string,
  projectSites: readonly WaterwaySite[],
  snapshot?: WaterwaySite,
): WaterwaySite | null {
  if (snapshot && snapshot.name === siteName) return snapshot;
  const current = projectSites.find((s) => s.name === siteName);
  return current ? { name: current.name, descriptor: current.descriptor } : null;
}

/** Reads `projects.waterway_sites`, tolerating anything malformed as "no sites". */
export function readProjectSites(value: unknown): WaterwaySite[] {
  const parsed = waterwaySitesSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
