# ISSUE-133: Before/After Photo Pairing (2h)

**Sprint:** Sprint 5 | **Phase:** 1 - Photo Gallery | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Completed:** 2025-11-28
**Dependencies:** ISSUE-132 (Photo Search & Filter)
**Status:** COMPLETE

## Completion Summary

### Implementation Details

- Created BeforeAfterComparison component with three view modes
- Implemented side-by-side view with Before/After badges
- Implemented fade slider for opacity blending between photos
- Implemented slider view for horizontal wipe comparison
- Added pairing mode to PhotoGalleryGrid with photo selection UI
- Added "Paired Only" filter checkbox to PhotoFilters
- Added multi-tenant validation (cross-org pairing rejected)
- Added offline queue for pairing operations (30-day capability)
- Added error handling with retry support

### Files Created/Modified

- apps/web/components/photos/before-after-comparison.tsx (new - 393 lines)
- apps/web/components/photos/__tests__/before-after-comparison.test.tsx (26 tests)
- apps/web/components/photos/photo-gallery-grid.tsx (pairing mode added)
- apps/web/components/photos/__tests__/photo-gallery-grid.test.tsx (4 new tests)
- apps/web/components/photos/photo-filters.tsx (onlyPaired filter)
- apps/web/components/photos/index.ts (BeforeAfterComparison export)

### Test Results

- 26/26 BeforeAfterComparison tests passing
- 17/17 PhotoGalleryGrid tests passing (including 4 new pairing tests)
- Tests cover: view modes, slider controls, metadata display, pairing flow, cross-tenant rejection, offline queue

### Key Features Implemented

- Three comparison view modes: Side-by-side, Fade, Slider
- Automatic before/after determination based on photo timestamps
- GPS indicator badges on comparison photos
- Photo pairing selection mode in gallery
- Cross-tenant pairing validation (security)
- Offline pairing queue with localStorage
- Error handling with user-friendly messages
- Unpair functionality with confirmation
- Paired photos filter in gallery

### Code Review Fixes Applied

- Added orgId to PhotoPair interface for multi-tenant isolation
- Added comprehensive JSDoc documentation
- Extracted NOTIFICATION_DURATION_MS constant
- Added try-catch error handling
- Added cross-tenant pairing rejection
- Added offline queue for 30-day capability

---

## What You'll Do

Create before/after photo pairing feature with side-by-side comparison and fade slider for progress tracking.

## Prerequisites

- [ ] ISSUE-158 complete (Search and filters functional)
- [ ] Photo gallery operational
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Create BeforeAfterComparison Component (60 min)

Create `apps/web/components/photos/before-after-comparison.tsx`:

```typescript
'use client';

import { Group, Stack, Image, Slider, Badge, Card } from '@mantine/core';
import { useState } from 'react';
import { Photo } from '@braveforms/types';

interface BeforeAfterComparisonProps {
  beforePhoto: Photo;
  afterPhoto: Photo;
}

export function BeforeAfterComparison({
  beforePhoto,
  afterPhoto,
}: BeforeAfterComparisonProps) {
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <Card shadow="md" padding="lg">
      <Stack gap="md">
        {/* Side-by-side view */}
        <Group grow>
          <div>
            <Badge color="blue" mb="xs">Before</Badge>
            <Image
              src={beforePhoto.url}
              alt="Before"
              height={300}
            />
          </div>
          <div>
            <Badge color="green" mb="xs">After</Badge>
            <Image
              src={afterPhoto.url}
              alt="After"
              height={300}
            />
          </div>
        </Group>

        {/* Fade slider */}
        <div style={{ position: 'relative', height: 300 }}>
          <Image
            src={beforePhoto.url}
            alt="Before"
            style={{
              position: 'absolute',
              opacity: sliderValue / 100,
            }}
          />
          <Image
            src={afterPhoto.url}
            alt="After"
            style={{
              position: 'absolute',
              opacity: 1 - sliderValue / 100,
            }}
          />
        </div>

        <Slider
          value={sliderValue}
          onChange={setSliderValue}
          label={null}
          marks={[
            { value: 0, label: 'After' },
            { value: 50, label: 'Blend' },
            { value: 100, label: 'Before' },
          ]}
        />
      </Stack>
    </Card>
  );
}
```

### Step 2: Add Pairing UI to Photo Gallery (40 min)

Update `apps/web/components/photos/photo-gallery-grid.tsx`:

```typescript
// Add pairing mode
const [pairingMode, setPairingMode] = useState(false);
const [selectedForPairing, setSelectedForPairing] = useState<Photo[]>([]);

const handlePhotoSelect = (photo: Photo) => {
  if (pairingMode) {
    if (selectedForPairing.length === 0) {
      setSelectedForPairing([photo]);
    } else if (selectedForPairing.length === 1) {
      // Create pairing
      createPairing(selectedForPairing[0], photo);
      setSelectedForPairing([]);
      setPairingMode(false);
    }
  }
};
```

### Step 3: Create Pairing Filter (20 min)

Add to `apps/web/components/photos/photo-filters.tsx`:

```typescript
<Checkbox
  label="Show Only Paired Photos"
  checked={filters.onlyPaired || false}
  onChange={(e) => onChange({ ...filters, onlyPaired: e.target.checked })}
/>
```

## TDD Workflow

**Phase 1: Write Tests First**

Create `apps/web/components/photos/__tests__/before-after-comparison.test.tsx`

**Phase 2: Implement and Pass Tests**

## Files to Create

**Create:**

- apps/web/components/photos/before-after-comparison.tsx
- apps/web/components/photos/**tests**/before-after-comparison.test.tsx

**Modify:**

- apps/web/components/photos/photo-gallery-grid.tsx
- apps/web/components/photos/photo-filters.tsx

## Verification Checklist

- [ ] Pairing UI functional
- [ ] Side-by-side view works
- [ ] Fade slider works
- [ ] Filter for paired photos works
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-159/

**Required:**

- test-results/red-phase.png
- test-results/green-phase.png
- screenshots/before-after-comparison.png
- screenshots/fade-slider.png

## Success Criteria

- [ ] Before/after pairing functional
- [ ] Side-by-side comparison displays
- [ ] Fade slider works smoothly
- [ ] Tests pass with >80% coverage

## Time Estimate

**2 hours total:**

- BeforeAfterComparison component: 60 min
- Pairing UI: 40 min
- Pairing filter: 20 min

## Next Issue

**ISSUE-134:** [Next issue title]
