import type { WaterwaySite } from "@/lib/schemas/waterways";

export interface SubmissionSite {
  form_type: string;
  form_date: string;
  site_name?: string | null;
}

export interface SiteToday {
  name: string;
  descriptor: string;
  submittedToday: boolean;
}

/**
 * For each of the project's waterway sites, whether a Working in Waterways
 * form dated `today` names it. A submission whose site is no longer on the
 * list (renamed or removed after it was filed) is still shown, under the name
 * it recorded, rather than dropped. Information only: nothing here is a warning.
 */
export function waterwaySitesToday(
  sites: readonly WaterwaySite[],
  submissions: readonly SubmissionSite[],
  today: string,
): SiteToday[] {
  const submittedNames = new Set<string>();
  for (const sub of submissions) {
    if (sub.form_type === "working_in_waterways" && sub.form_date === today && sub.site_name) {
      submittedNames.add(sub.site_name);
    }
  }

  const rows = sites.map((site) => ({
    name: site.name,
    descriptor: site.descriptor,
    submittedToday: submittedNames.has(site.name),
  }));

  const listed = new Set(sites.map((site) => site.name));
  for (const name of submittedNames) {
    if (!listed.has(name)) rows.push({ name, descriptor: "", submittedToday: true });
  }
  return rows;
}
