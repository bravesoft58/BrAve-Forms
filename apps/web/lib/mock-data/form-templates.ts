/**
 * Mock Form Templates Data
 *
 * Provides mock data for form templates used in the Template Selector component.
 * This will be replaced with API calls in Sprint 4.
 */

export type FormTemplateCategory = 'daily-logs' | 'inspections' | 'safety' | 'compliance';

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: FormTemplateCategory;
  icon?: string;
  estimatedTime?: string; // e.g., "5 min"
  fieldsCount?: number;
}

const mockTemplates: FormTemplate[] = [
  // Daily Logs
  {
    id: 'daily-dust-log',
    title: 'Daily Dust Log',
    description: 'Record daily dust control measures and weather conditions',
    category: 'daily-logs',
    estimatedTime: '5 min',
    fieldsCount: 8,
  },
  {
    id: 'daily-inspection-log',
    title: 'Daily Inspection Log',
    description: 'Daily site inspection checklist for BMP compliance',
    category: 'daily-logs',
    estimatedTime: '10 min',
    fieldsCount: 12,
  },
  {
    id: 'bmp-maintenance-log',
    title: 'BMP Maintenance Log',
    description: 'Track maintenance activities for Best Management Practices',
    category: 'daily-logs',
    estimatedTime: '8 min',
    fieldsCount: 10,
  },

  // Inspections
  {
    id: 'swppp-inspection',
    title: 'SWPPP Inspection',
    description: 'Storm Water Pollution Prevention Plan inspection form',
    category: 'inspections',
    estimatedTime: '15 min',
    fieldsCount: 20,
  },
  {
    id: 'post-storm-inspection',
    title: 'Post-Storm Inspection',
    description: 'Required inspection after rainfall >= 0.25" (EPA CGP threshold)',
    category: 'inspections',
    estimatedTime: '20 min',
    fieldsCount: 25,
  },
  {
    id: 'weekly-swppp-review',
    title: 'Weekly SWPPP Review',
    description: 'Weekly review of SWPPP compliance and site conditions',
    category: 'inspections',
    estimatedTime: '12 min',
    fieldsCount: 15,
  },
  {
    id: 'monthly-compliance-audit',
    title: 'Monthly Compliance Audit',
    description: 'Monthly comprehensive compliance audit checklist',
    category: 'inspections',
    estimatedTime: '30 min',
    fieldsCount: 35,
  },

  // Safety
  {
    id: 'safety-meeting-log',
    title: 'Safety Meeting Log',
    description: 'Document safety meetings and training sessions',
    category: 'safety',
    estimatedTime: '5 min',
    fieldsCount: 6,
  },
  {
    id: 'incident-report',
    title: 'Incident Report',
    description: 'Report workplace incidents and near misses',
    category: 'safety',
    estimatedTime: '10 min',
    fieldsCount: 12,
  },
  {
    id: 'toolbox-talk',
    title: 'Toolbox Talk',
    description: 'Daily toolbox talk documentation and attendance',
    category: 'safety',
    estimatedTime: '5 min',
    fieldsCount: 8,
  },

  // Compliance
  {
    id: 'epa-cgp-report',
    title: 'EPA CGP Report',
    description: 'EPA Construction General Permit compliance report',
    category: 'compliance',
    estimatedTime: '25 min',
    fieldsCount: 30,
  },
  {
    id: 'discharge-monitoring',
    title: 'Discharge Monitoring',
    description: 'Monitor and record stormwater discharge quality',
    category: 'compliance',
    estimatedTime: '15 min',
    fieldsCount: 18,
  },
];

/**
 * Get all form templates
 */
export const getMockFormTemplates = (): FormTemplate[] => mockTemplates;

/**
 * Get form templates filtered by category
 */
export const getMockFormTemplatesByCategory = (category: FormTemplateCategory | 'all'): FormTemplate[] => {
  if (category === 'all') {
    return mockTemplates;
  }
  return mockTemplates.filter((template) => template.category === category);
};

/**
 * Search form templates by name/description
 */
export const searchMockFormTemplates = (
  templates: FormTemplate[],
  searchQuery: string
): FormTemplate[] => {
  if (!searchQuery.trim()) {
    return templates;
  }

  const query = searchQuery.toLowerCase();
  return templates.filter(
    (template) =>
      template.title.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query)
  );
};

/**
 * Get a single template by ID
 */
export const getMockFormTemplateById = (id: string): FormTemplate | undefined => {
  return mockTemplates.find((template) => template.id === id);
};

