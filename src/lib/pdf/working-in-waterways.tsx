import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import { FormDocument, Section, FieldRow, Field, s, colors } from "./primitives";
import { WATERWAY_CHECKS, type WaterwaysData } from "@/lib/schemas/waterways";
import { QD_LOGO_PNG } from "./qd-logo";

interface Props {
  data: Partial<WaterwaysData> & { photos?: Array<{ file_name?: string; url?: string; caption?: string }> };
  projectName: string;
  formDate: string;
}

interface CheckLike {
  value?: string;
  comment?: string;
}

// The layout is ours; the information matches Q&D's paper form (BF-58).
export function WorkingInWaterwaysPdf({ data, projectName, formDate }: Props) {
  const photos = data.photos ?? [];
  const site = data.site_descriptor ? `${data.site_name} (${data.site_descriptor})` : data.site_name;

  return (
    <FormDocument title={`Working in Waterways - ${projectName} - ${formDate}`}>
      <View style={{ alignItems: "center", marginBottom: 6 }}>
        <Image src={QD_LOGO_PNG} style={{ width: 110, height: 58.4 }} />
      </View>
      <View style={s.titleBanner}>
        <Text style={s.titleText}>Working in Waters of the State Daily Inspection</Text>
      </View>

      <FieldRow>
        <Field label="Project" value={projectName} />
        <Field label="Site" value={site} />
      </FieldRow>
      <FieldRow>
        <Field label="Date" value={data.inspection_date || formDate} />
        <Field label="Time" value={data.inspection_time} />
        <Field label="Initials" value={data.initials} />
      </FieldRow>

      <Section title="Daily Checks" />
      {WATERWAY_CHECKS.map((item) => {
        const check = (data[item.key] ?? {}) as CheckLike;
        return (
          <View
            key={item.key}
            wrap={false}
            style={{ marginBottom: 5, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: colors.lightBorder }}
          >
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Text style={{ flex: 1, fontSize: 8.5, paddingRight: 8 }}>{item.label}</Text>
              <Text style={s.bold}>{check.value || "---"}</Text>
            </View>
            {check.comment ? (
              <Text style={{ fontSize: 7.5, color: colors.muted, marginTop: 1 }}>Comment: {check.comment}</Text>
            ) : null}
          </View>
        );
      })}

      <Section title="Equipment in use in and around waterway today" />
      <View style={[s.mb8, { minHeight: 30 }]}>
        <Text>{data.equipment_in_use || "None listed"}</Text>
      </View>

      {photos.length > 0 && (
        <>
          <Section title="Site Photos" />
          <View style={[s.row, { flexWrap: "wrap", gap: 8, marginTop: 4 }]}>
            {photos.map((photo, i) => (
              <View key={i} wrap={false} style={{ width: "48%", marginBottom: 8 }}>
                {photo.url ? (
                  <Image src={photo.url} style={{ width: "100%", maxHeight: 220, objectFit: "contain" }} />
                ) : (
                  <Text style={s.muted}>Photo unavailable</Text>
                )}
                <Text style={[s.muted, { marginTop: 2 }]}>{photo.caption || photo.file_name}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </FormDocument>
  );
}
