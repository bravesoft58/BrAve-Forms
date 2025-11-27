import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/20-wiw-daily-form.json';

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

describe('WIW Daily Form Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('WIW Daily Form');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have Nevada NAC 503 wildlife protection compliance', () => {
    expect(typedTemplate.compliance.regulation).toContain('Nevada NAC 503');
    expect(typedTemplate.compliance.regulation).toContain('Wildlife Protection');
  });

  it('should have Nevada NAC 445A water quality compliance', () => {
    expect(typedTemplate.compliance.regulation).toContain('NAC 445A');
    expect(typedTemplate.compliance.regulation).toContain('Water Quality');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have seven sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(7);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('project_information');
    expect(sectionIds).toContain('daily_work_log');
    expect(sectionIds).toContain('turbidity_monitoring');
    expect(sectionIds).toContain('best_management_practices');
    expect(sectionIds).toContain('fish_wildlife_observations');
    expect(sectionIds).toContain('environmental_incidents');
    expect(sectionIds).toContain('daily_certification');
  });

  describe('Project Information Section', () => {
    it('should have 12 project information fields', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_information'
      );
      expect(projectSection?.fields.length).toBe(12);
    });

    it('should have waterbody type select', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_information'
      );
      const waterbodyField = projectSection?.fields.find(
        (f) => f.id === 'waterbody_type'
      );

      expect(waterbodyField?.type).toBe('select');
      const options = waterbodyField?.options?.map((o) => o.value) || [];
      expect(options).toContain('stream');
      expect(options).toContain('river');
      expect(options).toContain('lake');
      expect(options).toContain('wetland');
    });

    it('should have work type select', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_information'
      );
      const workTypeField = projectSection?.fields.find(
        (f) => f.id === 'work_type'
      );

      expect(workTypeField?.type).toBe('select');
      const options = workTypeField?.options?.map((o) => o.value) || [];
      expect(options).toContain('bridge_construction');
      expect(options).toContain('culvert_installation');
      expect(options).toContain('dredging');
    });

    it('should have permit agency field', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_information'
      );
      const agencyField = projectSection?.fields.find(
        (f) => f.id === 'permit_agency'
      );

      expect(agencyField?.type).toBe('select');
      const options = agencyField?.options?.map((o) => o.value) || [];
      expect(options).toContain('nevada_dep');
      expect(options).toContain('army_corps');
      expect(options).toContain('both');
    });
  });

  describe('Daily Work Log Section', () => {
    it('should have daily logs repeater', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_work_log'
      );
      const dailyField = dailySection?.fields.find((f) => f.id === 'daily_logs');

      expect(dailyField?.type).toBe('repeater');
      expect(dailyField?.minItems).toBe(1);
      expect(dailyField?.maxItems).toBe(31);
    });

    it('should have conditional work description', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_work_log'
      );
      const dailyField = dailySection?.fields.find((f) => f.id === 'daily_logs');
      const itemFields = dailyField?.itemSchema?.fields || [];

      const workDesc = itemFields.find((f) => f.id === 'work_description');
      expect(workDesc?.conditionalDisplay?.field).toBe('work_performed');
      expect(workDesc?.conditionalDisplay?.value).toBe(true);
    });

    it('should have water depth and temperature fields', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_work_log'
      );
      const dailyField = dailySection?.fields.find((f) => f.id === 'daily_logs');
      const itemFields = dailyField?.itemSchema?.fields || [];
      const itemFieldIds = itemFields.map((f) => f.id);

      expect(itemFieldIds).toContain('water_depth_ft');
      expect(itemFieldIds).toContain('water_temp_f');
      expect(itemFieldIds).toContain('air_temp_f');
    });

    it('should have flow conditions select', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_work_log'
      );
      const dailyField = dailySection?.fields.find((f) => f.id === 'daily_logs');
      const itemFields = dailyField?.itemSchema?.fields || [];

      const flowField = itemFields.find((f) => f.id === 'flow_conditions');
      expect(flowField?.type).toBe('select');
      const options = flowField?.options?.map((o) => o.value) || [];
      expect(options).toContain('no_flow');
      expect(options).toContain('low_flow');
      expect(options).toContain('moderate_flow');
      expect(options).toContain('high_flow');
    });
  });

  describe('Turbidity Monitoring Section', () => {
    it('should have turbidity readings repeater', () => {
      const turbSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'turbidity_monitoring'
      );
      const turbField = turbSection?.fields.find(
        (f) => f.id === 'turbidity_readings'
      );

      expect(turbField?.type).toBe('repeater');
      expect(turbField?.minItems).toBe(0);
    });

    it('should have NTU reading field', () => {
      const turbSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'turbidity_monitoring'
      );
      const turbField = turbSection?.fields.find(
        (f) => f.id === 'turbidity_readings'
      );
      const itemFields = turbField?.itemSchema?.fields || [];

      const ntuField = itemFields.find((f) => f.id === 'turbidity_ntu');
      expect(ntuField?.type).toBe('number');
      expect(ntuField?.required).toBe(true);
    });

    it('should have monitoring location select with proper options', () => {
      const turbSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'turbidity_monitoring'
      );
      const turbField = turbSection?.fields.find(
        (f) => f.id === 'turbidity_readings'
      );
      const itemFields = turbField?.itemSchema?.fields || [];

      const locationField = itemFields.find((f) => f.id === 'location');
      expect(locationField?.type).toBe('select');
      const options = locationField?.options?.map((o) => o.value) || [];
      expect(options).toContain('upstream');
      expect(options).toContain('work_area');
      expect(options).toContain('downstream_100ft');
      expect(options).toContain('downstream_300ft');
    });

    it('should have threshold exceeded checkbox with conditional corrective action', () => {
      const turbSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'turbidity_monitoring'
      );
      const turbField = turbSection?.fields.find(
        (f) => f.id === 'turbidity_readings'
      );
      const itemFields = turbField?.itemSchema?.fields || [];

      const thresholdField = itemFields.find((f) => f.id === 'threshold_exceeded');
      expect(thresholdField?.type).toBe('checkbox');

      const correctiveField = itemFields.find((f) => f.id === 'corrective_action');
      expect(correctiveField?.conditionalDisplay?.field).toBe('threshold_exceeded');
      expect(correctiveField?.conditionalDisplay?.value).toBe(true);
    });
  });

  describe('Best Management Practices Section', () => {
    it('should have exactly 12 BMP checkboxes', () => {
      const bmpSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'best_management_practices'
      );
      expect(bmpSection?.fields.length).toBe(12);

      const checkboxCount = bmpSection?.fields.filter(
        (f) => f.type === 'checkbox'
      ).length;
      expect(checkboxCount).toBe(12);
    });

    it('should have aquatic-specific BMPs', () => {
      const bmpSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'best_management_practices'
      );
      const fieldIds = bmpSection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('silt_curtain_installed');
      expect(fieldIds).toContain('turbidity_curtain_maintained');
      expect(fieldIds).toContain('cofferdam_intact');
      expect(fieldIds).toContain('fish_relocation_complete');
      expect(fieldIds).toContain('work_area_isolated');
    });
  });

  describe('Fish and Wildlife Observations Section', () => {
    it('should have 8 wildlife observation fields', () => {
      const wildlifeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'fish_wildlife_observations'
      );
      expect(wildlifeSection?.fields.length).toBe(8);
    });

    it('should have conditional fish species field', () => {
      const wildlifeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'fish_wildlife_observations'
      );
      const fishSpecies = wildlifeSection?.fields.find(
        (f) => f.id === 'fish_species'
      );

      expect(fishSpecies?.conditionalDisplay?.field).toBe('fish_observed');
      expect(fishSpecies?.conditionalDisplay?.value).toBe(true);
    });

    it('should have fish behavior select with stress indicators', () => {
      const wildlifeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'fish_wildlife_observations'
      );
      const behaviorField = wildlifeSection?.fields.find(
        (f) => f.id === 'fish_behavior'
      );

      expect(behaviorField?.type).toBe('select');
      const options = behaviorField?.options?.map((o) => o.value) || [];
      expect(options).toContain('normal');
      expect(options).toContain('stressed');
      expect(options).toContain('mortality');
    });

    it('should have NDOW notification checkbox', () => {
      const wildlifeSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'fish_wildlife_observations'
      );
      const ndowField = wildlifeSection?.fields.find(
        (f) => f.id === 'wildlife_agency_notified'
      );

      expect(ndowField?.type).toBe('checkbox');
    });
  });

  describe('Environmental Incidents Section', () => {
    it('should have 5 incident fields', () => {
      const incidentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'environmental_incidents'
      );
      expect(incidentSection?.fields.length).toBe(5);
    });

    it('should have conditional incident type select', () => {
      const incidentSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'environmental_incidents'
      );
      const typeField = incidentSection?.fields.find(
        (f) => f.id === 'incident_type'
      );

      expect(typeField?.conditionalDisplay?.field).toBe('incidents_occurred');
      const options = typeField?.options?.map((o) => o.value) || [];
      expect(options).toContain('spill');
      expect(options).toContain('fish_kill');
      expect(options).toContain('excessive_turbidity');
    });
  });

  describe('Daily Certification Section', () => {
    it('should have 4 certification fields', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_certification'
      );
      expect(certSection?.fields.length).toBe(4);
    });

    it('should have required BMP and impact checkboxes', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_certification'
      );
      const bmpField = certSection?.fields.find((f) => f.id === 'bmps_maintained');
      const impactField = certSection?.fields.find(
        (f) => f.id === 'no_unauthorized_impacts'
      );

      expect(bmpField?.type).toBe('checkbox');
      expect(bmpField?.required).toBe(true);
      expect(impactField?.type).toBe('checkbox');
      expect(impactField?.required).toBe(true);
    });

    it('should have required monitor signature', () => {
      const certSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_certification'
      );
      const sigField = certSection?.fields.find(
        (f) => f.id === 'monitor_signature'
      );

      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });
  });
});
