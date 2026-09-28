import type { FormType } from "@/lib/constants/permits";

/**
 * Storage subfolder under `projects/<projectId>/` where PhotoAttachment puts a
 * form type's photos. The PDF route and the inspector portal both sign photo
 * URLs from this one map; a form type missing here gets no photo links.
 * Each value must match the `storagePath` its form passes to PhotoAttachment.
 */
export const FORM_PHOTO_SUBPATH: Partial<Record<FormType, string>> = {
  ndot_weekly_stormwater: "ndot-stormwater",
  working_in_waterways: "working-in-waterways",
};
