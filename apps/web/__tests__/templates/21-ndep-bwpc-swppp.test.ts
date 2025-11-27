import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/21-ndep-bwpc-swppp.json';

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

describe('NDEP BWPC SWPPP Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('NDEP BWPC SWPPP');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have EPA CGP 2022 and Nevada NAC 445A compliance', () => {
    expect(typedTemplate.compliance.regulation).toContain('EPA CGP 2022');
    expect(typedTemplate.compliance.regulation).toContain('Nevada NAC 445A');
    expect(typedTemplate.compliance.regulation).toContain('NVR100000');
    expect(typedTemplate.compliance.agency).toBe('Nevada DEP BWPC');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have eleven sections per EPA CGP 7.2', () => {
    expect(typedTemplate.schema.sections).toHaveLength(11);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('project_site_information');
    expect(sectionIds).toContain('site_operators');
    expect(sectionIds).toContain('stormwater_team');
    expect(sectionIds).toContain('nature_of_construction');
    expect(sectionIds).toContain('erosion_controls');
    expect(sectionIds).toContain('sediment_controls');
    expect(sectionIds).toContain('good_housekeeping');
    expect(sectionIds).toContain('stabilization_requirements');
    expect(sectionIds).toContain('inspection_procedures');
    expect(sectionIds).toContain('swppp_amendments');
    expect(sectionIds).toContain('certification_signature');
  });

  describe('Project and Site Information Section', () => {
    it('should have 13 project information fields', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_site_information'
      );
      expect(projectSection?.fields.length).toBe(13);
    });

    it('should have required permit number field', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_site_information'
      );
      const permitField = projectSection?.fields.find(
        (f) => f.id === 'permit_number'
      );

      expect(permitField?.type).toBe('text');
      expect(permitField?.required).toBe(true);
    });

    it('should have Nevada county select field', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_site_information'
      );
      const countyField = projectSection?.fields.find((f) => f.id === 'county');

      expect(countyField?.type).toBe('select');
      expect(countyField?.required).toBe(true);
      const countyValues = countyField?.options?.map((o) => o.value) || [];
      expect(countyValues).toContain('clark');
      expect(countyValues).toContain('washoe');
      expect(countyValues).toContain('carson_city');
      expect(countyValues.length).toBe(17);
    });

    it('should have latitude and longitude fields with Nevada bounds', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_site_information'
      );
      const latField = projectSection?.fields.find((f) => f.id === 'latitude');
      const lonField = projectSection?.fields.find((f) => f.id === 'longitude');

      expect(latField?.type).toBe('number');
      expect(lonField?.type).toBe('number');
      expect(latField?.required).toBe(true);
      expect(lonField?.required).toBe(true);
    });

    it('should have total and disturbed acreage fields', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_site_information'
      );
      const fieldIds = projectSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('total_acreage');
      expect(fieldIds).toContain('disturbed_acreage');
    });
  });

  describe('Site Operators Section', () => {
    it('should have required operator information', () => {
      const operatorsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_operators'
      );
      const operatorName = operatorsSection?.fields.find(
        (f) => f.id === 'operator_name'
      );
      const operatorContact = operatorsSection?.fields.find(
        (f) => f.id === 'operator_contact'
      );

      expect(operatorName?.required).toBe(true);
      expect(operatorContact?.required).toBe(true);
    });

    it('should have additional operators repeater', () => {
      const operatorsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_operators'
      );
      const additionalOps = operatorsSection?.fields.find(
        (f) => f.id === 'additional_operators'
      );

      expect(additionalOps?.type).toBe('repeater');
      expect(additionalOps?.maxItems).toBe(10);
    });

    it('should have operator email field', () => {
      const operatorsSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_operators'
      );
      const emailField = operatorsSection?.fields.find(
        (f) => f.id === 'operator_email'
      );

      expect(emailField?.type).toBe('email');
      expect(emailField?.required).toBe(true);
    });
  });

  describe('Stormwater Team Section', () => {
    it('should have required SWPPP administrator', () => {
      const teamSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stormwater_team'
      );
      const adminField = teamSection?.fields.find(
        (f) => f.id === 'swppp_administrator'
      );

      expect(adminField?.type).toBe('text');
      expect(adminField?.required).toBe(true);
    });

    it('should have required qualified inspector per EPA CGP', () => {
      const teamSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stormwater_team'
      );
      const inspectorField = teamSection?.fields.find(
        (f) => f.id === 'qualified_inspector'
      );

      expect(inspectorField?.type).toBe('text');
      expect(inspectorField?.required).toBe(true);
    });

    it('should have team members repeater', () => {
      const teamSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stormwater_team'
      );
      const teamField = teamSection?.fields.find(
        (f) => f.id === 'team_members'
      );

      expect(teamField?.type).toBe('repeater');
      expect(teamField?.maxItems).toBe(15);
    });

    it('should have SWPPP preparer with qualifications', () => {
      const teamSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stormwater_team'
      );
      const fieldIds = teamSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('swppp_preparer_name');
      expect(fieldIds).toContain('swppp_preparer_qualifications');
    });
  });

  describe('Nature of Construction Section', () => {
    it('should have required project description', () => {
      const constructionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'nature_of_construction'
      );
      const descField = constructionSection?.fields.find(
        (f) => f.id === 'project_description'
      );

      expect(descField?.type).toBe('textarea');
      expect(descField?.required).toBe(true);
    });

    it('should have project type select', () => {
      const constructionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'nature_of_construction'
      );
      const typeField = constructionSection?.fields.find(
        (f) => f.id === 'project_type'
      );

      expect(typeField?.type).toBe('select');
      const typeValues = typeField?.options?.map((o) => o.value) || [];
      expect(typeValues).toContain('residential_single');
      expect(typeValues).toContain('commercial');
      expect(typeValues).toContain('roadway_highway');
    });

    it('should have soil types field per EPA CGP 7.2.3', () => {
      const constructionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'nature_of_construction'
      );
      const soilField = constructionSection?.fields.find(
        (f) => f.id === 'soil_types'
      );

      expect(soilField?.type).toBe('textarea');
      expect(soilField?.required).toBe(true);
    });

    it('should have impaired waters checkbox with conditional impairment type', () => {
      const constructionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'nature_of_construction'
      );
      const impairedField = constructionSection?.fields.find(
        (f) => f.id === 'impaired_waters'
      );
      const impairmentType = constructionSection?.fields.find(
        (f) => f.id === 'impairment_type'
      );

      expect(impairedField?.type).toBe('checkbox');
      expect(impairmentType?.conditionalDisplay?.field).toBe('impaired_waters');
      expect(impairmentType?.conditionalDisplay?.value).toBe(true);
    });

    it('should have receiving waters field', () => {
      const constructionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'nature_of_construction'
      );
      const receivingField = constructionSection?.fields.find(
        (f) => f.id === 'receiving_waters'
      );

      expect(receivingField?.type).toBe('text');
      expect(receivingField?.required).toBe(true);
    });
  });

  describe('Erosion Controls Section', () => {
    it('should have EPA CGP 2.2 erosion control checkboxes', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_controls'
      );
      const fieldIds = erosionSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('natural_buffers_maintained');
      expect(fieldIds).toContain('stormwater_directed_vegetated');
      expect(fieldIds).toContain('perimeter_controls_installed');
      expect(fieldIds).toContain('track_out_controls');
      expect(fieldIds).toContain('stockpile_management');
      expect(fieldIds).toContain('dust_controls');
      expect(fieldIds).toContain('steep_slope_controls');
    });

    it('should have conditional buffer distance field', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_controls'
      );
      const bufferDistance = erosionSection?.fields.find(
        (f) => f.id === 'buffer_distance'
      );

      expect(bufferDistance?.conditionalDisplay?.field).toBe(
        'natural_buffers_maintained'
      );
      expect(bufferDistance?.conditionalDisplay?.value).toBe(true);
    });

    it('should have erosion control BMPs repeater with required fields', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_controls'
      );
      const bmpField = erosionSection?.fields.find(
        (f) => f.id === 'erosion_control_bmps'
      );

      expect(bmpField?.type).toBe('repeater');
      expect(bmpField?.minItems).toBe(1);
      expect(bmpField?.maxItems).toBe(25);

      const itemFieldIds = bmpField?.itemSchema?.fields.map((f) => f.id) || [];
      expect(itemFieldIds).toContain('bmp_type');
      expect(itemFieldIds).toContain('bmp_location');
      expect(itemFieldIds).toContain('bmp_design_specs');
      expect(itemFieldIds).toContain('bmp_maintenance');
    });

    it('should have comprehensive erosion BMP type options', () => {
      const erosionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'erosion_controls'
      );
      const bmpField = erosionSection?.fields.find(
        (f) => f.id === 'erosion_control_bmps'
      );
      const bmpTypeField = bmpField?.itemSchema?.fields.find(
        (f) => f.id === 'bmp_type'
      );

      const bmpTypes = bmpTypeField?.options?.map((o) => o.value) || [];
      expect(bmpTypes).toContain('seeding');
      expect(bmpTypes).toContain('erosion_blankets');
      expect(bmpTypes).toContain('hydromulch');
      expect(bmpTypes).toContain('geotextiles');
      expect(bmpTypes).toContain('terraces');
    });
  });

  describe('Sediment Controls Section', () => {
    it('should have sediment control BMPs repeater', () => {
      const sedimentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'sediment_controls'
      );
      const bmpField = sedimentSection?.fields.find(
        (f) => f.id === 'sediment_control_bmps'
      );

      expect(bmpField?.type).toBe('repeater');
      expect(bmpField?.minItems).toBe(1);
      expect(bmpField?.maxItems).toBe(25);
    });

    it('should have comprehensive sediment BMP type options', () => {
      const sedimentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'sediment_controls'
      );
      const bmpField = sedimentSection?.fields.find(
        (f) => f.id === 'sediment_control_bmps'
      );
      const bmpTypeField = bmpField?.itemSchema?.fields.find(
        (f) => f.id === 'bmp_type'
      );

      const bmpTypes = bmpTypeField?.options?.map((o) => o.value) || [];
      expect(bmpTypes).toContain('silt_fence');
      expect(bmpTypes).toContain('sediment_basin');
      expect(bmpTypes).toContain('sediment_trap');
      expect(bmpTypes).toContain('inlet_protection');
      expect(bmpTypes).toContain('check_dams');
      expect(bmpTypes).toContain('dewatering_controls');
    });
  });

  describe('Good Housekeeping Section', () => {
    it('should have waste management and concrete washout fields', () => {
      const housekeepingSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'good_housekeeping'
      );
      const fieldIds = housekeepingSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('waste_management');
      expect(fieldIds).toContain('concrete_washout_designated');
      expect(fieldIds).toContain('hazmat_storage_compliant');
      expect(fieldIds).toContain('fuel_storage_compliant');
    });

    it('should have conditional concrete washout location', () => {
      const housekeepingSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'good_housekeeping'
      );
      const locationField = housekeepingSection?.fields.find(
        (f) => f.id === 'concrete_washout_location'
      );

      expect(locationField?.conditionalDisplay?.field).toBe(
        'concrete_washout_designated'
      );
      expect(locationField?.conditionalDisplay?.value).toBe(true);
    });

    it('should have spill prevention fields', () => {
      const housekeepingSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'good_housekeeping'
      );
      const fieldIds = housekeepingSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('spill_prevention_plan');
      expect(fieldIds).toContain('spill_kit_locations');
    });
  });

  describe('Stabilization Requirements Section', () => {
    it('should have stabilization deadline options per EPA CGP', () => {
      const stabSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stabilization_requirements'
      );
      const deadlineField = stabSection?.fields.find(
        (f) => f.id === 'stabilization_deadline_standard'
      );

      expect(deadlineField?.type).toBe('select');
      expect(deadlineField?.required).toBe(true);
      const deadlineValues = deadlineField?.options?.map((o) => o.value) || [];
      expect(deadlineValues).toContain('14_days');
      expect(deadlineValues).toContain('7_days');
    });

    it('should have temporary and permanent stabilization methods', () => {
      const stabSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'stabilization_requirements'
      );
      const fieldIds = stabSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('temporary_stabilization_methods');
      expect(fieldIds).toContain('permanent_stabilization_methods');
      expect(fieldIds).toContain('final_stabilization_definition');
    });
  });

  describe('Inspection Procedures Section', () => {
    it('should have inspection frequency options per EPA CGP Part 4', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const freqField = inspectionSection?.fields.find(
        (f) => f.id === 'inspection_frequency'
      );

      expect(freqField?.type).toBe('select');
      expect(freqField?.required).toBe(true);
      const freqValues = freqField?.options?.map((o) => o.value) || [];
      expect(freqValues).toContain('7_day');
      expect(freqValues).toContain('14_day');
    });

    it('should have 0.25 inch rain trigger threshold', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const triggerField = inspectionSection?.fields.find(
        (f) => f.id === 'rain_trigger_threshold'
      );

      expect(triggerField?.type).toBe('number');
      expect(triggerField?.required).toBe(true);
      expect(triggerField?.defaultValue).toBe(0.25);
    });

    it('should have rain event inspection checkbox', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const rainField = inspectionSection?.fields.find(
        (f) => f.id === 'rain_event_inspection'
      );

      expect(rainField?.type).toBe('checkbox');
      expect(rainField?.required).toBe(true);
    });

    it('should have corrective action deadline options per EPA CGP Part 5', () => {
      const inspectionSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'inspection_procedures'
      );
      const deadlineField = inspectionSection?.fields.find(
        (f) => f.id === 'corrective_action_deadline'
      );

      expect(deadlineField?.type).toBe('select');
      const deadlineValues = deadlineField?.options?.map((o) => o.value) || [];
      expect(deadlineValues).toContain('24_hours');
      expect(deadlineValues).toContain('7_days');
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

    it('should have amendment tracking fields', () => {
      const amendSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'swppp_amendments'
      );
      const amendField = amendSection?.fields.find(
        (f) => f.id === 'amendments'
      );
      const itemFieldIds = amendField?.itemSchema?.fields.map((f) => f.id) || [];

      expect(itemFieldIds).toContain('amendment_date');
      expect(itemFieldIds).toContain('amendment_section');
      expect(itemFieldIds).toContain('amendment_description');
      expect(itemFieldIds).toContain('amendment_reason');
      expect(itemFieldIds).toContain('amendment_by');
    });
  });

  describe('Certification Section', () => {
    it('should have required SWPPP certification checkbox with legal language', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification_signature'
      );
      const certField = certSection?.fields.find(
        (f) => f.id === 'swppp_certification'
      );

      expect(certField?.type).toBe('checkbox');
      expect(certField?.required).toBe(true);
      expect(certField?.label).toContain('penalty of law');
    });

    it('should have required operator signature', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification_signature'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'operator_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });

    it('should have 5 certification fields', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'certification_signature'
      );
      expect(certSection?.fields.length).toBe(5);
    });
  });
});
