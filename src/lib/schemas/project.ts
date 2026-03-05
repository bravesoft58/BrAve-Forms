import { z } from "zod";
import { PERMIT_TYPES } from "@/lib/constants/permits";

const optionalEmail = z
  .string()
  .transform((v) => v.trim())
  .pipe(z.union([z.literal(""), z.string().email("Invalid email address")]));

const optionalPhone = z
  .string()
  .transform((v) => v.trim())
  .pipe(
    z.union([
      z.literal(""),
      z.string().regex(/^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, "Invalid US phone number"),
    ])
  );

const optionalString = z
  .string()
  .transform((v) => v.trim())
  .pipe(z.union([z.literal(""), z.string()]));

export const projectCreateSchema = z
  .object({
    name: z.string().min(1, "Project name is required").max(200),
    address: z.string().min(1, "Address is required").max(500),
    start_date: z.string().min(1, "Start date is required").date("Invalid date"),
    completion_date: z.string().min(1, "Completion date is required").date("Invalid date"),

    superintendent_name: optionalString,
    superintendent_phone: optionalPhone,
    superintendent_email: optionalEmail,

    foreman_name: optionalString,
    foreman_phone: optionalPhone,
    foreman_email: optionalEmail,

    pm_name: optionalString,
    pm_phone: optionalPhone,
    pm_email: optionalEmail,

    owner_rep_name: optionalString,
    owner_rep_phone: optionalPhone,
    owner_rep_email: optionalEmail,
    owner_rep_address: optionalString,

    acres_disturbed: optionalString,
    soil_type: optionalString,
    parcel_numbers: optionalString,
    description: optionalString,

    permits: z.array(
      z.object({
        permit_type: z.enum(PERMIT_TYPES),
        permit_number: z.string().optional(),
      })
    ),
  })
  .refine(
    (data) => data.completion_date >= data.start_date,
    { message: "Completion date must be on or after start date", path: ["completion_date"] }
  )
  .refine(
    (data) => {
      if (data.acres_disturbed === "") return true;
      const num = Number(data.acres_disturbed);
      return !isNaN(num) && num >= 0;
    },
    { message: "Acres must be a positive number", path: ["acres_disturbed"] }
  );

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export function parseProjectForm(formData: FormData): unknown {
  const get = (key: string) => (formData.get(key) as string) ?? "";

  const permitTypes = formData.getAll("permit_type") as string[];
  const permitNumbers = formData.getAll("permit_number") as string[];

  const permits = permitTypes.map((pt, i) => ({
    permit_type: pt,
    permit_number: permitNumbers[i] ?? "",
  }));

  return {
    name: get("name"),
    address: get("address"),
    start_date: get("start_date"),
    completion_date: get("completion_date"),

    superintendent_name: get("superintendent_name"),
    superintendent_phone: get("superintendent_phone"),
    superintendent_email: get("superintendent_email"),

    foreman_name: get("foreman_name"),
    foreman_phone: get("foreman_phone"),
    foreman_email: get("foreman_email"),

    pm_name: get("pm_name"),
    pm_phone: get("pm_phone"),
    pm_email: get("pm_email"),

    owner_rep_name: get("owner_rep_name"),
    owner_rep_phone: get("owner_rep_phone"),
    owner_rep_email: get("owner_rep_email"),
    owner_rep_address: get("owner_rep_address"),

    acres_disturbed: get("acres_disturbed"),
    soil_type: get("soil_type"),
    parcel_numbers: get("parcel_numbers"),
    description: get("description"),

    permits,
  };
}
