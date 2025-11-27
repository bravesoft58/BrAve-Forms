import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/17-quarterly-visual-assessment.json';

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
    frequency?: string;
  };
  schema: {
    sections: TemplateSection[];
  };
  offlineCapable: boolean;
}

const typedTemplate = template as unknown as Template;

describe('Quarterly Visual Assessment Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('Quarterly Visual Assessment');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have EPA MSGP compliance metadata', () => {
    expect(typedTemplate.compliance.regulation).toContain('EPA MSGP');
    expect(typedTemplate.compliance.agency).toBe('EPA');
    expect(typedTemplate.compliance.frequency).toContain('Quarterly');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have five sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(5);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('facility_information');
    expect(sectionIds).toContain('discharge_point_assessments');
    expect(sectionIds).toContain('photograph_documentation');
    expect(sectionIds).toContain('overall_assessment_summary');
    expect(sectionIds).toContain('certification');
  });

  describe('Facility Information Section', () => {
    it('should have NPDES permit number field', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_information'
      );
      const permitField = facilitySection?.fields.find(
        (f) => f.id === 'npdes_permit_number'
      );

      expect(permitField?.type).toBe('text');
      expect(permitField?.required).toBe(true);
    });

    it('should have assessment quarter select', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_information'
      );
      const quarterField = facilitySection?.fields.find(
        (f) => f.id === 'assessment_quarter'
      );

      expect(quarterField?.type).toBe('select');
      expect(quarterField?.required).toBe(true);
      const optionValues = quarterField?.options?.map((o) => o.value) || [];
      expect(optionValues).toContain('q1');
      expect(optionValues).toContain('q2');
      expect(optionValues).toContain('q3');
      expect(optionValues).toContain('q4');
    });

    it('should have weather conditions field', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_information'
      );
      const weatherField = facilitySection?.fields.find(
        (f) => f.id === 'weather_conditions'
      );

      expect(weatherField?.type).toBe('select');
      const weatherValues = weatherField?.options?.map((o) => o.value) || [];
      expect(weatherValues).toContain('clear');
      expect(weatherValues).toContain('rain_current');
      expect(weatherValues).toContain('rain_previous_48h');
    });
  });

  describe('Discharge Point Assessments Section', () => {
    it('should have discharge points repeater', () => {
      const dischargeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'discharge_point_assessments'
      );
      expect(dischargeSection).toBeDefined();

      const dischargeField = dischargeSection?.fields.find(
        (f) => f.id === 'discharge_points'
      );
      expect(dischargeField?.type).toBe('repeater');
      expect(dischargeField?.minItems).toBe(1);
    });

    it('should have visual assessment parameters', () => {
      const dischargeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'discharge_point_assessments'
      );
      const dischargeField = dischargeSection?.fields.find(
        (f) => f.id === 'discharge_points'
      );
      const itemFields = dischargeField?.itemSchema?.fields || [];
      const itemFieldIds = itemFields.map((f) => f.id);

      expect(itemFieldIds).toContain('color');
      expect(itemFieldIds).toContain('odor');
      expect(itemFieldIds).toContain('clarity');
      expect(itemFieldIds).toContain('floating_materials');
      expect(itemFieldIds).toContain('settled_solids');
      expect(itemFieldIds).toContain('foam');
      expect(itemFieldIds).toContain('oil_sheen');
    });

    it('should have conditional floating materials description', () => {
      const dischargeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'discharge_point_assessments'
      );
      const dischargeField = dischargeSection?.fields.find(
        (f) => f.id === 'discharge_points'
      );
      const itemFields = dischargeField?.itemSchema?.fields || [];

      const floatingDesc = itemFields.find(
        (f) => f.id === 'floating_materials_description'
      );
      expect(floatingDesc?.conditionalDisplay?.field).toBe('floating_materials');
      expect(floatingDesc?.conditionalDisplay?.value).toBe(true);
    });

    it('should have conditional settled solids description', () => {
      const dischargeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'discharge_point_assessments'
      );
      const dischargeField = dischargeSection?.fields.find(
        (f) => f.id === 'discharge_points'
      );
      const itemFields = dischargeField?.itemSchema?.fields || [];

      const settledDesc = itemFields.find(
        (f) => f.id === 'settled_solids_description'
      );
      expect(settledDesc?.conditionalDisplay?.field).toBe('settled_solids');
      expect(settledDesc?.conditionalDisplay?.value).toBe(true);
    });

    it('should have conditional corrective action description', () => {
      const dischargeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'discharge_point_assessments'
      );
      const dischargeField = dischargeSection?.fields.find(
        (f) => f.id === 'discharge_points'
      );
      const itemFields = dischargeField?.itemSchema?.fields || [];

      const correctiveDesc = itemFields.find(
        (f) => f.id === 'corrective_action_description'
      );
      expect(correctiveDesc?.conditionalDisplay?.field).toBe(
        'corrective_action_required'
      );
    });

    it('should have color select with EPA visual assessment options', () => {
      const dischargeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'discharge_point_assessments'
      );
      const dischargeField = dischargeSection?.fields.find(
        (f) => f.id === 'discharge_points'
      );
      const itemFields = dischargeField?.itemSchema?.fields || [];

      const colorField = itemFields.find((f) => f.id === 'color');
      expect(colorField?.type).toBe('select');
      const colorValues = colorField?.options?.map((o) => o.value) || [];
      expect(colorValues).toContain('clear');
      expect(colorValues).toContain('brown');
      expect(colorValues).toContain('gray');
    });
  });

  describe('Photograph Documentation Section', () => {
    it('should have photographs repeater with minimum 4 photos', () => {
      const photoSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'photograph_documentation'
      );
      expect(photoSection).toBeDefined();

      const photoField = photoSection?.fields.find((f) => f.id === 'photographs');
      expect(photoField?.type).toBe('repeater');
      expect(photoField?.minItems).toBe(4);
    });

    it('should have required photo upload field', () => {
      const photoSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'photograph_documentation'
      );
      const photoField = photoSection?.fields.find((f) => f.id === 'photographs');
      const itemFields = photoField?.itemSchema?.fields || [];

      const uploadField = itemFields.find((f) => f.id === 'photo_upload');
      expect(uploadField?.type).toBe('photo');
      expect(uploadField?.required).toBe(true);
    });

    it('should have GPS coordinate fields for photos', () => {
      const photoSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'photograph_documentation'
      );
      const photoField = photoSection?.fields.find((f) => f.id === 'photographs');
      const itemFields = photoField?.itemSchema?.fields || [];
      const itemFieldIds = itemFields.map((f) => f.id);

      expect(itemFieldIds).toContain('photo_gps_lat');
      expect(itemFieldIds).toContain('photo_gps_lon');
    });

    it('should have photo timestamp field', () => {
      const photoSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'photograph_documentation'
      );
      const photoField = photoSection?.fields.find((f) => f.id === 'photographs');
      const itemFields = photoField?.itemSchema?.fields || [];

      const timestampField = itemFields.find((f) => f.id === 'photo_timestamp');
      expect(timestampField?.type).toBe('datetime-local');
      expect(timestampField?.required).toBe(true);
    });
  });

  describe('Overall Assessment Summary Section', () => {
    it('should have required all discharge points assessed checkbox', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'overall_assessment_summary'
      );
      const allAssessedField = summarySection?.fields.find(
        (f) => f.id === 'all_discharge_points_assessed'
      );

      expect(allAssessedField?.type).toBe('checkbox');
      expect(allAssessedField?.required).toBe(true);
    });

    it('should have conditional pollutant description', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'overall_assessment_summary'
      );
      const pollutantDesc = summarySection?.fields.find(
        (f) => f.id === 'pollutant_description'
      );

      expect(pollutantDesc?.conditionalDisplay?.field).toBe(
        'significant_pollutants_observed'
      );
    });

    it('should have next assessment date as required', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'overall_assessment_summary'
      );
      const nextDate = summarySection?.fields.find(
        (f) => f.id === 'next_assessment_date'
      );

      expect(nextDate?.type).toBe('date');
      expect(nextDate?.required).toBe(true);
    });
  });

  describe('Certification Section', () => {
    it('should have certification statement with legal language', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification'
      );
      const certField = certSection?.fields.find(
        (f) => f.id === 'certification_statement'
      );

      expect(certField?.type).toBe('checkbox');
      expect(certField?.required).toBe(true);
      expect(certField?.label).toContain('penalty of law');
    });

    it('should have required certifier title for authorized signatory', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification'
      );
      const titleField = certSection?.fields.find(
        (f) => f.id === 'certifier_title'
      );

      expect(titleField?.type).toBe('text');
      expect(titleField?.required).toBe(true);
    });

    it('should have required certifier signature', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'certifier_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });
  });
});
