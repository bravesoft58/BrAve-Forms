# ISSUE-106: "Copy Yesterday's Log" Button

**Sprint:** Sprint 3 | **Phase:** 6 - Form Cloning | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-105 (cloning service exists)
**Status:** COMPLETE
**Completed:** 2025-11-23

## What You'll Do

Create frontend button to clone yesterday's submission, automatically find the most recent log, clone it, and redirect to the fill page with the cloned draft.

## Step-by-Step Instructions

### Step 1: Create CopyYesterdaysLog Hook (45 min)

Create `apps/web/hooks/useCopyYesterdaysLog.ts`:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface CopyYesterdaysLogInput {
  templateId: string;
}

export function useCopyYesterdaysLog() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ templateId }: CopyYesterdaysLogInput) => {
      // Call GraphQL mutation
      const response = await api.submissions.copyYesterdaysLog(templateId);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions'] });

      toast.success("Yesterday's log copied!", {
        description: 'Continue filling from where you left off',
      });

      // Redirect to fill page with draft ID
      router.push(`/forms/${data.templateId}/fill?draftId=${data.id}`);
    },
    onError: (error: any) => {
      if (error.message.includes('not found')) {
        toast.error('No submission found for yesterday', {
          description: 'Start a new form instead',
        });
      } else {
        toast.error("Failed to copy yesterday's log", {
          description: error.message || 'Please try again',
        });
      }
    },
  });

  return mutation;
}
```

### Step 2: Add API Helper Method (20 min)

Update `apps/web/lib/api.ts`:

```typescript
export const api = {
  // ... existing methods

  submissions: {
    // ... existing methods

    copyYesterdaysLog: async (templateId: string) => {
      const query = `
        mutation CopyYesterdaysLog($templateId: String!) {
          copyYesterdaysLog(templateId: $templateId) {
            id
            templateId
            data
            status
            submittedAt
          }
        }
      `;

      const response = await graphqlClient.request(query, { templateId });
      return response.copyYesterdaysLog;
    },

    clone: async (
      sourceId: string,
      mode: 'keep_all' | 'structure_only' | 'clear_all' = 'keep_all'
    ) => {
      const query = `
        mutation CloneSubmission($sourceId: String!, $mode: CloneMode) {
          cloneSubmission(sourceId: $sourceId, mode: $mode) {
            id
            templateId
            data
            status
          }
        }
      `;

      const response = await graphqlClient.request(query, { sourceId, mode });
      return response.cloneSubmission;
    },
  },
};
```

### Step 3: Add Button to Submissions List (40 min)

Update `apps/web/app/submissions/page.tsx`:

```tsx
import { useCopyYesterdaysLog } from '@/hooks/useCopyYesterdaysLog';

export default function SubmissionsPage() {
  // ... existing code

  const copyYesterdaysLog = useCopyYesterdaysLog();

  const handleCopyYesterday = async (templateId: string) => {
    await copyYesterdaysLog.mutateAsync({ templateId });
  };

  return (
    <div className="submissions-page">
      <div className="page-header">
        <h1>Form Submissions</h1>
        <div className="header-actions">
          <button
            onClick={() => handleCopyYesterday('daily-log-template-id')}
            className="copy-yesterday-button"
            disabled={copyYesterdaysLog.isPending}
          >
            {copyYesterdaysLog.isPending ? 'Copying...' : "Copy Yesterday's Log"}
          </button>
          <Link href="/forms" className="new-form-button">
            Fill New Form
          </Link>
        </div>
      </div>

      {/* Add quick action card */}
      <div className="quick-actions">
        <div className="quick-action-card">
          <h3>Daily Log</h3>
          <p>Continue from yesterday's log with pre-filled values</p>
          <button
            onClick={() => handleCopyYesterday('daily-log-template-id')}
            className="quick-action-button"
            disabled={copyYesterdaysLog.isPending}
          >
            Copy Yesterday's Log
          </button>
        </div>

        <div className="quick-action-card">
          <h3>Safety Inspection</h3>
          <p>Start a new safety inspection form</p>
          <button
            onClick={() => router.push('/forms/safety-inspection-template-id/fill')}
            className="quick-action-button"
          >
            New Safety Inspection
          </button>
        </div>
      </div>

      {/* ... rest of submissions list */}
    </div>
  );
}
```

### Step 4: Add Quick Actions Styles (10 min)

Add to `apps/web/styles/globals.css`:

```css
.header-actions {
  display: flex;
  gap: 12px;
}

.copy-yesterday-button {
  padding: 10px 20px;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-yesterday-button:hover:not(:disabled) {
  background-color: #38a169;
}

.copy-yesterday-button:disabled {
  background-color: #c6f6d5;
  color: #9ae6b4;
  cursor: not-allowed;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.quick-action-card {
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-action-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
}

.quick-action-card p {
  font-size: 14px;
  color: #718096;
  margin-bottom: 16px;
}

.quick-action-button {
  width: 100%;
  padding: 12px 24px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quick-action-button:hover:not(:disabled) {
  background-color: #3182ce;
}

.quick-action-button:disabled {
  background-color: #bee3f8;
  color: #90cdf4;
  cursor: not-allowed;
}
```

### Step 5: Test CopyYesterdaysLog Hook (5 min)

Create test file `apps/web/hooks/useCopyYesterdaysLog.test.ts`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useCopyYesterdaysLog } from './useCopyYesterdaysLog';
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

jest.mock('@/lib/api', () => ({
  api: {
    submissions: {
      copyYesterdaysLog: jest.fn().mockResolvedValue({
        id: 'cloned-id',
        templateId: 'template-id',
        data: { field1: 'value1' },
        status: 'draft',
      }),
    },
  },
}));

describe('useCopyYesterdaysLog', () => {
  it("should copy yesterday's log", async () => {
    const { result } = renderHook(() => useCopyYesterdaysLog(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ templateId: 'template-id' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle "not found" error', async () => {
    const { api } = require('@/lib/api');
    api.submissions.copyYesterdaysLog.mockRejectedValue(
      new Error('No submission found for yesterday')
    );

    const { result } = renderHook(() => useCopyYesterdaysLog(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync({ templateId: 'template-id' });
    } catch (error) {
      // Expected to throw
    }

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

Run tests:

```bash
cd apps/web
pnpm test hooks/useCopyYesterdaysLog
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should copy yesterday's log"
2. Write test: "should handle 'not found' error"
3. Write test: "should redirect after copy"
4. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create useCopyYesterdaysLog hook
2. Implement mutation with error handling
3. Add redirect logic
4. Add button to submissions page
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract template ID to constants
2. Add loading states
3. Improve error messages

## Troubleshooting

**Issue: "Not found" error always shown**

```bash
# Check backend has yesterday's submission
curl -X POST http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { copyYesterdaysLog(templateId: \"template-id\") { id } }"
  }'
```

**Issue: Redirect not working**

```tsx
// Ensure router.push is called in onSuccess
onSuccess: (data) => {
  router.push(`/forms/${data.templateId}/fill?draftId=${data.id}`);
};
```

**Issue: Button disabled permanently**

```tsx
// Check isPending state
<button disabled={copyYesterdaysLog.isPending}>
  {copyYesterdaysLog.isPending ? 'Copying...' : "Copy Yesterday's Log"}
</button>
```

## Completion Checklist

- [ ] Create apps/web/hooks/useCopyYesterdaysLog.ts
- [ ] Update apps/web/lib/api.ts (add copyYesterdaysLog method)
- [ ] Add "Copy Yesterday's Log" button to header
- [ ] Add quick actions section with cards
- [ ] Add loading state (isPending)
- [ ] Add success toast notification
- [ ] Add error toast notification (not found, generic)
- [ ] Implement redirect to fill page with draftId
- [ ] Add button styles (green accent)
- [ ] Create useCopyYesterdaysLog tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: copy yesterday's log button with auto-clone"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-106/

## Evidence Requirements

**Screenshots:**

- "Copy Yesterday's Log" button (enabled)
- "Copy Yesterday's Log" button (loading state)
- Quick actions section
- Success toast notification
- Error toast notification ("not found")

**Test Results:**

- useCopyYesterdaysLog tests passing (2+ tests)
- Screenshot of test coverage report

**Code Review:**

- Mutation calls correct GraphQL endpoint
- Redirect includes draftId query param
- Error handling comprehensive

**Manual Test:**

1. Create submission today
2. Change system date to tomorrow
3. Click "Copy Yesterday's Log"
4. Verify form fills with yesterday's data
5. Verify date/signature fields reset

## Files Created/Modified

**Created:**

- apps/web/hooks/useCopyYesterdaysLog.ts
- apps/web/hooks/useCopyYesterdaysLog.test.ts

**Modified:**

- apps/web/lib/api.ts (add copyYesterdaysLog method)
- apps/web/app/submissions/page.tsx (add button and quick actions)
- apps/web/styles/globals.css (add quick actions styles)

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Create hook (45 min)
- Step 2: Add API helper (20 min)
- Step 3: Add button to page (40 min)
- Step 4: Add styles (10 min)
- Step 5: Testing (5 min)

## Next Issue

**ISSUE-107:** "Use as Template" Feature (2h)
