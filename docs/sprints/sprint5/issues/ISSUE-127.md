# ISSUE-127: Photo Search & Filter (3h)

**Sprint:** Sprint 5 | **Phase:** 1 - Photo Gallery | **Priority:** P0
**Time:** 3 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-126 (Photo Annotations)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Implement comprehensive photo search and filtering by description, user, form type, date range, GPS location, and weather conditions.

## Prerequisites

- [ ] ISSUE-126 complete (Annotations functional)
- [ ] Photo gallery grid operational
- [ ] Backend supports photo queries
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Create Advanced PhotoFilters Component (90 min)

Update `apps/web/components/photos/photo-filters.tsx`:

```typescript
'use client';

import { Stack, Group, TextInput, Select, Button, MultiSelect } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconX, IconMapPin } from '@tabler/icons-react';

interface PhotoFiltersProps {
  filters: {
    search?: string;
    projectId?: string;
    formType?: string;
    userId?: string;
    dateRange?: [Date, Date];
    gpsRadius?: { lat: number; lng: number; radiusKm: number };
    weather?: string[];
  };
  onChange: (filters: any) => void;
}

export function PhotoFilters({ filters, onChange }: PhotoFiltersProps) {
  const clearFilters = () => {
    onChange({});
  };

  return (
    <Stack gap="md">
      <Group grow>
        <TextInput
          placeholder="Search descriptions/tags..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          leftSection={<IconSearch size={16} />}
        />

        <Select
          placeholder="All Users"
          value={filters.userId}
          onChange={(value) => onChange({ ...filters, userId: value })}
          data={[
            { value: 'user-1', label: 'John Doe' },
            { value: 'user-2', label: 'Jane Smith' },
          ]}
          clearable
        />
      </Group>

      <Group grow>
        <Select
          placeholder="All Form Types"
          value={filters.formType}
          onChange={(value) => onChange({ ...filters, formType: value })}
          data={[
            { value: 'daily-log', label: 'Daily Log' },
            { value: 'safety-inspection', label: 'Safety Inspection' },
            { value: 'swppp-inspection', label: 'SWPPP Inspection' },
          ]}
          clearable
        />

        <DatePickerInput
          type="range"
          placeholder="Date Range"
          value={filters.dateRange}
          onChange={(value) => onChange({ ...filters, dateRange: value })}
          clearable
        />
      </Group>

      <Group grow>
        <MultiSelect
          placeholder="Weather Conditions"
          value={filters.weather || []}
          onChange={(value) => onChange({ ...filters, weather: value })}
          data={[
            { value: 'rain', label: 'Rain' },
            { value: 'sun', label: 'Sunny' },
            { value: 'cloudy', label: 'Cloudy' },
            { value: 'storm', label: 'Storm' },
          ]}
          clearable
        />

        <Button
          variant="subtle"
          leftSection={<IconX size={16} />}
          onClick={clearFilters}
        >
          Clear All Filters
        </Button>
      </Group>
    </Stack>
  );
}
```

### Step 2: Implement Backend Query Support (60 min)

Update `apps/web/app/api/photos/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    skip: parseInt(searchParams.get('skip') || '0'),
    take: parseInt(searchParams.get('take') || '20'),
    search: searchParams.get('search'),
    projectId: searchParams.get('projectId'),
    formType: searchParams.get('formType'),
    userId: searchParams.get('userId'),
    dateFrom: searchParams.get('dateFrom'),
    dateTo: searchParams.get('dateTo'),
    weather: searchParams.get('weather')?.split(','),
  };

  // TODO: Implement GraphQL query with filters
  const photos = [];

  return NextResponse.json({
    photos,
    hasMore: photos.length === filters.take,
    totalCount: 0,
  });
}
```

### Step 3: Add GPS Location Filter (30 min)

Create `apps/web/components/photos/gps-radius-filter.tsx`:

```typescript
'use client';

import { Group, NumberInput, Button } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { useState } from 'react';

interface GPSRadiusFilterProps {
  onApply: (filter: { lat: number; lng: number; radiusKm: number }) => void;
}

export function GPSRadiusFilter({ onApply }: GPSRadiusFilterProps) {
  const [lat, setLat] = useState(39.5296);
  const [lng, setLng] = useState(-119.8138);
  const [radius, setRadius] = useState(1);

  return (
    <Group>
      <NumberInput
        label="Latitude"
        value={lat}
        onChange={(value) => setLat(Number(value))}
        precision={6}
      />
      <NumberInput
        label="Longitude"
        value={lng}
        onChange={(value) => setLng(Number(value))}
        precision={6}
      />
      <NumberInput
        label="Radius (km)"
        value={radius}
        onChange={(value) => setRadius(Number(value))}
        min={0.1}
        max={10}
        step={0.1}
      />
      <Button
        leftSection={<IconMapPin size={16} />}
        onClick={() => onApply({ lat, lng, radiusKm: radius })}
      >
        Apply
      </Button>
    </Group>
  );
}
```

### Step 4: Test Search and Filters (30 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access photo gallery
# Navigate to http://localhost:30102/photos
```

**Verify:**

- [ ] Search by description works
- [ ] Filter by user works
- [ ] Filter by form type works
- [ ] Date range filter works
- [ ] GPS radius filter works
- [ ] Weather condition filter works
- [ ] Clear filters resets all

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First

Create `apps/web/components/photos/__tests__/photo-filters.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoFilters } from '../photo-filters';

describe('PhotoFilters', () => {
  it('should update search filter on input change', () => {
    const onChange = jest.fn();
    render(<PhotoFilters filters={{}} onChange={onChange} />);

    const searchInput = screen.getByPlaceholderText('Search descriptions/tags...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalledWith({ search: 'test' });
  });

  it('should clear all filters on button click', () => {
    const onChange = jest.fn();
    render(
      <PhotoFilters
        filters={{ search: 'test', formType: 'daily-log' }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Clear All Filters'));
    expect(onChange).toHaveBeenCalledWith({});
  });
});
```

**Screenshot:** `evidence/ISSUE-127/test-results/red-phase.png`
**Screenshot:** `evidence/ISSUE-127/test-results/green-phase.png`

## Files to Create/Modify

**Modify:**

- apps/web/components/photos/photo-filters.tsx
- apps/web/app/api/photos/route.ts

**Create:**

- apps/web/components/photos/gps-radius-filter.tsx
- apps/web/components/photos/**tests**/photo-filters.test.tsx

## Verification Checklist

- [ ] All filter types implemented
- [ ] Backend query supports filters
- [ ] Clear filters button works
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-127/

**Required:**

- test-results/red-phase.png
- test-results/green-phase.png
- screenshots/filters-applied.png
- screenshots/search-results.png

## Success Criteria

- [ ] Photo search by description functional
- [ ] All 6 filter types work correctly
- [ ] Clear filters resets view
- [ ] Tests pass with >80% coverage

## Time Estimate

**3 hours total:**

- Advanced filters component: 90 min
- Backend query support: 60 min
- GPS radius filter: 30 min
- Testing: 30 min

## Next Issue

**ISSUE-128:** Before/After Photo Pairing (2h)
