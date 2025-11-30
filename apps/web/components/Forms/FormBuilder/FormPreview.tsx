'use client';

import React, { useState, useMemo } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Select,
  MultiSelect,
  Checkbox,
  Radio,
  Alert,
  Badge,
  Card,
  FileInput,
  Box,
  Grid,
  SegmentedControl,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCamera,
  IconSignature,
  IconMapPin,
  IconCloudRain,
  IconUser,
  IconShieldCheck,
  IconClipboardList,
  IconAlertTriangle,
  IconFileUpload,
  IconCalculator,
  IconTable,
  IconList,
  IconCheck,
  IconDeviceMobile,
  IconDeviceTablet,
  IconDeviceDesktop,
  IconTestPipe,
  IconRefresh,
} from '@tabler/icons-react';
import type { FieldDefinition, FormTemplate } from '@brave-forms/types';
import { getFieldVisibility } from './ConditionalLogicBuilder';

// ============================================================================
// Types
// ============================================================================

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

interface FormPreviewProps {
  schema: Partial<FormTemplate>;
}

interface FieldPreviewProps {
  field: FieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (value: any) => void;
  error?: string;
}

function FieldPreview({ field, value, onChange, error }: FieldPreviewProps) {
  const isRequired = field.validation?.required;
  const width = field.width || 'full';

  // Calculate grid span based on width
  const getGridSpan = (width: string) => {
    switch (width) {
      case 'quarter':
        return 3;
      case 'third':
        return 4;
      case 'half':
        return 6;
      case 'full':
      default:
        return 12;
    }
  };

  const gridSpan = getGridSpan(width);

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <TextInput
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={isRequired}
            value={value || ''}
            onChange={(event) => onChange?.(event.currentTarget.value)}
            error={error}
          />
        );

      case 'textarea':
        return (
          <Textarea
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={isRequired}
            rows={3}
            value={value || ''}
            onChange={(event) => onChange?.(event.currentTarget.value)}
          />
        );

      case 'number':
        return (
          <NumberInput
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={isRequired}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.validation?.step}
            value={value}
            onChange={onChange}
          />
        );

      case 'date':
        return (
          <TextInput
            type="date"
            label={field.label}
            description={field.description}
            required={isRequired}
            value={value || ''}
            onChange={(event) => onChange?.(event.currentTarget.value)}
          />
        );

      case 'time':
        return (
          <TextInput
            type="time"
            label={field.label}
            description={field.description}
            required={isRequired}
            value={value || ''}
            onChange={(event) => onChange?.(event.currentTarget.value)}
          />
        );

      case 'select':
        return (
          <Select
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={isRequired}
            data={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
            value={value}
            onChange={onChange}
          />
        );

      case 'multiSelect':
        return (
          <MultiSelect
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={isRequired}
            data={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
            value={value || []}
            onChange={onChange}
          />
        );

      case 'radio':
        return (
          <div>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {isRequired && (
                <Text component="span" c="red">
                  {' '}
                  *
                </Text>
              )}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Radio.Group value={value} onChange={onChange}>
              <Stack gap="xs">
                {field.options?.map((option) => (
                  <Radio key={option.value} value={option.value} label={option.label} />
                ))}
              </Stack>
            </Radio.Group>
          </div>
        );

      case 'checkbox':
        return (
          <div>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {isRequired && (
                <Text component="span" c="red">
                  {' '}
                  *
                </Text>
              )}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Checkbox.Group value={value || []} onChange={onChange}>
              <Stack gap="xs">
                {field.options?.map((option) => (
                  <Checkbox key={option.value} value={option.value} label={option.label} />
                ))}
              </Stack>
            </Checkbox.Group>
          </div>
        );

      case 'photo':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconCamera size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
              {field.metadata?.gpsRequired && (
                <Badge size="xs" color="cyan" leftSection={<IconMapPin size={12} />}>
                  GPS Required
                </Badge>
              )}
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Button leftSection={<IconCamera size={16} />} variant="light" disabled>
              Take Photo (Preview Mode)
            </Button>
          </Card>
        );

      case 'signature':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconSignature size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
              {field.metadata?.signatureCertificate && (
                <Badge size="xs" color="red">
                  Certificate
                </Badge>
              )}
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Box
              style={{
                height: 100,
                border: '2px dashed var(--mantine-color-gray-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--mantine-radius-sm)',
              }}
            >
              <Text c="dimmed" size="sm">
                Signature pad (Preview Mode)
              </Text>
            </Box>
          </Card>
        );

      case 'gpsLocation':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconMapPin size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Button leftSection={<IconMapPin size={16} />} variant="light" disabled>
              Get Current Location (Preview Mode)
            </Button>
          </Card>
        );

      case 'weather':
        return (
          <Card withBorder p="md" bg="blue.0">
            <Group mb="sm">
              <IconCloudRain size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
              <Badge size="xs" color="blue">
                Auto-populated
              </Badge>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Text size="sm" c="dimmed">
              Weather data will be automatically fetched from{' '}
              {field.metadata?.weatherSource?.toUpperCase() || 'NOAA'}
            </Text>
          </Card>
        );

      case 'swpppTrigger':
        return (
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow" title={field.label}>
            <Text size="sm">
              {field.description ||
                'EPA CGP requires inspection within 24 hours of 0.25" precipitation during working hours'}
            </Text>
            <Group mt="sm">
              <Badge color="yellow">EPA Critical</Badge>
              <Badge color="red">0.25&quot; Threshold</Badge>
            </Group>
          </Alert>
        );

      case 'bmpChecklist':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconClipboardList size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
              <Badge size="xs" color="green">
                BMP
              </Badge>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Stack gap="xs">
              <Checkbox label="Silt Fence - Installed and Functional" disabled />
              <Checkbox label="Check Dams - Properly Maintained" disabled />
              <Checkbox label="Inlet Protection - In Place" disabled />
              <Checkbox label="Sediment Basin - Clear and Functional" disabled />
            </Stack>
          </Card>
        );

      case 'violationCode':
        return (
          <Card withBorder p="md" bg="red.0">
            <Group mb="sm">
              <IconShieldCheck size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
              <Badge size="xs" color="red">
                Compliance
              </Badge>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Select
              placeholder="Select violation code"
              data={[
                { value: 'EPA-001', label: 'EPA-001: Inadequate BMP Installation' },
                { value: 'EPA-002', label: 'EPA-002: Stormwater Discharge Violation' },
                { value: 'EPA-003', label: 'EPA-003: Missing Inspection Records' },
                { value: 'OSHA-001', label: 'OSHA-001: Safety Equipment Violation' },
              ]}
              disabled
            />
          </Card>
        );

      case 'measurement':
        return (
          <Group align="end">
            <NumberInput
              label={field.label}
              placeholder={field.placeholder}
              description={field.description}
              required={isRequired}
              style={{ flex: 1 }}
              value={value?.value}
              onChange={(val) => onChange?.({ ...value, value: val })}
            />
            <Select
              data={[
                { value: 'inches', label: 'in' },
                { value: 'feet', label: 'ft' },
                { value: 'meters', label: 'm' },
                { value: 'centimeters', label: 'cm' },
              ]}
              value={value?.unit || field.metadata?.units || 'inches'}
              onChange={(unit) => onChange?.({ ...value, unit })}
              style={{ minWidth: 80 }}
            />
          </Group>
        );

      case 'inspector':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconUser size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Select
              placeholder="Select certified inspector"
              data={[
                { value: 'inspector1', label: 'John Smith (Cert: EPA-12345)' },
                { value: 'inspector2', label: 'Jane Doe (Cert: EPA-67890)' },
              ]}
              disabled
            />
          </Card>
        );

      case 'fileUpload':
        return (
          <FileInput
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={isRequired}
            leftSection={<IconFileUpload size={16} />}
            disabled
          />
        );

      case 'repeater':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconList size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Text size="sm" c="dimmed">
              Dynamic repeating field group (Preview Mode)
            </Text>
          </Card>
        );

      case 'table':
        return (
          <Card withBorder p="md">
            <Group mb="sm">
              <IconTable size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Text size="sm" c="dimmed">
              Data table interface (Preview Mode)
            </Text>
          </Card>
        );

      case 'calculation':
        return (
          <Card withBorder p="md" bg="violet.0">
            <Group mb="sm">
              <IconCalculator size={20} />
              <Text fw={500}>
                {field.label}
                {isRequired && (
                  <Text component="span" c="red">
                    {' '}
                    *
                  </Text>
                )}
              </Text>
              <Badge size="xs" color="violet">
                Calculated
              </Badge>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Text size="sm" c="dimmed">
              Auto-calculated based on other field values
            </Text>
          </Card>
        );

      default:
        return (
          <Alert color="orange" title="Unsupported Field Type">
            <Text size="sm">
              Field type &quot;{field.type}&quot; is not yet supported in preview mode.
            </Text>
          </Alert>
        );
    }
  };

  return (
    <Grid.Col span={gridSpan}>
      {renderField()}

      {/* EPA Compliance Indicators */}
      {field.metadata?.epaCompliance?.criticalField && (
        <Group mt="xs" gap="xs">
          <Badge size="xs" color="blue" leftSection={<IconShieldCheck size={12} />}>
            EPA Critical
          </Badge>
          {field.metadata.epaCompliance.regulation && (
            <Badge size="xs" variant="outline">
              {field.metadata.epaCompliance.regulation}
            </Badge>
          )}
        </Group>
      )}
    </Grid.Col>
  );
}

// ============================================================================
// Test Data Generation
// ============================================================================

/**
 * Construction-industry realistic test data samples
 */
const CONSTRUCTION_TEST_DATA = {
  inspectorNames: ['John Martinez', 'Sarah Chen', 'Mike Johnson', 'Emily Rodriguez'],
  siteLocations: [
    'North Entrance Gate',
    'Building A Foundation',
    'Parking Structure Level 2',
    'Stormwater Basin #3',
  ],
  projectNames: [
    'Highway 101 Expansion Phase 2',
    'Downtown Mixed-Use Development',
    'Industrial Park Lot 5',
  ],
  equipmentIds: ['CAT-320D-07', 'JD-544K-12', 'VOLVO-EC250E-03'],
  bmpConditions: [
    'Good - No maintenance required',
    'Fair - Minor repairs needed',
    'Poor - Immediate attention required',
  ],
  weatherConditions: ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain'],
  temperatures: [45, 58, 72, 85, 92],
  precipitation: [0, 0.1, 0.25, 0.5, 1.2],
};

/**
 * Generate realistic construction-industry test data for a field based on its type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateTestData(field: FieldDefinition): any {
  const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const fieldLabel = field.label?.toLowerCase() || '';

  switch (field.type) {
    case 'text':
      // Context-aware text generation
      if (fieldLabel.includes('inspector') || fieldLabel.includes('name')) {
        return randomItem(CONSTRUCTION_TEST_DATA.inspectorNames);
      }
      if (fieldLabel.includes('location') || fieldLabel.includes('site')) {
        return randomItem(CONSTRUCTION_TEST_DATA.siteLocations);
      }
      if (fieldLabel.includes('project')) {
        return randomItem(CONSTRUCTION_TEST_DATA.projectNames);
      }
      if (fieldLabel.includes('equipment') || fieldLabel.includes('id')) {
        return randomItem(CONSTRUCTION_TEST_DATA.equipmentIds);
      }
      return `Sample ${field.label}`;
    case 'textarea':
      if (fieldLabel.includes('note') || fieldLabel.includes('comment')) {
        return 'Silt fence along eastern perimeter showing minor damage from recent storm. Repairs scheduled for tomorrow. All other BMPs functioning properly.';
      }
      if (fieldLabel.includes('description') || fieldLabel.includes('observation')) {
        return 'Inspected stormwater outfall structure. No visible sediment discharge. Inlet protection devices in place and functioning. Area swept clean of debris.';
      }
      return `Detailed notes for ${field.label}. Construction site inspection completed per EPA CGP requirements.`;
    case 'number':
      if (fieldLabel.includes('temp')) {
        return randomItem(CONSTRUCTION_TEST_DATA.temperatures);
      }
      if (fieldLabel.includes('precip') || fieldLabel.includes('rain')) {
        return randomItem(CONSTRUCTION_TEST_DATA.precipitation);
      }
      return Math.floor(Math.random() * 100);
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'time': {
      // Typical construction inspection times (7am - 5pm)
      const hour = 7 + Math.floor(Math.random() * 10);
      const minute = Math.floor(Math.random() * 4) * 15;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    case 'select':
    case 'radio':
      return field.options?.[0]?.value || '';
    case 'multiSelect':
      return field.options?.slice(0, 2).map((o) => o.value) || [];
    case 'checkbox':
      return field.options?.slice(0, 2).map((o) => o.value) || [];
    case 'photo':
      return null; // Photos can't be generated
    case 'signature':
      return null; // Signatures can't be generated
    case 'gpsLocation':
      // San Francisco construction site coordinates
      return { lat: 37.7749, lng: -122.4194 };
    case 'weather':
      return {
        temp: randomItem(CONSTRUCTION_TEST_DATA.temperatures),
        conditions: randomItem(CONSTRUCTION_TEST_DATA.weatherConditions),
        precipitation: randomItem(CONSTRUCTION_TEST_DATA.precipitation),
      };
    case 'measurement':
      return { value: 12.5, unit: 'inches' };
    default:
      return '';
  }
}

/**
 * Validate a single field value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateField(field: FieldDefinition, value: any): string | null {
  const validation = field.validation;
  if (!validation) return null;

  // Required check
  if (validation.required) {
    if (value === undefined || value === null || value === '') {
      return `${field.label} is required`;
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${field.label} is required`;
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${field.label} must be at most ${validation.maxLength} characters`;
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `${field.label} format is invalid`;
      }
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      return `${field.label} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && value > validation.max) {
      return `${field.label} must be at most ${validation.max}`;
    }
  }

  return null;
}

// ============================================================================
// FormPreview Component
// ============================================================================

export function FormPreview({ schema }: FormPreviewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [showValidation, setShowValidation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    setShowValidation(false);
    setSubmitted(false);
  };

  const sortedFields = useMemo(
    () => (schema.fields || []).sort((a, b) => a.order - b.order),
    [schema.fields]
  );

  // Filter visible fields based on conditional logic
  const visibleFields = useMemo(() => {
    return sortedFields.filter((field) => {
      if (!field.conditional) return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getFieldVisibility(field as any, sortedFields as any, formValues);
    });
  }, [sortedFields, formValues]);

  // Validate all fields
  const validationErrors = useMemo(() => {
    if (!showValidation) return {};
    const errors: Record<string, string> = {};
    for (const field of visibleFields) {
      const error = validateField(field, formValues[field.name]);
      if (error) {
        errors[field.id] = error;
      }
    }
    return errors;
  }, [visibleFields, formValues, showValidation]);

  // Generate test data for all fields
  const fillTestData = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testData: Record<string, any> = {};
    for (const field of sortedFields) {
      testData[field.name] = generateTestData(field);
    }
    setFormValues(testData);
    setShowValidation(false);
    setSubmitted(false);
  };

  // Clear all form data
  const clearForm = () => {
    setFormValues({});
    setShowValidation(false);
    setSubmitted(false);
  };

  // Handle form submission
  const handleSubmit = () => {
    setShowValidation(true);
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (!hasErrors) {
      setSubmitted(true);
    }
  };

  // Preview mode widths
  const modeWidths: Record<PreviewMode, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  if (!sortedFields.length) {
    return (
      <Alert color="blue" title="No Fields to Preview">
        <Text size="sm">Add some fields to your form to see the preview.</Text>
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Preview Controls */}
      <Group justify="space-between">
        <Group gap="xs">
          <Text size="sm" fw={500}>
            Preview Mode:
          </Text>
          <SegmentedControl
            size="xs"
            value={previewMode}
            onChange={(value) => setPreviewMode(value as PreviewMode)}
            data={[
              {
                label: (
                  <Tooltip label="Desktop">
                    <IconDeviceDesktop size={16} />
                  </Tooltip>
                ),
                value: 'desktop',
              },
              {
                label: (
                  <Tooltip label="Tablet">
                    <IconDeviceTablet size={16} />
                  </Tooltip>
                ),
                value: 'tablet',
              },
              {
                label: (
                  <Tooltip label="Mobile">
                    <IconDeviceMobile size={16} />
                  </Tooltip>
                ),
                value: 'mobile',
              },
            ]}
          />
        </Group>

        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<IconTestPipe size={14} />}
            onClick={fillTestData}
          >
            Fill Test Data
          </Button>
          <Tooltip label="Clear Form">
            <ActionIcon variant="light" size="md" onClick={clearForm}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Form Container */}
      <ScrollArea>
        <div
          style={{
            width: modeWidths[previewMode],
            margin: '0 auto',
            transition: 'width 0.3s ease',
          }}
        >
          {/* Form Header */}
          <Paper withBorder p="lg" mb="md">
            <Title order={3}>{schema.name || 'Untitled Form'}</Title>
            {schema.description && (
              <Text c="dimmed" mt="xs">
                {schema.description}
              </Text>
            )}
            {schema.category && (
              <Group mt="sm">
                <Badge color="blue">{schema.category}</Badge>
                {schema.category?.startsWith('EPA') && (
                  <Badge color="green" leftSection={<IconShieldCheck size={12} />}>
                    Compliance Form
                  </Badge>
                )}
              </Group>
            )}
          </Paper>

          {/* Validation Summary */}
          {showValidation && Object.keys(validationErrors).length > 0 && (
            <Alert
              color="red"
              title="Validation Errors"
              mb="md"
              icon={<IconAlertTriangle size={16} />}
            >
              <Stack gap="xs">
                {Object.entries(validationErrors).map(([fieldId, error]) => (
                  <Text key={fieldId} size="sm">
                    {error}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}

          {/* Success Message */}
          {submitted && (
            <Alert
              color="green"
              title="Form Submitted Successfully"
              mb="md"
              icon={<IconCheck size={16} />}
            >
              <Text size="sm">Your form data has been submitted (preview mode).</Text>
              <Card withBorder mt="sm" p="xs">
                <Text size="xs" fw={500} mb="xs">
                  Submitted Data:
                </Text>
                <ScrollArea h={100}>
                  <pre style={{ fontSize: 10, margin: 0 }}>
                    {JSON.stringify(formValues, null, 2)}
                  </pre>
                </ScrollArea>
              </Card>
            </Alert>
          )}

          {/* Form Fields */}
          <Paper withBorder p="lg">
            <Grid>
              {visibleFields.map((field) => (
                <FieldPreview
                  key={field.id}
                  field={field}
                  value={formValues[field.name]}
                  onChange={(value) => handleFieldChange(field.name, value)}
                  error={showValidation ? validationErrors[field.id] : undefined}
                />
              ))}
            </Grid>

            {/* Hidden Fields Indicator */}
            {visibleFields.length < sortedFields.length && (
              <Alert color="gray" mt="md" variant="light">
                <Text size="sm">
                  {sortedFields.length - visibleFields.length} field
                  {sortedFields.length - visibleFields.length !== 1 ? 's' : ''} hidden by
                  conditional logic
                </Text>
              </Alert>
            )}

            {/* Form Actions */}
            <Group justify="center" mt="xl">
              <Button variant="outline" onClick={() => setShowValidation(true)}>
                Validate Form
              </Button>
              <Button leftSection={<IconCheck size={16} />} onClick={handleSubmit}>
                Submit Form
              </Button>
            </Group>
          </Paper>

          {/* Form Info */}
          <Paper p="sm" bg="gray.0" mt="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {visibleFields.length} of {sortedFields.length} fields visible |{' '}
                {visibleFields.filter((f) => f.validation?.required).length} required
              </Text>
              <Group gap="xs">
                {sortedFields.some((f) => f.metadata?.epaCompliance?.criticalField) && (
                  <Badge size="sm" color="blue">
                    EPA Compliant
                  </Badge>
                )}
                {sortedFields.some((f) => f.metadata?.gpsRequired) && (
                  <Badge size="sm" color="cyan">
                    GPS Required
                  </Badge>
                )}
              </Group>
            </Group>
          </Paper>
        </div>
      </ScrollArea>
    </Stack>
  );
}
