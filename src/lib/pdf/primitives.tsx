import React from "react";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

export const colors = {
  headerBg: "#4a5568",
  headerText: "#ffffff",
  sectionBg: "#e2e8f0",
  border: "#a0aec0",
  lightBorder: "#cbd5e0",
  text: "#1a202c",
  label: "#4a5568",
  muted: "#718096",
  green: "#276749",
  red: "#9b2c2c",
};

export const s = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.text,
    lineHeight: 1.4,
  },
  pageLandscape: {
    padding: 30,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: colors.text,
    lineHeight: 1.4,
  },
  /* Banner / Title */
  titleBanner: {
    backgroundColor: colors.headerBg,
    padding: 8,
    marginBottom: 10,
    textAlign: "center",
  },
  titleText: {
    color: colors.headerText,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    color: colors.headerText,
    fontSize: 9,
    fontFamily: "Helvetica",
    marginTop: 2,
  },
  /* Section */
  sectionHeader: {
    backgroundColor: colors.sectionBg,
    padding: 5,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  /* Field grid */
  fieldRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  /* Table */
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightBorder,
    minHeight: 18,
    alignItems: "center",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.sectionBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 20,
    alignItems: "center",
  },
  tableCell: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 8,
  },
  tableCellBold: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  /* Signature */
  signatureBlock: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
    width: 200,
    marginBottom: 2,
  },
  /* Misc */
  row: { flexDirection: "row" },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mt4: { marginTop: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  red: { color: colors.red },
  green: { color: colors.green },
  muted: { color: colors.muted, fontSize: 7 },
  legal: { fontSize: 6.5, color: colors.muted, marginTop: 6, lineHeight: 1.3 },
});

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

/** Section header bar (gray background, bold text) */
export function Section({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionHeaderText}>{title}</Text>
    </View>
  );
}

/** Single labeled field */
export function Field({
  label,
  value,
  width,
}: {
  label: string;
  value?: string | number | null;
  width?: string | number;
}) {
  return (
    <View style={width ? { width } : { flex: 1, marginRight: 6 }}>
      <Text style={[s.bold, { fontSize: 7, color: colors.label, marginBottom: 1 }]}>
        {label}
      </Text>
      <Text>{value || "---"}</Text>
    </View>
  );
}

/** Row of fields — wraps in a flexDirection row */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <View style={[s.fieldRow, s.mb4]}>{children}</View>;
}

/** Y / N / NA badge text */
export function YN({ value }: { value?: string | null }) {
  if (value === "Y") return <Text style={s.green}>Y</Text>;
  if (value === "N") return <Text style={s.red}>N</Text>;
  return <Text style={s.muted}>N/A</Text>;
}

/** Y/N field with label */
export function YNField({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={{ flex: 1, marginRight: 6 }}>
      <Text style={[s.bold, { fontSize: 7, color: colors.label, marginBottom: 1 }]}>
        {label}
      </Text>
      <YN value={value} />
    </View>
  );
}

/** Checkbox-style item (checked / unchecked) */
export function CheckItem({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <View style={[s.row, { marginBottom: 2, alignItems: "center" }]}>
      <Text style={{ fontSize: 10, marginRight: 4 }}>{checked ? "\u2611" : "\u2610"}</Text>
      <Text style={{ fontSize: 8 }}>{label}</Text>
    </View>
  );
}

/** Signature block with name + date */
export function SignatureBlock({
  label,
  name,
  date,
}: {
  label: string;
  name?: string | null;
  date?: string | null;
}) {
  return (
    <View style={{ marginRight: 30 }}>
      <Text style={[s.bold, { fontSize: 7, color: colors.label, marginBottom: 6 }]}>
        {label}
      </Text>
      <View style={s.signatureLine} />
      <Text style={s.italic}>{name || "---"}</Text>
      <Text style={[s.muted, { marginTop: 2 }]}>Date: {date || "---"}</Text>
    </View>
  );
}

/** Legal certification paragraph */
export function Certification({ text }: { text: string }) {
  return <Text style={s.legal}>{text}</Text>;
}

/** Wrapper Document + Page for portrait forms */
export function FormDocument({
  title,
  children,
  landscape,
}: {
  title: string;
  children: React.ReactNode;
  landscape?: boolean;
}) {
  return (
    <Document title={title}>
      <Page
        size="LETTER"
        orientation={landscape ? "landscape" : "portrait"}
        style={landscape ? s.pageLandscape : s.page}
      >
        {children}
      </Page>
    </Document>
  );
}

/** Multi-page document — children are Page elements directly */
export function MultiPageDocument({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return <Document title={title}>{children}</Document>;
}

/** Standard page with consistent styles */
export function FormPage({
  children,
  landscape,
}: {
  children: React.ReactNode;
  landscape?: boolean;
}) {
  return (
    <Page
      size="LETTER"
      orientation={landscape ? "landscape" : "portrait"}
      style={landscape ? s.pageLandscape : s.page}
    >
      {children}
    </Page>
  );
}
