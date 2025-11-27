import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/18-visual-assessment-report.json';

interface TemplateField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  conditionalDisplay?: {
    field: string;
    operator: string;
    value: unknown;
  };
  itemSchema?: {
    fields: TemplateField[];
  };
  minItems?: number;
  maxItems?: number;
  options?: { value: string; label: string }[];
}

interface TemplateSection {
  id: string;
  title: string;
  order: number;
  fields: TemplateField[];
}

interface Template {
  name: string;
  category: string;
  version: string;
  compliance: {
    regulation: string;
    agency: string;
    requiredFields: string[];
  };
  schema: {
    sections: TemplateSection[];
  };
  offlineCapable: boolean;
}

const typedTemplate = template as unknown as Template;

describe('Visual Assessment Report Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('Visual Assessment Report');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have EPA MSGP compliance info', () => {
    expect(typedTemplate.compliance.regulation).toContain('EPA MSGP');
    expect(typedTemplate.compliance.agency).toBe('EPA');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have six sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(6);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('facility_permit_information');
    expect(sectionIds).toContain('visual_assessment_observations');
    expect(sectionIds).toContain('laboratory_analysis');
    expect(sectionIds).toContain('corrective_actions');
    expect(sectionIds).toContain('monitoring_data_summary');
    expect(sectionIds).toContain('certification_signature');
  });

  describe('Facility and Permit Information Section', () => {
    it('should have 12 facility information fields', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_permit_information'
      );
      expect(facilitySection?.fields.length).toBe(12);
    });

    it('should have reporting period fields', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_permit_information'
      );
      const fieldIds = facilitySection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('reporting_period_start');
      expect(fieldIds).toContain('reporting_period_end');
    });

    it('should have contact email field', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_permit_information'
      );
      const emailField = facilitySection?.fields.find(
        (f) => f.id === 'contact_email'
      );

      expect(emailField?.type).toBe('email');
    });
  });

  describe('Visual Assessment Observations Section', () => {
    it('should have observations repeater', () => {
      const obsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'visual_assessment_observations'
      );
      const obsField = obsSection?.fields.find((f) => f.id === 'observations');

      expect(obsField?.type).toBe('repeater');
      expect(obsField?.minItems).toBe(1);
    });

    it('should have visual assessment indicators', () => {
      const obsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'visual_assessment_observations'
      );
      const obsField = obsSection?.fields.find((f) => f.id === 'observations');
      const itemFields = obsField?.itemSchema?.fields || [];
      const itemFieldIds = itemFields.map((f) => f.id);

      expect(itemFieldIds).toContain('discharge_color');
      expect(itemFieldIds).toContain('discharge_odor');
      expect(itemFieldIds).toContain('discharge_clarity');
      expect(itemFieldIds).toContain('floating_solids');
      expect(itemFieldIds).toContain('suspended_solids');
      expect(itemFieldIds).toContain('foam');
      expect(itemFieldIds).toContain('oil_sheen');
    });

    it('should have visual assessment passed checkbox', () => {
      const obsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'visual_assessment_observations'
      );
      const obsField = obsSection?.fields.find((f) => f.id === 'observations');
      const itemFields = obsField?.itemSchema?.fields || [];

      const passedField = itemFields.find(
        (f) => f.id === 'visual_assessment_passed'
      );
      expect(passedField?.type).toBe('checkbox');
    });
  });

  describe('Laboratory Analysis Section', () => {
    it('should have lab results repeater', () => {
      const labSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'laboratory_analysis'
      );
      const labField = labSection?.fields.find((f) => f.id === 'lab_results');

      expect(labField?.type).toBe('repeater');
      expect(labField?.minItems).toBe(0);
    });

    it('should have water quality parameters', () => {
      const labSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'laboratory_analysis'
      );
      const labField = labSection?.fields.find((f) => f.id === 'lab_results');
      const itemFields = labField?.itemSchema?.fields || [];

      const phField = itemFields.find((f) => f.id === 'ph_value');
      const turbidityField = itemFields.find((f) => f.id === 'turbidity_ntu');
      const tssField = itemFields.find((f) => f.id === 'tss_mg_l');
      const oilGreaseField = itemFields.find((f) => f.id === 'oil_grease_mg_l');
      const bodField = itemFields.find((f) => f.id === 'bod_mg_l');
      const codField = itemFields.find((f) => f.id === 'cod_mg_l');

      expect(phField?.type).toBe('number');
      expect(turbidityField?.type).toBe('number');
      expect(tssField?.type).toBe('number');
      expect(oilGreaseField?.type).toBe('number');
      expect(bodField?.type).toBe('number');
      expect(codField?.type).toBe('number');
    });

    it('should have conditional exceedance description', () => {
      const labSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'laboratory_analysis'
      );
      const labField = labSection?.fields.find((f) => f.id === 'lab_results');
      const itemFields = labField?.itemSchema?.fields || [];

      const exceedDesc = itemFields.find(
        (f) => f.id === 'exceedance_description'
      );
      expect(exceedDesc?.conditionalDisplay?.field).toBe('exceedances_observed');
      expect(exceedDesc?.conditionalDisplay?.value).toBe(true);
    });

    it('should have lab certification fields', () => {
      const labSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'laboratory_analysis'
      );
      const labField = labSection?.fields.find((f) => f.id === 'lab_results');
      const itemFields = labField?.itemSchema?.fields || [];
      const itemFieldIds = itemFields.map((f) => f.id);

      expect(itemFieldIds).toContain('lab_name');
      expect(itemFieldIds).toContain('lab_cert_number');
    });
  });

  describe('Corrective Actions Section', () => {
    it('should have corrective actions repeater', () => {
      const actionsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'corrective_actions'
      );
      const actionsField = actionsSection?.fields.find(
        (f) => f.id === 'corrective_actions'
      );

      expect(actionsField?.type).toBe('repeater');
      expect(actionsField?.minItems).toBe(0);
    });

    it('should have action status tracking', () => {
      const actionsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'corrective_actions'
      );
      const actionsField = actionsSection?.fields.find(
        (f) => f.id === 'corrective_actions'
      );
      const itemFields = actionsField?.itemSchema?.fields || [];

      const statusField = itemFields.find((f) => f.id === 'action_status');
      expect(statusField?.type).toBe('select');
      const statusValues = statusField?.options?.map((o) => o.value) || [];
      expect(statusValues).toContain('planned');
      expect(statusValues).toContain('in_progress');
      expect(statusValues).toContain('completed');
    });

    it('should have conditional completion date', () => {
      const actionsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'corrective_actions'
      );
      const actionsField = actionsSection?.fields.find(
        (f) => f.id === 'corrective_actions'
      );
      const itemFields = actionsField?.itemSchema?.fields || [];

      const completionDate = itemFields.find((f) => f.id === 'completion_date');
      expect(completionDate?.conditionalDisplay?.field).toBe('action_status');
      expect(completionDate?.conditionalDisplay?.value).toBe('completed');
    });

    it('should have conditional followup date', () => {
      const actionsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'corrective_actions'
      );
      const actionsField = actionsSection?.fields.find(
        (f) => f.id === 'corrective_actions'
      );
      const itemFields = actionsField?.itemSchema?.fields || [];

      const followupDate = itemFields.find((f) => f.id === 'followup_date');
      expect(followupDate?.conditionalDisplay?.field).toBe('followup_required');
      expect(followupDate?.conditionalDisplay?.value).toBe(true);
    });
  });

  describe('Monitoring Data Summary Section', () => {
    it('should have at least 8 summary fields', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'monitoring_data_summary'
      );
      expect(summarySection?.fields.length).toBeGreaterThanOrEqual(8);
    });

    it('should have compliance checkbox', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'monitoring_data_summary'
      );
      const complianceField = summarySection?.fields.find(
        (f) => f.id === 'facility_in_compliance'
      );

      expect(complianceField?.type).toBe('checkbox');
    });

    it('should have observation count fields', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'monitoring_data_summary'
      );
      const fieldIds = summarySection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('total_observations_conducted');
      expect(fieldIds).toContain('observations_passed_visual');
      expect(fieldIds).toContain('observations_failed_visual');
    });

    it('should have lab sample count fields', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'monitoring_data_summary'
      );
      const fieldIds = summarySection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('lab_samples_collected');
      expect(fieldIds).toContain('lab_exceedances_detected');
    });
  });

  describe('Certification and Signature Section', () => {
    it('should have 5 certification fields', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification_signature'
      );
      expect(certSection?.fields.length).toBe(5);
    });

    it('should have required authorized signatory signature', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification_signature'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'authorized_signatory_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });

    it('should have preparer and signatory fields', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification_signature'
      );
      const fieldIds = certSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('preparer_name');
      expect(fieldIds).toContain('preparer_date');
      expect(fieldIds).toContain('authorized_signatory_name');
    });
  });
});
