/**
 * Dashboard API helpers
 *
 * Fetches dashboard statistics and recent activity from the GraphQL backend.
 * All functions require Clerk JWT authentication.
 *
 * @security All queries automatically filtered by orgId from JWT
 * @offline Requests fail when offline (queued by TanStack Query for sync)
 */

import { makeAuthenticatedRequest } from './client';

// Dashboard statistics returned from organizationStats query
export interface DashboardStats {
  activeProjects: number;
  submissionsToday: number;
  pendingInspections: number;
  complianceRate: number;
}

// Raw response from organizationStats GraphQL query
interface OrganizationStatsResponse {
  projects: number;
  activeInspections: number;
  overdueInspections: number;
  complianceScore: number;
  recentActivity: Array<{
    id: string;
    type: string;
    status: string;
    inspectionDate: string;
    project: { name: string };
  }>;
}

// Recent activity item for the activity list
export interface RecentActivity {
  id: string;
  type: 'inspection' | 'submission' | 'photo';
  title: string;
  projectName: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'draft';
}

// Pending task for the pending tasks list
export interface PendingTask {
  id: string;
  name: string;
  projectName: string;
  dueTime: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Get start of today (midnight) for date comparisons
 * Reusable utility for dashboard date calculations
 */
function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Safely parse JSON with error logging
 *
 * @param jsonString - String to parse
 * @param context - Context for error logging (e.g., 'organizationStats')
 * @returns Parsed object or null on failure
 */
function safeParseJson<T>(jsonString: string, context: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
    console.error(`[Dashboard API] Failed to parse ${context} JSON: ${errorMessage}`);
    return null;
  }
}

/**
 * Fetch dashboard statistics
 *
 * @param token - Clerk JWT token
 * @returns Dashboard statistics (projects, submissions, inspections, compliance)
 * @throws {Error} If authentication fails
 *
 * @security Backend validates user's orgId from JWT
 */
export async function fetchDashboardStats(token: string | null): Promise<DashboardStats> {
  // Fetch organization stats and recent submissions in parallel
  const [orgStatsResult, submissionsResult] = await Promise.all([
    makeAuthenticatedRequest<{ organizationStats: string }>(
      {
        query: `
          query OrganizationStats {
            organizationStats
          }
        `,
      },
      token
    ).catch((error) => {
      console.error(
        '[Dashboard API] Failed to fetch organizationStats:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { organizationStats: null };
    }),

    makeAuthenticatedRequest<{ formSubmissions: Array<{ submittedAt: string }> }>(
      {
        query: `
          query RecentSubmissions {
            formSubmissions(take: 100) {
              submittedAt
            }
          }
        `,
      },
      token
    ).catch((error) => {
      console.error(
        '[Dashboard API] Failed to fetch formSubmissions:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { formSubmissions: [] };
    }),
  ]);

  // Parse org stats (returned as JSON string from resolver)
  let orgStats: OrganizationStatsResponse | null = null;
  if (orgStatsResult.organizationStats) {
    // organizationStats is returned as a JSON string from GraphQL resolver
    orgStats = safeParseJson<OrganizationStatsResponse>(
      orgStatsResult.organizationStats,
      'organizationStats'
    );
  }

  // Count submissions from today
  const today = getStartOfToday();
  const submissionsToday = (submissionsResult.formSubmissions || []).filter((sub) => {
    if (!sub.submittedAt) return false;
    const submittedDate = new Date(sub.submittedAt);
    return submittedDate >= today;
  }).length;

  return {
    activeProjects: orgStats?.projects ?? 0,
    submissionsToday,
    pendingInspections: orgStats?.overdueInspections ?? 0,
    complianceRate: orgStats?.complianceScore ?? 100,
  };
}

/**
 * Fetch recent activity for dashboard
 *
 * @param token - Clerk JWT token
 * @param limit - Maximum number of activities to return (default: 10)
 * @returns Recent activity items
 * @throws {Error} If authentication fails
 *
 * @security Backend validates user's orgId from JWT
 */
export async function fetchRecentActivity(
  token: string | null,
  limit: number = 10
): Promise<RecentActivity[]> {
  const data = await makeAuthenticatedRequest<{
    formSubmissions: Array<{
      id: string;
      status: string;
      submittedAt: string;
      template?: { name: string };
      createdBy?: { name: string };
    }>;
  }>(
    {
      query: `
        query RecentActivity($take: Int) {
          formSubmissions(take: $take) {
            id
            status
            submittedAt
            template {
              name
            }
            createdBy {
              name
            }
          }
        }
      `,
      variables: { take: limit },
    },
    token
  );

  // Transform submissions to activity items
  return (data.formSubmissions || []).map((submission) => ({
    id: submission.id,
    type: 'submission' as const,
    title: submission.template?.name || 'Form Submission',
    projectName: submission.createdBy?.name || 'Unknown User',
    timestamp: submission.submittedAt || new Date().toISOString(),
    status: mapStatus(submission.status),
  }));
}

/**
 * Fetch pending tasks for dashboard
 *
 * @param token - Clerk JWT token
 * @returns Pending tasks (inspections due today)
 * @throws {Error} If authentication fails
 *
 * @security Backend validates user's orgId from JWT
 */
export async function fetchPendingTasks(token: string | null): Promise<PendingTask[]> {
  const data = await makeAuthenticatedRequest<{ organizationStats: string }>(
    {
      query: `
        query OrganizationStats {
          organizationStats
        }
      `,
    },
    token
  );

  // Parse org stats to get recent activity (inspections)
  let orgStats: OrganizationStatsResponse | null = null;
  if (data.organizationStats) {
    // organizationStats is returned as a JSON string from GraphQL resolver
    orgStats = safeParseJson<OrganizationStatsResponse>(
      data.organizationStats,
      'pendingTasks.organizationStats'
    );
  }

  // Filter to pending/in-progress inspections as tasks
  const pendingInspections = (orgStats?.recentActivity || []).filter(
    (activity) => activity.status === 'PENDING' || activity.status === 'IN_PROGRESS'
  );

  return pendingInspections.map((inspection) => ({
    id: inspection.id,
    name: inspection.type || 'Inspection',
    projectName: inspection.project?.name || 'Unknown Project',
    dueTime: formatDueTime(inspection.inspectionDate),
    priority: inspection.status === 'PENDING' ? ('high' as const) : ('medium' as const),
  }));
}

// Status values that map to 'completed'
const COMPLETED_STATUSES = ['SUBMITTED', 'APPROVED', 'REVIEWED'];
// Status values that map to 'pending'
const PENDING_STATUSES = ['PENDING', 'IN_PROGRESS'];

/**
 * Map submission status to activity status
 *
 * @param status - Raw status string from backend (may be null/undefined)
 * @returns Normalized status for UI display
 */
function mapStatus(status: string | undefined | null): 'completed' | 'pending' | 'draft' {
  if (!status) return 'draft';

  const normalizedStatus = status.toUpperCase();

  if (COMPLETED_STATUSES.includes(normalizedStatus)) {
    return 'completed';
  }
  if (PENDING_STATUSES.includes(normalizedStatus)) {
    return 'pending';
  }
  return 'draft';
}

/**
 * Format inspection date to due time string
 */
function formatDueTime(dateString: string): string {
  if (!dateString) return 'Today';

  const date = new Date(dateString);
  const now = new Date();

  // If same day, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // If tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
