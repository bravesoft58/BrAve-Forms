import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formBuilderStore,
  addField,
  updateField,
  removeField,
  duplicateField,
  reorderFields,
  selectField,
  getSelectedField,
  setFormName,
  setFormDescription,
  setFormCategory,
  undo,
  redo,
  canUndo,
  canRedo,
  initializeNewForm,
  loadForm,
  resetFormBuilder,
  getFieldById,
  getAllFieldIds,
  getFieldCount,
  hasUnsavedChanges,
  generateFieldId,
} from '@/lib/stores/form-builder-store';
import type { FieldDefinition, FormTemplate } from '@brave-forms/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('form-builder-store', () => {
  beforeEach(() => {
    // Reset the store completely by reassigning all properties
    formBuilderStore.formId = null;
    formBuilderStore.formName = 'New Form';
    formBuilderStore.formDescription = '';
    formBuilderStore.formCategory = 'CUSTOM';
    formBuilderStore.fields = [];
    formBuilderStore.selectedFieldId = null;
    formBuilderStore.previewMode = false;
    formBuilderStore.isDirty = false;
    formBuilderStore.isSaving = false;
    formBuilderStore.isLoading = false;
    formBuilderStore.history = [[]];
    formBuilderStore.historyIndex = 0;
    formBuilderStore.lastSaved = null;
    formBuilderStore.lastModified = null;

    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('generateFieldId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateFieldId();
      const id2 = generateFieldId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^field_\d+_[a-z0-9]+$/);
    });
  });

  describe('Field Management', () => {
    const createTestField = (overrides?: Partial<FieldDefinition>): FieldDefinition =>
      ({
        id: generateFieldId(),
        name: 'test_field',
        label: 'Test Field',
        type: 'text',
        order: 0,
        ...overrides,
      }) as FieldDefinition;

    describe('addField', () => {
      it('should add a field to the store', () => {
        const field = createTestField();
        addField(field);

        expect(formBuilderStore.fields).toHaveLength(1);
        expect(formBuilderStore.fields[0].label).toBe('Test Field');
      });

      it('should auto-generate ID if not provided', () => {
        const field = createTestField({ id: '' });
        addField(field);

        expect(formBuilderStore.fields[0].id).toBeTruthy();
        expect(formBuilderStore.fields[0].id).toMatch(/^field_/);
      });

      it('should set order based on field count', () => {
        addField(createTestField({ name: 'field1' }));
        addField(createTestField({ name: 'field2' }));

        expect(formBuilderStore.fields[0].order).toBe(0);
        expect(formBuilderStore.fields[1].order).toBe(1);
      });

      it('should auto-select the new field', () => {
        const field = createTestField();
        addField(field);

        expect(formBuilderStore.selectedFieldId).toBe(field.id);
      });

      it('should mark form as dirty', () => {
        addField(createTestField());

        expect(formBuilderStore.isDirty).toBe(true);
      });
    });

    describe('updateField', () => {
      it('should update an existing field', () => {
        const field = createTestField();
        addField(field);

        updateField(field.id, { label: 'Updated Label' });

        expect(formBuilderStore.fields[0].label).toBe('Updated Label');
      });

      it('should preserve unchanged properties', () => {
        const field = createTestField({ validation: { required: true } });
        addField(field);

        updateField(field.id, { label: 'Updated Label' });

        expect(formBuilderStore.fields[0].validation?.required).toBe(true);
      });

      it('should do nothing if field not found', () => {
        addField(createTestField());
        const initialFields = [...formBuilderStore.fields];

        updateField('nonexistent-id', { label: 'Updated' });

        expect(formBuilderStore.fields).toEqual(initialFields);
      });
    });

    describe('removeField', () => {
      it('should remove a field from the store', () => {
        const field = createTestField();
        addField(field);

        removeField(field.id);

        expect(formBuilderStore.fields).toHaveLength(0);
      });

      it('should clear selection if removed field was selected', () => {
        const field = createTestField();
        addField(field);
        selectField(field.id);

        removeField(field.id);

        expect(formBuilderStore.selectedFieldId).toBeNull();
      });

      it('should update order for remaining fields', () => {
        const field1 = createTestField({ name: 'field1' });
        const field2 = createTestField({ name: 'field2' });
        const field3 = createTestField({ name: 'field3' });

        addField(field1);
        addField(field2);
        addField(field3);

        removeField(field2.id);

        expect(formBuilderStore.fields[0].order).toBe(0);
        expect(formBuilderStore.fields[1].order).toBe(1);
      });
    });

    describe('duplicateField', () => {
      it('should create a copy of the field', () => {
        const field = createTestField({ label: 'Original' });
        addField(field);

        const newId = duplicateField(field.id);

        expect(formBuilderStore.fields).toHaveLength(2);
        expect(newId).toBeTruthy();
      });

      it('should append (Copy) to label', () => {
        const field = createTestField({ label: 'Original' });
        addField(field);

        duplicateField(field.id);

        expect(formBuilderStore.fields[1].label).toBe('Original (Copy)');
      });

      it('should append _copy to name', () => {
        const field = createTestField({ name: 'original_field' });
        addField(field);

        duplicateField(field.id);

        expect(formBuilderStore.fields[1].name).toBe('original_field_copy');
      });

      it('should return null if field not found', () => {
        const result = duplicateField('nonexistent-id');

        expect(result).toBeNull();
      });

      it('should select the duplicated field', () => {
        const field = createTestField();
        addField(field);

        const newId = duplicateField(field.id);

        expect(formBuilderStore.selectedFieldId).toBe(newId);
      });
    });

    describe('reorderFields', () => {
      it('should reorder fields correctly', () => {
        const field1 = createTestField({ name: 'field1', label: 'Field 1' });
        const field2 = createTestField({ name: 'field2', label: 'Field 2' });
        const field3 = createTestField({ name: 'field3', label: 'Field 3' });

        addField(field1);
        addField(field2);
        addField(field3);

        reorderFields(0, 2);

        expect(formBuilderStore.fields[0].name).toBe('field2');
        expect(formBuilderStore.fields[1].name).toBe('field3');
        expect(formBuilderStore.fields[2].name).toBe('field1');
      });

      it('should update order numbers after reorder', () => {
        const field1 = createTestField({ name: 'field1' });
        const field2 = createTestField({ name: 'field2' });

        addField(field1);
        addField(field2);

        reorderFields(0, 1);

        expect(formBuilderStore.fields[0].order).toBe(0);
        expect(formBuilderStore.fields[1].order).toBe(1);
      });

      it('should do nothing if indices are the same', () => {
        const field1 = createTestField({ name: 'field1' });
        const field2 = createTestField({ name: 'field2' });

        addField(field1);
        addField(field2);

        const orderBefore = formBuilderStore.fields.map((f) => f.name);
        reorderFields(0, 0);
        const orderAfter = formBuilderStore.fields.map((f) => f.name);

        expect(orderAfter).toEqual(orderBefore);
      });

      it('should handle invalid indices gracefully', () => {
        const field = createTestField();
        addField(field);

        reorderFields(-1, 5);

        expect(formBuilderStore.fields).toHaveLength(1);
      });
    });

    describe('selectField', () => {
      it('should select a field', () => {
        const field = createTestField();
        addField(field);

        selectField(field.id);

        expect(formBuilderStore.selectedFieldId).toBe(field.id);
      });

      it('should deselect when passed null', () => {
        const field = createTestField();
        addField(field);
        selectField(field.id);

        selectField(null);

        expect(formBuilderStore.selectedFieldId).toBeNull();
      });
    });

    describe('getSelectedField', () => {
      it('should return the selected field', () => {
        const field = createTestField({ label: 'Selected' });
        addField(field);
        selectField(field.id);

        const selected = getSelectedField();

        expect(selected?.label).toBe('Selected');
      });

      it('should return null if no field is selected', () => {
        selectField(null);

        const selected = getSelectedField();

        expect(selected).toBeNull();
      });
    });
  });

  describe('Form Metadata', () => {
    describe('setFormName', () => {
      it('should update form name', () => {
        setFormName('My Form');

        expect(formBuilderStore.formName).toBe('My Form');
      });

      it('should mark form as dirty', () => {
        setFormName('My Form');

        expect(formBuilderStore.isDirty).toBe(true);
      });
    });

    describe('setFormDescription', () => {
      it('should update form description', () => {
        setFormDescription('My description');

        expect(formBuilderStore.formDescription).toBe('My description');
      });
    });

    describe('setFormCategory', () => {
      it('should update form category', () => {
        setFormCategory('EPA_CGP');

        expect(formBuilderStore.formCategory).toBe('EPA_CGP');
      });
    });
  });

  describe('Undo/Redo', () => {
    const createTestField = (name: string): FieldDefinition =>
      ({
        id: generateFieldId(),
        name,
        label: name,
        type: 'text',
        order: 0,
      }) as FieldDefinition;

    it('should undo the last action', () => {
      addField(createTestField('field1'));
      addField(createTestField('field2'));

      expect(formBuilderStore.fields).toHaveLength(2);

      undo();

      expect(formBuilderStore.fields).toHaveLength(1);
    });

    it('should redo after undo', () => {
      addField(createTestField('field1'));
      addField(createTestField('field2'));

      undo();
      expect(formBuilderStore.fields).toHaveLength(1);

      redo();
      expect(formBuilderStore.fields).toHaveLength(2);
    });

    it('should report canUndo correctly', () => {
      expect(canUndo()).toBe(false);

      addField(createTestField('field1'));

      expect(canUndo()).toBe(true);
    });

    it('should report canRedo correctly', () => {
      expect(canRedo()).toBe(false);

      addField(createTestField('field1'));
      undo();

      expect(canRedo()).toBe(true);
    });

    it('should return false when undo is not possible', () => {
      const result = undo();

      expect(result).toBe(false);
    });

    it('should return false when redo is not possible', () => {
      addField(createTestField('field1'));

      const result = redo();

      expect(result).toBe(false);
    });

    it('should clear future history after new action', () => {
      addField(createTestField('field1'));
      addField(createTestField('field2'));
      undo();
      undo();

      addField(createTestField('field3'));

      expect(canRedo()).toBe(false);
    });
  });

  describe('Form Lifecycle', () => {
    describe('initializeNewForm', () => {
      it('should reset to default state', () => {
        addField({
          id: 'test',
          name: 'test',
          label: 'Test',
          type: 'text',
          order: 0,
        } as FieldDefinition);

        initializeNewForm();

        expect(formBuilderStore.fields).toHaveLength(0);
        expect(formBuilderStore.formName).toBe('New Form');
        expect(formBuilderStore.isDirty).toBe(false);
      });

      it('should accept custom name and category', () => {
        initializeNewForm('Custom Form', 'EPA_CGP');

        expect(formBuilderStore.formName).toBe('Custom Form');
        expect(formBuilderStore.formCategory).toBe('EPA_CGP');
      });
    });

    describe('loadForm', () => {
      it('should load a form template', () => {
        const template = {
          id: 'template-1',
          name: 'EPA Daily Inspection',
          description: 'Daily inspection form',
          category: 'EPA_CGP',
          fields: [
            {
              id: 'field1',
              name: 'inspector',
              label: 'Inspector',
              type: 'inspector',
              order: 0,
            },
          ] as FieldDefinition[],
          schema: { sections: [] },
          version: 1,
          isActive: true,
        } as unknown as FormTemplate;

        loadForm(template);

        expect(formBuilderStore.formId).toBe('template-1');
        expect(formBuilderStore.formName).toBe('EPA Daily Inspection');
        expect(formBuilderStore.fields).toHaveLength(1);
        expect(formBuilderStore.isDirty).toBe(false);
      });
    });

    describe('resetFormBuilder', () => {
      it('should reset all state to defaults', () => {
        addField({
          id: 'test',
          name: 'test',
          label: 'Test',
          type: 'text',
          order: 0,
        } as FieldDefinition);
        setFormName('Custom Form');

        resetFormBuilder();

        expect(formBuilderStore.formName).toBe('New Form');
        expect(formBuilderStore.fields).toHaveLength(0);
        expect(formBuilderStore.selectedFieldId).toBeNull();
      });
    });
  });

  describe('Utility Functions', () => {
    const createTestField = (name: string): FieldDefinition =>
      ({
        id: `field_${name}`,
        name,
        label: name,
        type: 'text',
        order: 0,
      }) as FieldDefinition;

    describe('getFieldById', () => {
      it('should return the field with matching ID', () => {
        const field = createTestField('test');
        addField(field);

        const found = getFieldById(field.id);

        expect(found?.name).toBe('test');
      });

      it('should return undefined if not found', () => {
        const found = getFieldById('nonexistent');

        expect(found).toBeUndefined();
      });
    });

    describe('getAllFieldIds', () => {
      it('should return all field IDs', () => {
        addField(createTestField('field1'));
        addField(createTestField('field2'));

        const ids = getAllFieldIds();

        expect(ids).toHaveLength(2);
        expect(ids).toContain('field_field1');
        expect(ids).toContain('field_field2');
      });
    });

    describe('getFieldCount', () => {
      it('should return correct field count', () => {
        addField(createTestField('field1'));
        addField(createTestField('field2'));

        expect(getFieldCount()).toBe(2);
      });

      it('should return 0 for empty form', () => {
        expect(getFieldCount()).toBe(0);
      });
    });

    describe('hasUnsavedChanges', () => {
      it('should return false for clean form', () => {
        expect(hasUnsavedChanges()).toBe(false);
      });

      it('should return true after field is added', () => {
        addField(createTestField('test'));

        expect(hasUnsavedChanges()).toBe(true);
      });
    });
  });
});
