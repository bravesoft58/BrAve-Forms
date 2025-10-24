# ISSUE-126: Photo Annotations (4h)

**Sprint:** Sprint 5 | **Phase:** 1 - Photo Gallery | **Priority:** P1
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-125 (GPS Map Integration)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Integrate Annotorious library for drawing annotations on photos (arrows, text, shapes) with metadata tracking and annotation history.

## Prerequisites

- [ ] ISSUE-125 complete (Map view functional)
- [ ] Photos accessible via lightbox
- [ ] Code editor open to apps/web directory

## Libraries/Dependencies

**Annotorious (@annotorious/react):**

- **Version:** ^3.0.0
- **License:** BSD 3-Clause (fully open source)
- **Why:** Actively maintained (Sept 2025 updates), full TypeScript support, modern annotation features
- **Alternatives Rejected:** react-image-annotate (unmaintained for 5 years, no security patches)
- **Install:**
  ```bash
  pnpm add @annotorious/react @annotorious/annotorious
  ```

## Step-by-Step Instructions

### Step 1: Install Annotorious (10 min)

```bash
cd apps/web
pnpm add @annotorious/react @annotorious/annotorious
```

Verify installation:

```bash
grep "@annotorious" package.json
```

### Step 2: Create PhotoAnnotation Component (120 min)

Create `apps/web/components/photos/photo-annotation.tsx`:

```typescript
'use client';

import { Annotorious } from '@annotorious/react';
import { useAnnotator } from '@annotorious/react';
import { Photo, Annotation } from '@braveforms/types';
import { Stack, Group, Button, Select } from '@mantine/core';
import { useState, useEffect } from 'react';

interface PhotoAnnotationProps {
  photo: Photo;
  onSave: (annotations: Annotation[]) => void;
}

export function PhotoAnnotation({ photo, onSave }: PhotoAnnotationProps) {
  const { anno } = useAnnotator();
  const [tool, setTool] = useState<string>('rect');

  useEffect(() => {
    if (!anno) return;

    // Load existing annotations
    if (photo.annotations) {
      anno.setAnnotations(photo.annotations);
    }

    // Listen for annotation changes
    anno.on('createAnnotation', handleAnnotationCreate);
    anno.on('updateAnnotation', handleAnnotationUpdate);
    anno.on('deleteAnnotation', handleAnnotationDelete);

    return () => {
      anno.off('createAnnotation', handleAnnotationCreate);
      anno.off('updateAnnotation', handleAnnotationUpdate);
      anno.off('deleteAnnotation', handleAnnotationDelete);
    };
  }, [anno]);

  const handleAnnotationCreate = (annotation: any) => {
    const enrichedAnnotation = {
      ...annotation,
      body: [{
        type: 'TextualBody',
        purpose: 'tagging',
        value: 'annotation',
        creator: {
          name: currentUser.name,
          id: currentUser.id,
        },
        created: new Date().toISOString(),
      }],
    };

    const allAnnotations = anno?.getAnnotations() || [];
    onSave(allAnnotations);
  };

  const handleAnnotationUpdate = (annotation: any) => {
    const allAnnotations = anno?.getAnnotations() || [];
    onSave(allAnnotations);
  };

  const handleAnnotationDelete = (annotation: any) => {
    const allAnnotations = anno?.getAnnotations() || [];
    onSave(allAnnotations);
  };

  const handleSaveAnnotations = async () => {
    const annotations = anno?.getAnnotations() || [];
    onSave(annotations);

    // Save to backend
    await fetch(`/api/photos/${photo.id}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotations }),
    });
  };

  return (
    <Stack gap="md">
      <Group>
        <Select
          label="Drawing Tool"
          value={tool}
          onChange={(value) => setTool(value || 'rect')}
          data={[
            { value: 'rect', label: 'Rectangle' },
            { value: 'polygon', label: 'Polygon' },
            { value: 'circle', label: 'Circle' },
            { value: 'freehand', label: 'Freehand' },
          ]}
        />

        <Button onClick={handleSaveAnnotations}>
          Save Annotations
        </Button>
      </Group>

      <Annotorious>
        <img
          src={photo.url}
          alt={photo.description || 'Photo'}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </Annotorious>
    </Stack>
  );
}
```

### Step 3: Test Annotation Functionality (35 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access photo gallery
# Navigate to http://localhost:30102/photos
```

**Verify:**

- [ ] Annotation toolbar appears
- [ ] Drawing shapes works (rect, polygon, circle, freehand)
- [ ] Annotations save with metadata (who, when, what)
- [ ] Delete annotations works
- [ ] TypeScript types work correctly

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/components/photos/__tests__/photo-annotation.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoAnnotation } from '../photo-annotation';

describe('PhotoAnnotation', () => {
  const mockPhoto = {
    id: 'photo-1',
    url: 'https://example.com/photo1.jpg',
    annotations: [],
  };

  it('should render annotation toolbar', () => {
    render(<PhotoAnnotation photo={mockPhoto} onSave={jest.fn()} />);
    expect(screen.getByText('Drawing Tool')).toBeInTheDocument();
  });

  it('should save annotations on button click', () => {
    const onSave = jest.fn();
    render(<PhotoAnnotation photo={mockPhoto} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save Annotations'));
    expect(onSave).toHaveBeenCalled();
  });
});
```

Run tests (should FAIL):

```bash
cd apps/web
pnpm test photo-annotation
```

**Screenshot:** Save to `evidence/ISSUE-126/test-results/red-phase.png`

### Phase 2: Implement and Pass Tests

**Screenshot:** Save to `evidence/ISSUE-126/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/components/photos/photo-annotation.tsx
- apps/web/components/photos/**tests**/photo-annotation.test.tsx

**Modify:**

- apps/web/package.json (add @annotorious dependencies)

## Verification Checklist

- [ ] Annotorious installed
- [ ] Annotation toolbar displays
- [ ] Drawing tools work
- [ ] Annotations save with metadata
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-126/

**Required:**

- test-results/red-phase.png
- test-results/green-phase.png
- screenshots/annotation-toolbar.png

## Success Criteria

- [ ] Photo annotations functional with modern library
- [ ] TypeScript support complete
- [ ] Performance <1s annotation save
- [ ] Tests pass with >80% coverage

## Time Estimate

**4 hours total**

## Next Issue

**ISSUE-127:** Photo Search & Filter (3h)
