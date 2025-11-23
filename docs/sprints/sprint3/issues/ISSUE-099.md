# ISSUE-099: Mobile Form Filling Page

**Sprint:** Sprint 3 | **Phase:** 5 - Form Submission Workflow | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** Phase 1 complete (FormRenderer ready)
**Status:** COMPLETE
**Completed:** 2025-11-17
**Evidence:** docs/sprints/sprint3/evidence/ISSUE-099/COMPLETION_REPORT.md

## What You'll Do

Create mobile-optimized form filling page with Capacitor camera integration, large touch targets for glove use, and auto-save functionality.

## Step-by-Step Instructions

### Step 1: Create Form Fill Page Route (90 min)

Create `apps/web/app/forms/[templateId]/fill/page.tsx`:

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FormRenderer } from '@/components/Forms/FormRenderer';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export default function FormFillPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const { data: template, isLoading } = useQuery({
    queryKey: ['formTemplate', templateId],
    queryFn: () => api.forms.getTemplate(templateId),
  });

  const [formData, setFormData] = useState({});
  const [isDraft, setIsDraft] = useState(false);

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
      toast.success('Draft saved');
      setIsDraft(true);
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading form...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{template.name}</h1>
        <FormRenderer
          schema={template.schema}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          mode="mobile"
        />
      </div>
    </div>
  );
}
```

Create `apps/web/app/forms/[templateId]/fill/layout.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fill Form | BrAve Forms',
  description: 'Fill out construction form',
};

export default function FormFillLayout({ children }: { children: React.ReactNode }) {
  return <div className="mobile-optimized">{children}</div>;
}
```

**Mobile Optimization CSS** (add to globals.css):

```css
.mobile-optimized {
  /* Large touch targets for glove use */
  --touch-target-size: 48px;
}

.mobile-optimized button,
.mobile-optimized input,
.mobile-optimized select,
.mobile-optimized textarea {
  min-height: var(--touch-target-size);
  min-width: var(--touch-target-size);
  font-size: 16px; /* Prevent iOS zoom */
}

.mobile-optimized input[type='text'],
.mobile-optimized input[type='number'],
.mobile-optimized textarea {
  padding: 12px 16px;
  border: 2px solid #cbd5e0;
  border-radius: 8px;
}

.mobile-optimized input:focus,
.mobile-optimized textarea:focus {
  border-color: #3b82f6;
  outline: none;
}

/* High contrast for sunlight visibility */
.mobile-optimized {
  --text-color: #1a202c;
  --background-color: #ffffff;
  --border-color: #2d3748;
}

@media (max-width: 768px) {
  .mobile-optimized {
    padding: 0;
  }

  .mobile-optimized .form-section {
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
  }
}
```

### Step 2: Integrate Capacitor Camera (60 min)

Update `FormRenderer.tsx` to detect mobile and use camera:

```tsx
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: any) => void;
  onSaveDraft?: (data: any) => void;
  mode: 'mobile' | 'desktop';
}

export function FormRenderer({ schema, onSubmit, onSaveDraft, mode }: FormRendererProps) {
  const isMobile = Capacitor.isNativePlatform() || mode === 'mobile';

  const handlePhotoCapture = async (fieldId: string) => {
    if (!isMobile) {
      // Desktop: Use file upload
      return;
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      // Upload photo
      const result = await api.photos.upload({
        dataUrl: photo.dataUrl,
        fieldId,
      });

      // Update form data
      setValue(fieldId, result.url);
    } catch (error) {
      toast.error('Failed to capture photo');
    }
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* Render fields */}</form>;
}
```

### Step 3: Add Mobile-Specific Features (60 min)

**Large Touch Targets:**

```tsx
// Button component for mobile
function MobileButton({ children, onClick, variant = 'primary' }: MobileButtonProps) {
  const baseStyles = 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg font-semibold rounded-lg';
  const variantStyles = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 active:bg-gray-300',
    danger: 'bg-red-600 text-white active:bg-red-700',
  };

  return (
    <button type="button" onClick={onClick} className={`${baseStyles} ${variantStyles[variant]}`}>
      {children}
    </button>
  );
}
```

**No Hover States (Touch Only):**

```css
/* Remove hover states on mobile */
@media (hover: none) {
  .mobile-optimized button:hover {
    background-color: inherit;
  }

  .mobile-optimized button:active {
    transform: scale(0.98);
  }
}
```

### Step 4: Test Mobile Layout (30 min)

Create test file `apps/web/app/forms/[templateId]/fill/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import FormFillPage from './page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ templateId: 'test-template-id' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      id: 'test-template-id',
      name: 'Daily Log',
      schema: { sections: [] },
    },
    isLoading: false,
  }),
}));

describe('FormFillPage', () => {
  it('should render form title', () => {
    render(<FormFillPage />);
    expect(screen.getByText('Daily Log')).toBeInTheDocument();
  });

  it('should render FormRenderer', () => {
    render(<FormFillPage />);
    expect(screen.getByRole('form')).toBeInTheDocument();
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

1. Write test: "should render form title"
2. Write test: "should render FormRenderer with correct props"
3. Write test: "should handle form submission"
4. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create page.tsx with basic structure
2. Add useQuery for template data
3. Add FormRenderer component
4. Implement handleSubmit function
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract mobile styles to separate CSS file
2. Add TypeScript types for props
3. Improve error handling

## Troubleshooting

**Issue: Form not loading**

```bash
# Check if template exists
curl http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ formTemplates { id name } }"}'
```

**Issue: Camera not working**

```bash
# Verify Capacitor camera plugin installed
cd apps/web
pnpm list @capacitor/camera

# Check permissions in Info.plist (iOS)
# <key>NSCameraUsageDescription</key>
# <string>BrAve Forms needs camera access to capture photos</string>
```

**Issue: Touch targets too small**

```css
/* Use browser DevTools to inspect element sizes */
/* Minimum 48x48px for accessibility */
button {
  min-height: 48px;
  min-width: 48px;
}
```

## Completion Checklist

- [ ] Create apps/web/app/forms/[templateId]/fill/page.tsx
- [ ] Create apps/web/app/forms/[templateId]/fill/layout.tsx
- [ ] Add mobile-optimized CSS (48px touch targets)
- [ ] Integrate Capacitor Camera plugin
- [ ] Add high contrast styles for sunlight visibility
- [ ] Remove hover states (touch-only interactions)
- [ ] Test form renders correctly on mobile viewport
- [ ] Test camera integration (mock camera in tests)
- [ ] Verify touch targets 48x48px minimum
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: mobile form filling page with camera integration"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-085/

## Evidence Requirements

**Screenshots:**

- Mobile form page rendering (actual device or Chrome DevTools mobile view)
- Camera capture button (48x48px verified)
- Form submission success toast

**Test Results:**

- FormFillPage tests passing
- Screenshot of test coverage report

**Code Review:**

- Touch target sizes verified (48x48px minimum)
- High contrast colors for sunlight visibility
- No hover states on mobile

## Files Created/Modified

**Created:**

- apps/web/app/forms/[templateId]/fill/page.tsx
- apps/web/app/forms/[templateId]/fill/layout.tsx
- apps/web/app/forms/[templateId]/fill/page.test.tsx

**Modified:**

- apps/web/styles/globals.css (add mobile-optimized styles)
- apps/web/components/Forms/FormRenderer.tsx (add camera integration)

## Time Estimate: 4 hours

**Breakdown:**

- Step 1: Create page route (90 min)
- Step 2: Integrate camera (60 min)
- Step 3: Mobile features (60 min)
- Step 4: Testing (30 min)

## Next Issue

**ISSUE-086:** Web Form Filling Page (3h)
