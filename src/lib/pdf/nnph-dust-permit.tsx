import React from "react";
import { View, Text, Page } from "@react-pdf/renderer";
import {
  MultiPageDocument,
  Section,
  FieldRow,
  Field,
  CheckItem,
  YNField,
  SignatureBlock,
  s,
  colors,
} from "./primitives";
import type { NnphDustPermitData, ContactInfo, DustControlMethod } from "@/lib/schemas/nnph-dust-permit";

interface Props {
  data: NnphDustPermitData;
  projectName: string;
  formDate: string;
}

const APP_TYPE_LABELS: Record<string, string> = {
  new: "New",
  renewal: "Renewal",
  modification: "Modification",
};

function ContactSection({ title, note, contact }: { title: string; note?: string; contact: ContactInfo }) {
  return (
    <>
      <View style={[s.sectionHeader, { marginTop: 6 }]}>
        <Text style={s.sectionHeaderText}>
          {title}
          {note && <Text style={{ fontFamily: "Helvetica", fontSize: 7 }}> {note}</Text>}
        </Text>
      </View>
      <FieldRow>
        <Field label="Company Name" value={contact.company} />
      </FieldRow>
      <FieldRow>
        <Field label="Address" value={contact.address} />
      </FieldRow>
      <FieldRow>
        <Field label="City" value={contact.city} />
        <Field label="State" value={contact.state} width="15%" />
        <Field label="ZIP" value={contact.zip} width="15%" />
      </FieldRow>
      <FieldRow>
        <Field label="Contact Name" value={contact.name} />
        <Field label="Phone" value={contact.phone} />
        <Field label="Email" value={contact.email} />
      </FieldRow>
    </>
  );
}

export function NnphDustPermitPdf({ data, projectName, formDate }: Props) {
  const methods = data.dust_control_methods ?? [];

  return (
    <MultiPageDocument title={`NNPH Dust Permit - ${projectName} - ${formDate}`}>
      {/* PAGE 1 — Application Info + Contacts */}
      <Page size="LETTER" style={s.page}>
        <View style={s.titleBanner}>
          <Text style={s.titleText}>DUST CONTROL PERMIT APPLICATION</Text>
          <Text style={s.subtitle}>Northern Nevada Public Health &mdash; Air Quality Management Division</Text>
        </View>

        {/* Application Information */}
        <Section title="Application Information" />
        <FieldRow>
          <Field label="Application Type" value={APP_TYPE_LABELS[data.application_type] || data.application_type} />
          <Field label="Permit Number" value={data.permit_number} width="30%" />
        </FieldRow>
        <FieldRow>
          <Field label="Project/Development Name" value={data.project_name || projectName} />
        </FieldRow>
        <FieldRow>
          <Field label="APN(s)" value={data.apn} />
          <Field label="Size (acres)" value={data.acres} width="20%" />
        </FieldRow>
        <FieldRow>
          <Field label="Project Start Date" value={data.start_date} />
          <Field label="Project Completion Date" value={data.end_date} />
        </FieldRow>

        {/* Applicant + Contractor */}
        <ContactSection title="Applicant Information" contact={data.applicant} />
        <ContactSection
          title="General Contractor Information"
          note="(all fields must be completed, even if same as applicant)"
          contact={data.contractor}
        />

        {/* After-Hours Contacts */}
        <Section title="After-Hours Contact Information" />
        <View style={{ marginTop: 2 }}>
          <Text style={[s.bold, { fontSize: 8, marginBottom: 2 }]}>After-Hours Contact #1</Text>
          <FieldRow>
            <Field label="Contact Name" value={data.emergency_contact_1?.name} />
            <Field label="Mobile Phone" value={data.emergency_contact_1?.phone} />
          </FieldRow>
          <Text style={[s.bold, { fontSize: 8, marginBottom: 2, marginTop: 4 }]}>After-Hours Contact #2</Text>
          <FieldRow>
            <Field label="Contact Name" value={data.emergency_contact_2?.name} />
            <Field label="Mobile Phone" value={data.emergency_contact_2?.phone} />
          </FieldRow>
        </View>

        {/* Signature */}
        <View style={[s.mt4, { marginTop: 10 }]}>
          <Text style={[s.italic, { fontSize: 7, textAlign: "center", marginBottom: 6 }]}>
            By signing, the applicant shall constitute agreement to accept responsibility for maintaining
            compliance with the conditions of the permit and DBOH 040.030 24 hours per day, 7 days per week.
          </Text>
        </View>
        <View style={s.signatureBlock}>
          <SignatureBlock
            label="Responsible Official (Applicant) Signature"
            name={data.signature}
            date={data.signature_date}
          />
        </View>
      </Page>

      {/* PAGE 2 — Project Details + Dust Control Methods */}
      <Page size="LETTER" style={s.page}>
        <Section title="Project/Development Information" />

        {data.project_description && (
          <View style={s.mb8}>
            <Text style={[s.bold, { fontSize: 7, color: colors.label, marginBottom: 1 }]}>
              Detailed Description
            </Text>
            <Text>{data.project_description}</Text>
          </View>
        )}

        <FieldRow>
          <Field label="Type of Project" value={data.project_type} />
        </FieldRow>
        <FieldRow>
          <Field label="Fill Material Source" value={data.fill_material_source} />
          <Field label="Excavation Amount (yd3)" value={data.excavation_amount} />
        </FieldRow>
        <FieldRow>
          <YNField label="Crushing/Screening Equipment?" value={data.crushing_equipment} />
          <Field label="Stationary Source Permit #" value={data.stationary_source_permit} />
        </FieldRow>
        <FieldRow>
          <Field label="On-site Soil Type" value={data.soil_type} />
          <YNField label="Soil Analysis Available?" value={data.soil_analysis_available} />
        </FieldRow>

        {/* Dust Control Methods */}
        <Section title="Dust Control Methods" />
        <View style={{ marginTop: 2 }}>
          {methods.map((m: DustControlMethod, i: number) => (
            <View key={i} style={{ marginBottom: 3 }}>
              <CheckItem label={m.method} checked={m.enabled} />
              {m.enabled && m.details && (
                <Text style={[s.muted, { marginLeft: 18 }]}>Details: {m.details}</Text>
              )}
            </View>
          ))}
        </View>

        <FieldRow>
          <YNField label="Temporary Irrigation?" value={data.temporary_irrigation} />
          <Field label="Irrigation Details" value={data.irrigation_details} />
        </FieldRow>
        <FieldRow>
          <Field label="On-Site Speed Limit" value={data.speed_limit} />
        </FieldRow>
        <FieldRow>
          <Field label="Trackout Control Method" value={data.trackout_control} />
        </FieldRow>
        <FieldRow>
          <Field label="Unauthorized Traffic Prevention" value={data.unauthorized_traffic_prevention} />
        </FieldRow>

        {/* Track-out Warning */}
        <View style={[s.mt4, { padding: 6, borderWidth: 0.5, borderColor: colors.border }]}>
          <Text style={[s.italic, s.bold, { fontSize: 7 }]}>
            Cleanup of track out shall be performed at least daily and more frequently as needed
            to prevent accumulation. Reference DBOH 040.030 for full compliance requirements.
          </Text>
        </View>

        {/* Permanent Stabilization Notice */}
        <View style={[s.mt4, { textAlign: "center" }]}>
          <Text style={[s.bold, { fontSize: 7.5 }]}>
            Permanent stabilization methods such as construction of buildings, parking lots, etc.,
            landscaping, revegetation, chemical sealant/palliative, or other approved method(s) of
            stabilization must occur prior to closure of a Dust Control Permit.
          </Text>
        </View>

        {/* Footer */}
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
          1001 E. Ninth Street, Suite B171, Reno, NV 89512 | Phone: 775.784.7200 | Fax: 775.784.7225 | OurCleanAir.com
        </Text>
      </Page>
    </MultiPageDocument>
  );
}
