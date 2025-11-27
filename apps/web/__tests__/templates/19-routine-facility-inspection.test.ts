import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/19-routine-facility-inspection.json';

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

describe('Routine Facility Inspection Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('Routine Facility Inspection');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have EPA SPCC compliance metadata', () => {
    expect(typedTemplate.compliance.regulation).toContain('EPA SPCC');
    expect(typedTemplate.compliance.regulation).toContain('40 CFR Part 112');
    expect(typedTemplate.compliance.agency).toBe('EPA');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have seven sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(7);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('facility_information');
    expect(sectionIds).toContain('equipment_condition_assessment');
    expect(sectionIds).toContain('spill_prevention_measures');
    expect(sectionIds).toContain('housekeeping_standards');
    expect(sectionIds).toContain('material_storage_compliance');
    expect(sectionIds).toContain('findings_corrective_actions');
    expect(sectionIds).toContain('inspector_certification');
  });

  describe('Facility Information Section', () => {
    it('should have 10 facility information fields', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_information'
      );
      expect(facilitySection?.fields.length).toBe(10);
    });

    it('should have inspection frequency select', () => {
      const facilitySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'facility_information'
      );
      const freqField = facilitySection?.fields.find(
        (f) => f.id === 'inspection_frequency'
      );

      expect(freqField?.type).toBe('select');
      const optionValues = freqField?.options?.map((o) => o.value) || [];
      expect(optionValues).toContain('weekly');
      expect(optionValues).toContain('monthly');
      expect(optionValues).toContain('quarterly');
    });
  });

  describe('Equipment Condition Assessment Section', () => {
    it('should have equipment inspections repeater', () => {
      const equipSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'equipment_condition_assessment'
      );
      expect(equipSection).toBeDefined();

      const equipField = equipSection?.fields.find(
        (f) => f.id === 'equipment_inspections'
      );
      expect(equipField?.type).toBe('repeater');
      expect(equipField?.minItems).toBe(1);
      expect(equipField?.maxItems).toBe(50);
    });

    it('should have equipment type select with correct options', () => {
      const equipSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'equipment_condition_assessment'
      );
      const equipField = equipSection?.fields.find(
        (f) => f.id === 'equipment_inspections'
      );
      const itemFields = equipField?.itemSchema?.fields || [];

      const typeField = itemFields.find((f) => f.id === 'equipment_type');
      expect(typeField?.type).toBe('select');
      const typeValues = typeField?.options?.map((o) => o.value) || [];
      expect(typeValues).toContain('storage_tank');
      expect(typeValues).toContain('transfer_pump');
      expect(typeValues).toContain('piping');
      expect(typeValues).toContain('valve');
    });

    it('should have conditional leak description field', () => {
      const equipSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'equipment_condition_assessment'
      );
      const equipField = equipSection?.fields.find(
        (f) => f.id === 'equipment_inspections'
      );
      const itemFields = equipField?.itemSchema?.fields || [];

      const leakDesc = itemFields.find((f) => f.id === 'leak_description');
      expect(leakDesc?.conditionalDisplay?.field).toBe('leaks_observed');
      expect(leakDesc?.conditionalDisplay?.value).toBe(true);
    });

    it('should have conditional corrosion severity field', () => {
      const equipSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'equipment_condition_assessment'
      );
      const equipField = equipSection?.fields.find(
        (f) => f.id === 'equipment_inspections'
      );
      const itemFields = equipField?.itemSchema?.fields || [];

      const corrosionSev = itemFields.find((f) => f.id === 'corrosion_severity');
      expect(corrosionSev?.conditionalDisplay?.field).toBe('corrosion_observed');
      expect(corrosionSev?.conditionalDisplay?.value).toBe(true);
    });

    it('should have visual condition select', () => {
      const equipSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'equipment_condition_assessment'
      );
      const equipField = equipSection?.fields.find(
        (f) => f.id === 'equipment_inspections'
      );
      const itemFields = equipField?.itemSchema?.fields || [];

      const condField = itemFields.find((f) => f.id === 'visual_condition');
      expect(condField?.type).toBe('select');
      const condValues = condField?.options?.map((o) => o.value) || [];
      expect(condValues).toContain('good');
      expect(condValues).toContain('fair');
      expect(condValues).toContain('poor');
    });
  });

  describe('Spill Prevention Measures Section', () => {
    it('should have exactly 12 spill prevention checkboxes', () => {
      const spillSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'spill_prevention_measures'
      );
      expect(spillSection?.fields.length).toBe(12);

      const checkboxCount = spillSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ).length;
      expect(checkboxCount).toBe(12);
    });

    it('should have 110% containment capacity checkbox', () => {
      const spillSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'spill_prevention_measures'
      );
      const containmentField = spillSection?.fields.find(
        (f) => f.id === 'containment_capacity_adequate'
      );

      expect(containmentField?.type).toBe('checkbox');
      expect(containmentField?.label).toContain('110%');
    });

    it('should have SPCC plan onsite checkbox', () => {
      const spillSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'spill_prevention_measures'
      );
      const spccField = spillSection?.fields.find(
        (f) => f.id === 'spcc_plan_onsite'
      );

      expect(spccField?.type).toBe('checkbox');
    });
  });

  describe('Housekeeping Standards Section', () => {
    it('should have exactly 10 housekeeping checkboxes', () => {
      const houseSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'housekeeping_standards'
      );
      expect(houseSection?.fields.length).toBe(10);

      const checkboxCount = houseSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ).length;
      expect(checkboxCount).toBe(10);
    });

    it('should have safety-related checkboxes', () => {
      const houseSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'housekeeping_standards'
      );
      const fieldIds = houseSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('fire_extinguishers_accessible');
      expect(fieldIds).toContain('ventilation_functioning');
      expect(fieldIds).toContain('incompatible_materials_separated');
    });
  });

  describe('Material Storage Compliance Section', () => {
    it('should have storage areas repeater', () => {
      const storageSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'material_storage_compliance'
      );
      const storageField = storageSection?.fields.find(
        (f) => f.id === 'storage_areas'
      );

      expect(storageField?.type).toBe('repeater');
      expect(storageField?.minItems).toBe(0);
      expect(storageField?.maxItems).toBe(25);
    });

    it('should have conditional containment capacity field', () => {
      const storageSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'material_storage_compliance'
      );
      const storageField = storageSection?.fields.find(
        (f) => f.id === 'storage_areas'
      );
      const itemFields = storageField?.itemSchema?.fields || [];

      const capField = itemFields.find((f) => f.id === 'containment_capacity');
      expect(capField?.conditionalDisplay?.field).toBe('secondary_containment');
      expect(capField?.conditionalDisplay?.value).toBe(true);
    });

    it('should have SDS availability checkbox', () => {
      const storageSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'material_storage_compliance'
      );
      const storageField = storageSection?.fields.find(
        (f) => f.id === 'storage_areas'
      );
      const itemFields = storageField?.itemSchema?.fields || [];

      const sdsField = itemFields.find((f) => f.id === 'sds_available');
      expect(sdsField?.type).toBe('checkbox');
    });
  });

  describe('Findings and Corrective Actions Section', () => {
    it('should have 8 findings fields', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );
      expect(findingsSection?.fields.length).toBe(8);
    });

    it('should have conditional deficiency count and summary', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );

      const countField = findingsSection?.fields.find(
        (f) => f.id === 'deficiency_count'
      );
      expect(countField?.conditionalDisplay?.field).toBe('deficiencies_found');

      const summaryField = findingsSection?.fields.find(
        (f) => f.id === 'deficiency_summary'
      );
      expect(summaryField?.conditionalDisplay?.field).toBe('deficiencies_found');
    });

    it('should have next inspection date as required', () => {
      const findingsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'findings_corrective_actions'
      );
      const nextInsp = findingsSection?.fields.find(
        (f) => f.id === 'next_inspection_date'
      );

      expect(nextInsp?.type).toBe('date');
      expect(nextInsp?.required).toBe(true);
    });
  });

  describe('Inspector Certification Section', () => {
    it('should have 3 certification fields', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspector_certification'
      );
      expect(certSection?.fields.length).toBe(3);
    });

    it('should have required certification checkbox', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspector_certification'
      );
      const certField = certSection?.fields.find(
        (f) => f.id === 'inspector_certification'
      );

      expect(certField?.type).toBe('checkbox');
      expect(certField?.required).toBe(true);
    });

    it('should have required signature field', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspector_certification'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'inspector_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });
  });

  describe('Template Compliance Totals', () => {
    it('should have 22 total checkboxes for spill prevention and housekeeping', () => {
      const spillSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'spill_prevention_measures'
      );
      const houseSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'housekeeping_standards'
      );

      const spillCheckboxes = spillSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ).length || 0;
      const houseCheckboxes = houseSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ).length || 0;

      expect(spillCheckboxes + houseCheckboxes).toBe(22);
    });
  });
});
