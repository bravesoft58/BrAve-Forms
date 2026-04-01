import React from "react";
import { View, Text, Page } from "@react-pdf/renderer";
import {
  MultiPageDocument,
  Section,
  FieldRow,
  Field,
  CheckItem,
  SignatureBlock,
  s,
  colors,
} from "./primitives";
import {
  NDEP_SAD_BMP_OPTIONS,
  NDEP_SAD_ATTACHMENT_ITEMS,
  NDEP_SAD_APP_TYPE_LABELS,
  type NdepSadData,
  type AddressBlock,
  type ContactBlock,
} from "@/lib/schemas/ndep-sad";

interface Props {
  data: NdepSadData;
  projectName: string;
  formDate: string;
}

function AddressSection({ title, block }: { title: string; block: AddressBlock | ContactBlock }) {
  const contact = block as ContactBlock;
  return (
    <>
      <View style={[s.sectionHeader, { marginTop: 6 }]}>
        <Text style={[s.sectionHeaderText, { fontSize: 9 }]}>{title}</Text>
      </View>
      <FieldRow>
        <Field label="Name" value={block.name} />
        <Field label="Street" value={block.street} />
      </FieldRow>
      <FieldRow>
        <Field label="City" value={block.city} />
        <Field label="State" value={block.state} width="15%" />
        <Field label="ZIP" value={block.zip} width="15%" />
      </FieldRow>
      {"title" in contact && contact.title && (
        <FieldRow>
          <Field label="Title" value={contact.title} />
          <Field label="Phone" value={contact.phone} />
          <Field label="Fax" value={contact.fax} />
          <Field label="Email" value={contact.email} />
        </FieldRow>
      )}
    </>
  );
}

export function NdepSadPdf({ data, projectName, formDate }: Props) {
  const bmpChecks = data.bmp_checkboxes ?? {};
  const attachChecks = data.attachment_checklist ?? {};

  return (
    <MultiPageDocument title={`NDEP SAD Application - ${projectName} - ${formDate}`}>
      {/* PAGE 1 — Header + Address Blocks */}
      <Page size="LETTER" style={s.page}>
        <View style={s.titleBanner}>
          <Text style={s.titleText}>NDEP Surface Area Disturbance (SAD) Application</Text>
        </View>

        {/* Application Info */}
        <Section title="Application Information" />
        <FieldRow>
          <Field
            label="Application Type"
            value={data.application_type ? NDEP_SAD_APP_TYPE_LABELS[data.application_type] || data.application_type : "---"}
          />
        </FieldRow>
        <FieldRow>
          <Field label="Facility Name" value={data.facility_name} />
          <Field label="Existing Facility ID" value={data.existing_facility_id} width="25%" />
          <Field label="Existing AQOP" value={data.existing_aqop} width="25%" />
        </FieldRow>

        {/* 6 Address Blocks */}
        <Section title="General Company Information" />
        <AddressSection title="Company" block={data.company} />
        <AddressSection title="Owner" block={data.owner} />
        <AddressSection title="Site / Plant" block={data.site_plant} />
        <AddressSection title="Records Location" block={data.records_location} />
        <AddressSection title="Responsible Official" block={data.responsible_official} />
        <AddressSection title="Site Manager" block={data.site_manager} />
      </Page>

      {/* PAGE 2 — Location + SAD Details + BMPs + Attachments */}
      <Page size="LETTER" style={s.page}>
        {/* Location Details */}
        <Section title="Location Details" />
        <FieldRow>
          <Field label="Township" value={data.township} />
          <Field label="Range" value={data.range} />
          <Field label="Section" value={data.section} />
        </FieldRow>
        <FieldRow>
          <Field label="UTM Easting" value={data.utm_easting} />
          <Field label="UTM Northing" value={data.utm_northing} />
        </FieldRow>
        <FieldRow>
          <Field label="Hydrographic Basin" value={data.hydrographic_basin} />
          <Field label="County" value={data.county} />
          <Field label="Nearest City" value={data.nearest_city} />
        </FieldRow>
        {data.driving_directions && (
          <View style={s.mb4}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label }]}>Driving Directions</Text>
            <Text>{data.driving_directions}</Text>
          </View>
        )}

        {/* SAD Details */}
        <Section title="Surface Area Disturbance Details" />
        <FieldRow>
          <Field label="Project Name" value={data.project_name || projectName} />
          <Field label="Total Acres" value={data.total_acres} width="20%" />
        </FieldRow>
        {(data.water_truck_count || data.water_truck_capacity) && (
          <FieldRow>
            <Field label="Water Truck Count" value={data.water_truck_count} />
            <Field label="Water Truck Capacity" value={data.water_truck_capacity} />
          </FieldRow>
        )}

        {/* BMP Checkboxes */}
        <Section title="Best Management Practices (BMPs)" />
        <View style={{ marginTop: 2 }}>
          {NDEP_SAD_BMP_OPTIONS.map((opt) => (
            <CheckItem key={opt} label={opt} checked={bmpChecks[opt] === true} />
          ))}
        </View>

        {/* Attachment Checklist */}
        <Section title="Certification Attachment Checklist" />
        <View style={{ marginTop: 2 }}>
          {NDEP_SAD_ATTACHMENT_ITEMS.map((item) => (
            <CheckItem key={item} label={item} checked={attachChecks[item] === true} />
          ))}
        </View>

        {/* Signature */}
        <View style={s.signatureBlock}>
          <SignatureBlock
            label="Authorized Signature"
            name={data.signature}
            date={data.signature_date}
          />
        </View>
      </Page>
    </MultiPageDocument>
  );
}
