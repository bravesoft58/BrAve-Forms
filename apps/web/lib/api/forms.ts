/**
 * Forms API helpers for fetching form templates
 *
 * @security All functions require Clerk JWT authentication
 * @multi-tenancy All queries automatically filtered by orgId from JWT
 */

import { makeAuthenticatedRequest } from './client';

export type FormCategory =
  | 'EPA_SWPPP'
  | 'EPA_CGP'
  | 'OSHA_SAFETY'
  | 'STATE_PERMIT'
  | 'CUSTOM';

export interface FormTemplateField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: Record<string, unknown>;
  conditionalLogic?: Record<string, unknown>;
}

export interface FormTemplateSection {
  id: string;
  title: string;
  fields: FormTemplateField[];
}

export interface FormTemplateSchema {
  sections: FormTemplateSection[];
  version?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: FormCategory;
  schema: FormTemplateSchema;
  version: number;
  isActive: boolean;
  isSystemTemplate?: boolean;
  compliance?: Record<string, unknown>;
  offlineCapable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetFormTemplatesParams {
  category?: FormCategory;
  isActive?: boolean;
  take?: number;
  skip?: number;
}

/**
 * Get form templates with optional filters
 *
 * @param params - Optional filters (category, isActive, pagination)
 * @param token - Clerk JWT token
 * @returns Promise resolving to array of form templates
 *
 * @example
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const templates = await getFormTemplates({ category: 'EPA_SWPPP' }, token);
 *
 * @security Requires valid Clerk JWT with orgId claim
 * @multi-tenancy Returns system templates + org-specific templates
 */
export async function getFormTemplates(
  params: GetFormTemplatesParams | undefined,
  token: string | null
): Promise<FormTemplate[]> {
  const data = await makeAuthenticatedRequest<{ formTemplates: FormTemplate[] }>(
    {
      query: `
        query GetFormTemplates($category: String, $isActive: Boolean) {
          formTemplates(category: $category, isActive: $isActive) {
            id
            name
            description
            category
            schema
            version
            isActive
            compliance
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        category: params?.category,
        isActive: params?.isActive,
      },
    },
    token
  );

  return data.formTemplates || [];
}

/**
 * Get a single form template by ID
 *
 * @param id - Template ID
 * @param token - Clerk JWT token
 * @returns Promise resolving to form template
 * @throws {Error} If template not found
 * @throws {Error} If user lacks permission (cross-tenant access)
 *
 * @example
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const template = await getFormTemplateById('template-123', token);
 *
 * @security Backend validates user can access template (system or org-specific)
 */
export async function getFormTemplateById(
  id: string,
  token: string | null
): Promise<FormTemplate> {
  // Input validation
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid template ID: must be a non-empty string');
  }

  const data = await makeAuthenticatedRequest<{ formTemplate: FormTemplate }>(
    {
      query: `
        query GetFormTemplate($id: String!) {
          formTemplate(id: $id) {
            id
            name
            description
            category
            schema
            version
            isActive
            compliance
            createdAt
            updatedAt
          }
        }
      `,
      variables: { id },
    },
    token
  );

  return data.formTemplate;
}

/**
 * Get form template categories with counts
 *
 * @param token - Clerk JWT token
 * @returns Promise resolving to category counts
 *
 * @security Requires valid Clerk JWT
 */
export async function getFormTemplateCategories(
  token: string | null
): Promise<Array<{ category: FormCategory; count: number }>> {
  // Get all templates and aggregate by category
  const templates = await getFormTemplates({ isActive: true }, token);

  const categoryCounts = templates.reduce(
    (acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category]++;
      return acc;
    },
    {} as Record<FormCategory, number>
  );

  return Object.entries(categoryCounts).map(([category, count]) => ({
    category: category as FormCategory,
    count,
  }));
}
