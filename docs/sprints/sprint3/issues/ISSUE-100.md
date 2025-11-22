# ISSUE-100: Web Form Filling Page

**Sprint:** Sprint 3 | **Phase:** 5 - Form Submission Workflow | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-113 (mobile page exists)
**Status:** COMPLETE
**Completed:** 2025-11-22

## What You'll Do

Create desktop-optimized form filling page with file upload for photos, keyboard shortcuts, and print preview functionality.

## Step-by-Step Instructions

### Step 1: Add Desktop Layout to Existing Page (60 min)

Modify `apps/web/app/forms/[templateId]/fill/page.tsx`:

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FormRenderer } from '@/components/Forms/FormRenderer';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function FormFillPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: template, isLoading } = useQuery({
    queryKey: ['formTemplate', templateId],
    queryFn: () => api.forms.getTemplate(templateId),
  });

  const [formData, setFormData] = useState({});
  const [isDraft, setIsDraft] = useState(false);

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft(formData);
      }

      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(formData);
      }

      // Ctrl+P or Cmd+P to print preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrintPreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isMobile]);

  const handleSubmit = async (data: any) => {
    try {
      const result = await api.submissions.create({
        templateId,
        data,
        status: 'submitted',
      });
      toast.success('Form submitted successfully!');
      router.push(`/submissions/${result.id}`);
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  const handleSaveDraft = async (data: any) => {
    try {
      const result = await api.submissions.create({
        templateId,
        data,
        status: 'draft',
      });
      toast.success('Draft saved (Ctrl+S)');
      setIsDraft(true);
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const handlePrintPreview = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-4">Loading form...</div>;
  }

  return (
    <div className={isMobile ? 'mobile-view' : 'desktop-view'}>
      {!isMobile && (
        <div className="desktop-toolbar">
          <div className="toolbar-shortcuts">
            <span className="shortcut-hint">Ctrl+S to save draft</span>
            <span className="shortcut-hint">Ctrl+Enter to submit</span>
            <span className="shortcut-hint">Ctrl+P to print</span>
          </div>
          <button onClick={handlePrintPreview} className="print-button">
            Print Preview
          </button>
        </div>
      )}

      <div className={isMobile ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">{template.name}</h1>
          <FormRenderer
            schema={template.schema}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            mode={isMobile ? 'mobile' : 'desktop'}
          />
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Add Desktop Styles (45 min)

Add to `apps/web/styles/globals.css`:

```css
.desktop-view {
  padding: 24px;
  background-color: #f7fafc;
}

.desktop-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1024px;
  margin: 0 auto 16px;
  padding: 12px 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-shortcuts {
  display: flex;
  gap: 16px;
}

.shortcut-hint {
  font-size: 14px;
  color: #718096;
  padding: 4px 8px;
  background-color: #edf2f7;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.print-button {
  padding: 8px 16px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.print-button:hover {
  background-color: #3182ce;
}

/* Desktop form optimizations */
.desktop-view input[type='text'],
.desktop-view input[type='number'],
.desktop-view textarea {
  padding: 8px 12px;
  font-size: 14px;
}

.desktop-view button {
  min-height: 36px;
  min-width: 80px;
}

/* Print styles */
@media print {
  .desktop-toolbar,
  .print-button,
  .shortcut-hint {
    display: none;
  }

  .desktop-view {
    padding: 0;
    background-color: white;
  }

  .form-section {
    page-break-inside: avoid;
  }
}

/* Two-column layout for desktop */
@media (min-width: 1024px) {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .form-field.full-width {
    grid-column: 1 / -1;
  }
}
```

### Step 3: Implement File Upload for Photos (60 min)

Update `FormRenderer.tsx` to support file upload on desktop:

```tsx
interface PhotoFieldProps {
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
  mode: 'mobile' | 'desktop';
}

function PhotoField({ fieldId, value, onChange, mode }: PhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = async () => {
    if (mode === 'desktop') {
      fileInputRef.current?.click();
      return;
    }

    // Mobile camera capture (from ISSUE-113)
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      const result = await api.photos.upload({
        dataUrl: photo.dataUrl,
        fieldId,
      });

      onChange(result.url);
    } catch (error) {
      toast.error('Failed to capture photo');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await api.photos.upload({
          dataUrl: reader.result as string,
          fieldId,
        });
        onChange(result.url);
        toast.success('Photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  return (
    <div className="photo-field">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <button type="button" onClick={handleCameraCapture} className="photo-button">
        {mode === 'desktop' ? 'Upload Photo' : 'Take Photo'}
      </button>

      {value && (
        <div className="photo-preview">
          <img src={value} alt="Field photo" />
          <button type="button" onClick={() => onChange('')} className="delete-photo">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Test Desktop Features (45 min)

Create test file `apps/web/app/forms/[templateId]/fill/desktop.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormFillPage from './page';

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop mode
}));

describe('FormFillPage (Desktop)', () => {
  it('should show desktop toolbar', () => {
    render(<FormFillPage />);
    expect(screen.getByText(/Ctrl\+S to save draft/)).toBeInTheDocument();
    expect(screen.getByText('Print Preview')).toBeInTheDocument();
  });

  it('should save draft on Ctrl+S', async () => {
    render(<FormFillPage />);
    const user = userEvent.setup();

    await user.keyboard('{Control>}s{/Control}');

    expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
  });

  it('should submit on Ctrl+Enter', async () => {
    render(<FormFillPage />);
    const user = userEvent.setup();

    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.getByText(/Form submitted/)).toBeInTheDocument();
  });

  it('should trigger print on Ctrl+P', async () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation();
    render(<FormFillPage />);
    const user = userEvent.setup();

    await user.keyboard('{Control>}p{/Control}');

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('should show file upload button instead of camera', () => {
    render(<FormFillPage />);
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    expect(screen.queryByText('Take Photo')).not.toBeInTheDocument();
  });
});
```

Run tests:

```bash
cd apps/web
pnpm test forms/\[templateId\]/fill
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should show desktop toolbar"
2. Write test: "should save draft on Ctrl+S"
3. Write test: "should submit on Ctrl+Enter"
4. Write test: "should trigger print on Ctrl+P"
5. Write test: "should show file upload button"
6. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Add desktop toolbar to page.tsx
2. Implement keyboard shortcuts with useEffect
3. Add print preview handler
4. Update PhotoField to show file upload on desktop
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract keyboard shortcuts to custom hook
2. Add TypeScript types for all handlers
3. Improve error messages

## Troubleshooting

**Issue: Keyboard shortcuts not working**

```tsx
// Ensure preventDefault is called
if ((e.ctrlKey || e.metaKey) && e.key === 's') {
  e.preventDefault(); // CRITICAL: Prevents browser "Save Page"
  handleSaveDraft(formData);
}
```

**Issue: File upload not triggering**

```tsx
// Hidden input pattern
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleFileUpload}
  style={{ display: 'none' }} // Hide but keep in DOM
/>

<button onClick={() => fileInputRef.current?.click()}>
  Upload Photo
</button>
```

**Issue: Print preview showing unnecessary elements**

```css
/* Hide non-printable elements */
@media print {
  .desktop-toolbar,
  .print-button,
  button {
    display: none !important;
  }
}
```

## Completion Checklist

- [ ] Modify apps/web/app/forms/[templateId]/fill/page.tsx (add desktop layout)
- [ ] Add desktop-toolbar with keyboard shortcut hints
- [ ] Implement Ctrl+S keyboard shortcut (save draft)
- [ ] Implement Ctrl+Enter keyboard shortcut (submit)
- [ ] Implement Ctrl+P keyboard shortcut (print preview)
- [ ] Add desktop CSS styles (two-column layout, print styles)
- [ ] Update PhotoField component (file upload for desktop)
- [ ] Add file validation (type, size)
- [ ] Create useMediaQuery hook (detect mobile/desktop)
- [ ] Test keyboard shortcuts work
- [ ] Test file upload works
- [ ] Test print preview hides unnecessary elements
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: desktop form filling with keyboard shortcuts and print preview"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-100/

## Evidence Requirements

**Screenshots:**

- Desktop form page with toolbar (1920x1080 viewport)
- Print preview (Ctrl+P modal)
- File upload dialog
- Two-column layout on wide screens

**Test Results:**

- Desktop keyboard shortcut tests passing
- Screenshot of test coverage report

**Code Review:**

- Keyboard shortcuts preventDefault correctly
- Print styles hide UI elements
- File upload validates type and size

## Files Created/Modified

**Created:**

- apps/web/hooks/useMediaQuery.ts
- apps/web/app/forms/[templateId]/fill/desktop.test.tsx

**Modified:**

- apps/web/app/forms/[templateId]/fill/page.tsx (add desktop layout)
- apps/web/styles/globals.css (add desktop styles)
- apps/web/components/Forms/FormRenderer.tsx (add file upload)

## Time Estimate: 3 hours

**Breakdown:**

- Step 1: Desktop layout (60 min)
- Step 2: Desktop styles (45 min)
- Step 3: File upload (60 min)
- Step 4: Testing (45 min)

## Next Issue

**ISSUE-101:** Photo Attachment to Form Fields (2h)
