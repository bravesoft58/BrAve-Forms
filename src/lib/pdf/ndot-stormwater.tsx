import React from "react";
import { View, Text, Page, Image } from "@react-pdf/renderer";
import {
  MultiPageDocument,
  Section,
  FieldRow,
  Field,
  YNField,
  YN,
  SignatureBlock,
  Certification,
  s,
  colors,
} from "./primitives";
import type { NdotStormwaterData } from "@/lib/schemas/ndot-stormwater";

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

const CERT_TEXT =
  "I certify under penalty of law that this document and all attachments were prepared under my direction or supervision in accordance with a system designed to assure that qualified personnel properly gathered and evaluated the information submitted. Based on my inquiry of the person or persons who manage the system, or those persons directly responsible for gathering the information, the information submitted is, to the best of my knowledge and belief, true, accurate, and complete. I am aware that there are significant penalties for submitting false information, including the possibility of fine and imprisonment for knowing violations. 40 CFR 122.22(d)";

const FORM_ID = "FORM 018-001 WPCM (Rev. 1/04/2017)";

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
        <FieldRow>
          <YNField label="TMDL Waterway Potential?" value={data.tmdl_waterway} />
          <Field label="Waterway Names" value={data.tmdl_waterway_names} />
        </FieldRow>
        <FieldRow>
          <YNField label="Significant Erosion?" value={data.erosion_evidence} />
          <YNField label="Discharge into Waterway?" value={data.erosion_discharge} />
          <Field label="Which Waterway" value={data.erosion_waterway} />
        </FieldRow>
        <FieldRow>
          <YNField label="Adjacent Stormwater?" value={data.adjacent_runoff} />
          <YNField label="Pollutant Concerns?" value={data.pollutant_concerns} />
        </FieldRow>
        <FieldRow>
          <Field
            label="Deficiency Follow-up"
            value={
              data.deficiency_followup === "yes"
                ? "Yes"
                : data.deficiency_followup === "no"
                  ? "No"
                  : "N/A"
            }
          />
          <Field label="Actions Taken" value={data.deficiency_actions} />
        </FieldRow>

        {/* SWPPP Elements */}
        <Section title="SWPPP Elements" />
        <FieldRow>
          <YNField label="SWPPP Onsite?" value={data.swppp_onsite} />
          <YNField label="SWPPP Signed?" value={data.swppp_signed} />
          <YNField label="SWPPP Current?" value={data.swppp_current} />
          <YNField label="Permit Posted?" value={data.swppp_posted} />
        </FieldRow>

        <PageFooter />
      </Page>

      {/* PAGE 2 — BMP Categories */}
      <Page size="LETTER" style={s.page}>
        <NdotHeader />
        <Section title="Best Management Practice (BMP) Categories" />

        <View style={s.tableHeaderRow}>
          <Text style={[s.tableCellBold, { width: "35%" }]}>BMP Category</Text>
          <Text style={[s.tableCellBold, { width: "15%", textAlign: "center" }]}>Required?</Text>
          <Text style={[s.tableCellBold, { width: "15%", textAlign: "center" }]}>Implemented?</Text>
          <Text style={[s.tableCellBold, { width: "35%" }]}>Comments</Text>
        </View>

        {bmps.map((bmp, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { width: "35%" }]}>{bmp.name}</Text>
            <View style={{ width: "15%", alignItems: "center", paddingVertical: 3 }}>
              <YN value={bmp.required} />
            </View>
            <View style={{ width: "15%", alignItems: "center", paddingVertical: 3 }}>
              <YN value={bmp.implemented} />
            </View>
            <Text style={[s.tableCell, { width: "35%" }]}>{bmp.comments || "---"}</Text>
          </View>
        ))}

        {/* Batch Plants */}
        <Section title="Temporary Batch Plants" />
        <FieldRow>
          <YNField label="Batch Plant Present?" value={data.batch_plant_present} />
          <Field
            label="Location"
            value={data.batch_plant_location === "onsite" ? "Onsite" : data.batch_plant_location === "offsite" ? "Offsite" : "---"}
          />
        </FieldRow>
        {data.batch_plant_comments && (
          <View style={s.mb4}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label }]}>Comments</Text>
            <Text>{data.batch_plant_comments}</Text>
          </View>
        )}

        {/* Illicit Discharge */}
        <Section title="Illicit Discharge Detection & Spill Response" />
        <FieldRow>
          <YNField label="Illicit Discharges?" value={data.illicit_discharges} />
          <YNField label="Reportable Spills?" value={data.reportable_spills} />
          <YNField label="NDEP Report Filed?" value={data.ndep_report_filed} />
          <YNField label="Non-reportable Spills?" value={data.non_reportable_spills} />
        </FieldRow>
        {data.spill_action && (
          <View style={s.mb4}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label }]}>Spill Actions</Text>
            <Text>{data.spill_action}</Text>
          </View>
        )}

        {/* Final Check */}
        <Section title="Final Check" />
        <FieldRow>
          <YNField label="All Areas Inspected?" value={data.all_areas_inspected} />
        </FieldRow>

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
        <Certification text={CERT_TEXT} />
        <View style={s.signatureBlock}>
          <SignatureBlock label="Inspector" name={data.inspector_name} date={data.inspector_date} />
          <SignatureBlock label="Water Pollution Control Manager" name={data.wpcm_name} date={data.wpcm_date} />
        </View>

        <PageFooter />
      </Page>
    </MultiPageDocument>
  );
}
