import React from "react";
import { View, Text } from "@react-pdf/renderer";
import {
  FormDocument,
  Section,
  FieldRow,
  Field,
  s,
  colors,
} from "./primitives";

interface DustLogEntry {
  date: string;
  time: string;
  visible_dust: string;
  project_soils: string;
  access_roads: string;
  trackout: string;
  corrective_actions?: string;
}

interface DustLogProps {
  data: { entries: DustLogEntry[] };
  projectName: string;
  permitNumber?: string;
  companyName?: string;
}

const cols = [
  { label: "Date", sub: "(MM/DD/YY)", width: "11%", key: "date" },
  { label: "Time", sub: "", width: "9%", key: "time" },
  { label: "Visible Dust", sub: "(Y/N)", width: "10%", key: "visible_dust" },
  { label: "Project Soils", sub: "(Crusted/Damp/Dry/Loose/Powdery)", width: "15%", key: "project_soils" },
  { label: "Access Roads", sub: "(Crusted/Damp/Paved/Dry)", width: "14%", key: "access_roads" },
  { label: "Trackout", sub: "(Y/N)", width: "9%", key: "trackout" },
  { label: "Corrective Action(s) Taken / Comments", sub: "", width: "32%", key: "corrective_actions" },
] as const;

export function DustLogPdf({ data, projectName, permitNumber, companyName }: DustLogProps) {
  const entries = data.entries ?? [];

  return (
    <FormDocument title={`Daily Dust Log - ${projectName}`} landscape>
      {/* Title Banner */}
      <View style={s.titleBanner}>
        <Text style={s.titleText}>
          Air Quality Management Division &mdash; Record of Daily Dust Logs
        </Text>
      </View>

      {/* Project Info Row */}
      <FieldRow>
        <Field label="Permit #" value={permitNumber} width="20%" />
        <Field label="Project Name" value={projectName} width="45%" />
        <Field label="Company / Contractor" value={companyName} />
      </FieldRow>

      {/* Instruction */}
      <View style={s.mb4}>
        <Text style={{ fontSize: 8 }}>
          Record inspection results and corrective actions in the following table (
          <Text style={[s.bold, s.red]}>Minimum 1 Entry Per Day</Text>
          ):
        </Text>
      </View>

      {/* Table Header */}
      <View style={s.tableHeaderRow}>
        {cols.map((col) => (
          <View key={col.key} style={{ width: col.width, paddingHorizontal: 3 }}>
            <Text style={[s.bold, { fontSize: 7.5, textAlign: "center" }]}>{col.label}</Text>
            {col.sub ? (
              <Text style={{ fontSize: 6, textAlign: "center", color: colors.muted }}>
                {col.sub}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {entries.map((entry, i) => (
        <View key={i} style={s.tableRow}>
          {cols.map((col) => (
            <View key={col.key} style={{ width: col.width }}>
              <Text style={[s.tableCell, { textAlign: col.key === "corrective_actions" ? "left" : "center" }]}>
                {(entry as unknown as Record<string, string | undefined>)[col.key] || "---"}
              </Text>
            </View>
          ))}
        </View>
      ))}

      {/* Fill remaining rows to ~20 total for the form look */}
      {Array.from({ length: Math.max(0, 20 - entries.length) }).map((_, i) => (
        <View key={`empty-${i}`} style={s.tableRow}>
          {cols.map((col) => (
            <View key={col.key} style={{ width: col.width, minHeight: 16 }}>
              <Text style={s.tableCell}> </Text>
            </View>
          ))}
        </View>
      ))}
    </FormDocument>
  );
}
