import { proxy, subscribe, snapshot } from 'valtio';
import type { FieldDefinition, FormTemplate } from '@brave-forms/types';

/**
 * Form Builder State Interface
 */
export interface FormBuilderState {
  // Form metadata
  formId: string | null;
  formName: string;
  formDescription: string;
  formCategory: string;

  // Fields
  fields: FieldDefinition[];
  selectedFieldId: string | null;

  // UI state
  previewMode: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // History for undo/redo (max 50 states)
  history: FieldDefinition[][];
  historyIndex: number;

  // Timestamps
  lastSaved: string | null;
  lastModified: string | null;
}

/**
 * Maximum history snapshots to keep
 */
const MAX_HISTORY = 50;

/**
 * Debounce delay for localStorage saves (milliseconds)
 */
const DRAFT_SAVE_DEBOUNCE_MS = 1000;

/**
 * localStorage key for form builder draft
 */
const STORAGE_KEY = 'braveforms_form_builder_draft';

/**
 * Load draft from localStorage
 */
function loadDraft(): Partial<FormBuilderState> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load form builder draft:', error);
  }

  return null;
}

/**
 * Save draft to localStorage
 */
function saveDraft(state: FormBuilderState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Only save essential data, not full history
    const draftData = {
      formId: state.formId,
      formName: state.formName,
      formDescription: state.formDescription,
      formCategory: state.formCategory,
      fields: state.fields,
      lastModified: state.lastModified,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  } catch (error) {
    console.error('Failed to save form builder draft:', error);
  }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear form builder draft:', error);
  }
}

/**
 * Generate unique ID for fields
 */
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Default initial state
 */
const defaultState: FormBuilderState = {
  formId: null,
  formName: 'New Form',
  formDescription: '',
  formCategory: 'CUSTOM',
  fields: [],
  selectedFieldId: null,
  previewMode: false,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  history: [[]],
  historyIndex: 0,
  lastSaved: null,
  lastModified: null,
};

/**
 * Form Builder Store using Valtio
 */
export const formBuilderStore = proxy<FormBuilderState>({ ...defaultState });

// Subscribe to changes and persist draft (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
if (typeof window !== 'undefined') {
  subscribe(formBuilderStore, () => {
    // Debounce saves to prevent excessive writes
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      if (formBuilderStore.isDirty) {
        saveDraft(formBuilderStore);
      }
    }, DRAFT_SAVE_DEBOUNCE_MS);
  });
}

// ============================================================================
// History Management (Undo/Redo)
// ============================================================================

/**
 * Save current state to history
 * Called after every field mutation
 */
function saveToHistory(): void {
  // Create deep copy of current fields
  const fieldsCopy = JSON.parse(JSON.stringify(formBuilderStore.fields)) as FieldDefinition[];

  // Remove any future history if we're not at the end
  if (formBuilderStore.historyIndex < formBuilderStore.history.length - 1) {
    formBuilderStore.history = formBuilderStore.history.slice(0, formBuilderStore.historyIndex + 1);
  }

  // Add current state to history
  formBuilderStore.history.push(fieldsCopy);

  // Limit history to MAX_HISTORY snapshots
  if (formBuilderStore.history.length > MAX_HISTORY) {
    formBuilderStore.history.shift();
  } else {
    formBuilderStore.historyIndex++;
  }

  // Mark as dirty
  formBuilderStore.isDirty = true;
  formBuilderStore.lastModified = new Date().toISOString();
}

/**
 * Undo last change
 */
export function undo(): boolean {
  if (formBuilderStore.historyIndex > 0) {
    formBuilderStore.historyIndex--;
    formBuilderStore.fields = JSON.parse(
      JSON.stringify(formBuilderStore.history[formBuilderStore.historyIndex])
    );
    formBuilderStore.isDirty = true;
    formBuilderStore.lastModified = new Date().toISOString();
    return true;
  }
  return false;
}

/**
 * Redo previously undone change
 */
export function redo(): boolean {
  if (formBuilderStore.historyIndex < formBuilderStore.history.length - 1) {
    formBuilderStore.historyIndex++;
    formBuilderStore.fields = JSON.parse(
      JSON.stringify(formBuilderStore.history[formBuilderStore.historyIndex])
    );
    formBuilderStore.isDirty = true;
    formBuilderStore.lastModified = new Date().toISOString();
    return true;
  }
  return false;
}

/**
 * Check if undo is available
 */
export function canUndo(): boolean {
  return formBuilderStore.historyIndex > 0;
}

/**
 * Check if redo is available
 */
export function canRedo(): boolean {
  return formBuilderStore.historyIndex < formBuilderStore.history.length - 1;
}

// ============================================================================
// Form Metadata Actions
// ============================================================================

/**
 * Set form name
 */
export function setFormName(name: string): void {
  formBuilderStore.formName = name;
  formBuilderStore.isDirty = true;
  formBuilderStore.lastModified = new Date().toISOString();
}

/**
 * Set form description
 */
export function setFormDescription(description: string): void {
  formBuilderStore.formDescription = description;
  formBuilderStore.isDirty = true;
  formBuilderStore.lastModified = new Date().toISOString();
}

/**
 * Set form category
 */
export function setFormCategory(category: string): void {
  formBuilderStore.formCategory = category;
  formBuilderStore.isDirty = true;
  formBuilderStore.lastModified = new Date().toISOString();
}

// ============================================================================
// Field Management Actions
// ============================================================================

/**
 * Add a new field to the form
 */
export function addField(field: FieldDefinition): void {
  // Ensure field has an ID
  if (!field.id) {
    field.id = generateFieldId();
  }

  // Set order to end of list
  field.order = formBuilderStore.fields.length;

  formBuilderStore.fields.push(field);
  saveToHistory();

  // Auto-select the new field
  formBuilderStore.selectedFieldId = field.id;
}

/**
 * Update an existing field
 */
export function updateField(fieldId: string, updates: Partial<FieldDefinition>): void {
  const fieldIndex = formBuilderStore.fields.findIndex((f) => f.id === fieldId);
  if (fieldIndex === -1) return;

  formBuilderStore.fields[fieldIndex] = {
    ...formBuilderStore.fields[fieldIndex],
    ...updates,
  };
  saveToHistory();
}

/**
 * Remove a field from the form
 */
export function removeField(fieldId: string): void {
  const fieldIndex = formBuilderStore.fields.findIndex((f) => f.id === fieldId);
  if (fieldIndex === -1) return;

  formBuilderStore.fields.splice(fieldIndex, 1);

  // Update order for remaining fields
  formBuilderStore.fields.forEach((field, index) => {
    field.order = index;
  });

  // Clear selection if removed field was selected
  if (formBuilderStore.selectedFieldId === fieldId) {
    formBuilderStore.selectedFieldId = null;
  }

  saveToHistory();
}

/**
 * Duplicate a field
 */
export function duplicateField(fieldId: string): string | null {
  const field = formBuilderStore.fields.find((f) => f.id === fieldId);
  if (!field) return null;

  const duplicatedField: FieldDefinition = {
    ...JSON.parse(JSON.stringify(field)),
    id: generateFieldId(),
    name: `${field.name}_copy`,
    label: `${field.label} (Copy)`,
    order: formBuilderStore.fields.length,
  };

  formBuilderStore.fields.push(duplicatedField);
  saveToHistory();

  // Select the duplicated field
  formBuilderStore.selectedFieldId = duplicatedField.id;

  return duplicatedField.id;
}

/**
 * Reorder fields (after drag and drop)
 */
export function reorderFields(oldIndex: number, newIndex: number): void {
  if (oldIndex === newIndex) return;
  if (oldIndex < 0 || oldIndex >= formBuilderStore.fields.length) return;
  if (newIndex < 0 || newIndex >= formBuilderStore.fields.length) return;

  const [movedField] = formBuilderStore.fields.splice(oldIndex, 1);
  formBuilderStore.fields.splice(newIndex, 0, movedField);

  // Update order for all fields
  formBuilderStore.fields.forEach((field, index) => {
    field.order = index;
  });

  saveToHistory();
}

/**
 * Select a field for editing
 */
export function selectField(fieldId: string | null): void {
  formBuilderStore.selectedFieldId = fieldId;
}

/**
 * Get currently selected field
 */
export function getSelectedField(): FieldDefinition | null {
  if (!formBuilderStore.selectedFieldId) return null;
  return formBuilderStore.fields.find((f) => f.id === formBuilderStore.selectedFieldId) || null;
}

// ============================================================================
// Form Lifecycle Actions
// ============================================================================

/**
 * Initialize a new form
 */
export function initializeNewForm(name?: string, category?: string): void {
  formBuilderStore.formId = null;
  formBuilderStore.formName = name || 'New Form';
  formBuilderStore.formDescription = '';
  formBuilderStore.formCategory = category || 'CUSTOM';
  formBuilderStore.fields = [];
  formBuilderStore.selectedFieldId = null;
  formBuilderStore.previewMode = false;
  formBuilderStore.isDirty = false;
  formBuilderStore.isSaving = false;
  formBuilderStore.isLoading = false;
  formBuilderStore.history = [[]];
  formBuilderStore.historyIndex = 0;
  formBuilderStore.lastSaved = null;
  formBuilderStore.lastModified = new Date().toISOString();
}

/**
 * Load an existing form template into the builder
 */
export function loadForm(template: FormTemplate): void {
  formBuilderStore.isLoading = true;

  formBuilderStore.formId = template.id || null;
  formBuilderStore.formName = template.name || 'Untitled Form';
  formBuilderStore.formDescription = template.description || '';
  formBuilderStore.formCategory = template.category || 'CUSTOM';
  formBuilderStore.fields = template.fields ? [...template.fields] : [];
  formBuilderStore.selectedFieldId = null;
  formBuilderStore.previewMode = false;
  formBuilderStore.isDirty = false;
  formBuilderStore.history = [JSON.parse(JSON.stringify(formBuilderStore.fields))];
  formBuilderStore.historyIndex = 0;
  formBuilderStore.lastSaved = template.updatedAt?.toString() || null;
  formBuilderStore.lastModified = new Date().toISOString();

  formBuilderStore.isLoading = false;
}

/**
 * Load draft from localStorage if available
 */
export function loadDraftIfAvailable(): boolean {
  const draft = loadDraft();
  if (draft && draft.fields && draft.fields.length > 0) {
    formBuilderStore.formId = draft.formId || null;
    formBuilderStore.formName = draft.formName || 'New Form';
    formBuilderStore.formDescription = draft.formDescription || '';
    formBuilderStore.formCategory = draft.formCategory || 'CUSTOM';
    formBuilderStore.fields = draft.fields;
    formBuilderStore.isDirty = true;
    formBuilderStore.history = [JSON.parse(JSON.stringify(draft.fields))];
    formBuilderStore.historyIndex = 0;
    formBuilderStore.lastModified = draft.lastModified || new Date().toISOString();
    return true;
  }
  return false;
}

/**
 * Get form template data for saving
 */
export function getFormTemplateData(): Partial<FormTemplate> {
  return {
    id: formBuilderStore.formId || undefined,
    name: formBuilderStore.formName,
    description: formBuilderStore.formDescription,
    category: formBuilderStore.formCategory as FormTemplate['category'],
    fields: formBuilderStore.fields.sort((a, b) => a.order - b.order),
  };
}

/**
 * Mark form as saved
 */
export function markAsSaved(): void {
  formBuilderStore.isDirty = false;
  formBuilderStore.lastSaved = new Date().toISOString();
  clearDraft();
}

/**
 * Set saving state
 */
export function setSaving(saving: boolean): void {
  formBuilderStore.isSaving = saving;
}

/**
 * Toggle preview mode
 */
export function togglePreviewMode(): void {
  formBuilderStore.previewMode = !formBuilderStore.previewMode;
}

/**
 * Set preview mode
 */
export function setPreviewMode(preview: boolean): void {
  formBuilderStore.previewMode = preview;
}

/**
 * Reset the form builder to initial state
 */
export function resetFormBuilder(): void {
  Object.assign(formBuilderStore, { ...defaultState });
  clearDraft();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get field by ID
 */
export function getFieldById(fieldId: string): FieldDefinition | undefined {
  return formBuilderStore.fields.find((f) => f.id === fieldId);
}

/**
 * Get all field IDs (useful for conditional logic)
 */
export function getAllFieldIds(): string[] {
  return formBuilderStore.fields.map((f) => f.id);
}

/**
 * Get field count
 */
export function getFieldCount(): number {
  return formBuilderStore.fields.length;
}

/**
 * Check if form has unsaved changes
 */
export function hasUnsavedChanges(): boolean {
  return formBuilderStore.isDirty;
}

/**
 * Export current store state as snapshot (for debugging)
 */
export function getStoreSnapshot(): FormBuilderState {
  return snapshot(formBuilderStore) as FormBuilderState;
}
