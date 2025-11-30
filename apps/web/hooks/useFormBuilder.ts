import { useSnapshot } from 'valtio';
import { useEffect } from 'react';
import {
  formBuilderStore,
  // Actions
  undo,
  redo,
  canUndo,
  canRedo,
  setFormName,
  setFormDescription,
  setFormCategory,
  addField,
  updateField,
  removeField,
  duplicateField,
  reorderFields,
  selectField,
  getSelectedField,
  initializeNewForm,
  loadForm,
  loadDraftIfAvailable,
  getFormTemplateData,
  markAsSaved,
  setSaving,
  togglePreviewMode,
  setPreviewMode,
  resetFormBuilder,
  getFieldById,
  getAllFieldIds,
  getFieldCount,
  hasUnsavedChanges,
  generateFieldId,
} from '@/lib/stores/form-builder-store';
import type { FieldDefinition } from '@brave-forms/types';

/**
 * Hook for using the Form Builder store with Valtio
 *
 * Provides reactive state and actions for the form builder.
 * Uses Valtio's useSnapshot for automatic re-renders on state changes.
 */
export function useFormBuilder() {
  // Get reactive snapshot of store state
  const state = useSnapshot(formBuilderStore);

  // Memoized actions that don't need state
  const actions = {
    // History actions
    undo,
    redo,

    // Metadata actions
    setFormName,
    setFormDescription,
    setFormCategory,

    // Field actions
    addField,
    updateField,
    removeField,
    duplicateField,
    reorderFields,
    selectField,

    // Form lifecycle
    initializeNewForm,
    loadForm,
    loadDraftIfAvailable,
    getFormTemplateData,
    markAsSaved,
    setSaving,
    togglePreviewMode,
    setPreviewMode,
    resetFormBuilder,

    // Utilities
    getFieldById,
    getAllFieldIds,
    getFieldCount,
    hasUnsavedChanges,
    generateFieldId,
  };

  // Computed values that depend on state
  const computed = {
    canUndo: canUndo(),
    canRedo: canRedo(),
    selectedField: getSelectedField(),
    fieldCount: state.fields.length,
    hasChanges: state.isDirty,
  };

  return {
    // State (reactive)
    formId: state.formId,
    formName: state.formName,
    formDescription: state.formDescription,
    formCategory: state.formCategory,
    fields: state.fields as FieldDefinition[],
    selectedFieldId: state.selectedFieldId,
    previewMode: state.previewMode,
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    isLoading: state.isLoading,
    lastSaved: state.lastSaved,
    lastModified: state.lastModified,

    // Computed
    ...computed,

    // Actions
    ...actions,
  };
}

/**
 * Hook for keyboard shortcuts in the form builder
 *
 * Implements:
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * - Delete/Backspace: Delete selected field
 * - Escape: Deselect field
 */
export function useFormBuilderHotkeys() {
  const { selectedFieldId, canUndo, canRedo, undo, redo, removeField, selectField } =
    useFormBuilder();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z: Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === 'y' || (event.key === 'z' && event.shiftKey))
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Delete/Backspace: Delete selected field
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedFieldId) {
        event.preventDefault();
        removeField(selectedFieldId);
        return;
      }

      // Escape: Deselect field
      if (event.key === 'Escape' && selectedFieldId) {
        event.preventDefault();
        selectField(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, canUndo, canRedo, undo, redo, removeField, selectField]);
}

/**
 * Hook for auto-loading draft on mount
 *
 * Checks for existing draft in localStorage and loads it if available.
 * Returns whether a draft was loaded.
 */
export function useFormBuilderDraft(autoLoad: boolean = true) {
  const { loadDraftIfAvailable, hasChanges } = useFormBuilder();

  useEffect(() => {
    if (autoLoad) {
      loadDraftIfAvailable();
    }
  }, [autoLoad, loadDraftIfAvailable]);

  return { hasChanges };
}

/**
 * Hook for unsaved changes warning
 *
 * Shows browser warning when user tries to leave with unsaved changes.
 */
export function useUnsavedChangesWarning() {
  const { isDirty } = useFormBuilder();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}

export default useFormBuilder;
