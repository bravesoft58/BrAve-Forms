import { describe, it, expect } from 'vitest';
import template from '../../../../packages/database/templates/15-ndot-weekly-stormwater.json';

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

describe('NDOT Weekly Stormwater Logs Template', () => {
  it('should have correct metadata', () => {
    expect(typedTemplate.name).toBe('NDOT Weekly Stormwater Logs');
    expect(typedTemplate.category).toBe('COMPLIANCE');
    expect(typedTemplate.version).toBe('1.0.0');
  });

  it('should have Nevada DOT compliance info', () => {
    expect(typedTemplate.compliance.regulation).toContain('NDOT');
    expect(typedTemplate.compliance.regulation).toContain('EPA NPDES');
    expect(typedTemplate.compliance.agency).toBe('Nevada DOT');
  });

  it('should be offline capable', () => {
    expect(typedTemplate.offlineCapable).toBe(true);
  });

  it('should have three sections', () => {
    expect(typedTemplate.schema.sections).toHaveLength(3);
    const sectionIds = typedTemplate.schema.sections.map((s) => s.id);
    expect(sectionIds).toContain('project_information');
    expect(sectionIds).toContain('daily_inspections');
    expect(sectionIds).toContain('weekly_summary');
  });

  describe('Project Information Section', () => {
    it('should have highway-specific project fields', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_information'
      );
      expect(projectSection).toBeDefined();

      const fieldIds = projectSection?.fields.map((f) => f.id) || [];
      expect(fieldIds).toContain('route_number');
      expect(fieldIds).toContain('mile_post_range');
      expect(fieldIds).toContain('ndot_project_number');
      expect(fieldIds).toContain('ndot_resident_engineer');
    });

    it('should have NDOT project number field', () => {
      const projectSection = typedTemplate.schema.sections.find(
        (s) => s.id === 'project_information'
      );
      const ndotField = projectSection?.fields.find(
        (f) => f.id === 'ndot_project_number'
      );

      expect(ndotField?.type).toBe('text');
      expect(ndotField?.required).toBe(true);
    });
  });

  describe('Daily Highway Inspections Section', () => {
    it('should have daily inspections repeater with max 7 items', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      expect(dailySection).toBeDefined();

      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      expect(dailyField?.type).toBe('repeater');
      expect(dailyField?.minItems).toBe(1);
      expect(dailyField?.maxItems).toBe(7);
    });

    it('should have culvert inspection fields', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const itemFields = dailyField?.itemSchema?.fields || [];

      const culvertInspected = itemFields.find(
        (f) => f.id === 'culverts_inspected'
      );
      const culvertFindings = itemFields.find(
        (f) => f.id === 'culvert_findings'
      );

      expect(culvertInspected?.type).toBe('checkbox');
      expect(culvertFindings?.type).toBe('textarea');
      expect(culvertFindings?.conditionalDisplay?.field).toBe(
        'culverts_inspected'
      );
      expect(culvertFindings?.conditionalDisplay?.value).toBe(true);
    });

    it('should have traffic impact tracking', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const itemFields = dailyField?.itemSchema?.fields || [];

      const trafficImpact = itemFields.find((f) => f.id === 'traffic_impact');

      expect(trafficImpact?.type).toBe('select');
      const optionValues =
        trafficImpact?.options?.map((o) => o.value) || [];
      expect(optionValues).toContain('lane_closure');
      expect(optionValues).toContain('detour');
    });

    it('should have ROW BMP fields', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const itemFields = dailyField?.itemSchema?.fields || [];

      const rowBmpFunctional = itemFields.find(
        (f) => f.id === 'row_bmps_functional'
      );
      const rowBmpIssues = itemFields.find((f) => f.id === 'row_bmp_issues');

      expect(rowBmpFunctional?.type).toBe('checkbox');
      expect(rowBmpIssues?.conditionalDisplay?.field).toBe('row_bmps_functional');
      expect(rowBmpIssues?.conditionalDisplay?.value).toBe(false);
    });

    it('should have erosion observation with location field', () => {
      const dailySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'daily_inspections'
      );
      const dailyField = dailySection?.fields.find(
        (f) => f.id === 'daily_inspections'
      );
      const itemFields = dailyField?.itemSchema?.fields || [];

      const erosionObserved = itemFields.find(
        (f) => f.id === 'erosion_observed'
      );
      const erosionLocation = itemFields.find(
        (f) => f.id === 'erosion_location'
      );

      expect(erosionObserved?.type).toBe('checkbox');
      expect(erosionLocation?.conditionalDisplay?.field).toBe('erosion_observed');
    });
  });

  describe('Weekly Summary Section', () => {
    it('should have NDOT inspector signature requirement', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      expect(summarySection).toBeDefined();

      const sigField = summarySection?.fields.find(
        (f) => f.id === 'ndot_inspector_signature'
      );
      expect(sigField?.type).toBe('signature');
      expect(sigField?.required).toBe(true);
    });

    it('should have storm events count field for 0.25+ inch events', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      const stormField = summarySection?.fields.find(
        (f) => f.id === 'storm_events_count'
      );

      expect(stormField?.type).toBe('number');
    });

    it('should have culvert and drainage tracking', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      const fieldIds = summarySection?.fields.map((f) => f.id) || [];

      expect(fieldIds).toContain('culverts_cleaned_count');
      expect(fieldIds).toContain('drainage_issues_resolved_count');
    });

    it('should have traffic delays count', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      const trafficField = summarySection?.fields.find(
        (f) => f.id === 'traffic_delays_count'
      );

      expect(trafficField?.type).toBe('number');
    });

    it('should have conditional ROW violation description', () => {
      const summarySection = typedTemplate.schema.sections.find(
        (s) => s.id === 'weekly_summary'
      );
      const rowViolationDesc = summarySection?.fields.find(
        (f) => f.id === 'row_violation_description'
      );

      expect(rowViolationDesc?.conditionalDisplay?.field).toBe(
        'row_violations_observed'
      );
    });
  });
});
