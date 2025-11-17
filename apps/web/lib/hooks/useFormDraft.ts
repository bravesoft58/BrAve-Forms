import { useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'braveforms_drafts';
const STORE_NAME = 'form_drafts';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Auto-save form draft to IndexedDB
 *
 * Features:
 * - Saves draft every 30 seconds
 * - Loads draft on form open
 * - Clears draft on submission
 *
 * @param templateId - Form template ID
 * @param formValues - Current form values from React Hook Form watch()
 * @param onLoadDraft - Callback to load draft into form
 * @returns saveDraft, loadDraft, clearDraft functions
 */
export function useFormDraft(
  templateId: string,
  formValues: Record<string, any>,
  onLoadDraft?: (draft: Record<string, any>) => void
) {
  /**
   * Initialize IndexedDB
   */
  const initDB = useCallback(async (): Promise<IDBPDatabase> => {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Always create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
        blocked() {
          console.warn('IndexedDB blocked - another tab may be open');
        },
        blocking() {
          console.warn('IndexedDB blocking - close other tabs');
        },
      });

      // Verify object store exists, recreate if missing
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.warn('Object store missing, recreating database...');
        db.close();
        // Delete and recreate database
        const deleteReq = indexedDB.deleteDatabase(DB_NAME);
        await new Promise<void>((resolve, reject) => {
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => reject(deleteReq.error);
        });
        // Reopen with upgrade
        return openDB(DB_NAME, 1, {
          upgrade(db) {
            db.createObjectStore(STORE_NAME);
          },
        });
      }

      return db;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }, []);

  /**
   * Save draft to IndexedDB
   */
  const saveDraft = useCallback(async () => {
    try {
      const db = await initDB();
      const draft = {
        templateId,
        values: formValues,
        savedAt: new Date().toISOString(),
      };

      await db.put(STORE_NAME, draft, templateId);
      console.log('Draft saved:', templateId);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [templateId, formValues, initDB]);

  /**
   * Load draft from IndexedDB
   */
  const loadDraft = useCallback(async () => {
    try {
      const db = await initDB();
      const draft = await db.get(STORE_NAME, templateId);

      if (draft && onLoadDraft) {
        onLoadDraft((draft as any).values);
        console.log('Draft loaded:', templateId);
        return (draft as any).values;
      }

      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [templateId, initDB, onLoadDraft]);

  /**
   * Clear draft from IndexedDB
   */
  const clearDraft = useCallback(async () => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAME, templateId);
      console.log('Draft cleared:', templateId);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [templateId, initDB]);

  // Note: Auto-save interval is handled by the component using this hook
  // to allow for status updates and custom timing

  /**
   * Load draft on mount
   */
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  return { saveDraft, loadDraft, clearDraft };
}

