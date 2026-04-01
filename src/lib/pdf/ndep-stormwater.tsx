import React from "react";
import { View, Text, Page } from "@react-pdf/renderer";
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
import type { NdepStormwaterData } from "@/lib/schemas/ndep-stormwater";

interface Props {
  data: NdepStormwaterData;
  projectName: string;
  permitNumber?: string;
  formDate: string;
}

const CERT_TEXT =
  "I certify under penalty of law that this document and all attachments were prepared under my direction or supervision in accordance with a system designed to assure that qualified personnel properly gathered and evaluated the information submitted. Based on my inquiry of the person or persons who manage the system, or those persons directly responsible for gathering the information, the information submitted is, to the best of my knowledge and belief, true, accurate, and complete. I am aware that there are significant penalties for submitting false information, including the possibility of fine and imprisonment for knowing violations.";

export function NdepStormwaterPdf({ data, projectName, permitNumber, formDate }: Props) {
  const measures = data.control_measures ?? [];
  const stabilization = data.stabilization_items ?? [];
  const corrective = data.corrective_actions ?? [];

  const typeLabel =
    data.inspection_type === "post_storm"
      ? "Post-Storm Event"
      : data.inspection_type === "other"
        ? `Other: ${data.inspection_type_other || ""}`
        : "Regular";

  return (
    <MultiPageDocument title={`NDEP Stormwater - ${projectName} - ${formDate}`}>
      {/* PAGE 1 — General Info + Site Conditions */}
      <Page size="LETTER" style={s.page}>
        <View style={s.titleBanner}>
          <Text style={s.titleText}>Construction Site Stormwater Inspection Checklist</Text>
        </View>

        {/* General Information */}
        <Section title="General Information" />
        <FieldRow>
          <Field label="Project Site Name" value={data.project_site_name || projectName} />
          <Field label="CSW #" value={permitNumber} width="20%" />
        </FieldRow>
        <FieldRow>
          <Field label="Project Location" value={data.location} />
        </FieldRow>

        {/* Inspection Information */}
        <Section title="Inspection Information" />
        <FieldRow>
          <Field label="Date of Inspection" value={data.inspection_date} />
          <Field label="Time of Inspection" value={data.inspection_time} />
        </FieldRow>
        <FieldRow>
          <Field label="Inspector Name" value={data.inspector_name} />
          <Field label="Type of Inspection" value={typeLabel} />
        </FieldRow>
        <FieldRow>
          <YNField label="Storm event >= 0.25 in?" value={data.storm_event_025} />
          <YNField label="Snowmelt Discharge?" value={data.snowmelt_discharge} />
        </FieldRow>

        {data.storm_event_025 === "Y" && (
          <>
            <FieldRow>
              <Field
                label="Rain Source"
                value={
                  data.rain_source === "rain_gauge"
                    ? "Rain Gauge"
                    : data.rain_source === "weather_station"
                      ? "Weather Station"
                      : "---"
                }
              />
              <Field label="Total Rainfall (in)" value={data.total_rainfall} />
            </FieldRow>
            <FieldRow>
              <Field label="Storm Start" value={data.storm_start} />
              <Field label="Storm Duration (hrs)" value={data.storm_duration} />
            </FieldRow>
          </>
        )}

        {/* Project Site Conditions */}
        <Section title="Project Site Conditions" />
        <FieldRow>
          <Field label="Weather" value={data.weather} />
          <Field label="Temperature" value={data.temperature} />
        </FieldRow>
        <FieldRow>
          <YNField label="Discharge from Site" value={data.discharge_from_site} />
          <YNField label="Evidence of Erosion" value={data.erosion_evidence} />
          <YNField label="Previous Corrective Complete" value={data.previous_corrective_complete} />
        </FieldRow>
        {data.discharge_from_site === "Y" && data.discharge_description && (
          <View style={s.mb4}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label }]}>Discharge Description</Text>
            <Text>{data.discharge_description}</Text>
          </View>
        )}
        {data.erosion_evidence === "Y" && data.erosion_description && (
          <View style={s.mb4}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label }]}>Erosion Description</Text>
            <Text>{data.erosion_description}</Text>
          </View>
        )}
        {data.previous_corrective_complete === "N" && data.previous_corrective_description && (
          <View style={s.mb4}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label }]}>Explanation</Text>
            <Text>{data.previous_corrective_description}</Text>
          </View>
        )}

        {/* SWPPP Elements */}
        <Section title="SWPPP Elements (Section 6.0)" />
        <FieldRow>
          <YNField label="SWPPP Available" value={data.swppp_available} />
          <YNField label="SWPPP Current" value={data.swppp_current} />
          <YNField label="Site Map Accurate" value={data.site_map_accurate} />
        </FieldRow>
      </Page>

      {/* PAGE 2 — Control Measures */}
      <Page size="LETTER" style={s.page}>
        <Section title="Stormwater Control Measures and Potential Pollutant Sources (Section 3.0)" />

        {/* Table Header */}
        <View style={s.tableHeaderRow}>
          <Text style={[s.tableCellBold, { width: "40%" }]}>Control Measure</Text>
          <Text style={[s.tableCellBold, { width: "15%", textAlign: "center" }]}>Implemented?</Text>
          <Text style={[s.tableCellBold, { width: "20%", textAlign: "center" }]}>Maint. Needed?</Text>
          <Text style={[s.tableCellBold, { width: "25%" }]}>Notes</Text>
        </View>

        {measures.map((cm, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { width: "40%" }]}>{cm.name}</Text>
            <View style={{ width: "15%", alignItems: "center", paddingVertical: 3 }}>
              <YN value={cm.implemented} />
            </View>
            <View style={{ width: "20%", alignItems: "center", paddingVertical: 3 }}>
              <YN value={cm.maintenance_needed} />
            </View>
            <Text style={[s.tableCell, { width: "25%" }]}>{cm.notes || "---"}</Text>
          </View>
        ))}
      </Page>

      {/* PAGE 3 — Stabilization, Corrective Actions, Signature */}
      <Page size="LETTER" style={s.page}>
        <Section title="Stabilization (Section 3.7)" />

        <View style={s.tableHeaderRow}>
          <Text style={[s.tableCellBold, { width: "40%" }]}>Stabilization Measure</Text>
          <Text style={[s.tableCellBold, { width: "15%", textAlign: "center" }]}>Implemented?</Text>
          <Text style={[s.tableCellBold, { width: "20%", textAlign: "center" }]}>Maint. Needed?</Text>
          <Text style={[s.tableCellBold, { width: "25%" }]}>Notes</Text>
        </View>

        {stabilization.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { width: "40%" }]}>{item.name}</Text>
            <View style={{ width: "15%", alignItems: "center", paddingVertical: 3 }}>
              <YN value={item.implemented} />
            </View>
            <View style={{ width: "20%", alignItems: "center", paddingVertical: 3 }}>
              <YN value={item.maintenance_needed} />
            </View>
            <Text style={[s.tableCell, { width: "25%" }]}>{item.notes || "---"}</Text>
          </View>
        ))}

        {/* Corrective Actions */}
        {corrective.length > 0 && (
          <>
            <Section title="Corrective Actions" />
            <View style={s.tableHeaderRow}>
              <Text style={[s.tableCellBold, { width: "55%" }]}>Description</Text>
              <Text style={[s.tableCellBold, { width: "25%", textAlign: "center" }]}>
                Date to Complete
              </Text>
              <Text style={[s.tableCellBold, { width: "20%", textAlign: "center" }]}>
                Completed
              </Text>
            </View>
            {corrective.map((ca, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={[s.tableCell, { width: "55%" }]}>{ca.description}</Text>
                <Text style={[s.tableCell, { width: "25%", textAlign: "center" }]}>
                  {ca.date_to_complete}
                </Text>
                <View style={{ width: "20%", alignItems: "center", paddingVertical: 3 }}>
                  <YN value={ca.completed} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* Certification */}
        <Certification text={CERT_TEXT} />

        {/* Signature */}
        <View style={s.signatureBlock}>
          <SignatureBlock
            label="Inspector Signature"
            name={data.inspector_signature}
            date={data.signature_date}
          />
        </View>
      </Page>
    </MultiPageDocument>
  );
}
