# ISSUE-166: Implement GPS Field Functionality (6h)

**Sprint:** Sprint 5 | **Phase:** 0 - Production-Ready Fixes | **Priority:** P0
**Time:** 6 hours | **Complexity:** Medium
**Created:** 2025-11-27
**Dependencies:** Form schema supports GPS field type, Capacitor Geolocation plugin available
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Implement functional GPS coordinate capture for form fields. Currently GPS fields render but don't actually capture real coordinates - they need to use the Geolocation API (web) or Capacitor Geolocation plugin (mobile).

## Prerequisites

- [ ] Form schema supports GPS field type
- [ ] Web app accessible at http://localhost:30102
- [ ] Capacitor Geolocation plugin installed for mobile
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Review Current GPS Field Implementation (30 min)

Check current GPS field component:

```bash
cd apps/web
ls -la components/Forms/fields/
grep -r "gps\|GPS\|coordinates\|location" components/Forms/fields/ --include="*.tsx"
```

Expected file: `GPSField.tsx` or similar

### Step 2: Create GPS API Helper (45 min)

Create `apps/web/lib/geolocation.ts`:

```typescript
/**
 * Geolocation utilities for GPS field functionality
 *
 * Uses Web Geolocation API on web, Capacitor plugin on mobile
 * Falls back gracefully when GPS unavailable
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number;
  timestamp: string;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

/**
 * Check if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  if (Capacitor.isNativePlatform()) {
    return true; // Capacitor always has geolocation
  }
  return 'geolocation' in navigator;
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch {
      return false;
    }
  }

  // Web: Permission requested on first getCurrentPosition call
  return true;
}

/**
 * Get current GPS coordinates
 *
 * @param highAccuracy - Use high accuracy mode (slower, more battery)
 * @param timeout - Maximum time to wait for position (ms)
 * @returns GPS coordinates or error
 */
export async function getCurrentPosition(
  highAccuracy: boolean = true,
  timeout: number = 30000
): Promise<GPSCoordinates | GeolocationError> {
  if (!isGeolocationAvailable()) {
    return {
      code: 'POSITION_UNAVAILABLE',
      message: 'Geolocation is not available on this device',
    };
  }

  try {
    let position: Position;

    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Geolocation
      position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: highAccuracy,
        timeout: timeout,
      });
    } else {
      // Use Web Geolocation API
      position = await new Promise<Position>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: pos.coords.altitude,
                altitudeAccuracy: pos.coords.altitudeAccuracy,
                heading: pos.coords.heading,
                speed: pos.coords.speed,
              },
              timestamp: pos.timestamp,
            });
          },
          (error) => reject(error),
          {
            enableHighAccuracy: highAccuracy,
            timeout: timeout,
            maximumAge: 0,
          }
        );
      });
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      timestamp: new Date(position.timestamp).toISOString(),
    };
  } catch (error: any) {
    // Map error codes
    if (error.code === 1 || error.message?.includes('permission')) {
      return {
        code: 'PERMISSION_DENIED',
        message: 'Location permission denied. Please enable location access in settings.',
      };
    }
    if (error.code === 2) {
      return {
        code: 'POSITION_UNAVAILABLE',
        message: 'Unable to determine location. Please check GPS signal.',
      };
    }
    if (error.code === 3 || error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Location request timed out. Please try again.',
      };
    }

    return {
      code: 'UNKNOWN',
      message: error.message || 'An unknown error occurred',
    };
  }
}

/**
 * Check if result is an error
 */
export function isGeolocationError(
  result: GPSCoordinates | GeolocationError
): result is GeolocationError {
  return 'code' in result && 'message' in result && !('latitude' in result);
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: GPSCoordinates): string {
  const lat = coords.latitude.toFixed(6);
  const lng = coords.longitude.toFixed(6);
  return `${lat}, ${lng}`;
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(meters: number): string {
  if (meters < 10) return 'Excellent';
  if (meters < 30) return 'Good';
  if (meters < 100) return 'Fair';
  return 'Poor';
}
```

### Step 3: Create GPS Field Component (90 min)

Create or update `apps/web/components/Forms/fields/GPSField.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import {
  Stack,
  Group,
  Button,
  Text,
  Paper,
  Badge,
  Loader,
  Alert,
} from '@mantine/core';
import { IconMapPin, IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  getCurrentPosition,
  isGeolocationError,
  formatCoordinates,
  formatAccuracy,
  GPSCoordinates,
  isGeolocationAvailable,
} from '@/lib/geolocation';

interface GPSFieldProps {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
}

export function GPSField({ name, label, required, description }: GPSFieldProps) {
  const { control, setValue } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getCurrentPosition(true, 30000);

    if (isGeolocationError(result)) {
      setError(result.message);
      setLoading(false);
      return;
    }

    // Store full GPS data
    setValue(name, result, { shouldValidate: true });
    setLoading(false);
  }, [name, setValue]);

  if (!isGeolocationAvailable()) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
        GPS is not available on this device
      </Alert>
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {label}
            </Text>
            {required && <Text c="red" size="sm">*</Text>}
          </Group>

          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}

          {field.value ? (
            <Paper p="sm" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text size="sm" fw={500}>
                      {formatCoordinates(field.value as GPSCoordinates)}
                    </Text>
                  </Group>
                  <Badge
                    size="sm"
                    color={
                      (field.value as GPSCoordinates).accuracy < 30
                        ? 'green'
                        : 'orange'
                    }
                  >
                    {formatAccuracy((field.value as GPSCoordinates).accuracy)}
                  </Badge>
                </Group>

                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Accuracy: {Math.round((field.value as GPSCoordinates).accuracy)}m
                  </Text>
                  <Text size="xs" c="dimmed">
                    Captured: {new Date((field.value as GPSCoordinates).timestamp).toLocaleTimeString()}
                  </Text>
                </Group>

                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconRefresh size={14} />}
                  onClick={captureLocation}
                  loading={loading}
                >
                  Update Location
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Button
              leftSection={loading ? <Loader size={14} /> : <IconMapPin size={16} />}
              onClick={captureLocation}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Getting Location...' : 'Capture GPS Location'}
            </Button>
          )}

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              title="Location Error"
            >
              {error}
            </Alert>
          )}

          {fieldState.error && (
            <Text size="xs" c="red">
              {fieldState.error.message}
            </Text>
          )}
        </Stack>
      )}
    />
  );
}
```

### Step 4: Update Form Renderer to Use GPS Field (30 min)

Update `apps/web/components/Forms/FormRenderer/FormRenderer.tsx` to include GPS field:

```typescript
// In the field type switch statement:
case 'gps':
case 'GPS':
case 'location':
  return (
    <GPSField
      key={field.id}
      name={field.name}
      label={field.label}
      required={field.required}
      description={field.description}
    />
  );
```

### Step 5: Write Tests (60 min)

Create `apps/web/lib/__tests__/geolocation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isGeolocationAvailable,
  getCurrentPosition,
  isGeolocationError,
  formatCoordinates,
  formatAccuracy,
} from '../geolocation';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

describe('geolocation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGeolocationAvailable', () => {
    it('returns true when geolocation exists', () => {
      expect(isGeolocationAvailable()).toBe(true);
    });
  });

  describe('getCurrentPosition', () => {
    it('returns coordinates on success', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          altitude: 50,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(false);
      if (!isGeolocationError(result)) {
        expect(result.latitude).toBe(37.7749);
        expect(result.longitude).toBe(-122.4194);
        expect(result.accuracy).toBe(10);
      }
    });

    it('returns error on permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      const result = await getCurrentPosition();

      expect(isGeolocationError(result)).toBe(true);
      if (isGeolocationError(result)) {
        expect(result.code).toBe('PERMISSION_DENIED');
      }
    });
  });

  describe('formatCoordinates', () => {
    it('formats coordinates correctly', () => {
      const coords = {
        latitude: 37.774929,
        longitude: -122.419416,
        accuracy: 10,
        timestamp: '2025-11-27T10:00:00Z',
      };

      expect(formatCoordinates(coords)).toBe('37.774929, -122.419416');
    });
  });

  describe('formatAccuracy', () => {
    it('returns Excellent for <10m', () => {
      expect(formatAccuracy(5)).toBe('Excellent');
    });

    it('returns Good for <30m', () => {
      expect(formatAccuracy(20)).toBe('Good');
    });

    it('returns Fair for <100m', () => {
      expect(formatAccuracy(50)).toBe('Fair');
    });

    it('returns Poor for >=100m', () => {
      expect(formatAccuracy(150)).toBe('Poor');
    });
  });
});
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

```bash
cd apps/web
pnpm test geolocation
```

**Screenshot:** Save to `evidence/ISSUE-166/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

```bash
pnpm test geolocation
```

**Screenshot:** Save to `evidence/ISSUE-166/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/lib/geolocation.ts
- apps/web/components/Forms/fields/GPSField.tsx
- apps/web/lib/**tests**/geolocation.test.ts
- apps/web/components/Forms/fields/**tests**/GPSField.test.tsx

**Modify:**

- apps/web/components/Forms/FormRenderer/FormRenderer.tsx

## Verification Checklist

- [ ] GPS capture works on web browsers
- [ ] GPS capture works on mobile (Capacitor)
- [ ] Permission denied shows helpful message
- [ ] Timeout handled gracefully
- [ ] Accuracy indicator displays
- [ ] Coordinates stored in form data
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-166/

**Required:**

- test-results/red-phase.png, green-phase.png, coverage-report.png
- screenshots/gps-captured.png, gps-permission-denied.png, gps-accuracy-badge.png

## Time Estimate

**6 hours total:**

- Review current implementation: 30 min
- Geolocation helper: 45 min
- GPS field component: 90 min
- Form renderer update: 30 min
- Testing: 60 min
- Mobile testing: 60 min
- Documentation: 45 min

## Next Issue

**ISSUE-167:** Implement Photo Upload to Storage
