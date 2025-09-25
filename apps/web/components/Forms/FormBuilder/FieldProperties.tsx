'use client';

import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Title,
  TextInput,
  Textarea,
  Switch,
  Select,
  NumberInput,
  Button,
  Group,
  Divider,
  Tabs,
  Accordion,
  Alert,
  Badge,
  ActionIcon,
  Text,
  Collapse,
  Box,
  Checkbox,
} from '@mantine/core';
import {
  IconSettings,
  IconTrash,
  IconAlertTriangle,
  IconShieldCheck,
  IconMapPin,
  IconCamera,
  IconPlus,
  IconX,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import type { FieldDefinition } from '@brave-forms/types';

interface FieldPropertiesProps {
  field: FieldDefinition;
  onUpdate: (updates: Partial<FieldDefinition>) => void;
  onDelete: () => void;
}

export function FieldProperties({ field, onUpdate, onDelete }: FieldPropertiesProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm({
    initialValues: {
      label: field.label || '',
      name: field.name || '',
      description: field.description || '',
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue || '',
      required: field.validation?.required || false,
      width: field.width || 'full',
      // Validation
      minLength: field.validation?.minLength || undefined,
      maxLength: field.validation?.maxLength || undefined,
      min: field.validation?.min || undefined,
      max: field.validation?.max || undefined,
      step: field.validation?.step || undefined,
      pattern: field.validation?.pattern || '',
      // Options for select/radio fields
      options: field.options || [],
      // EPA Compliance
      gpsRequired: field.metadata?.gpsRequired || false,
      photoQuality: field.metadata?.photoQuality || 'high',
      signatureCertificate: field.metadata?.signatureCertificate || false,
      weatherSource: field.metadata?.weatherSource || 'noaa',
      units: field.metadata?.units || '',
      epaRegulation: field.metadata?.epaCompliance?.regulation || '',
      epaSection: field.metadata?.epaCompliance?.section || '',
      epaCritical: field.metadata?.epaCompliance?.criticalField || false,
    },
  });

  // Update field when form values change
  const handleFormChange = (updates: any) => {
    const fieldUpdates: Partial<FieldDefinition> = {
      label: updates.label,
      name: updates.name,
      description: updates.description,
      placeholder: updates.placeholder,
      defaultValue: updates.defaultValue,
      width: updates.width,
      validation: {
        required: updates.required,
        ...(updates.minLength && { minLength: updates.minLength }),
        ...(updates.maxLength && { maxLength: updates.maxLength }),
        ...(updates.min !== undefined && { min: updates.min }),
        ...(updates.max !== undefined && { max: updates.max }),
        ...(updates.step && { step: updates.step }),
        ...(updates.pattern && { pattern: updates.pattern }),
      },
      ...(updates.options && { options: updates.options }),
      metadata: {
        ...field.metadata,
        ...(updates.gpsRequired && { gpsRequired: updates.gpsRequired }),
        ...(updates.photoQuality && { photoQuality: updates.photoQuality }),
        ...(updates.signatureCertificate && { signatureCertificate: updates.signatureCertificate }),
        ...(updates.weatherSource && { weatherSource: updates.weatherSource }),
        ...(updates.units && { units: updates.units }),
        ...(updates.epaRegulation || updates.epaSection || updates.epaCritical) && {
          epaCompliance: {
            regulation: updates.epaRegulation,
            section: updates.epaSection,
            criticalField: updates.epaCritical,
          },
        },
      },
    };

    onUpdate(fieldUpdates);
  };

  // Add option for select fields
  const addOption = () => {
    const newOptions = [
      ...(form.values.options || []),
      { label: `Option ${(form.values.options?.length || 0) + 1}`, value: `option_${Date.now()}` },
    ];
    form.setFieldValue('options', newOptions);
    handleFormChange({ ...form.values, options: newOptions });
  };

  // Remove option
  const removeOption = (index: number) => {
    const newOptions = form.values.options?.filter((_, i) => i !== index) || [];
    form.setFieldValue('options', newOptions);
    handleFormChange({ ...form.values, options: newOptions });
  };

  // Update option
  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    const newOptions = [...(form.values.options || [])];
    if (newOptions[index]) {
      newOptions[index] = { ...newOptions[index], [key]: value };
      form.setFieldValue('options', newOptions);
      handleFormChange({ ...form.values, options: newOptions });
    }
  };

  const isEpaField = ['weather', 'swpppTrigger', 'bmpChecklist', 'violationCode'].includes(field.type);
  const isPhotoField = field.type === 'photo';
  const isSignatureField = field.type === 'signature';
  const isMeasurementField = field.type === 'measurement';
  const hasOptions = ['select', 'multiSelect', 'radio', 'checkbox'].includes(field.type);
  const isNumberField = field.type === 'number';
  const isTextField = ['text', 'textarea'].includes(field.type);

  return (
    <Paper withBorder style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <Stack gap="sm" p="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconSettings size={18} />
            <Title order={5}>Field Properties</Title>
          </Group>
          <ActionIcon color="red" variant="light" onClick={onDelete}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>

        <Badge variant="light" size="sm">
          {field.type} field
        </Badge>

        <Divider />

        {/* Basic Properties */}
        <Stack gap="xs">
          <Title order={6}>Basic Settings</Title>
          
          <TextInput
            label="Field Label"
            placeholder="Enter field label"
            {...form.getInputProps('label')}
            onChange={(event) => {
              form.getInputProps('label').onChange(event);
              handleFormChange({ ...form.values, label: event.currentTarget.value });
            }}
          />

          <TextInput
            label="Field Name"
            placeholder="field_name"
            description="Used in form data (no spaces)"
            {...form.getInputProps('name')}
            onChange={(event) => {
              form.getInputProps('name').onChange(event);
              handleFormChange({ ...form.values, name: event.currentTarget.value });
            }}
          />

          <Textarea
            label="Description"
            placeholder="Help text for users"
            rows={2}
            {...form.getInputProps('description')}
            onChange={(event) => {
              form.getInputProps('description').onChange(event);
              handleFormChange({ ...form.values, description: event.currentTarget.value });
            }}
          />

          <TextInput
            label="Placeholder"
            placeholder="Placeholder text"
            {...form.getInputProps('placeholder')}
            onChange={(event) => {
              form.getInputProps('placeholder').onChange(event);
              handleFormChange({ ...form.values, placeholder: event.currentTarget.value });
            }}
          />

          <Select
            label="Field Width"
            data={[
              { value: 'full', label: 'Full Width (100%)' },
              { value: 'half', label: 'Half Width (50%)' },
              { value: 'third', label: 'Third Width (33%)' },
              { value: 'quarter', label: 'Quarter Width (25%)' },
            ]}
            {...form.getInputProps('width')}
            onChange={(value) => {
              form.setFieldValue('width', value);
              handleFormChange({ ...form.values, width: value });
            }}
          />

          <Switch
            label="Required Field"
            description="Users must fill this field"
            {...form.getInputProps('required')}
            onChange={(event) => {
              form.getInputProps('required').onChange(event);
              handleFormChange({ ...form.values, required: event.currentTarget.checked });
            }}
          />
        </Stack>

        {/* Field Type Specific Settings */}
        {(isTextField || isNumberField) && (
          <>
            <Divider />
            <Stack gap="xs">
              <Title order={6}>Validation</Title>
              
              {isTextField && (
                <>
                  <NumberInput
                    label="Minimum Length"
                    placeholder="Min characters"
                    min={0}
                    {...form.getInputProps('minLength')}
                    onChange={(value) => {
                      form.setFieldValue('minLength', value);
                      handleFormChange({ ...form.values, minLength: value });
                    }}
                  />
                  <NumberInput
                    label="Maximum Length"
                    placeholder="Max characters"
                    min={0}
                    {...form.getInputProps('maxLength')}
                    onChange={(value) => {
                      form.setFieldValue('maxLength', value);
                      handleFormChange({ ...form.values, maxLength: value });
                    }}
                  />
                </>
              )}
              
              {isNumberField && (
                <>
                  <NumberInput
                    label="Minimum Value"
                    placeholder="Min value"
                    {...form.getInputProps('min')}
                    onChange={(value) => {
                      form.setFieldValue('min', value);
                      handleFormChange({ ...form.values, min: value });
                    }}
                  />
                  <NumberInput
                    label="Maximum Value"
                    placeholder="Max value"
                    {...form.getInputProps('max')}
                    onChange={(value) => {
                      form.setFieldValue('max', value);
                      handleFormChange({ ...form.values, max: value });
                    }}
                  />
                  <NumberInput
                    label="Step"
                    placeholder="Increment step"
                    step={0.01}
                    decimalScale={2}
                    {...form.getInputProps('step')}
                    onChange={(value) => {
                      form.setFieldValue('step', value);
                      handleFormChange({ ...form.values, step: value });
                    }}
                  />
                  
                  {field.name === 'rainfallAmount' && (
                    <Alert icon={<IconAlertTriangle size={16} />} color="yellow" size="sm">
                      EPA CGP requires exactly 0.25 inches for inspection trigger
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          </>
        )}

        {/* Options for Select Fields */}
        {hasOptions && (
          <>
            <Divider />
            <Stack gap="xs">
              <Group justify="space-between">
                <Title order={6}>Options</Title>
                <Button size="xs" leftSection={<IconPlus size={14} />} onClick={addOption}>
                  Add Option
                </Button>
              </Group>
              
              {form.values.options?.map((option, index) => (
                <Paper key={index} p="xs" withBorder>
                  <Group>
                    <TextInput
                      placeholder="Label"
                      value={option.label}
                      onChange={(event) => updateOption(index, 'label', event.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      placeholder="Value"
                      value={option.value}
                      onChange={(event) => updateOption(index, 'value', event.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon color="red" size="sm" onClick={() => removeOption(index)}>
                      <IconX size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </>
        )}

        {/* EPA Compliance Settings */}
        {(isEpaField || isPhotoField || isSignatureField) && (
          <>
            <Divider />
            <Stack gap="xs">
              <Group>
                <IconShieldCheck size={16} />
                <Title order={6}>EPA Compliance</Title>
              </Group>

              {isPhotoField && (
                <>
                  <Switch
                    label="Require GPS Location"
                    description="Embed GPS coordinates in photo EXIF data"
                    icon={<IconMapPin size={16} />}
                    {...form.getInputProps('gpsRequired')}
                    onChange={(event) => {
                      form.getInputProps('gpsRequired').onChange(event);
                      handleFormChange({ ...form.values, gpsRequired: event.currentTarget.checked });
                    }}
                  />
                  <Select
                    label="Photo Quality"
                    data={[
                      { value: 'high', label: 'High Quality (Recommended)' },
                      { value: 'medium', label: 'Medium Quality' },
                      { value: 'low', label: 'Low Quality' },
                    ]}
                    {...form.getInputProps('photoQuality')}
                    onChange={(value) => {
                      form.setFieldValue('photoQuality', value);
                      handleFormChange({ ...form.values, photoQuality: value });
                    }}
                  />
                </>
              )}

              {isSignatureField && (
                <Switch
                  label="Digital Certificate"
                  description="Generate legally binding certificate"
                  {...form.getInputProps('signatureCertificate')}
                  onChange={(event) => {
                    form.getInputProps('signatureCertificate').onChange(event);
                    handleFormChange({ ...form.values, signatureCertificate: event.currentTarget.checked });
                  }}
                />
              )}

              <Switch
                label="EPA Critical Field"
                description="Mark as critical for EPA compliance"
                {...form.getInputProps('epaCritical')}
                onChange={(event) => {
                  form.getInputProps('epaCritical').onChange(event);
                  handleFormChange({ ...form.values, epaCritical: event.currentTarget.checked });
                }}
              />

              <TextInput
                label="EPA Regulation"
                placeholder="e.g., EPA CGP 2022"
                {...form.getInputProps('epaRegulation')}
                onChange={(event) => {
                  form.getInputProps('epaRegulation').onChange(event);
                  handleFormChange({ ...form.values, epaRegulation: event.currentTarget.value });
                }}
              />

              <TextInput
                label="Section Reference"
                placeholder="e.g., Section 4.2"
                {...form.getInputProps('epaSection')}
                onChange={(event) => {
                  form.getInputProps('epaSection').onChange(event);
                  handleFormChange({ ...form.values, epaSection: event.currentTarget.value });
                }}
              />
            </Stack>
          </>
        )}

        {/* Measurement Units */}
        {isMeasurementField && (
          <>
            <Divider />
            <Stack gap="xs">
              <Title order={6}>Measurement Settings</Title>
              <Select
                label="Units"
                data={[
                  { value: 'inches', label: 'Inches' },
                  { value: 'feet', label: 'Feet' },
                  { value: 'meters', label: 'Meters' },
                  { value: 'centimeters', label: 'Centimeters' },
                  { value: 'square_feet', label: 'Square Feet' },
                  { value: 'acres', label: 'Acres' },
                  { value: 'cubic_feet', label: 'Cubic Feet' },
                  { value: 'gallons', label: 'Gallons' },
                ]}
                {...form.getInputProps('units')}
                onChange={(value) => {
                  form.setFieldValue('units', value);
                  handleFormChange({ ...form.values, units: value });
                }}
              />
            </Stack>
          </>
        )}

        {/* Advanced Settings */}
        <Box>
          <Button
            variant="light"
            size="sm"
            rightSection={showAdvanced ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            fullWidth
          >
            Advanced Settings
          </Button>
          
          <Collapse in={showAdvanced}>
            <Stack gap="xs" mt="md">
              <TextInput
                label="CSS Classes"
                placeholder="custom-class another-class"
                description="Custom CSS classes for styling"
              />
              
              <TextInput
                label="Field ID"
                placeholder="custom-id"
                description="Custom HTML ID attribute"
              />
              
              <Textarea
                label="Custom Validation"
                placeholder="JavaScript validation function"
                description="Advanced validation logic"
                rows={3}
              />
            </Stack>
          </Collapse>
        </Box>
      </Stack>
    </Paper>
  );
}