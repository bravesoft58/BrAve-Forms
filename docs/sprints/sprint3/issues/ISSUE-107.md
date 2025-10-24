# ISSUE-107: "Use as Template" Feature

**Sprint:** Sprint 3 | **Phase:** 6 - Form Cloning | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-106 (copy yesterday working)
**Status:** NOT STARTED

## What You'll Do

Implement "Use as Template" feature to clone any submission with three clone modes: keep all values, structure only, or clear all.

## Step-by-Step Instructions

### Step 1: Create UseAsTemplateDialog Component (60 min)

Create `apps/web/app/submissions/[id]/UseAsTemplateDialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface UseAsTemplateDialogProps {
  submissionId: string;
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
}

type CloneMode = 'keep_all' | 'structure_only' | 'clear_all';

export function UseAsTemplateDialog({
  submissionId,
  templateId,
  isOpen,
  onClose,
}: UseAsTemplateDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMode, setSelectedMode] = useState<CloneMode>('keep_all');

  const cloneMutation = useMutation({
    mutationFn: async (mode: CloneMode) => {
      return await api.submissions.clone(submissionId, mode);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Template created successfully!');
      onClose();
      router.push(`/forms/${templateId}/fill?draftId=${data.id}`);
    },
    onError: (error: any) => {
      toast.error('Failed to create template', {
        description: error.message || 'Please try again',
      });
    },
  });

  const handleClone = async () => {
    await cloneMutation.mutateAsync(selectedMode);
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Use as Template</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-description">Choose how you want to clone this submission:</p>

          <div className="clone-mode-options">
            <label className="clone-mode-option">
              <input
                type="radio"
                name="cloneMode"
                value="keep_all"
                checked={selectedMode === 'keep_all'}
                onChange={(e) => setSelectedMode(e.target.value as CloneMode)}
              />
              <div className="option-content">
                <strong>Keep All Values</strong>
                <p>Copy all field values. Date, time, and signature fields will be reset.</p>
              </div>
            </label>

            <label className="clone-mode-option">
              <input
                type="radio"
                name="cloneMode"
                value="structure_only"
                checked={selectedMode === 'structure_only'}
                onChange={(e) => setSelectedMode(e.target.value as CloneMode)}
              />
              <div className="option-content">
                <strong>Structure Only</strong>
                <p>
                  Keep form structure but clear all field values. Useful for creating a blank
                  template.
                </p>
              </div>
            </label>

            <label className="clone-mode-option">
              <input
                type="radio"
                name="cloneMode"
                value="clear_all"
                checked={selectedMode === 'clear_all'}
                onChange={(e) => setSelectedMode(e.target.value as CloneMode)}
              />
              <div className="option-content">
                <strong>Clear All</strong>
                <p>Start completely fresh. Same template, no pre-filled values.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="dialog-footer">
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={cloneMutation.isPending}
            className="confirm-button"
          >
            {cloneMutation.isPending ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Add Dialog to Submission Detail Page (30 min)

Update `apps/web/app/submissions/[id]/page.tsx`:

```tsx
import { useState } from 'react';
import { UseAsTemplateDialog } from './UseAsTemplateDialog';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.submissions.findById(submissionId),
  });

  // ... existing code

  return (
    <div className="submission-detail">
      {/* ... existing content */}

      <div className="detail-actions">
        <button onClick={() => window.print()} className="print-button">
          Print
        </button>
        <button onClick={() => setIsDialogOpen(true)} className="use-as-template-button">
          Use as Template
        </button>
      </div>

      <UseAsTemplateDialog
        submissionId={submissionId}
        templateId={submission.templateId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
```

### Step 3: Add Dialog Styles (25 min)

Add to `apps/web/styles/globals.css`:

```css
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  color: #718096;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-button:hover {
  color: #2d3748;
}

.dialog-body {
  padding: 24px;
}

.dialog-description {
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 16px;
}

.clone-mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clone-mode-option {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.clone-mode-option:hover {
  border-color: #cbd5e0;
}

.clone-mode-option input[type='radio'] {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
}

.clone-mode-option input[type='radio']:checked + .option-content {
  color: #2d3748;
}

.clone-mode-option:has(input:checked) {
  border-color: #4299e1;
  background-color: #ebf8ff;
}

.option-content {
  flex: 1;
}

.option-content strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.option-content p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.cancel-button,
.confirm-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button {
  background-color: #edf2f7;
  color: #2d3748;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.confirm-button {
  background-color: #4299e1;
  color: white;
}

.confirm-button:hover:not(:disabled) {
  background-color: #3182ce;
}

.confirm-button:disabled {
  background-color: #bee3f8;
  color: #90cdf4;
  cursor: not-allowed;
}

.use-as-template-button {
  padding: 10px 20px;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.use-as-template-button:hover {
  background-color: #38a169;
}
```

### Step 4: Test UseAsTemplateDialog (5 min)

Create test file `apps/web/app/submissions/[id]/UseAsTemplateDialog.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UseAsTemplateDialog } from './UseAsTemplateDialog';

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('UseAsTemplateDialog', () => {
  const defaultProps = {
    submissionId: 'test-submission',
    templateId: 'test-template',
    isOpen: true,
    onClose: jest.fn(),
  };

  it('should render dialog when open', () => {
    render(<UseAsTemplateDialog {...defaultProps} />);

    expect(screen.getByText('Use as Template')).toBeInTheDocument();
    expect(screen.getByText('Keep All Values')).toBeInTheDocument();
    expect(screen.getByText('Structure Only')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<UseAsTemplateDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Use as Template')).not.toBeInTheDocument();
  });

  it('should select clone mode', () => {
    render(<UseAsTemplateDialog {...defaultProps} />);

    const structureOnlyRadio = screen.getByLabelText(/Structure Only/);
    fireEvent.click(structureOnlyRadio);

    expect(structureOnlyRadio).toBeChecked();
  });

  it('should close on cancel', () => {
    const onClose = jest.fn();
    render(<UseAsTemplateDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });
});
```

Run tests:

```bash
cd apps/web
pnpm test app/submissions/\[id\]/UseAsTemplateDialog
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should render dialog when open"
2. Write test: "should not render when closed"
3. Write test: "should select clone mode"
4. Write test: "should close on cancel"
5. Write test: "should clone with selected mode"
6. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create UseAsTemplateDialog component
2. Add clone mode radio buttons
3. Implement clone mutation
4. Add close handlers
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract clone mode descriptions to constants
2. Add TypeScript types for all props
3. Improve accessibility (ARIA labels)

## Troubleshooting

**Issue: Dialog not showing**

```tsx
// Ensure isOpen prop is true
<UseAsTemplateDialog
  isOpen={isDialogOpen}
  // ...
/>
```

**Issue: Click outside not closing**

```tsx
// Add stopPropagation to content
<div className="dialog-overlay" onClick={onClose}>
  <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
    {/* Dialog content */}
  </div>
</div>
```

**Issue: Radio buttons not working**

```tsx
// Ensure name attribute is same for all radios
<input
  type="radio"
  name="cloneMode" // CRITICAL: Same name for radio group
  value="keep_all"
  checked={selectedMode === 'keep_all'}
  onChange={(e) => setSelectedMode(e.target.value as CloneMode)}
/>
```

## Completion Checklist

- [ ] Create apps/web/app/submissions/[id]/UseAsTemplateDialog.tsx
- [ ] Add "Use as Template" button to submission detail page
- [ ] Implement clone mode radio buttons (3 options)
- [ ] Add clone mode descriptions
- [ ] Implement clone mutation with selected mode
- [ ] Add loading state (isPending)
- [ ] Add success toast notification
- [ ] Add error toast notification
- [ ] Implement redirect to fill page with draftId
- [ ] Add dialog styles (overlay, content, footer)
- [ ] Add close on overlay click
- [ ] Add close button (X)
- [ ] Create UseAsTemplateDialog tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: use as template dialog with clone modes"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-107/

## Evidence Requirements

**Screenshots:**

- "Use as Template" button on detail page
- Dialog with 3 clone mode options
- "Keep All Values" selected
- "Structure Only" selected
- "Clear All" selected
- Success toast notification

**Test Results:**

- UseAsTemplateDialog tests passing (4+ tests)
- Screenshot of test coverage report

**Code Review:**

- Clone modes working correctly
- Dialog accessibility (keyboard navigation, ARIA labels)
- Mutation calls correct GraphQL endpoint

**Manual Test:**

1. View submission detail
2. Click "Use as Template"
3. Select "Keep All Values" → Verify text fields kept, date reset
4. Select "Structure Only" → Verify all values cleared
5. Select "Clear All" → Verify completely empty

## Files Created/Modified

**Created:**

- apps/web/app/submissions/[id]/UseAsTemplateDialog.tsx
- apps/web/app/submissions/[id]/UseAsTemplateDialog.test.tsx

**Modified:**

- apps/web/app/submissions/[id]/page.tsx (add button and dialog)
- apps/web/styles/globals.css (add dialog styles)

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Create dialog component (60 min)
- Step 2: Add to detail page (30 min)
- Step 3: Add styles (25 min)
- Step 4: Testing (5 min)

## Next Issue

**ISSUE-108:** Cloning Workflow Tests (2h)
