/**
 * Tests for useFormDraft Hook
 *
 * Tests auto-save form draft functionality with IndexedDB:
 * - Save draft to IndexedDB
 * - Load draft from IndexedDB
 * - Clear draft from IndexedDB
 * - Error handling
 * - Complex form data persistence
 * - Multiple templates isolation
 *
 * @offline Critical for 30-day offline form data persistence
 * @warning iOS: IndexedDB may be reclaimed by iOS under low storage conditions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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
    objectStoreNames: {
      contains: vi.fn(() => true),
    },
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (openDB as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockDB);
    mockDB.get.mockResolvedValue(null);
    mockDB.put.mockResolvedValue(undefined);
    mockDB.delete.mockResolvedValue(undefined);
    mockDB.objectStoreNames.contains.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveDraft', () => {
    it('should save draft to IndexedDB', async () => {
      const templateId = 'template_1';
      const formValues = { field1: 'value1' };

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      await waitFor(() => {
        expect(mockDB.put).toHaveBeenCalledWith(
          'form_drafts',
          expect.objectContaining({
            templateId,
            values: formValues,
            savedAt: expect.any(String),
          }),
          templateId
        );
      });
    });

    it('should save draft with complex nested values', async () => {
      const templateId = 'complex_form';
      const formValues = {
        inspectorInfo: {
          name: 'John Doe',
          certifications: ['SWPPP', 'OSHA'],
          contact: {
            email: 'john@example.com',
            phone: '555-1234',
          },
        },
        siteConditions: {
          weather: 'sunny',
          temperature: 72,
          hasRainfall: false,
        },
        photos: ['photo1.jpg', 'photo2.jpg'],
      };

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(mockDB.put).toHaveBeenCalledWith(
        'form_drafts',
        expect.objectContaining({
          values: formValues,
        }),
        templateId
      );
    });

    it('should include timestamp in saved draft', async () => {
      const templateId = 'template_1';
      const formValues = { field1: 'value1' };

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      const savedDraft = mockDB.put.mock.calls[0][1];
      expect(savedDraft.savedAt).toBeDefined();
      expect(new Date(savedDraft.savedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should handle save errors gracefully', async () => {
      const templateId = 'template_1';
      const formValues = { field1: 'value1' };
      const errorMessage = 'QuotaExceededError: Storage quota exceeded';

      mockDB.put.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      // Should not throw - graceful error handling
      await expect(
        act(async () => {
          await result.current.saveDraft();
        })
      ).resolves.not.toThrow();

      // Error is logged internally but function doesn't throw
      // The important behavior is that the error is caught and handled gracefully
    });

    it('should update draft when form values change', async () => {
      const templateId = 'template_1';
      let formValues = { field1: 'initial' };

      const { result, rerender } = renderHook(({ values }) => useFormDraft(templateId, values), {
        initialProps: { values: formValues },
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      // Update form values
      formValues = { field1: 'updated' };
      rerender({ values: formValues });

      await act(async () => {
        await result.current.saveDraft();
      });

      // Should be called twice with different values
      expect(mockDB.put).toHaveBeenCalledTimes(2);
      expect(mockDB.put.mock.calls[1][1].values).toEqual({ field1: 'updated' });
    });
  });

  describe('loadDraft', () => {
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

      await act(async () => {
        await result.current.loadDraft();
      });

      await waitFor(() => {
        expect(onLoadDraft).toHaveBeenCalledWith(draftValues);
      });
    });

    it('should return null when no draft exists', async () => {
      const templateId = 'non_existent';
      const onLoadDraft = vi.fn();

      mockDB.get.mockResolvedValue(null);

      const { result } = renderHook(() => useFormDraft(templateId, {}, onLoadDraft));

      let loadedDraft: unknown;
      await act(async () => {
        loadedDraft = await result.current.loadDraft();
      });

      expect(loadedDraft).toBeNull();
      expect(onLoadDraft).not.toHaveBeenCalled();
    });

    it('should not call onLoadDraft when callback not provided', async () => {
      const templateId = 'template_1';
      const draftValues = { field1: 'draft_value' };

      mockDB.get.mockResolvedValue({
        templateId,
        values: draftValues,
        savedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useFormDraft(templateId, {}));

      await act(async () => {
        await result.current.loadDraft();
      });

      // Should not throw even without callback
    });

    it('should handle load errors gracefully', async () => {
      const templateId = 'template_1';
      const onLoadDraft = vi.fn();

      mockDB.get.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useFormDraft(templateId, {}, onLoadDraft));

      let loadedDraft: unknown;
      await act(async () => {
        loadedDraft = await result.current.loadDraft();
      });

      // Should return null on error
      expect(loadedDraft).toBeNull();
      // Should not call onLoadDraft callback when error occurs
      expect(onLoadDraft).not.toHaveBeenCalled();
      // Error is logged internally but function returns gracefully
    });

    it('should load draft automatically on mount', async () => {
      const templateId = 'template_1';
      const draftValues = { field1: 'auto_loaded' };
      const onLoadDraft = vi.fn();

      mockDB.get.mockResolvedValue({
        templateId,
        values: draftValues,
        savedAt: new Date().toISOString(),
      });

      renderHook(() => useFormDraft(templateId, {}, onLoadDraft));

      await waitFor(() => {
        expect(mockDB.get).toHaveBeenCalledWith('form_drafts', templateId);
        expect(onLoadDraft).toHaveBeenCalledWith(draftValues);
      });
    });
  });

  describe('clearDraft', () => {
    it('should clear draft from IndexedDB', async () => {
      const templateId = 'template_1';

      const { result } = renderHook(() => useFormDraft(templateId, {}));

      await act(async () => {
        await result.current.clearDraft();
      });

      await waitFor(() => {
        expect(mockDB.delete).toHaveBeenCalledWith('form_drafts', templateId);
      });
    });

    it('should handle clear errors gracefully', async () => {
      const templateId = 'template_1';

      mockDB.delete.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useFormDraft(templateId, {}));

      // Should not throw - graceful error handling
      await expect(
        act(async () => {
          await result.current.clearDraft();
        })
      ).resolves.not.toThrow();

      // Error is logged internally but function doesn't throw
      // The important behavior is that the error is caught and handled gracefully
    });

    it('should not throw when draft does not exist', async () => {
      const templateId = 'non_existent';

      mockDB.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFormDraft(templateId, {}));

      await expect(
        act(async () => {
          await result.current.clearDraft();
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Multi-template isolation', () => {
    it('should save drafts with different template IDs separately', async () => {
      const formValues1 = { field: 'value1' };
      const formValues2 = { field: 'value2' };

      const { result: result1 } = renderHook(() => useFormDraft('template_1', formValues1));
      const { result: result2 } = renderHook(() => useFormDraft('template_2', formValues2));

      await act(async () => {
        await result1.current.saveDraft();
        await result2.current.saveDraft();
      });

      expect(mockDB.put).toHaveBeenCalledTimes(2);
      expect(mockDB.put).toHaveBeenCalledWith(
        'form_drafts',
        expect.objectContaining({ templateId: 'template_1' }),
        'template_1'
      );
      expect(mockDB.put).toHaveBeenCalledWith(
        'form_drafts',
        expect.objectContaining({ templateId: 'template_2' }),
        'template_2'
      );
    });

    it('should load correct draft for specific template', async () => {
      const onLoadDraft = vi.fn();

      mockDB.get.mockImplementation((store: string, id: string) => {
        if (id === 'template_1') {
          return Promise.resolve({ templateId: 'template_1', values: { field: 'value1' } });
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useFormDraft('template_1', {}, onLoadDraft));

      await act(async () => {
        await result.current.loadDraft();
      });

      expect(onLoadDraft).toHaveBeenCalledWith({ field: 'value1' });
    });
  });

  describe('Construction site offline scenarios', () => {
    it('should persist draft data for offline access', async () => {
      const templateId = 'swppp_inspection';
      const formValues = {
        inspectorName: 'John Doe',
        siteConditions: 'Dry',
        stormwaterBMPs: ['Silt fence in place', 'Storm drain protection installed'],
        notes: 'No issues observed during inspection',
      };

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      // Verify data structure for compliance forms
      expect(mockDB.put).toHaveBeenCalledWith(
        'form_drafts',
        expect.objectContaining({
          templateId: 'swppp_inspection',
          values: expect.objectContaining({
            inspectorName: 'John Doe',
            stormwaterBMPs: expect.any(Array),
          }),
        }),
        templateId
      );
    });

    it('should handle large form data (photo references)', async () => {
      const templateId = 'site_inspection';
      const formValues = {
        photos: Array(50)
          .fill(null)
          .map((_, i) => ({
            id: `photo_${i}`,
            uri: `/photos/photo_${i}.jpg`,
            timestamp: new Date().toISOString(),
            gps: { lat: 36.1 + i * 0.001, lng: -115.1 + i * 0.001 },
          })),
        notes: 'Large inspection with many photos',
      };

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(mockDB.put).toHaveBeenCalled();
      const savedData = mockDB.put.mock.calls[0][1];
      expect(savedData.values.photos).toHaveLength(50);
    });
  });

  describe('IndexedDB initialization', () => {
    it('should create database if not exists', async () => {
      const templateId = 'new_template';
      const formValues = { field: 'value' };

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(openDB).toHaveBeenCalledWith('braveforms_drafts', 1, expect.any(Object));
    });

    it('should handle database upgrade scenarios', async () => {
      mockDB.objectStoreNames.contains.mockReturnValue(false);

      const templateId = 'template_1';
      const formValues = { field: 'value' };

      // Simulate database that needs recreation
      let dbOpenCount = 0;
      (openDB as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        dbOpenCount++;
        if (dbOpenCount === 1) {
          return Promise.resolve(mockDB);
        }
        // Second call after recreation
        mockDB.objectStoreNames.contains.mockReturnValue(true);
        return Promise.resolve(mockDB);
      });

      // Mock indexedDB.deleteDatabase
      Object.defineProperty(global, 'indexedDB', {
        value: {
          deleteDatabase: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
        },
        writable: true,
      });

      const { result } = renderHook(() => useFormDraft(templateId, formValues));

      await act(async () => {
        await result.current.saveDraft();
      });

      // Should attempt to open database
      expect(openDB).toHaveBeenCalled();
    });
  });
});
