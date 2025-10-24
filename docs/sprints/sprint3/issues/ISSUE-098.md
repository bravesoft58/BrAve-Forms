# ISSUE-084: Auto-Save Draft Functionality

**Sprint:** Sprint 3 | **Phase:** 4 - Dynamic Form Renderer | **Priority:** P1
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-083 (validation complete)

## What You'll Do

Implement auto-save draft functionality that saves form data to IndexedDB every 30 seconds, loads draft on form open, and clears draft on submission.

## Prerequisites

- [ ] ISSUE-083 complete (validation working)
- [ ] Web app accessible at http://localhost:30102
- [ ] Code editor open to apps/web/hooks
- [ ] IndexedDB available in browser

## Step-by-Step Instructions

### Step 1: Create Auto-Save Draft Hook (40 min)

Create `apps/web/hooks/useFormDraft.ts`:

```typescript
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
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
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
        onLoadDraft(draft.values);
        console.log('Draft loaded:', templateId);
        return draft.values;
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

  /**
   * Auto-save draft every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [saveDraft]);

  /**
   * Load draft on mount
   */
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  return { saveDraft, loadDraft, clearDraft };
}
```

### Step 2: Install IndexedDB Library (5 min)

```bash
cd apps/web
pnpm add idb
```

Verify installation:

```bash
grep "idb" package.json
```

Expected output:

```json
"idb": "^8.0.0"
```

### Step 3: Integrate Auto-Save into FormRenderer (10 min)

Edit `FormRenderer.tsx`:

```typescript
import { useFormDraft } from '@/hooks/useFormDraft';

export function FormRenderer({ template, onSubmit, initialValues, readOnly }: FormRendererProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  const formValues = watch();

  // Auto-save draft functionality
  const { saveDraft, loadDraft, clearDraft } = useFormDraft(
    template.id,
    formValues,
    (draftValues) => {
      // Load draft into form
      reset(draftValues);
      console.log('Draft loaded into form');
    }
  );

  const onSubmitForm = async (data: Record<string, any>) => {
    const submission: FormSubmissionData = {
      templateId: template.id,
      values: data,
      submittedAt: new Date().toISOString(),
      submittedBy: 'current-user-id',
    };

    // Clear draft on successful submission
    await clearDraft();

    onSubmit(submission);
  };

  // Manual save button (optional)
  const handleManualSave = async () => {
    await saveDraft();
    alert('Draft saved!');
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="form-renderer">
      {/* ... form fields ... */}

      <div className="form-actions">
        {!readOnly && (
          <>
            <button type="button" onClick={handleManualSave}>
              Save Draft
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
```

### Step 4: Add Draft Status Indicator (5 min)

Update FormRenderer to show draft status:

```typescript
const [lastSaved, setLastSaved] = useState<Date | null>(null);

// Update saveDraft to set lastSaved
const saveDraftWithStatus = async () => {
  await saveDraft();
  setLastSaved(new Date());
};

// Update useEffect to use saveDraftWithStatus
useEffect(() => {
  const interval = setInterval(() => {
    saveDraftWithStatus();
  }, AUTO_SAVE_INTERVAL);

  return () => clearInterval(interval);
}, [saveDraft]);

// Add status indicator to UI
<div className="form-header">
  <h2>{template.title}</h2>
  {lastSaved && (
    <p style={{ fontSize: '12px', color: '#666' }}>
      Draft saved at {lastSaved.toLocaleTimeString()}
    </p>
  )}
</div>
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `__tests__/useFormDraft.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useFormDraft } from '../useFormDraft';
import { openDB } from 'idb';

// Mock idb
jest.mock('idb');

describe('useFormDraft', () => {
  const mockDB = {
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (openDB as jest.Mock).mockResolvedValue(mockDB);
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
    const onLoadDraft = jest.fn();

    mockDB.get.mockResolvedValue({
      templateId,
      values: draftValues,
      savedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useFormDraft(templateId, {}, onLoadDraft));

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
    jest.useFakeTimers();

    const templateId = 'template_1';
    const formValues = { field1: 'value1' };

    renderHook(() => useFormDraft(templateId, formValues));

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockDB.put).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });
});
```

Run tests (should FAIL - red phase):

```bash
pnpm test useFormDraft.test.ts
```

Expected: Tests fail (hook not implemented yet)

**Screenshot:** Save failing test to `evidence/ISSUE-084/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement useFormDraft.ts as shown in Step 1.

Run tests again:

```bash
pnpm test useFormDraft.test.ts
```

Expected: All tests pass (4/4 passing)

**Screenshot:** Save passing tests to `evidence/ISSUE-084/test-results/green-phase.png`

### Step 5: Manual Testing (10 min)

Test manually:

1. Navigate to http://localhost:30102/test-form
2. Fill in some fields
3. Wait 30 seconds - see "Draft saved at..." message
4. Refresh page - form fields restored from draft
5. Submit form - draft cleared
6. Refresh page - form empty (no draft)

**Screenshot:** Save draft status to `evidence/ISSUE-084/test-results/draft-saved-status.png`

## Files to Create/Modify

**Create:**

- apps/web/hooks/useFormDraft.ts
- apps/web/hooks/**tests**/useFormDraft.test.ts

**Modify:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx (integrate auto-save)
- apps/web/package.json (add idb dependency)

## Verification Checklist

- [ ] useFormDraft hook created
- [ ] idb package installed
- [ ] Draft saves to IndexedDB every 30 seconds
- [ ] Draft loads on form open
- [ ] Draft clears on submission
- [ ] Manual "Save Draft" button works
- [ ] Draft status indicator shows last saved time
- [ ] Tests pass (4/4 passing)
- [ ] Manual test verifies auto-save and load
- [ ] Build succeeds
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-084/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (4/4 tests passing)
  - draft-saved-status.png (UI showing "Draft saved at...")
  - draft-loaded.png (form restored from draft after refresh)
- code/
  - use-form-draft.png (useFormDraft.ts)
  - form-renderer-integration.png (FormRenderer.tsx with auto-save)

## Troubleshooting

**Problem:** Draft not saving

- **Cause:** IndexedDB not initialized
- **Solution:** Check browser console for errors, verify idb package installed

**Problem:** Draft not loading on mount

- **Cause:** loadDraft effect not running
- **Solution:** Verify loadDraft in useEffect dependency array

**Problem:** Draft persists after submission

- **Cause:** clearDraft not called in onSubmit
- **Solution:** Call clearDraft() before onSubmit callback

**Problem:** iOS Safari doesn't persist draft

- **Cause:** IndexedDB may be cleared under low storage (see CLAUDE.md)
- **Solution:** KNOWN ISSUE - Sprint 5 will migrate to SQLite for critical data

## Success Criteria

- [ ] Form auto-saves to IndexedDB every 30 seconds
- [ ] Draft loads automatically on form open
- [ ] Draft clears on successful submission
- [ ] Manual "Save Draft" button works
- [ ] Draft status indicator shows last saved time
- [ ] Tests pass (4/4 passing)
- [ ] Manual test verifies end-to-end flow
- [ ] Build succeeds

## Time Estimate

**1 hour total:**

- Create auto-save hook: 40 min
- Install idb library: 5 min
- Integrate into FormRenderer: 10 min
- Add draft status indicator: 5 min

## Next Issue

**ISSUE-085:** GraphQL Form Template Mutations (3h)

- Prerequisites: Phase 1 complete (FormRenderer fully functional)
- Starts: Phase 2 - Template Management
- Uses: FormRenderer component for template preview
- Adds: GraphQL mutations for create/update/delete templates
