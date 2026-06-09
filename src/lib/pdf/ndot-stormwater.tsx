import React from "react";
import { View, Text, Page, Image } from "@react-pdf/renderer";
import {
  MultiPageDocument,
  Section,
  FieldRow,
  Field,
  YN,
  SignatureBlock,
  Certification,
  s,
  colors,
} from "./primitives";
import type { NdotStormwaterData } from "@/lib/schemas/ndot-stormwater";
import {
  NDOT_INSTRUCTIONS,
  NDOT_CERT_TEXT,
  NDOT_BMP_PROMPTS,
  NDOT_SECTION1_PROMPTS,
  NDOT_SWPPP_PROMPTS,
  NDOT_SECTION3_PROMPTS,
} from "@/lib/constants/ndot-form-text";

interface Props {
  data: NdotStormwaterData;
  projectName: string;
  permitNumber?: string;
  formDate: string;
}

const TEMP_LABELS: Record<string, string> = {
  "<32": "< 32\u00b0F",
  "32-50": "32\u201350\u00b0F",
  "51-75": "51\u201375\u00b0F",
  ">75": "> 75\u00b0F",
};

const INTENSITY_LABELS: Record<string, string> = {
  none: "None",
  light: "Light",
  moderate: "Moderate",
  heavy: "Heavy",
};

const FORM_ID = "FORM 018-001 WPCM (Rev. 1/04/2017)";

// Full-width "prompt + Y/N" row mirroring the official form's vertical layout.
// `detail` renders the conditional follow-up answer (waterway names, actions, etc.)
// beneath the prompt when present.
function PromptRow({ prompt, value, detail }: { prompt: string; value?: string; detail?: string }) {
  return (
    <View style={{ marginBottom: 5 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ flex: 1, fontSize: 8, paddingRight: 8 }}>{prompt}</Text>
        <View style={{ flexShrink: 0 }}>
          <YN value={value} />
        </View>
      </View>
      {detail ? (
        <Text style={{ fontSize: 7.5, color: colors.muted, marginTop: 1 }}>{detail}</Text>
      ) : null}
    </View>
  );
}

function PageFooter() {
  return (
    <Text
      style={{
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 6.5,
        color: colors.muted,
      }}
    >
      {FORM_ID}
    </Text>
  );
}

function NdotHeader() {
  return (
    <View style={{ textAlign: "center", marginBottom: 8 }}>
      <Text style={[s.bold, { fontSize: 11 }]}>STATE OF NEVADA</Text>
      <Text style={[s.bold, { fontSize: 10 }]}>DEPARTMENT OF TRANSPORTATION</Text>
      <Text style={{ fontSize: 9, marginTop: 2 }}>
        Construction Site Stormwater Inspection Form
      </Text>
      <Text style={{ fontSize: 8, color: colors.muted }}>
        For Water Pollution Control Managers
      </Text>
    </View>
  );
}

export function NdotStormwaterPdf({ data, projectName, permitNumber, formDate }: Props) {
  const bmps = data.bmp_categories ?? [];
  const photos = data.photos ?? [];

  return (
    <MultiPageDocument title={`NDOT Stormwater - ${projectName} - ${formDate}`}>
      {/* PAGE 1 — Site Info + Conditions + SWPPP + first BMPs */}
      <Page size="LETTER" style={s.page}>
        <NdotHeader />

        {/* Instructions (official p.1) */}
        <Text style={{ fontSize: 7, color: colors.muted, marginBottom: 6, lineHeight: 1.3 }}>
          <Text style={s.bold}>Instructions: </Text>
          {NDOT_INSTRUCTIONS}
        </Text>

        {/* Site Information */}
        <Section title="Site Information" />
        <FieldRow>
          <Field label="Report No." value={data.report_no} width="25%" />
          <Field label="Contract Number" value={data.contract_number} width="25%" />
          <Field label="CSW/Tracking #" value={permitNumber || data.csw_tracking} />
        </FieldRow>
        <FieldRow>
          <Field label="Project Location" value={data.project_location || projectName} />
        </FieldRow>
        <FieldRow>
          <Field label="NDOT Inspector" value={data.ndot_inspector} />
          <Field label="Crew #" value={data.crew_number} width="15%" />
          <Field label="Resident Engineer" value={data.resident_engineer} />
        </FieldRow>
        <FieldRow>
          <Field label="WPCM" value={data.wpcm} />
          <Field label="Inspection Date" value={data.inspection_date} />
          <Field label="Previous Inspection" value={data.previous_inspection_date} />
        </FieldRow>

        {/* Site Conditions */}
        <Section title="Site Conditions at the Time of Inspection" />
        <FieldRow>
          <Field label="Weather" value={(data.weather ?? []).join(", ")} />
          <Field
            label="Precip. Intensity"
            value={data.precip_intensity ? INTENSITY_LABELS[data.precip_intensity] || data.precip_intensity : "---"}
          />
          <Field label="Precip. Total" value={data.precip_total} width="18%" />
        </FieldRow>
        <FieldRow>
          <Field label="Wind" value={data.wind ? INTENSITY_LABELS[data.wind] || data.wind : "---"} />
          <Field
            label="Temperature Range"
            value={data.temp_range ? TEMP_LABELS[data.temp_range] || data.temp_range : "---"}
          />
        </FieldRow>
        <FieldRow>
          <Field label="Precip. Reference Type" value={data.precip_reference_type} />
          <Field label="Precip. Reference Location" value={data.precip_reference_location} />
        </FieldRow>

        {/* Assessment Questions */}
        <Section title="Site Assessment" />
        <PromptRow
          prompt={NDOT_SECTION1_PROMPTS.tmdl_waterway}
          value={data.tmdl_waterway}
          detail={
            data.tmdl_waterway === "Y" && data.tmdl_waterway_names
              ? `${NDOT_SECTION1_PROMPTS.tmdl_waterway_names} ${data.tmdl_waterway_names}`
              : undefined
          }
        />
        {/* Deficiency follow-up: N/A | Yes | No */}
        <View style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: 8 }}>{NDOT_SECTION1_PROMPTS.deficiency_followup}</Text>
          <Text style={{ fontSize: 7.5, color: colors.muted, marginTop: 1 }}>
            {data.deficiency_followup === "yes" ? "Yes" : data.deficiency_followup === "no" ? "No" : "N/A"}
            {data.deficiency_actions ? ` — ${data.deficiency_actions}` : ""}
          </Text>
        </View>
        <PromptRow
          prompt={NDOT_SECTION1_PROMPTS.erosion_evidence}
          value={data.erosion_evidence}
          detail={
            data.erosion_evidence === "Y"
              ? `${NDOT_SECTION1_PROMPTS.erosion_discharge} ${data.erosion_discharge ?? "—"}${
                  data.erosion_waterway ? ` · ${data.erosion_waterway}` : ""
                }`
              : undefined
          }
        />
        <PromptRow prompt={NDOT_SECTION1_PROMPTS.adjacent_runoff} value={data.adjacent_runoff} />
        <PromptRow
          prompt={NDOT_SECTION1_PROMPTS.pollutant_concerns}
          value={data.pollutant_concerns}
          detail={data.pollutant_concerns === "Y" ? data.pollutant_explain : undefined}
        />

        {/* SWPPP Elements */}
        <Section title="SWPPP Elements" />
        <PromptRow prompt={NDOT_SWPPP_PROMPTS.swppp_onsite} value={data.swppp_onsite} />
        <PromptRow prompt={NDOT_SWPPP_PROMPTS.swppp_signed} value={data.swppp_signed} />
        <PromptRow prompt={NDOT_SWPPP_PROMPTS.swppp_current} value={data.swppp_current} />
        <PromptRow prompt={NDOT_SWPPP_PROMPTS.swppp_posted} value={data.swppp_posted} />

        <PageFooter />
      </Page>

      {/* PAGE 2 — BMP Categories */}
      <Page size="LETTER" style={s.page}>
        <NdotHeader />
        <Section title="Best Management Practice (BMP) Categories" />

        {bmps.map((bmp, i) => {
          const prompt = NDOT_BMP_PROMPTS[bmp.name as keyof typeof NDOT_BMP_PROMPTS];
          return (
            <View
              key={i}
              wrap={false}
              style={{ marginBottom: 7, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#D1D5DB" }}
            >
              <Text style={[s.bold, { fontSize: 9, marginBottom: 2 }]}>
                {prompt?.displayName ?? bmp.name}
              </Text>
              <PromptRow prompt={prompt?.required ?? "Required?"} value={bmp.required} />
              <PromptRow prompt={prompt?.implemented ?? "Are BMPs properly implemented?"} value={bmp.implemented} />
              {bmp.comments ? (
                <Text style={{ fontSize: 7.5, color: colors.muted }}>Comments: {bmp.comments}</Text>
              ) : null}
            </View>
          );
        })}

        {/* Batch Plants */}
        <Section title="Temporary Batch Plants" />
        <PromptRow
          prompt={NDOT_SECTION3_PROMPTS.batch_plant_present}
          value={data.batch_plant_present}
          detail={
            data.batch_plant_present === "Y"
              ? `${NDOT_SECTION3_PROMPTS.batch_plant_location} ${
                  data.batch_plant_location === "onsite"
                    ? "Onsite"
                    : data.batch_plant_location === "offsite"
                      ? "Offsite"
                      : "—"
                }${data.batch_plant_comments ? ` · ${data.batch_plant_comments}` : ""}`
              : undefined
          }
        />

        {/* Illicit Discharge */}
        <Section title="Illicit Discharge Detection and Elimination / Spill Response" />
        <PromptRow prompt={NDOT_SECTION3_PROMPTS.illicit_discharges} value={data.illicit_discharges} />
        <PromptRow prompt={NDOT_SECTION3_PROMPTS.reportable_spills} value={data.reportable_spills} />
        <View style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: 8 }}>{NDOT_SECTION3_PROMPTS.spill_action}</Text>
          <Text style={{ fontSize: 7.5, color: colors.muted, marginTop: 1 }}>{data.spill_action || "N/A"}</Text>
        </View>
        <PromptRow prompt={NDOT_SECTION3_PROMPTS.ndep_report_filed} value={data.ndep_report_filed} />
        <PromptRow prompt={NDOT_SECTION3_PROMPTS.non_reportable_spills} value={data.non_reportable_spills} />

        {/* Final Check */}
        <Section title="Final Check" />
        <PromptRow prompt={NDOT_SECTION3_PROMPTS.all_areas_inspected} value={data.all_areas_inspected} />
        <View style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: 8 }}>{NDOT_SECTION3_PROMPTS.non_structural_bmps}</Text>
          {data.non_structural_bmps ? (
            <Text style={{ fontSize: 7.5, color: colors.muted, marginTop: 1 }}>{data.non_structural_bmps}</Text>
          ) : null}
        </View>

        <PageFooter />
      </Page>

      {/* PAGE 3 — Comments, Photos, Signatures */}
      <Page size="LETTER" style={s.page}>
        <NdotHeader />

        {/* Additional Comments */}
        <Section title="Additional Comments" />
        <View style={[s.mb8, { minHeight: 40 }]}>
          <Text>{data.additional_comments || "None"}</Text>
        </View>

        {/* Photos */}
        {photos.length > 0 && (
          <>
            <Section title="Site Photos" />
            <View style={[s.row, { flexWrap: "wrap", gap: 8, marginTop: 4 }]}>
              {photos.map((photo, i) => (
                <View key={i} style={{ width: "48%", marginBottom: 8 }}>
                  <Image src={photo.url} style={{ width: "100%", maxHeight: 200 }} />
                  <Text style={[s.muted, { marginTop: 2 }]}>
                    {photo.caption || photo.file_name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Certification + Signatures */}
        <Certification text={NDOT_CERT_TEXT} />
        <View style={s.signatureBlock}>
          <SignatureBlock label="Inspector" name={data.inspector_name} date={data.inspector_date} />
          <SignatureBlock label="Water Pollution Control Manager" name={data.wpcm_name} date={data.wpcm_date} />
        </View>

        <PageFooter />
      </Page>
    </MultiPageDocument>
  );
}
