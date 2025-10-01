# ISSUE-023: Create NOAA Client TypeScript Types

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P1
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 15:30:00 EDT
**Dependencies:** ISSUE-022 ✅

---

## What You'll Do

Define TypeScript interfaces for NOAA API responses based on documentation research.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-022 complete (NOAA API documentation reviewed)

### Steps

1. Create `apps/backend/src/modules/weather/types/` directory:
```bash
mkdir -p apps/backend/src/modules/weather/types
```

2. Create `noaa.types.ts` file

3. Define interfaces:
```typescript
export interface NOAAPointResponse {
  properties: {
    observationStations: string; // URL to stations
  };
}

export interface NOAAStation {
  id: string;
  properties: {
    stationIdentifier: string;
    name: string;
  };
}

export interface NOAAObservation {
  properties: {
    timestamp: string;
    precipitationLastHour: {
      value: number; // millimeters
      unitCode: string;
    };
  };
}

export interface PrecipitationData {
  timestamp: Date;
  amountInches: number;
  stationId: string;
}
```

4. Export all types

5. Save file

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/types/noaa.types.ts`

---

## Verification Checklist

- [ ] Types directory created
- [ ] File created with all interfaces
- [ ] `NOAAPointResponse` defined
- [ ] `NOAAStation` defined
- [ ] `NOAAObservation` defined
- [ ] `PrecipitationData` defined (our internal format)
- [ ] All interfaces exported
- [ ] File compiles without errors

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Verify no errors
3. Check file exists:
```bash
ls apps/backend/src/modules/weather/types/noaa.types.ts
```

---

## Evidence Requirements

**Location:** `evidence/ISSUE-023/code/`

**Required Screenshots:**
1. `noaa-types.png` - Full file content with syntax highlighting

---

## Troubleshooting

**Problem:** TypeScript compilation errors
- Check interface syntax (properties object, types)
- Verify export statements
- Check for typos in interface names

**Problem:** Directory doesn't exist
- Create parent directories: `mkdir -p apps/backend/src/modules/weather/types`

---

## Success Criteria

- Types file created with all 4 interfaces
- Interfaces match NOAA API structure from documentation
- `PrecipitationData` uses our internal format (Date, inches)
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-024:** Implement NOAA Client getStationForCoordinates (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 15 minutes
