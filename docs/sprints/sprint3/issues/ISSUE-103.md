# ISSUE-103: Form Submission Confirmation

**Sprint:** Sprint 3 | **Phase:** 5 - Form Submission Workflow | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-102 (signature working)
**Status:** COMPLETE
**Completed:** 2025-11-22

## What You'll Do

Implement form submission mutation, success/error toast notifications, redirect to submission view, and offline queue functionality.

## Step-by-Step Instructions

### Step 1: Create Submission Mutation Hook (30 min)

Create `apps/web/hooks/useSubmitForm.ts`:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface SubmitFormInput {
  templateId: string;
  data: Record<string, any>;
  status: 'draft' | 'submitted';
}

export function useSubmitForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const mutation = useMutation({
    mutationFn: async (input: SubmitFormInput) => {
      if (!isOnline) {
        // Queue for offline sync
        await queueSubmissionForSync(input);
        return { id: 'offline-pending', ...input };
      }

      // Submit immediately if online
      const response = await api.submissions.create(input);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions'] });

      if (variables.status === 'draft') {
        toast.success('Draft saved successfully');
      } else {
        toast.success('Form submitted successfully!', {
          description: 'Your submission has been recorded.',
        });
        // Redirect to submission view
        router.push(`/submissions/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast.error('Failed to submit form', {
        description: error.message || 'Please try again',
      });
    },
  });

  return mutation;
}

// Queue submission for offline sync
async function queueSubmissionForSync(input: SubmitFormInput) {
  const db = await openIndexedDB();
  const transaction = db.transaction(['offline-queue'], 'readwrite');
  const store = transaction.objectStore('offline-queue');

  const queueItem = {
    id: `offline-${Date.now()}`,
    type: 'form-submission',
    data: input,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  await store.add(queueItem);
  toast.info('Form queued for submission', {
    description: 'Will submit when connection is restored',
  });
}

// IndexedDB helper
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('brave-forms-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id' });
      }
    };
  });
}
```

### Step 2: Create Network Status Hook (15 min)

Create `apps/web/hooks/useNetworkStatus.ts`:

```tsx
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Network: Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network: Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
```

### Step 3: Update FormRenderer to Use Submission Hook (10 min)

Update `apps/web/components/Forms/FormRenderer.tsx`:

```tsx
import { useSubmitForm } from '@/hooks/useSubmitForm';

export function FormRenderer({ schema, templateId, mode }: FormRendererProps) {
  const { handleSubmit, control } = useForm();
  const submitMutation = useSubmitForm();

  const onSubmit = async (formData: any) => {
    await submitMutation.mutateAsync({
      templateId,
      data: formData,
      status: 'submitted',
    });
  };

  const onSaveDraft = async (formData: any) => {
    await submitMutation.mutateAsync({
      templateId,
      data: formData,
      status: 'draft',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}

      <div className="form-actions">
        <button
          type="button"
          onClick={handleSubmit(onSaveDraft)}
          className="save-draft-button"
          disabled={submitMutation.isPending}
        >
          Save Draft
        </button>

        <button type="submit" className="submit-button" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? 'Submitting...' : 'Submit Form'}
        </button>
      </div>
    </form>
  );
}
```

### Step 4: Test Submission Workflow (5 min)

Create test file `apps/web/hooks/useSubmitForm.test.ts`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSubmitForm } from './useSubmitForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

describe('useSubmitForm', () => {
  it('should submit form successfully', async () => {
    const { result } = renderHook(() => useSubmitForm(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      templateId: 'test-template',
      data: { field1: 'value1' },
      status: 'submitted',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should save draft', async () => {
    const { result } = renderHook(() => useSubmitForm(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      templateId: 'test-template',
      data: { field1: 'value1' },
      status: 'draft',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

Run tests:

```bash
cd apps/web
pnpm test hooks/useSubmitForm
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should submit form successfully"
2. Write test: "should save draft"
3. Write test: "should queue when offline"
4. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create useSubmitForm hook with mutation
2. Add success/error handlers
3. Add offline queue logic
4. Run tests → ALL PASS

**Refactor Phase:**

1. Extract IndexedDB logic to separate module
2. Add retry logic for failed submissions
3. Improve TypeScript types

## Troubleshooting

**Issue: Submission not redirecting**

```tsx
// Ensure router.push is called in onSuccess
onSuccess: (data) => {
  if (data.status === 'submitted') {
    router.push(`/submissions/${data.id}`);
  }
};
```

**Issue: Offline queue not working**

```tsx
// Check IndexedDB browser support
if (!window.indexedDB) {
  console.error('IndexedDB not supported');
  // Fallback to localStorage
}
```

**Issue: Toast not showing**

```tsx
// Ensure Toaster component is in layout
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

## Completion Checklist

- [ ] Create apps/web/hooks/useSubmitForm.ts
- [ ] Create apps/web/hooks/useNetworkStatus.ts
- [ ] Implement form submission mutation
- [ ] Add success toast notification
- [ ] Add error toast notification
- [ ] Add redirect to submission view
- [ ] Implement offline queue (IndexedDB)
- [ ] Add loading state (isPending)
- [ ] Integrate into FormRenderer
- [ ] Create useSubmitForm tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: form submission with offline queue"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-103/

## Evidence Requirements

**Screenshots:**

- Success toast notification
- Error toast notification
- Offline queue notification
- Loading state (submitting button)

**Test Results:**

- useSubmitForm tests passing (2+ tests)
- Screenshot of test coverage report

**Code Review:**

- Offline queue working correctly
- Redirect after submission
- Error handling comprehensive

## Files Created/Modified

**Created:**

- apps/web/hooks/useSubmitForm.ts
- apps/web/hooks/useNetworkStatus.ts
- apps/web/hooks/useSubmitForm.test.ts

**Modified:**

- apps/web/components/Forms/FormRenderer.tsx (use submission hook)
- apps/web/app/layout.tsx (add Toaster component)

## Time Estimate: 1 hour

**Breakdown:**

- Step 1: Create submission mutation hook (30 min)
- Step 2: Create network status hook (15 min)
- Step 3: Update FormRenderer (10 min)
- Step 4: Testing (5 min)

## Next Issue

**ISSUE-104:** Submission History View (2h)
