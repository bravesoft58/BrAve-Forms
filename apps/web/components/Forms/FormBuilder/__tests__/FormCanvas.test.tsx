'use client';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { DndContext } from '@dnd-kit/core';
import { FormCanvas } from '../FormCanvas';
import type { FieldDefinition } from '@brave-forms/types';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MantineProvider>
      <DndContext>{ui}</DndContext>
    </MantineProvider>
  );
};

const createMockField = (overrides?: Partial<FieldDefinition>): FieldDefinition =>
  ({
    id: 'field-1',
    name: 'testField',
    label: 'Test Field',
    type: 'text',
    order: 0,
    width: 'full',
    description: 'Test description',
    ...overrides,
  }) as FieldDefinition;

describe('FormCanvas', () => {
  describe('Empty State', () => {
    it('should render empty state when no fields', () => {
      const props = {
        fields: [],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('No fields added yet')).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      const props = {
        fields: [],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(
        screen.getByText(/Start building your form by selecting field types/)
      ).toBeInTheDocument();
    });

    it('should mention EPA SWPPP template in empty state', () => {
      const props = {
        fields: [],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText(/For EPA compliance, use the SWPPP template/)).toBeInTheDocument();
    });

    it('should show disabled preview button in empty state', () => {
      const props = {
        fields: [],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      const previewButton = screen.getByText('Preview will appear here');
      expect(previewButton).toBeInTheDocument();
      expect(previewButton.closest('button')).toBeDisabled();
    });
  });

  describe('With Fields', () => {
    it('should render field count', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('1 field')).toBeInTheDocument();
    });

    it('should show plural for multiple fields', () => {
      const props = {
        fields: [createMockField({ id: 'field-1' }), createMockField({ id: 'field-2' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('2 fields')).toBeInTheDocument();
    });

    it('should render canvas title', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('Form Builder Canvas')).toBeInTheDocument();
    });

    it('should show drag to reorder badge', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('Drag to reorder')).toBeInTheDocument();
    });

    it('should render field label', () => {
      const props = {
        fields: [createMockField({ label: 'Inspector Name' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('Inspector Name')).toBeInTheDocument();
    });

    it('should render field type', () => {
      const props = {
        fields: [createMockField({ type: 'text' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should render field name', () => {
      const props = {
        fields: [createMockField({ name: 'inspector_name' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText(/Name: inspector_name/)).toBeInTheDocument();
    });

    it('should render field width', () => {
      const props = {
        fields: [createMockField({ width: 'half' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText(/Width: half/)).toBeInTheDocument();
    });

    it('should render field description', () => {
      const props = {
        fields: [createMockField({ description: 'Enter inspector full name' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('Enter inspector full name')).toBeInTheDocument();
    });
  });

  describe('Field Badges', () => {
    it('should show Required badge for required fields', () => {
      const props = {
        fields: [createMockField({ validation: { required: true } })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should show EPA Critical badge for EPA compliance fields', () => {
      const props = {
        fields: [
          createMockField({
            metadata: { epaCompliance: { criticalField: true, section: '', regulation: '' } },
          }),
        ],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('EPA Critical')).toBeInTheDocument();
    });

    it('should show GPS badge for GPS required fields', () => {
      const props = {
        fields: [createMockField({ metadata: { gpsRequired: true } })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(screen.getByText('GPS')).toBeInTheDocument();
    });
  });

  describe('EPA Compliance Alert', () => {
    it('should show EPA compliance warning for critical fields', () => {
      const props = {
        fields: [
          createMockField({
            metadata: { epaCompliance: { criticalField: true, section: '', regulation: '' } },
          }),
        ],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(
        screen.getByText('Critical EPA field - modifications may affect compliance')
      ).toBeInTheDocument();
    });
  });

  describe('Field Selection', () => {
    it('should call onSelectField when field is clicked', () => {
      const onSelectField = vi.fn();
      const props = {
        fields: [createMockField({ id: 'field-123' })],
        selectedField: null,
        onSelectField,
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      const fieldCard = screen.getByText('Test Field').closest('[class*="Card"]');
      expect(fieldCard).toBeInTheDocument();
      fireEvent.click(fieldCard!);

      expect(onSelectField).toHaveBeenCalledWith('field-123');
    });
  });

  describe('Field Actions', () => {
    it('should call onDeleteField when delete button is clicked', () => {
      const onDeleteField = vi.fn();
      const props = {
        fields: [createMockField({ id: 'field-456' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField,
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Find the delete button using the trash icon SVG
      const trashIcon = document.querySelector('.tabler-icon-trash');
      const deleteButton = trashIcon?.closest('button');
      expect(deleteButton).toBeInTheDocument();
      fireEvent.click(deleteButton!);

      expect(onDeleteField).toHaveBeenCalledWith('field-456');
    });

    it('should call onDuplicateField when duplicate button is clicked', () => {
      const onDuplicateField = vi.fn();
      const props = {
        fields: [createMockField({ id: 'field-789' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField,
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Find the duplicate button using the copy icon SVG
      const copyIcon = document.querySelector('.tabler-icon-copy');
      const duplicateButton = copyIcon?.closest('button');
      expect(duplicateButton).toBeInTheDocument();
      fireEvent.click(duplicateButton!);

      expect(onDuplicateField).toHaveBeenCalledWith('field-789');
    });

    it('should render multiple action buttons for each field', () => {
      const props = {
        fields: [createMockField({ id: 'field-101' })],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Should have action icons - copy, trash, settings
      expect(document.querySelector('.tabler-icon-copy')).toBeInTheDocument();
      expect(document.querySelector('.tabler-icon-trash')).toBeInTheDocument();
      expect(document.querySelector('.tabler-icon-settings')).toBeInTheDocument();
    });
  });

  describe('Field Types', () => {
    const fieldTypes = [
      { type: 'text', label: 'Text' },
      { type: 'textarea', label: 'Text Area' },
      { type: 'number', label: 'Number' },
      { type: 'date', label: 'Date' },
      { type: 'time', label: 'Time' },
      { type: 'select', label: 'Dropdown' },
      { type: 'multiSelect', label: 'Multi-Select' },
      { type: 'radio', label: 'Radio' },
      { type: 'checkbox', label: 'Checkbox' },
      { type: 'photo', label: 'Photo' },
      { type: 'signature', label: 'Signature' },
      { type: 'gpsLocation', label: 'GPS Location' },
      { type: 'swpppTrigger', label: 'SWPPP Trigger' },
      { type: 'bmpChecklist', label: 'BMP Checklist' },
      { type: 'violationCode', label: 'Violation Code' },
    ] as const;

    fieldTypes.forEach(({ type, label }) => {
      it(`should render ${type} field type as "${label}"`, () => {
        const props = {
          fields: [createMockField({ type })],
          selectedField: null,
          onSelectField: vi.fn(),
          onDeleteField: vi.fn(),
          onDuplicateField: vi.fn(),
        };

        renderWithProviders(<FormCanvas {...props} />);

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('Field Ordering', () => {
    it('should render fields in order', () => {
      const props = {
        fields: [
          createMockField({ id: 'field-3', label: 'Third', order: 2 }),
          createMockField({ id: 'field-1', label: 'First', order: 0 }),
          createMockField({ id: 'field-2', label: 'Second', order: 1 }),
        ],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      const labels = screen.getAllByText(/First|Second|Third/);
      expect(labels[0]).toHaveTextContent('First');
      expect(labels[1]).toHaveTextContent('Second');
      expect(labels[2]).toHaveTextContent('Third');
    });
  });

  describe('Add Field Hint', () => {
    it('should show add field hint when fields exist', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      expect(
        screen.getByText('Add more fields from the palette or drag to reorder')
      ).toBeInTheDocument();
    });
  });

  describe('Action Icons', () => {
    it('should render copy icon for duplicate action', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Copy icon should be present for duplicate action
      expect(document.querySelector('.tabler-icon-copy')).toBeInTheDocument();
    });

    it('should render trash icon for delete action', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Trash icon should be present for delete action
      expect(document.querySelector('.tabler-icon-trash')).toBeInTheDocument();
    });

    it('should render settings icon for field settings', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Settings icon should be present
      expect(document.querySelector('.tabler-icon-settings')).toBeInTheDocument();
    });

    it('should render grip icon for drag handle', () => {
      const props = {
        fields: [createMockField()],
        selectedField: null,
        onSelectField: vi.fn(),
        onDeleteField: vi.fn(),
        onDuplicateField: vi.fn(),
      };

      renderWithProviders(<FormCanvas {...props} />);

      // Grip vertical icon should be present for drag handle
      expect(document.querySelector('.tabler-icon-grip-vertical')).toBeInTheDocument();
    });
  });
});
