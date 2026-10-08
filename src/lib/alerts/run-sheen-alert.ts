import { sendOrgEmail } from "@/lib/email/send-mail";
import type { SendResult } from "@/lib/email/send-result";
import { createServiceClient } from "@/lib/supabase/service";
import type { WaterwaysData } from "@/lib/schemas/waterways";
import {
  SHEEN_ALERT_KIND,
  buildSheenAlertEmail,
  inspectionLink,
  type AlertStatus,
} from "./sheen-alert-message";

// BF-72 orchestration: claim, send, record. Runs inside next/server after(),
// so the inspection is already saved and the crew is not kept waiting. Never
// throws: a failure is recorded on the alert row and logged.

type Service = ReturnType<typeof createServiceClient>;

export type SheenAlertOutcome = AlertStatus | "already_claimed" | "claim_failed";

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Claims the (submission, sheen_plume) alert row. Only the request whose
 * insert creates the row may send; any other attempt (a retried submit, a
 * double-click that got past the client) finds it taken.
 */
async function claim(db: Service, submissionId: string): Promise<"claimed" | "taken" | "error"> {
  const { data, error } = await db
    .from("submission_alerts")
    .upsert(
      { submission_id: submissionId, kind: SHEEN_ALERT_KIND, status: "sending" },
      { onConflict: "submission_id,kind", ignoreDuplicates: true },
    )
    .select("submission_id");
  if (error) {
    console.error("[sheen-alert] claim failed", { submissionId, error: error.message });
    return "error";
  }
  return data && data.length > 0 ? "claimed" : "taken";
}

async function record(
  db: Service,
  submissionId: string,
  fields: { status: AlertStatus; recipient?: string | null; reason?: string | null; detail?: string | null },
) {
  const { error } = await db
    .from("submission_alerts")
    .update(fields)
    .eq("submission_id", submissionId)
    .eq("kind", SHEEN_ALERT_KIND);
  if (error) console.error("[sheen-alert] status write failed", { submissionId, status: fields.status, error: error.message });
}

function statusOf(result: SendResult): AlertStatus {
  if (result.ok) return "sent";
  return result.reason === "not_configured" ? "not_configured" : "failed";
}

export async function runSheenAlert(
  submissionId: string,
  projectId: string,
  data: WaterwaysData,
): Promise<SheenAlertOutcome> {
  try {
    const db = createServiceClient();
    const claimed = await claim(db, submissionId);
    if (claimed === "taken") return "already_claimed";
    if (claimed === "error") return "claim_failed";

    const { data: project, error } = await db
      .from("projects")
      .select("organization_id, name, waterway_contact_name, waterway_contact_email")
      .eq("id", projectId)
      .maybeSingle();
    if (error || !project) {
      await record(db, submissionId, { status: "failed", reason: "project_unavailable", detail: error?.message ?? null });
      return "failed";
    }

    const to = (project.waterway_contact_email ?? "").trim();
    if (!to) {
      await record(db, submissionId, { status: "no_contact" });
      return "no_contact";
    }

    const email = buildSheenAlertEmail({
      projectName: project.name,
      siteName: data.site_name,
      inspectionDate: data.inspection_date,
      inspectionTime: data.inspection_time,
      initials: data.initials,
      comment: data.sheen_or_plume.comment,
      contactName: project.waterway_contact_name,
      link: inspectionLink(process.env.NEXT_PUBLIC_SITE_URL, projectId, submissionId),
    });
    const result = await sendOrgEmail(project.organization_id, { to, ...email });
    const status = statusOf(result);
    await record(db, submissionId, {
      status,
      recipient: to,
      reason: result.ok ? null : result.reason,
      detail: result.ok ? null : (result.detail ?? null),
    });
    return status;
  } catch (e) {
    console.error("[sheen-alert] unexpected failure", { submissionId, error: message(e) });
    return "failed";
  }
}
