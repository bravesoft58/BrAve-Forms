'use client';

import React, { useState } from 'react';
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
  Switch,
  Alert,
  Badge,
  Card,
  FileInput,
  Box,
  Grid,
  Divider,
} from '@mantine/core';
import {
  IconCamera,
  IconSignature,
  IconMapPin,
  IconCloudRain,
  IconUser,
  IconShieldCheck,
  IconRuler,
  IconClipboardList,
  IconAlertTriangle,
  IconFileUpload,
  IconCalculator,
  IconTable,
  IconList,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import type { FieldDefinition, FormTemplate } from '@brave-forms/types';

interface FormPreviewProps {
  schema: Partial<FormTemplate>;
}

interface FieldPreviewProps {
  field: FieldDefinition;
  value?: any;
  onChange?: (value: any) => void;
}

function FieldPreview({ field, value, onChange }: FieldPreviewProps) {
  const isRequired = field.validation?.required;
  const width = field.width || 'full';
  
  // Calculate grid span based on width
  const getGridSpan = (width: string) => {
    switch (width) {
      case 'quarter': return 3;
      case 'third': return 4;
      case 'half': return 6;
      case 'full':
      default: return 12;
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
            data={field.options?.map(opt => ({ value: opt.value, label: opt.label })) || []}
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
            data={field.options?.map(opt => ({ value: opt.value, label: opt.label })) || []}
            value={value || []}
            onChange={onChange}
          />
        );

      case 'radio':
        return (
          <div>
            <Text size="sm" fw={500} mb="xs">
              {field.label}
              {isRequired && <Text component="span" c="red"> *</Text>}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Radio.Group value={value} onChange={onChange}>
              <Stack gap="xs">
                {field.options?.map((option) => (
                  <Radio
                    key={option.value}
                    value={option.value}
                    label={option.label}
                  />
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
              {isRequired && <Text component="span" c="red"> *</Text>}
            </Text>
            {field.description && (
              <Text size="xs" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Checkbox.Group value={value || []} onChange={onChange}>
              <Stack gap="xs">
                {field.options?.map((option) => (
                  <Checkbox
                    key={option.value}
                    value={option.value}
                    label={option.label}
                  />
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
            <Button
              leftSection={<IconCamera size={16} />}
              variant="light"
              disabled
            >
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
                {isRequired && <Text component="span" c="red"> *</Text>}
              </Text>
            </Group>
            {field.description && (
              <Text size="sm" c="dimmed" mb="sm">
                {field.description}
              </Text>
            )}
            <Button
              leftSection={<IconMapPin size={16} />}
              variant="light"
              disabled
            >
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
              Weather data will be automatically fetched from {field.metadata?.weatherSource?.toUpperCase() || 'NOAA'}
            </Text>
          </Card>
        );

      case 'swpppTrigger':
        return (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="yellow"
            title={field.label}
          >
            <Text size="sm">
              {field.description || 'EPA CGP requires inspection within 24 hours of 0.25" precipitation during working hours'}
            </Text>
            <Group mt="sm">
              <Badge color="yellow">EPA Critical</Badge>
              <Badge color="red">0.25" Threshold</Badge>
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
                {isRequired && <Text component="span" c="red"> *</Text>}
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
              Field type "{field.type}" is not yet supported in preview mode.
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

export function FormPreview({ schema }: FormPreviewProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const sortedFields = (schema.fields || []).sort((a, b) => a.order - b.order);

  if (!sortedFields.length) {
    return (
      <Alert color="blue" title="No Fields to Preview">
        <Text size="sm">
          Add some fields to your form to see the preview.
        </Text>
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Form Header */}
      <div>
        <Title order={3}>
          {schema.name || 'Untitled Form'}
        </Title>
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
      </div>

      <Divider />

      {/* Form Fields */}
      <Paper withBorder p="lg">
        <Grid>
          {sortedFields.map((field) => (
            <FieldPreview
              key={field.id}
              field={field}
              value={formValues[field.name]}
              onChange={(value) => handleFieldChange(field.name, value)}
            />
          ))}
        </Grid>

        {/* Form Actions */}
        <Group justify="center" mt="xl">
          <Button leftSection={<IconCheck size={16} />} disabled>
            Submit Form (Preview Mode)
          </Button>
          <Button variant="light" leftSection={<IconX size={16} />} disabled>
            Save Draft (Preview Mode)
          </Button>
        </Group>
      </Paper>

      {/* Form Info */}
      <Paper p="sm" bg="gray.0">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {sortedFields.length} field{sortedFields.length !== 1 ? 's' : ''} • 
            {sortedFields.filter(f => f.validation?.required).length} required
          </Text>
          <Group gap="xs">
            {sortedFields.some(f => f.metadata?.epaCompliance?.criticalField) && (
              <Badge size="sm" color="blue">
                EPA Compliant
              </Badge>
            )}
            {sortedFields.some(f => f.metadata?.gpsRequired) && (
              <Badge size="sm" color="cyan">
                GPS Required
              </Badge>
            )}
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}