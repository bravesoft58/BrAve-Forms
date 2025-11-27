import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/16-tmwa-inspection.json';

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

describe('TMWA Inspection Checklist Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('TMWA Inspection Checklist');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have TMWA compliance info with Lake Tahoe TMDL reference', () => {
    expect(typedTemplate.compliance.regulation).toContain('TMWA');
    expect(typedTemplate.compliance.regulation).toContain('Lake Tahoe TMDL');
    expect(typedTemplate.compliance.agency).toBe('Truckee Meadows Water Authority');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have six sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(6);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('site_information');
    expect(sectionIds).toContain('erosion_control_measures');
    expect(sectionIds).toContain('sediment_control_measures');
    expect(sectionIds).toContain('water_quality_protection');
    expect(sectionIds).toContain('findings_corrective_actions');
    expect(sectionIds).toContain('tmwa_certification');
  });

  describe('Site Information Section', () => {
    it('should have TMWA permit number field', () => {
      const siteSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_information'
      );
      expect(siteSection).toBeDefined();

      const permitField = siteSection?.fields.find(
        (f) => f.id === 'tmwa_permit_number'
      );
      expect(permitField?.type).toBe('text');
      expect(permitField?.required).toBe(true);
    });

    it('should have watershed select field', () => {
      const siteSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_information'
      );
      const watershedField = siteSection?.fields.find(
        (f) => f.id === 'watershed'
      );

      expect(watershedField?.type).toBe('select');
      const optionValues = watershedField?.options?.map((o) => o.value) || [];
      expect(optionValues).toContain('truckee_river');
      expect(optionValues).toContain('lake_tahoe');
    });

    it('should have Lake Tahoe TMDL checkbox', () => {
      const siteSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_information'
      );
      const tmdlField = siteSection?.fields.find(
        (f) => f.id === 'lake_tahoe_tmdl'
      );

      expect(tmdlField?.type).toBe('checkbox');
    });

    it('should have project type select', () => {
      const siteSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_information'
      );
      const projectTypeField = siteSection?.fields.find(
        (f) => f.id === 'project_type'
      );

      expect(projectTypeField?.type).toBe('select');
      const optionValues = projectTypeField?.options?.map((o) => o.value) || [];
      expect(optionValues).toContain('residential');
      expect(optionValues).toContain('commercial');
      expect(optionValues).toContain('roadway');
    });
  });

  describe('Erosion Control Measures Section', () => {
    it('should have multiple erosion control checkboxes', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_control_measures'
      );
      expect(erosionSection).toBeDefined();

      const checkboxFields = erosionSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ) || [];
      expect(checkboxFields.length).toBeGreaterThanOrEqual(10);
    });

    it('should have perimeter controls checkbox', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_control_measures'
      );
      const perimeterField = erosionSection?.fields.find(
        (f) => f.id === 'perimeter_controls_installed'
      );

      expect(perimeterField?.type).toBe('checkbox');
    });

    it('should have inlet protection fields', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_control_measures'
      );
      const fieldIds = erosionSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('inlet_protection_installed');
      expect(fieldIds).toContain('inlet_protection_maintained');
    });
  });

  describe('Sediment Control Measures Section', () => {
    it('should have sediment control checkboxes', () => {
      const sedimentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'sediment_control_measures'
      );
      expect(sedimentSection).toBeDefined();

      const checkboxFields = sedimentSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ) || [];
      expect(checkboxFields.length).toBeGreaterThanOrEqual(8);
    });

    it('should have silt fence and sediment trap fields', () => {
      const sedimentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'sediment_control_measures'
      );
      const fieldIds = sedimentSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('silt_fence_intact');
      expect(fieldIds).toContain('sediment_traps_functional');
    });
  });

  describe('Water Quality Protection Section', () => {
    it('should have concrete washout fields', () => {
      const waterSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'water_quality_protection'
      );
      const fieldIds = waterSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('concrete_washout_designated');
      expect(fieldIds).toContain('washout_contained');
      expect(fieldIds).toContain('no_concrete_discharge');
    });

    it('should have fuel and chemical storage fields', () => {
      const waterSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'water_quality_protection'
      );
      const fieldIds = waterSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('chemical_storage_compliant');
      expect(fieldIds).toContain('fuel_storage_compliant');
      expect(fieldIds).toContain('spill_kit_available');
    });

    it('should have Lake Tahoe BMPs field with conditional display', () => {
      const waterSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'water_quality_protection'
      );
      const lakeTahoeBmps = waterSection?.fields.find(
        (f) => f.id === 'lake_tahoe_bmps'
      );

      expect(lakeTahoeBmps?.type).toBe('checkbox');
      expect(lakeTahoeBmps?.conditionalDisplay?.field).toBe('lake_tahoe_tmdl');
      expect(lakeTahoeBmps?.conditionalDisplay?.value).toBe(true);
    });
  });

  describe('Findings and Corrective Actions Section', () => {
    it('should have findings repeater with max 20 items', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );
      expect(findingsSection).toBeDefined();

      const findingsField = findingsSection?.fields.find(
        (f) => f.id === 'findings'
      );
      expect(findingsField?.type).toBe('repeater');
      expect(findingsField?.maxItems).toBe(20);
    });

    it('should have severity levels in findings', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );
      const findingsField = findingsSection?.fields.find(
        (f) => f.id === 'findings'
      );
      const itemFields = findingsField?.itemSchema?.fields || [];

      const severityField = itemFields.find((f) => f.id === 'severity');
      expect(severityField?.type).toBe('select');
      const severityValues = severityField?.options?.map((o) => o.value) || [];
      expect(severityValues).toContain('minor');
      expect(severityValues).toContain('moderate');
      expect(severityValues).toContain('major');
    });

    it('should have corrective action tracking fields', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );
      const findingsField = findingsSection?.fields.find(
        (f) => f.id === 'findings'
      );
      const itemFields = findingsField?.itemSchema?.fields || [];
      const itemFieldIds = itemFields.map((f) => f.id);

      expect(itemFieldIds).toContain('corrective_action_required');
      expect(itemFieldIds).toContain('corrective_action_completed');
      expect(itemFieldIds).toContain('completion_date');
    });

    it('should have conditional completion date field', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );
      const findingsField = findingsSection?.fields.find(
        (f) => f.id === 'findings'
      );
      const itemFields = findingsField?.itemSchema?.fields || [];

      const completionDate = itemFields.find((f) => f.id === 'completion_date');
      expect(completionDate?.conditionalDisplay?.field).toBe(
        'corrective_action_completed'
      );
      expect(completionDate?.conditionalDisplay?.value).toBe(true);
    });
  });

  describe('TMWA Certification Section', () => {
    it('should have SWPPP onsite checkbox as required', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'tmwa_certification'
      );
      const swpppField = certSection?.fields.find(
        (f) => f.id === 'swppp_onsite'
      );

      expect(swpppField?.type).toBe('checkbox');
      expect(swpppField?.required).toBe(true);
    });

    it('should have training current checkbox as required', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'tmwa_certification'
      );
      const trainingField = certSection?.fields.find(
        (f) => f.id === 'training_current'
      );

      expect(trainingField?.type).toBe('checkbox');
      expect(trainingField?.required).toBe(true);
    });

    it('should have compliance status select field', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'tmwa_certification'
      );
      const statusField = certSection?.fields.find(
        (f) => f.id === 'compliance_status'
      );

      expect(statusField?.type).toBe('select');
      expect(statusField?.required).toBe(true);
      const statusValues = statusField?.options?.map((o) => o.value) || [];
      expect(statusValues).toContain('in_compliance');
      expect(statusValues).toContain('minor_deficiencies');
      expect(statusValues).toContain('major_deficiencies');
    });

    it('should have inspector signature requirement', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'tmwa_certification'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'inspector_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });

    it('should have next inspection date field', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'tmwa_certification'
      );
      const nextInspField = certSection?.fields.find(
        (f) => f.id === 'next_inspection_date'
      );

      expect(nextInspField?.type).toBe('date');
      expect(nextInspField?.required).toBe(true);
    });
  });
});
