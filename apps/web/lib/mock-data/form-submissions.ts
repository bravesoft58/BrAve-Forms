/**
 * Mock Form Submissions Data
 *
 * Provides mock data for form submissions used in the Submitted Forms List component.
 * This will be replaced with API calls in Sprint 4.
 */

export type FormSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';

export interface FormSubmission {
  id: string;
  projectId: string;
  templateId: string;
  templateTitle: string;
  submittedBy: string;
  status: FormSubmissionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mockSubmissions: FormSubmission[] = [
  {
    id: 'sub-001',
    projectId: '1',
    templateId: 'post-storm-inspection',
    templateTitle: 'Post-Storm Inspection',
    submittedBy: 'John Smith',
    status: 'APPROVED',
    submittedAt: new Date('2025-01-20T14:30:00'),
    createdAt: new Date('2025-01-20T14:00:00'),
    updatedAt: new Date('2025-01-20T15:00:00'),
  },
  {
    id: 'sub-002',
    projectId: '1',
    templateId: 'daily-dust-log',
    templateTitle: 'Daily Dust Log',
    submittedBy: 'Jane Doe',
    status: 'SUBMITTED',
    submittedAt: new Date('2025-01-20T08:00:00'),
    createdAt: new Date('2025-01-20T07:45:00'),
    updatedAt: new Date('2025-01-20T08:00:00'),
  },
  {
    id: 'sub-003',
    projectId: '1',
    templateId: 'swppp-inspection',
    templateTitle: 'SWPPP Inspection',
    submittedBy: 'Bob Johnson',
    status: 'REVIEWED',
    submittedAt: new Date('2025-01-19T16:00:00'),
    createdAt: new Date('2025-01-19T15:30:00'),
    updatedAt: new Date('2025-01-19T17:00:00'),
  },
  {
    id: 'sub-004',
    projectId: '1',
    templateId: 'bmp-maintenance-log',
    templateTitle: 'BMP Maintenance Log',
    submittedBy: 'Alice Williams',
    status: 'DRAFT',
    submittedAt: new Date('2025-01-19T10:00:00'),
    createdAt: new Date('2025-01-19T09:30:00'),
    updatedAt: new Date('2025-01-19T10:00:00'),
  },
  {
    id: 'sub-005',
    projectId: '1',
    templateId: 'weekly-swppp-review',
    templateTitle: 'Weekly SWPPP Review',
    submittedBy: 'Charlie Brown',
    status: 'APPROVED',
    submittedAt: new Date('2025-01-18T12:00:00'),
    createdAt: new Date('2025-01-18T11:30:00'),
    updatedAt: new Date('2025-01-18T13:00:00'),
  },
  {
    id: 'sub-006',
    projectId: '2',
    templateId: 'daily-inspection-log',
    templateTitle: 'Daily Inspection Log',
    submittedBy: 'Diana Prince',
    status: 'SUBMITTED',
    submittedAt: new Date('2025-01-20T09:00:00'),
    createdAt: new Date('2025-01-20T08:45:00'),
    updatedAt: new Date('2025-01-20T09:00:00'),
  },
];

/**
 * Get form submissions for a project
 */
export const getMockFormSubmissions = (projectId: string): FormSubmission[] => {
  return mockSubmissions
    .filter((submission) => submission.projectId === projectId)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()); // Newest first
};

/**
 * Filter submissions by template
 */
export const filterSubmissionsByTemplate = (
  submissions: FormSubmission[],
  templateId: string | 'all'
): FormSubmission[] => {
  if (templateId === 'all') {
    return submissions;
  }
  return submissions.filter((submission) => submission.templateId === templateId);
};

/**
 * Filter submissions by status
 */
export const filterSubmissionsByStatus = (
  submissions: FormSubmission[],
  status: FormSubmissionStatus | 'all'
): FormSubmission[] => {
  if (status === 'all') {
    return submissions;
  }
  return submissions.filter((submission) => submission.status === status);
};

/**
 * Filter submissions by date range
 */
export const filterSubmissionsByDateRange = (
  submissions: FormSubmission[],
  startDate: Date | null,
  endDate: Date | null
): FormSubmission[] => {
  if (!startDate && !endDate) {
    return submissions;
  }

  return submissions.filter((submission) => {
    const submissionDate = submission.submittedAt;
    if (startDate && submissionDate < startDate) {
      return false;
    }
    if (endDate && submissionDate > endDate) {
      return false;
    }
    return true;
  });
};

/**
 * Get status color for badge
 */
export const getSubmissionStatusColor = (status: FormSubmissionStatus): string => {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'REVIEWED':
      return 'blue';
    case 'SUBMITTED':
      return 'cyan';
    case 'DRAFT':
      return 'gray';
    case 'REJECTED':
      return 'red';
    default:
      return 'gray';
  }
};

