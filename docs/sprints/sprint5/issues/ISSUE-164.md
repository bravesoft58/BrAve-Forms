# ISSUE-164: Replace Mock Data in Dashboard (4h)

**Sprint:** Sprint 5 | **Phase:** 0 - Production-Ready Fixes | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-11-27
**Dependencies:** ISSUE-162 complete (API patterns established)
**Status:** COMPLETE
**Completed:** 2025-11-27

## What You'll Do

Replace all mock/placeholder data in dashboard widgets with real GraphQL API calls. Dashboard currently shows hardcoded statistics instead of actual project, submission, and compliance data.

## Prerequisites

- [ ] ISSUE-162 complete (API helper patterns established)
- [ ] Web app accessible at http://localhost:30102
- [ ] Backend API running with real data
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Identify Dashboard Mock Data (30 min)

Review current dashboard components for mock data:

```bash
cd apps/web
grep -r "mock" components/Dashboard/ --include="*.tsx"
grep -r "placeholder" components/Dashboard/ --include="*.tsx"
grep -r "TODO" components/Dashboard/ --include="*.tsx"
```

Expected mock data locations:

- `StatsWidget.tsx` - Hardcoded statistics
- `RecentSubmissions.tsx` - Mock submission list
- `ProjectsOverview.tsx` - Fake project counts
- `ComplianceStatus.tsx` - Placeholder compliance data

### Step 2: Create Dashboard API Helpers (45 min)

Create `apps/web/lib/api/dashboard.ts`:

```typescript
import { makeAuthenticatedRequest } from './client';

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  submissionsToday: number;
  submissionsThisWeek: number;
  pendingInspections: number;
  complianceRate: number;
}

export async function fetchDashboardStats(token: string | null): Promise<DashboardStats> {
  const data = await makeAuthenticatedRequest<{ dashboardStats: DashboardStats }>(
    {
      query: `
        query DashboardStats {
          dashboardStats {
            totalProjects
            activeProjects
            submissionsToday
            submissionsThisWeek
            pendingInspections
            complianceRate
          }
        }
      `,
    },
    token
  );

  return data.dashboardStats;
}

export interface RecentActivity {
  id: string;
  type: 'submission' | 'inspection' | 'weather_alert';
  title: string;
  timestamp: string;
  projectName: string;
}

export async function fetchRecentActivity(
  token: string | null,
  limit: number = 10
): Promise<RecentActivity[]> {
  const data = await makeAuthenticatedRequest<{ recentActivity: RecentActivity[] }>(
    {
      query: `
        query RecentActivity($limit: Int!) {
          recentActivity(limit: $limit) {
            id
            type
            title
            timestamp
            projectName
          }
        }
      `,
      variables: { limit },
    },
    token
  );

  return data.recentActivity || [];
}
```

### Step 3: Create Dashboard Hooks (45 min)

Create `apps/web/hooks/useDashboard.ts`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppAuth } from '@/app/providers';
import {
  fetchDashboardStats,
  fetchRecentActivity,
  DashboardStats,
  RecentActivity,
} from '@/lib/api/dashboard';

export function useDashboardStats() {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const token = await getToken();
      return fetchDashboardStats(token);
    },
    enabled: isSignedIn,
    staleTime: 60 * 1000, // 1 minute - dashboard data should be fresh
    networkMode: 'offlineFirst',
  });
}

export function useRecentActivity(limit: number = 10) {
  const auth = useAppAuth();
  const getToken = auth.getToken || (async () => 'dev-token');
  const isSignedIn = auth.isSignedIn ?? true;

  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: async () => {
      const token = await getToken();
      return fetchRecentActivity(token, limit);
    },
    enabled: isSignedIn,
    staleTime: 30 * 1000, // 30 seconds - activity updates frequently
    networkMode: 'offlineFirst',
  });
}

export type { DashboardStats, RecentActivity };
```

### Step 4: Update Dashboard Widgets (90 min)

Update `apps/web/components/Dashboard/StatsWidget.tsx`:

```typescript
'use client';

import { Paper, Group, Text, Stack, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useDashboardStats } from '@/hooks/useDashboard';

export function StatsWidget() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Paper p="md" withBorder>
        <Group justify="center">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading statistics...</Text>
        </Group>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="light">
        Failed to load dashboard statistics
      </Alert>
    );
  }

  return (
    <Group grow>
      <Paper p="md" withBorder>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Active Projects</Text>
          <Text size="xl" fw={700}>{stats?.activeProjects ?? 0}</Text>
        </Stack>
      </Paper>
      <Paper p="md" withBorder>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Submissions Today</Text>
          <Text size="xl" fw={700}>{stats?.submissionsToday ?? 0}</Text>
        </Stack>
      </Paper>
      <Paper p="md" withBorder>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Pending Inspections</Text>
          <Text size="xl" fw={700}>{stats?.pendingInspections ?? 0}</Text>
        </Stack>
      </Paper>
      <Paper p="md" withBorder>
        <Stack gap={4}>
          <Text size="xs" c="dimmed">Compliance Rate</Text>
          <Text size="xl" fw={700} c={stats?.complianceRate >= 90 ? 'green' : 'orange'}>
            {stats?.complianceRate ?? 0}%
          </Text>
        </Stack>
      </Paper>
    </Group>
  );
}
```

### Step 5: Write Tests (30 min)

Create `apps/web/hooks/__tests__/useDashboard.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mocks = {
  getToken: vi.fn().mockResolvedValue('test-token'),
  isSignedIn: true,
  fetchDashboardStats: vi.fn(),
  fetchRecentActivity: vi.fn(),
};

vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    getToken: mocks.getToken,
    isSignedIn: mocks.isSignedIn,
  }),
}));

vi.mock('@/lib/api/dashboard', () => ({
  fetchDashboardStats: () => mocks.fetchDashboardStats(),
  fetchRecentActivity: () => mocks.fetchRecentActivity(),
}));

import { useDashboardStats, useRecentActivity } from '../useDashboard';

const mockStats = {
  totalProjects: 5,
  activeProjects: 3,
  submissionsToday: 12,
  submissionsThisWeek: 45,
  pendingInspections: 2,
  complianceRate: 94,
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchDashboardStats.mockResolvedValue(mockStats);
  });

  it('fetches dashboard statistics', async () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
  });
});
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Run tests before implementation:

```bash
cd apps/web
pnpm test useDashboard
```

**Expected:** Tests FAIL (no implementation yet)
**Screenshot:** Save to `evidence/ISSUE-164/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 2-4.

Run tests:

```bash
pnpm test useDashboard
```

**Expected:** Tests PASS
**Screenshot:** Save to `evidence/ISSUE-164/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/lib/api/dashboard.ts
- apps/web/hooks/useDashboard.ts
- apps/web/hooks/**tests**/useDashboard.test.tsx

**Modify:**

- apps/web/components/Dashboard/StatsWidget.tsx
- apps/web/components/Dashboard/RecentSubmissions.tsx
- apps/web/components/Dashboard/ProjectsOverview.tsx

## Verification Checklist

- [x] Dashboard stats fetched from real API
- [x] Recent activity shows real data
- [x] Loading states display correctly
- [x] Error states handled gracefully
- [x] Offline mode uses cached data (networkMode: 'offlineFirst')
- [x] Tests passing (16/16 tests)
- [x] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-164/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests)
  - coverage-report.png (>80%)
- screenshots/
  - dashboard-real-data.png (showing real stats)
  - dashboard-loading.png (loading state)

## Time Estimate

**4 hours total:**

- Identify mock data: 30 min
- API helpers: 45 min
- Dashboard hooks: 45 min
- Update widgets: 90 min
- Testing: 30 min

## Next Issue

**ISSUE-165:** Connect QR Inspector Portal to Backend
