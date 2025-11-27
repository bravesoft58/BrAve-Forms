# ISSUE-165: Connect QR Inspector Portal to Backend (8h)

**Sprint:** Sprint 5 | **Phase:** 0 - Production-Ready Fixes | **Priority:** P0
**Time:** 8 hours | **Complexity:** High
**Created:** 2025-11-27
**Dependencies:** ISSUE-162 complete (API patterns established), QR Portal UI complete (Sprint 4)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Connect the QR Inspector Portal (read-only public interface) to the real backend API. Currently the portal shows mock data - this issue replaces it with real GraphQL queries using time-limited JWT tokens embedded in QR codes.

## Prerequisites

- [ ] QR Inspector Portal UI complete (Sprint 4 ISSUE-100-105)
- [ ] Backend API running with real data
- [ ] QR code generation endpoint working
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Review Current QR Portal Implementation (30 min)

The QR portal was implemented in Sprint 4. Review current state:

```bash
cd apps/web
ls -la app/inspector/
ls -la components/Inspector/
```

Expected files:

- `app/inspector/[token]/page.tsx` - Portal entry point
- `components/Inspector/InspectorPortal.tsx` - Main portal component
- `components/Inspector/InspectionDetails.tsx` - Inspection view
- `components/Inspector/PhotoViewer.tsx` - Photo gallery

### Step 2: Create Inspector API Helpers (60 min)

Create `apps/web/lib/api/inspector.ts`:

```typescript
/**
 * Inspector Portal API helpers
 *
 * @security Uses time-limited JWT tokens embedded in QR codes
 * @public No Clerk authentication required - token-based access only
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:30101';

export interface InspectorTokenPayload {
  inspectionId: string;
  projectId: string;
  expiresAt: string;
  permissions: 'read' | 'read_write';
}

export interface InspectionData {
  id: string;
  projectName: string;
  formTitle: string;
  status: string;
  submittedAt: string;
  submittedBy: string;
  data: Record<string, unknown>;
  photos: InspectionPhoto[];
  complianceStatus: {
    isCompliant: boolean;
    violations: string[];
    lastRainEvent?: string;
  };
}

export interface InspectionPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  takenAt: string;
}

/**
 * Validate inspector token and return payload
 *
 * @param token - Time-limited JWT from QR code
 * @returns Token payload if valid, null if expired/invalid
 */
export async function validateInspectorToken(token: string): Promise<InspectorTokenPayload | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Inspector-Token': token,
      },
      body: JSON.stringify({
        query: `
          query ValidateInspectorToken {
            validateInspectorToken {
              inspectionId
              projectId
              expiresAt
              permissions
            }
          }
        `,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('[validateInspectorToken] Token validation failed:', result.errors);
      return null;
    }

    return result.data.validateInspectorToken;
  } catch (error) {
    console.error('[validateInspectorToken] Request failed:', error);
    return null;
  }
}

/**
 * Fetch inspection data for inspector portal
 *
 * @param token - Time-limited JWT from QR code
 * @param inspectionId - Inspection ID from token payload
 * @returns Inspection data or null if unauthorized
 */
export async function fetchInspectionForPortal(
  token: string,
  inspectionId: string
): Promise<InspectionData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Inspector-Token': token,
      },
      body: JSON.stringify({
        query: `
          query InspectionForPortal($id: ID!) {
            inspectionForPortal(id: $id) {
              id
              projectName
              formTitle
              status
              submittedAt
              submittedBy
              data
              photos {
                id
                url
                thumbnailUrl
                caption
                gpsCoordinates {
                  latitude
                  longitude
                }
                takenAt
              }
              complianceStatus {
                isCompliant
                violations
                lastRainEvent
              }
            }
          }
        `,
        variables: { id: inspectionId },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('[fetchInspectionForPortal] Failed:', result.errors);
      return null;
    }

    return result.data.inspectionForPortal;
  } catch (error) {
    console.error('[fetchInspectionForPortal] Request failed:', error);
    return null;
  }
}
```

### Step 3: Create Inspector Portal Hooks (60 min)

Create `apps/web/hooks/useInspectorPortal.ts`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  validateInspectorToken,
  fetchInspectionForPortal,
  InspectorTokenPayload,
  InspectionData,
} from '@/lib/api/inspector';

/**
 * Hook to validate inspector token from QR code
 */
export function useInspectorToken(token: string | null) {
  return useQuery({
    queryKey: ['inspector', 'token', token],
    queryFn: async () => {
      if (!token) return null;
      return validateInspectorToken(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry failed token validation
  });
}

/**
 * Hook to fetch inspection data for portal
 */
export function useInspectionPortal(token: string | null, inspectionId: string | null) {
  return useQuery({
    queryKey: ['inspector', 'inspection', token, inspectionId],
    queryFn: async () => {
      if (!token || !inspectionId) return null;
      return fetchInspectionForPortal(token, inspectionId);
    },
    enabled: !!token && !!inspectionId,
    staleTime: 60 * 1000, // 1 minute - inspection data should be fresh
    retry: 1, // Retry once on failure
  });
}

/**
 * Check if token is expired
 */
export function isTokenExpired(payload: InspectorTokenPayload | null): boolean {
  if (!payload) return true;
  return new Date(payload.expiresAt) < new Date();
}

export type { InspectorTokenPayload, InspectionData };
```

### Step 4: Update Inspector Portal Page (90 min)

Update `apps/web/app/inspector/[token]/page.tsx`:

```typescript
'use client';

import { useParams } from 'next/navigation';
import { Stack, Alert, Loader, Center, Paper, Text } from '@mantine/core';
import { IconAlertCircle, IconLock, IconClock } from '@tabler/icons-react';
import { useInspectorToken, useInspectionPortal, isTokenExpired } from '@/hooks/useInspectorPortal';
import { InspectorHeader } from '@/components/Inspector/InspectorHeader';
import { InspectionDetails } from '@/components/Inspector/InspectionDetails';
import { InspectionPhotos } from '@/components/Inspector/InspectionPhotos';
import { ComplianceStatus } from '@/components/Inspector/ComplianceStatus';

export default function InspectorPortalPage() {
  const { token } = useParams<{ token: string }>();

  const {
    data: tokenPayload,
    isLoading: tokenLoading,
    error: tokenError
  } = useInspectorToken(token);

  const {
    data: inspection,
    isLoading: inspectionLoading,
    error: inspectionError,
  } = useInspectionPortal(token, tokenPayload?.inspectionId ?? null);

  // Loading state
  if (tokenLoading || inspectionLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading inspection...</Text>
        </Stack>
      </Center>
    );
  }

  // Token expired
  if (tokenPayload && isTokenExpired(tokenPayload)) {
    return (
      <Center h="100vh" p="md">
        <Alert
          icon={<IconClock size={24} />}
          title="Link Expired"
          color="orange"
          variant="filled"
        >
          <Stack gap="xs">
            <Text>This inspection link has expired.</Text>
            <Text size="sm">Please request a new QR code from the project manager.</Text>
          </Stack>
        </Alert>
      </Center>
    );
  }

  // Invalid token
  if (tokenError || !tokenPayload) {
    return (
      <Center h="100vh" p="md">
        <Alert
          icon={<IconLock size={24} />}
          title="Invalid Link"
          color="red"
          variant="filled"
        >
          <Stack gap="xs">
            <Text>This inspection link is invalid or has been revoked.</Text>
            <Text size="sm">Please contact the project manager for access.</Text>
          </Stack>
        </Alert>
      </Center>
    );
  }

  // Inspection load error
  if (inspectionError || !inspection) {
    return (
      <Center h="100vh" p="md">
        <Alert
          icon={<IconAlertCircle size={24} />}
          title="Error Loading Inspection"
          color="red"
          variant="light"
        >
          Failed to load inspection data. Please try again.
        </Alert>
      </Center>
    );
  }

  return (
    <Stack gap="md" p="md">
      <InspectorHeader
        projectName={inspection.projectName}
        expiresAt={tokenPayload.expiresAt}
      />

      <Paper p="md" withBorder>
        <InspectionDetails inspection={inspection} />
      </Paper>

      <Paper p="md" withBorder>
        <ComplianceStatus status={inspection.complianceStatus} />
      </Paper>

      {inspection.photos.length > 0 && (
        <Paper p="md" withBorder>
          <InspectionPhotos photos={inspection.photos} />
        </Paper>
      )}
    </Stack>
  );
}
```

### Step 5: Write Tests (60 min)

Create `apps/web/hooks/__tests__/useInspectorPortal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mocks = {
  validateInspectorToken: vi.fn(),
  fetchInspectionForPortal: vi.fn(),
};

vi.mock('@/lib/api/inspector', () => ({
  validateInspectorToken: () => mocks.validateInspectorToken(),
  fetchInspectionForPortal: () => mocks.fetchInspectionForPortal(),
}));

import { useInspectorToken, useInspectionPortal, isTokenExpired } from '../useInspectorPortal';

const mockTokenPayload = {
  inspectionId: 'insp-123',
  projectId: 'proj-456',
  expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24h from now
  permissions: 'read' as const,
};

const mockInspection = {
  id: 'insp-123',
  projectName: 'Highway 101 Extension',
  formTitle: 'SWPPP Inspection',
  status: 'SUBMITTED',
  submittedAt: '2025-11-27T10:00:00Z',
  submittedBy: 'John Smith',
  data: {},
  photos: [],
  complianceStatus: {
    isCompliant: true,
    violations: [],
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useInspectorToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validateInspectorToken.mockResolvedValue(mockTokenPayload);
  });

  it('validates inspector token', async () => {
    const { result } = renderHook(() => useInspectorToken('valid-token'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTokenPayload);
  });

  it('returns null for invalid token', async () => {
    mocks.validateInspectorToken.mockResolvedValue(null);

    const { result } = renderHook(() => useInspectorToken('invalid-token'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('returns true for expired token', () => {
    const expiredPayload = {
      ...mockTokenPayload,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
    };
    expect(isTokenExpired(expiredPayload)).toBe(true);
  });

  it('returns false for valid token', () => {
    expect(isTokenExpired(mockTokenPayload)).toBe(false);
  });

  it('returns true for null payload', () => {
    expect(isTokenExpired(null)).toBe(true);
  });
});
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

```bash
cd apps/web
pnpm test useInspectorPortal
```

**Expected:** Tests FAIL
**Screenshot:** Save to `evidence/ISSUE-165/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

```bash
pnpm test useInspectorPortal
```

**Expected:** Tests PASS
**Screenshot:** Save to `evidence/ISSUE-165/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/lib/api/inspector.ts
- apps/web/hooks/useInspectorPortal.ts
- apps/web/hooks/**tests**/useInspectorPortal.test.tsx

**Modify:**

- apps/web/app/inspector/[token]/page.tsx
- apps/web/components/Inspector/InspectionDetails.tsx
- apps/web/components/Inspector/InspectionPhotos.tsx

## Backend Requirements

The backend must implement:

1. `validateInspectorToken` query - Validates X-Inspector-Token header
2. `inspectionForPortal` query - Returns inspection data for valid token
3. Token generation endpoint - Creates time-limited JWT for QR codes

## Verification Checklist

- [ ] Token validation works
- [ ] Expired tokens show proper message
- [ ] Invalid tokens show error
- [ ] Inspection data loads from API
- [ ] Photos display correctly
- [ ] Compliance status shows real data
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-165/

**Required:**

- test-results/red-phase.png, green-phase.png, coverage-report.png
- screenshots/portal-real-data.png, expired-token.png, invalid-token.png

## Time Estimate

**8 hours total:**

- Review current implementation: 30 min
- API helpers: 60 min
- Hooks: 60 min
- Update portal page: 90 min
- Update components: 90 min
- Testing: 60 min
- Integration testing: 60 min

## Next Issue

**ISSUE-166:** Implement GPS Field Functionality
