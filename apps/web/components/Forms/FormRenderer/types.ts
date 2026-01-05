/**
 * Form Template Schema
 * JSON structure defining form layout and fields
 */
export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  version: number;
  fields: FormField[];
  metadata?: Record<string, any>;
}

/**
 * Individual Form Field Definition
 */
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  validation?: FieldValidation;
  conditional?: ConditionalLogic;
  computedValue?: string;
  options?: FieldOption[];
  metadata?: Record<string, any>;
}

/**
 * Field Types (17 total - ISSUE-094 + ISSUE-182 tel/email support)
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkboxes'
  | 'photo'
  | 'signature'
  | 'gps'
  | 'repeater'
  | 'file'
  | 'computed'
  | 'tel'
  | 'email';

/**
 * Field Validation Rules
 */
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
  step?: number;
}

/**
 * Conditional Display Logic (ISSUE-095)
 */
export interface ConditionalLogic {
  showIf?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
}

/**
 * Field Options (for select, radio, checkboxes)
 */
export interface FieldOption {
  value: string;
  label: string;
}

/**
 * Form Submission Data
 */
export interface FormSubmissionData {
  templateId: string;
  values: Record<string, any>;
  submittedAt: string;
  submittedBy: string;
}

/**
 * FormRenderer Props
 */
export interface FormRendererProps {
  template: FormTemplate;
  onSubmit: (data: FormSubmissionData) => void;
  initialValues?: Record<string, any>;
  readOnly?: boolean;
  /** Hide form header (title/description) - use when page already shows them */
  hideHeader?: boolean;
}
