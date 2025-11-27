import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/22-ndot-swppp.json';

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
  defaultValue?: unknown;
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

describe('NDOT SWPPP Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('NDOT SWPPP');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have NDOT and EPA CGP compliance', () => {
    expect(typedTemplate.compliance.regulation).toContain('NDOT SWPPP Form 018-002');
    expect(typedTemplate.compliance.regulation).toContain('NDOT Construction Site BMPs Manual');
    expect(typedTemplate.compliance.regulation).toContain('NVR100000');
    expect(typedTemplate.compliance.regulation).toContain('EPA CGP 2022');
    expect(typedTemplate.compliance.agency).toBe('Nevada DOT Environmental Division');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have eleven sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(11);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('ndot_project_information');
    expect(sectionIds).toContain('contractor_wpcm_information');
    expect(sectionIds).toContain('project_description');
    expect(sectionIds).toContain('erosion_control_plan');
    expect(sectionIds).toContain('sediment_control_plan');
    expect(sectionIds).toContain('good_housekeeping_controls');
    expect(sectionIds).toContain('traffic_control_impacts');
    expect(sectionIds).toContain('stabilization_requirements');
    expect(sectionIds).toContain('inspection_procedures');
    expect(sectionIds).toContain('swppp_amendments');
    expect(sectionIds).toContain('certification');
  });

  describe('NDOT Project Information Section', () => {
    it('should have 16 project information fields', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'ndot_project_information'
      );
      expect(projectSection?.fields.length).toBe(16);
    });

    it('should have required NDOT project number', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'ndot_project_information'
      );
      const projectNumField = projectSection?.fields.find(
        (f) => f.id === 'ndot_project_number'
      );

      expect(projectNumField?.type).toBe('text');
      expect(projectNumField?.required).toBe(true);
    });

    it('should have required route number and type', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'ndot_project_information'
      );
      const routeNumField = projectSection?.fields.find(
        (f) => f.id === 'route_number'
      );
      const routeTypeField = projectSection?.fields.find(
        (f) => f.id === 'route_type'
      );

      expect(routeNumField?.required).toBe(true);
      expect(routeTypeField?.type).toBe('select');
      const routeTypes = routeTypeField?.options?.map((o) => o.value) || [];
      expect(routeTypes).toContain('interstate');
      expect(routeTypes).toContain('us_route');
      expect(routeTypes).toContain('state_route');
    });

    it('should have mile post fields', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'ndot_project_information'
      );
      const fieldIds = projectSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('begin_mile_post');
      expect(fieldIds).toContain('end_mile_post');
    });

    it('should have NDOT district select', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'ndot_project_information'
      );
      const districtField = projectSection?.fields.find(
        (f) => f.id === 'district'
      );

      expect(districtField?.type).toBe('select');
      const districts = districtField?.options?.map((o) => o.value) || [];
      expect(districts).toContain('district_1');
      expect(districts).toContain('district_2');
      expect(districts).toContain('district_3');
    });

    it('should have Nevada county select with 17 counties', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'ndot_project_information'
      );
      const countyField = projectSection?.fields.find((f) => f.id === 'county');

      expect(countyField?.type).toBe('select');
      expect(countyField?.options?.length).toBe(17);
    });
  });

  describe('Contractor and WPCM Information Section', () => {
    it('should have required WPCM (Water Pollution Control Manager) fields', () => {
      const wpcmSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'contractor_wpcm_information'
      );
      const wpcmName = wpcmSection?.fields.find((f) => f.id === 'wpcm_name');
      const wpcmPhone = wpcmSection?.fields.find((f) => f.id === 'wpcm_phone');

      expect(wpcmName?.required).toBe(true);
      expect(wpcmPhone?.required).toBe(true);
    });

    it('should have WPCM training checkbox and conditional training date', () => {
      const wpcmSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'contractor_wpcm_information'
      );
      const trainingField = wpcmSection?.fields.find(
        (f) => f.id === 'wpcm_training_completed'
      );
      const trainingDate = wpcmSection?.fields.find(
        (f) => f.id === 'wpcm_training_date'
      );

      expect(trainingField?.type).toBe('checkbox');
      expect(trainingField?.required).toBe(true);
      expect(trainingDate?.conditionalDisplay?.field).toBe(
        'wpcm_training_completed'
      );
    });

    it('should have backup WPCM fields', () => {
      const wpcmSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'contractor_wpcm_information'
      );
      const fieldIds = wpcmSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('backup_wpcm_name');
      expect(fieldIds).toContain('backup_wpcm_phone');
    });

    it('should have NDOT Resident Engineer fields', () => {
      const wpcmSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'contractor_wpcm_information'
      );
      const fieldIds = wpcmSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('ndot_resident_engineer');
      expect(fieldIds).toContain('ndot_re_phone');
    });
  });

  describe('Project Description Section', () => {
    it('should have highway construction type select', () => {
      const descSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_description'
      );
      const typeField = descSection?.fields.find(
        (f) => f.id === 'construction_type'
      );

      expect(typeField?.type).toBe('select');
      const types = typeField?.options?.map((o) => o.value) || [];
      expect(types).toContain('new_construction');
      expect(types).toContain('widening');
      expect(types).toContain('bridge_work');
      expect(types).toContain('drainage_improvement');
    });

    it('should have impaired water checkbox with conditional pollutant field', () => {
      const descSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_description'
      );
      const impairedField = descSection?.fields.find(
        (f) => f.id === 'impaired_water'
      );
      const pollutantField = descSection?.fields.find(
        (f) => f.id === 'impairment_pollutant'
      );

      expect(impairedField?.type).toBe('checkbox');
      expect(pollutantField?.conditionalDisplay?.field).toBe('impaired_water');
    });

    it('should have TMDL and endangered species checkboxes', () => {
      const descSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_description'
      );
      const fieldIds = descSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('tmdl_area');
      expect(fieldIds).toContain('endangered_species');
    });
  });

  describe('Erosion Control Plan Section', () => {
    it('should have NDOT BMP type erosion control checkboxes', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_control_plan'
      );
      const fieldIds = erosionSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('temporary_seeding');
      expect(fieldIds).toContain('permanent_seeding');
      expect(fieldIds).toContain('erosion_blankets');
      expect(fieldIds).toContain('hydromulch');
      expect(fieldIds).toContain('stabilized_entrance');
    });

    it('should have erosion BMPs repeater with NDOT EC codes', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_control_plan'
      );
      const bmpsField = erosionSection?.fields.find(
        (f) => f.id === 'erosion_bmps_list'
      );

      expect(bmpsField?.type).toBe('repeater');
      expect(bmpsField?.minItems).toBe(1);
      expect(bmpsField?.maxItems).toBe(30);

      const bmpTypeField = bmpsField?.itemSchema?.fields.find(
        (f) => f.id === 'bmp_type'
      );
      const bmpTypes = bmpTypeField?.options?.map((o) => o.value) || [];
      expect(bmpTypes).toContain('EC-1');
      expect(bmpTypes).toContain('EC-3');
      expect(bmpTypes).toContain('EC-7');
    });

    it('should have ROW preservation checkbox', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_control_plan'
      );
      const rowField = erosionSection?.fields.find(
        (f) => f.id === 'row_preservation'
      );

      expect(rowField?.type).toBe('checkbox');
    });
  });

  describe('Sediment Control Plan Section', () => {
    it('should have sediment control checkboxes', () => {
      const sedimentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'sediment_control_plan'
      );
      const fieldIds = sedimentSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('silt_fence');
      expect(fieldIds).toContain('sediment_basin');
      expect(fieldIds).toContain('inlet_protection');
      expect(fieldIds).toContain('wheel_wash');
      expect(fieldIds).toContain('street_sweeping');
    });

    it('should have sediment BMPs repeater with NDOT SE codes', () => {
      const sedimentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'sediment_control_plan'
      );
      const bmpsField = sedimentSection?.fields.find(
        (f) => f.id === 'sediment_bmps_list'
      );

      expect(bmpsField?.type).toBe('repeater');
      expect(bmpsField?.minItems).toBe(1);

      const bmpTypeField = bmpsField?.itemSchema?.fields.find(
        (f) => f.id === 'bmp_type'
      );
      const bmpTypes = bmpTypeField?.options?.map((o) => o.value) || [];
      expect(bmpTypes).toContain('SE-1');
      expect(bmpTypes).toContain('SE-2');
      expect(bmpTypes).toContain('SE-10');
    });
  });

  describe('Good Housekeeping Section', () => {
    it('should have concrete washout with conditional location', () => {
      const housekeepingSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'good_housekeeping_controls'
      );
      const washoutField = housekeepingSection?.fields.find(
        (f) => f.id === 'concrete_washout'
      );
      const locationField = housekeepingSection?.fields.find(
        (f) => f.id === 'concrete_washout_location'
      );

      expect(washoutField?.type).toBe('checkbox');
      expect(locationField?.conditionalDisplay?.field).toBe('concrete_washout');
    });

    it('should have spill prevention with conditional spill kit locations', () => {
      const housekeepingSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'good_housekeeping_controls'
      );
      const spillField = housekeepingSection?.fields.find(
        (f) => f.id === 'spill_prevention'
      );
      const kitField = housekeepingSection?.fields.find(
        (f) => f.id === 'spill_kit_locations'
      );

      expect(spillField?.type).toBe('checkbox');
      expect(kitField?.conditionalDisplay?.field).toBe('spill_prevention');
    });
  });

  describe('Traffic Control and ROW Section', () => {
    it('should have traffic control fields', () => {
      const trafficSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'traffic_control_impacts'
      );
      const fieldIds = trafficSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('traffic_control_required');
      expect(fieldIds).toContain('lane_closures');
      expect(fieldIds).toContain('detours');
    });

    it('should have conditional traffic control plan', () => {
      const trafficSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'traffic_control_impacts'
      );
      const planField = trafficSection?.fields.find(
        (f) => f.id === 'traffic_control_plan'
      );

      expect(planField?.conditionalDisplay?.field).toBe(
        'traffic_control_required'
      );
    });

    it('should have staging areas repeater', () => {
      const trafficSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'traffic_control_impacts'
      );
      const stagingField = trafficSection?.fields.find(
        (f) => f.id === 'staging_areas'
      );

      expect(stagingField?.type).toBe('repeater');
      expect(stagingField?.maxItems).toBe(10);
    });

    it('should have utility coordination with conditional notes', () => {
      const trafficSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'traffic_control_impacts'
      );
      const utilityField = trafficSection?.fields.find(
        (f) => f.id === 'utility_conflicts'
      );
      const coordField = trafficSection?.fields.find(
        (f) => f.id === 'utility_coordination'
      );

      expect(utilityField?.type).toBe('checkbox');
      expect(coordField?.conditionalDisplay?.field).toBe('utility_conflicts');
    });
  });

  describe('Stabilization Requirements Section', () => {
    it('should have stabilization deadline select per EPA CGP', () => {
      const stabSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stabilization_requirements'
      );
      const deadlineField = stabSection?.fields.find(
        (f) => f.id === 'stabilization_deadline'
      );

      expect(deadlineField?.type).toBe('select');
      const deadlines = deadlineField?.options?.map((o) => o.value) || [];
      expect(deadlines).toContain('14_days');
      expect(deadlines).toContain('7_days');
    });

    it('should have 5 stabilization fields', () => {
      const stabSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stabilization_requirements'
      );
      expect(stabSection?.fields.length).toBe(5);
    });
  });

  describe('Inspection Procedures Section', () => {
    it('should have inspection frequency options', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const freqField = inspectionSection?.fields.find(
        (f) => f.id === 'inspection_frequency'
      );

      expect(freqField?.type).toBe('select');
      const freqs = freqField?.options?.map((o) => o.value) || [];
      expect(freqs).toContain('7_day');
      expect(freqs).toContain('14_day');
    });

    it('should have 0.25 inch rain threshold with default value', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const thresholdField = inspectionSection?.fields.find(
        (f) => f.id === 'rain_threshold'
      );

      expect(thresholdField?.type).toBe('number');
      expect(thresholdField?.defaultValue).toBe(0.25);
      expect(thresholdField?.required).toBe(true);
    });

    it('should have NDOT Form 018-001WPCM as inspection form option', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const formField = inspectionSection?.fields.find(
        (f) => f.id === 'inspection_form'
      );

      expect(formField?.type).toBe('select');
      const forms = formField?.options?.map((o) => o.value) || [];
      expect(forms).toContain('ndot_018_001');
    });

    it('should have corrective action deadline options', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const deadlineField = inspectionSection?.fields.find(
        (f) => f.id === 'corrective_action_deadline'
      );

      const deadlines = deadlineField?.options?.map((o) => o.value) || [];
      expect(deadlines).toContain('24_hours');
      expect(deadlines).toContain('7_days');
    });
  });

  describe('SWPPP Amendments Section', () => {
    it('should have amendments repeater', () => {
      const amendSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'swppp_amendments'
      );
      const amendField = amendSection?.fields.find(
        (f) => f.id === 'amendments'
      );

      expect(amendField?.type).toBe('repeater');
      expect(amendField?.maxItems).toBe(50);
    });
  });

  describe('Certification Section', () => {
    it('should have required SWPPP certification with legal language', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification'
      );
      const certField = certSection?.fields.find(
        (f) => f.id === 'swppp_certification'
      );

      expect(certField?.type).toBe('checkbox');
      expect(certField?.required).toBe(true);
      expect(certField?.label).toContain('penalty of law');
    });

    it('should have required WPCM signature', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'wpcm_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });

    it('should have 7 certification fields including contractor signature', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification'
      );
      expect(certSection?.fields.length).toBe(7);

      const fieldIds = certSection?.fields.map((f) => f.id) || [];
      expect(fieldIds).toContain('contractor_signature');
    });
  });
});
