import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/14-ndep-weekly-stormwater.json';

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

describe('NDEP Weekly Stormwater Log Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('NDEP Weekly Stormwater Log');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have Nevada DEP compliance info', () => {
    expect(typedTemplate.compliance.regulation).toContain('Nevada NAC 445A');
    expect(typedTemplate.compliance.agency).toBe('Nevada DEP');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have three sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(3);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('site_information');
    expect(sectionIds).toContain('daily_inspections');
    expect(sectionIds).toContain('weekly_summary');
  });

  describe('Daily Inspections Section', () => {
    it('should have daily inspections repeater with max 7 items', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      expect(dailySection).toBeDefined();

      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      expect(dailyField).toBeDefined();
      expect(dailyField?.type).toBe('repeater');
      expect(dailyField?.minItems).toBe(1);
      expect(dailyField?.maxItems).toBe(7);
    });

    it('should have all required daily inspection fields', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const itemFields = dailyField?.itemSchema?.fields || [];

      const fieldIds = itemFields.map((f) => f.id);
      expect(fieldIds).toContain('inspection_date');
      expect(fieldIds).toContain('day_of_week');
      expect(fieldIds).toContain('weather_conditions');
      expect(fieldIds).toContain('precipitation_amount');
      expect(fieldIds).toContain('visual_assessment_complete');
      expect(fieldIds).toContain('bmps_functional');
      expect(fieldIds).toContain('erosion_observed');
      expect(fieldIds).toContain('corrective_actions');
      expect(fieldIds).toContain('maintenance_performed');
      expect(fieldIds).toContain('maintenance_description');
      expect(fieldIds).toContain('inspector_initials');
    });

    it('should have conditional maintenance_description field', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const maintenanceDesc = dailyField?.itemSchema?.fields.find(
        (f) => f.id === 'maintenance_description'
      );

      expect(maintenanceDesc).toBeDefined();
      expect(maintenanceDesc?.conditionalDisplay?.field).toBe(
        'maintenance_performed'
      );
      expect(maintenanceDesc?.conditionalDisplay?.operator).toBe('equals');
      expect(maintenanceDesc?.conditionalDisplay?.value).toBe(true);
    });

    it('should have conditional corrective_actions field', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const correctiveActions = dailyField?.itemSchema?.fields.find(
        (f) => f.id === 'corrective_actions'
      );

      expect(correctiveActions).toBeDefined();
      expect(correctiveActions?.conditionalDisplay?.field).toBe(
        'erosion_observed'
      );
      expect(correctiveActions?.conditionalDisplay?.value).toBe(true);
    });

    it('should have day_of_week with 7 options', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const dayOfWeek = dailyField?.itemSchema?.fields.find(
        (f) => f.id === 'day_of_week'
      ) as TemplateField & { options?: { value: string }[] };

      expect(dayOfWeek?.type).toBe('select');
      expect(dayOfWeek?.options).toHaveLength(7);
    });
  });

  describe('Weekly Summary Section', () => {
    it('should have weekly certification signature', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      expect(summarySection).toBeDefined();

      const sigField = summarySection?.fields.find(
        (f) => f.id === 'weekly_certification_signature'
      );
      expect(sigField).toBeDefined();
      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });

    it('should have storm events count field', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      const stormField = summarySection?.fields.find(
        (f) => f.id === 'storm_events_count'
      );

      expect(stormField).toBeDefined();
      expect(stormField?.type).toBe('number');
    });

    it('should have conditional non_compliance_description', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      const nonCompDesc = summarySection?.fields.find(
        (f) => f.id === 'non_compliance_description'
      );

      expect(nonCompDesc?.conditionalDisplay?.field).toBe(
        'non_compliance_observed'
      );
    });
  });

  describe('Site Information Section', () => {
    it('should have all required site info fields', () => {
      const siteSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_information'
      );
      expect(siteSection).toBeDefined();

      const fieldIds = siteSection?.fields.map((f) => f.id) || [];
      expect(fieldIds).toContain('site_name');
      expect(fieldIds).toContain('permit_number');
      expect(fieldIds).toContain('week_starting');
      expect(fieldIds).toContain('week_ending');
      expect(fieldIds).toContain('inspector_name');
      expect(fieldIds).toContain('project_phase');
    });

    it('should have project phase with 4 options', () => {
      const siteSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'site_information'
      );
      const phaseField = siteSection?.fields.find(
        (f) => f.id === 'project_phase'
      ) as TemplateField & { options?: { value: string }[] };

      expect(phaseField?.type).toBe('select');
      expect(phaseField?.options).toHaveLength(4);
    });
  });
});
