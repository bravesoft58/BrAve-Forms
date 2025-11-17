import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFormDraft } from './useFormDraft';
import { openDB } from 'idb';

// Mock idb
vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('useFormDraft', () => {
  const mockDB = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (openDB as any).mockResolvedValue(mockDB);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save draft to IndexedDB', async () => {
    const templateId = 'template_1';
    const formValues = { field1: 'value1' };

    const { result } = renderHook(() => useFormDraft(templateId, formValues));

    await result.current.saveDraft();

    await waitFor(() => {
      expect(mockDB.put).toHaveBeenCalledWith(
        'form_drafts',
        expect.objectContaining({
          templateId,
          values: formValues,
        }),
        templateId
      );
    });
  });

  it('should load draft from IndexedDB', async () => {
    const templateId = 'template_1';
    const draftValues = { field1: 'draft_value' };
    const onLoadDraft = vi.fn();

    mockDB.get.mockResolvedValue({
      templateId,
      values: draftValues,
      savedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useFormDraft(templateId, {}, onLoadDraft));

    await result.current.loadDraft();

    await waitFor(() => {
      expect(onLoadDraft).toHaveBeenCalledWith(draftValues);
    });
  });

  it('should clear draft from IndexedDB', async () => {
    const templateId = 'template_1';

    const { result } = renderHook(() => useFormDraft(templateId, {}));

    await result.current.clearDraft();

    await waitFor(() => {
      expect(mockDB.delete).toHaveBeenCalledWith('form_drafts', templateId);
    });
  });

  it('should auto-save every 30 seconds', async () => {
    vi.useFakeTimers();

    const templateId = 'template_1';
    const formValues = { field1: 'value1' };

    const { unmount } = renderHook(() => useFormDraft(templateId, formValues));

    // Fast-forward 30 seconds - this should trigger auto-save
    await vi.advanceTimersByTimeAsync(30000);

    // Check that saveDraft was called
    expect(mockDB.put).toHaveBeenCalled();

    unmount();
    vi.useRealTimers();
  }, 10000);
});

