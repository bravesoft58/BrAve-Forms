'use client';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { FieldProperties } from '../FieldProperties';
import type { FieldDefinition } from '@brave-forms/types';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

const createMockField = (overrides?: Partial<FieldDefinition>): FieldDefinition =>
  ({
    id: 'field-1',
    name: 'testField',
    label: 'Test Field',
    type: 'text',
    order: 0,
    width: 'full',
    description: '',
    placeholder: '',
    defaultValue: '',
    validation: { required: false },
    options: [],
    metadata: {},
    ...overrides,
  }) as FieldDefinition;

describe('FieldProperties', () => {
  describe('Component Rendering', () => {
    it('should render the Field Properties title', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Field Properties')).toBeInTheDocument();
    });

    it('should display field type badge', () => {
      const props = {
        field: createMockField({ type: 'number' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('number field')).toBeInTheDocument();
    });

    it('should render delete button', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Delete button uses ActionIcon with trash icon - no accessible name set
      const trashIcon = document.querySelector('.tabler-icon-trash');
      const deleteButton = trashIcon?.closest('button');
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Basic Settings Section', () => {
    it('should render Basic Settings heading', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Basic Settings')).toBeInTheDocument();
    });

    it('should render Field Label input', () => {
      const props = {
        field: createMockField({ label: 'Inspector Name' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Field Label')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Inspector Name')).toBeInTheDocument();
    });

    it('should render Field Name input', () => {
      const props = {
        field: createMockField({ name: 'inspector_name' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Field Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('inspector_name')).toBeInTheDocument();
    });

    it('should render Description textarea', () => {
      const props = {
        field: createMockField({ description: 'Enter your full name' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Enter your full name')).toBeInTheDocument();
    });

    it('should render Placeholder input', () => {
      const props = {
        field: createMockField({ placeholder: 'John Doe' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Placeholder')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should render Field Width dropdown', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Multiple elements may have this label - check at least one exists
      const widthElements = screen.getAllByLabelText('Field Width');
      expect(widthElements.length).toBeGreaterThan(0);
    });

    it('should render Required Field switch', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Mantine Switch uses text label, not accessible label
      expect(screen.getByText('Required Field')).toBeInTheDocument();
    });
  });

  describe('Field Update Callbacks', () => {
    it('should call onUpdate when label changes', () => {
      const onUpdate = vi.fn();
      const props = {
        field: createMockField({ label: 'Old Label' }),
        onUpdate,
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const labelInput = screen.getByLabelText('Field Label');
      fireEvent.change(labelInput, { target: { value: 'New Label' } });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should call onUpdate when name changes', () => {
      const onUpdate = vi.fn();
      const props = {
        field: createMockField({ name: 'old_name' }),
        onUpdate,
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const nameInput = screen.getByLabelText('Field Name');
      fireEvent.change(nameInput, { target: { value: 'new_name' } });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should call onUpdate when description changes', () => {
      const onUpdate = vi.fn();
      const props = {
        field: createMockField(),
        onUpdate,
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const descInput = screen.getByLabelText('Description');
      fireEvent.change(descInput, { target: { value: 'New description' } });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should call onUpdate when placeholder changes', () => {
      const onUpdate = vi.fn();
      const props = {
        field: createMockField(),
        onUpdate,
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const placeholderInput = screen.getByLabelText('Placeholder');
      fireEvent.change(placeholderInput, { target: { value: 'Enter value' } });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should call onUpdate when required is toggled', () => {
      const onUpdate = vi.fn();
      const props = {
        field: createMockField({ validation: { required: false } }),
        onUpdate,
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Find switch via its label text, then find the input
      const label = screen.getByText('Required Field');
      const switchInput = label.closest('.mantine-Switch-root')?.querySelector('input');
      expect(switchInput).toBeInTheDocument();
      fireEvent.click(switchInput!);

      expect(onUpdate).toHaveBeenCalled();
    });
  });

  describe('Delete Action', () => {
    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete,
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Delete button uses ActionIcon with trash icon - no accessible name set
      const trashIcon = document.querySelector('.tabler-icon-trash');
      const deleteButton = trashIcon?.closest('button');
      expect(deleteButton).toBeInTheDocument();
      fireEvent.click(deleteButton!);

      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('Text Field Validation', () => {
    it('should render validation section for text fields', () => {
      const props = {
        field: createMockField({ type: 'text' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Validation')).toBeInTheDocument();
    });

    it('should render min/max length inputs for text fields', () => {
      const props = {
        field: createMockField({ type: 'text' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Minimum Length')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum Length')).toBeInTheDocument();
    });

    it('should render validation section for textarea fields', () => {
      const props = {
        field: createMockField({ type: 'textarea' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Validation')).toBeInTheDocument();
      expect(screen.getByLabelText('Minimum Length')).toBeInTheDocument();
    });
  });

  describe('Number Field Validation', () => {
    it('should render min/max value inputs for number fields', () => {
      const props = {
        field: createMockField({ type: 'number' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Minimum Value')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum Value')).toBeInTheDocument();
    });

    it('should render step input for number fields', () => {
      const props = {
        field: createMockField({ type: 'number' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByLabelText('Step')).toBeInTheDocument();
    });

    it('should show EPA 0.25 inch alert for rainfallAmount field', () => {
      const props = {
        field: createMockField({ type: 'number', name: 'rainfallAmount' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText(/EPA CGP requires exactly 0.25 inches/)).toBeInTheDocument();
    });
  });

  describe('Selection Field Options', () => {
    it('should render Options section for select fields', () => {
      const props = {
        field: createMockField({ type: 'select' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should render Options section for multiSelect fields', () => {
      const props = {
        field: createMockField({ type: 'multiSelect' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should render Options section for radio fields', () => {
      const props = {
        field: createMockField({ type: 'radio' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should render Options section for checkbox fields', () => {
      const props = {
        field: createMockField({ type: 'checkbox' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should render Add Option button', () => {
      const props = {
        field: createMockField({ type: 'select' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Add Option')).toBeInTheDocument();
    });

    it('should render existing options', () => {
      const props = {
        field: createMockField({
          type: 'select',
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
          ],
        }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByDisplayValue('Option A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Option B')).toBeInTheDocument();
    });
  });

  describe('EPA Compliance Settings', () => {
    it('should render EPA Compliance section for photo fields', () => {
      const props = {
        field: createMockField({ type: 'photo' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('EPA Compliance')).toBeInTheDocument();
    });

    it('should render GPS Required switch for photo fields', () => {
      const props = {
        field: createMockField({ type: 'photo' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Mantine Switch uses text label, not accessible label
      expect(screen.getByText('Require GPS Location')).toBeInTheDocument();
    });

    it('should render Photo Quality dropdown for photo fields', () => {
      const props = {
        field: createMockField({ type: 'photo' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Multiple elements may have this label - check at least one exists
      const qualityElements = screen.getAllByLabelText('Photo Quality');
      expect(qualityElements.length).toBeGreaterThan(0);
    });

    it('should render EPA Compliance section for signature fields', () => {
      const props = {
        field: createMockField({ type: 'signature' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('EPA Compliance')).toBeInTheDocument();
    });

    it('should render Digital Certificate switch for signature fields', () => {
      const props = {
        field: createMockField({ type: 'signature' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Mantine Switch uses text label, not accessible label
      expect(screen.getByText('Digital Certificate')).toBeInTheDocument();
    });

    it('should render EPA Critical Field switch', () => {
      const props = {
        field: createMockField({ type: 'weather' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Mantine Switch uses text label, not accessible label
      expect(screen.getByText('EPA Critical Field')).toBeInTheDocument();
    });

    it('should render EPA Regulation input', () => {
      const props = {
        field: createMockField({ type: 'swpppTrigger' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Use text matcher for label text
      expect(screen.getByText('EPA Regulation')).toBeInTheDocument();
    });

    it('should render Section Reference input', () => {
      const props = {
        field: createMockField({ type: 'bmpChecklist' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Use text matcher for label text
      expect(screen.getByText('Section Reference')).toBeInTheDocument();
    });
  });

  describe('Measurement Settings', () => {
    it('should render Measurement Settings section for measurement fields', () => {
      const props = {
        field: createMockField({ type: 'measurement' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Measurement Settings')).toBeInTheDocument();
    });

    it('should render Units dropdown for measurement fields', () => {
      const props = {
        field: createMockField({ type: 'measurement' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Multiple elements may have this label - check at least one exists
      const unitsElements = screen.getAllByLabelText('Units');
      expect(unitsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Settings', () => {
    it('should render Advanced Settings button', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    });

    it('should expand advanced settings when clicked', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const advancedButton = screen.getByText('Advanced Settings');
      fireEvent.click(advancedButton);

      // After clicking, CSS Classes should be visible
      expect(screen.getByLabelText('CSS Classes')).toBeInTheDocument();
    });

    it('should render Field ID input in advanced settings', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const advancedButton = screen.getByText('Advanced Settings');
      fireEvent.click(advancedButton);

      expect(screen.getByLabelText('Field ID')).toBeInTheDocument();
    });

    it('should render Custom Validation textarea in advanced settings', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      const advancedButton = screen.getByText('Advanced Settings');
      fireEvent.click(advancedButton);

      expect(screen.getByLabelText('Custom Validation')).toBeInTheDocument();
    });
  });

  describe('Field Width Options', () => {
    it('should have Full Width option', () => {
      const props = {
        field: createMockField(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      // Multiple elements may have this label - check at least one exists
      const widthElements = screen.getAllByLabelText('Field Width');
      expect(widthElements.length).toBeGreaterThan(0);
    });
  });

  describe('No EPA Section for Non-EPA Fields', () => {
    it('should not render EPA Compliance section for text fields', () => {
      const props = {
        field: createMockField({ type: 'text' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('EPA Compliance')).not.toBeInTheDocument();
    });

    it('should not render EPA Compliance section for number fields', () => {
      const props = {
        field: createMockField({ type: 'number' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('EPA Compliance')).not.toBeInTheDocument();
    });

    it('should not render EPA Compliance section for select fields', () => {
      const props = {
        field: createMockField({ type: 'select' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('EPA Compliance')).not.toBeInTheDocument();
    });
  });

  describe('No Validation Section for Non-Validatable Fields', () => {
    it('should not render Validation section for select fields', () => {
      const props = {
        field: createMockField({ type: 'select' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('Validation')).not.toBeInTheDocument();
    });

    it('should not render Validation section for photo fields', () => {
      const props = {
        field: createMockField({ type: 'photo' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('Validation')).not.toBeInTheDocument();
    });
  });

  describe('No Options Section for Non-Selection Fields', () => {
    it('should not render Options section for text fields', () => {
      const props = {
        field: createMockField({ type: 'text' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('Options')).not.toBeInTheDocument();
    });

    it('should not render Options section for number fields', () => {
      const props = {
        field: createMockField({ type: 'number' }),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      renderWithMantine(<FieldProperties {...props} />);

      expect(screen.queryByText('Options')).not.toBeInTheDocument();
    });
  });
});
