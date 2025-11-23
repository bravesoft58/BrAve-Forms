'use client';

import { FormRenderer } from '@/components/Forms/FormRenderer';
import { FormTemplate } from '@/components/Forms/FormRenderer/types';
import { PageContainer } from '@/components/Layout/PageContainer';

const testTemplate: FormTemplate = {
  id: 'template_test',
  title: 'Daily Safety Inspection - All Field Types with Conditional Logic',
  description: 'Test form demonstrating all 15 field types and conditional display logic',
  version: 1,
  fields: [
    {
      id: 'inspector_name',
      type: 'text',
      label: 'Inspector Name',
      placeholder: 'Enter your name',
      required: true,
    },
    {
      id: 'has_hazards',
      type: 'radio',
      label: 'Are there any safety hazards?',
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      id: 'hazard_description',
      type: 'textarea',
      label: 'Describe the hazards',
      placeholder: 'Provide detailed description',
      required: true,
      conditional: {
        showIf: {
          field: 'has_hazards',
          operator: 'equals',
          value: 'yes',
        },
      },
    },
    {
      id: 'hazard_severity',
      type: 'select',
      label: 'Hazard Severity',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      conditional: {
        showIf: {
          field: 'has_hazards',
          operator: 'equals',
          value: 'yes',
        },
      },
    },
    {
      id: 'immediate_action',
      type: 'textarea',
      label: 'Immediate Action Required',
      placeholder: 'Describe action taken',
      required: true,
      conditional: {
        showIf: {
          field: 'hazard_severity',
          operator: 'equals',
          value: 'high',
        },
      },
    },
    {
      id: 'inspection_date',
      type: 'date',
      label: 'Inspection Date',
      required: true,
    },
    {
      id: 'inspection_time',
      type: 'time',
      label: 'Inspection Time',
      required: false,
    },
    {
      id: 'site_conditions',
      type: 'textarea',
      label: 'Site Conditions',
      placeholder: 'Describe site conditions',
      required: false,
    },
    {
      id: 'temperature',
      type: 'number',
      label: 'Temperature (°F)',
      placeholder: 'Enter temperature',
      required: false,
      validation: {
        min: 0,
        max: 120,
      },
    },
    {
      id: 'extreme_weather_warning',
      type: 'text',
      label: 'Extreme Weather Warning',
      placeholder: 'Warning message',
      required: false,
      conditional: {
        showIf: {
          field: 'temperature',
          operator: 'greaterThan',
          value: 100,
        },
      },
    },
    {
      id: 'weather_condition',
      type: 'select',
      label: 'Weather Condition',
      required: true,
      options: [
        { value: 'sunny', label: 'Sunny' },
        { value: 'cloudy', label: 'Cloudy' },
        { value: 'rainy', label: 'Rainy' },
        { value: 'snowy', label: 'Snowy' },
      ],
    },
    {
      id: 'safety_status',
      type: 'radio',
      label: 'Safety Status',
      required: true,
      options: [
        { value: 'safe', label: 'Safe' },
        { value: 'caution', label: 'Caution' },
        { value: 'unsafe', label: 'Unsafe' },
      ],
    },
    {
      id: 'ppe_required',
      type: 'checkbox',
      label: 'PPE Required',
      placeholder: 'Personal Protective Equipment required',
      required: false,
    },
    {
      id: 'hazards',
      type: 'checkboxes',
      label: 'Hazards Present',
      required: false,
      options: [
        { value: 'electrical', label: 'Electrical' },
        { value: 'chemical', label: 'Chemical' },
        { value: 'fall', label: 'Fall Risk' },
        { value: 'machinery', label: 'Machinery' },
      ],
    },
    {
      id: 'site_photo',
      type: 'photo',
      label: 'Site Photo',
      required: false,
    },
    {
      id: 'inspector_signature',
      type: 'signature',
      label: 'Inspector Signature',
      required: true,
    },
    {
      id: 'gps_location',
      type: 'gps',
      label: 'GPS Location',
      required: false,
    },
    {
      id: 'attachments',
      type: 'file',
      label: 'Additional Attachments',
      required: false,
    },
    {
      id: 'materials_list',
      type: 'repeater',
      label: 'Materials List',
      required: false,
    },
    {
      id: 'length',
      type: 'number',
      label: 'Length (ft)',
      placeholder: '0',
      required: false,
      defaultValue: 0,
    },
    {
      id: 'width',
      type: 'number',
      label: 'Width (ft)',
      placeholder: '0',
      required: false,
      defaultValue: 0,
    },
    {
      id: 'height',
      type: 'number',
      label: 'Height (ft)',
      placeholder: '0',
      required: false,
      defaultValue: 0,
    },
    {
      id: 'total_linear',
      type: 'computed',
      label: 'Total Linear Feet',
      computedValue: 'SUM(length, width, height)',
      required: false,
    },
    {
      id: 'total_area',
      type: 'computed',
      label: 'Average Dimension',
      computedValue: 'AVERAGE(length, width)',
      required: false,
    },
    {
      id: 'field_count',
      type: 'computed',
      label: 'Completed Fields',
      computedValue: 'COUNT(length, width, height)',
      required: false,
    },
    {
      id: 'inspection_date',
      type: 'computed',
      label: 'Inspection Date',
      computedValue: '{{currentDate}}',
      required: false,
    },
    {
      id: 'inspection_time',
      type: 'computed',
      label: 'Inspection Time',
      computedValue: '{{currentTime}}',
      required: false,
    },
    {
      id: 'inspector',
      type: 'computed',
      label: 'Inspector',
      computedValue: '{{userName}}',
      required: false,
    },
  ],
};

// Validation example template
const validationTemplate: FormTemplate = {
  id: 'template_validation',
  title: 'Form Validation Example',
  version: 1,
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
      validation: {
        minLength: 3,
        maxLength: 50,
        customMessage: 'Name must be between 3 and 50 characters',
      },
    },
    {
      id: 'email',
      type: 'text',
      label: 'Email Address',
      placeholder: 'user@example.com',
      required: true,
      validation: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        customMessage: 'Invalid email address',
      },
    },
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      placeholder: '18',
      required: true,
      validation: {
        min: 18,
        max: 100,
        customMessage: 'Age must be between 18 and 100',
      },
    },
    {
      id: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter description',
      required: false,
      validation: {
        maxLength: 500,
        customMessage: 'Description cannot exceed 500 characters',
      },
    },
    {
      id: 'agree_terms',
      type: 'checkbox',
      label: 'I agree to the terms and conditions',
      required: true,
    },
  ],
};

export default function TestFormPage() {
  const handleSubmit = (data: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.log('Form submitted:', data);
    // eslint-disable-next-line no-alert
    alert('Form submitted successfully!');
  };

  // Use validationTemplate to test validation, or testTemplate for all field types
  const useValidationTemplate = false;

  return (
    <PageContainer title="Test Form">
      <FormRenderer
        template={useValidationTemplate ? validationTemplate : testTemplate}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
