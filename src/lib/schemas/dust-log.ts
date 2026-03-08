import { z } from "zod";

const SOIL_CONDITIONS = ["Crusted", "Damp", "Dry", "Loose", "Powdery"] as const;
const ROAD_CONDITIONS = ["Crusted", "Damp", "Paved", "Dry"] as const;

const dustLogEntrySchema = z.object({
  date: z.string().min(1, "Date is required").date("Invalid date"),
  time: z.string().min(1, "Time is required"),
  visible_dust: z.enum(["Y", "N"], { message: "Select Y or N" }),
  project_soils: z.enum(SOIL_CONDITIONS, { message: "Select soil condition" }),
  access_roads: z.enum(ROAD_CONDITIONS, { message: "Select road condition" }),
  trackout: z.enum(["Y", "N"], { message: "Select Y or N" }),
  corrective_actions: z.string().optional(),
});

export const dustLogSchema = z.object({
  entries: z.array(dustLogEntrySchema).min(1, "At least one entry is required"),
});

export type DustLogEntry = z.infer<typeof dustLogEntrySchema>;
export type DustLogFormData = z.infer<typeof dustLogSchema>;

export const SOIL_CONDITIONS_LIST = SOIL_CONDITIONS;
export const ROAD_CONDITIONS_LIST = ROAD_CONDITIONS;

export function parseDustLogForm(formData: FormData): unknown {
  const raw = formData.get("entries") as string;
  try {
    return { entries: JSON.parse(raw) };
  } catch {
    return { entries: [] };
  }
}
