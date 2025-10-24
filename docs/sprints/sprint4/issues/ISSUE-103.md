# ISSUE-103: Form Submission Viewer (Read-Only)

**Sprint:** Sprint 4 | **Phase:** 1 - QR Inspector Portal | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-102 (QR code display)
**Status:** NOT STARTED

## What You'll Do

Create read-only form submission viewer for inspectors with filtering and export capabilities.

## Prerequisites

- [ ] ISSUE-102 complete (QR code generation working)
- [ ] Inspector portal accessible at /inspector/[token]
- [ ] Web frontend running at http://localhost:30102
- [ ] Code editor open to apps/web directory

## Step-by-Step Instructions

### Step 1: Create Submissions API (40 min)

Create `apps/web/lib/api/inspector-submissions.ts`:

```typescript
import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

export interface SubmissionFilter {
  startDate?: Date;
  endDate?: Date;
  templateType?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface FormSubmission {
  id: string;
  templateId: string;
  templateName: string;
  submittedBy: string;
  submittedAt: Date;
  status: string;
  fields: SubmissionField[];
  photos: SubmissionPhoto[];
}

export interface SubmissionField {
  id: string;
  label: string;
  type: string;
  value: any;
}

export interface SubmissionPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  takenAt: Date;
}

const GET_SUBMISSIONS_BY_TOKEN = gql`
  query GetSubmissionsByToken($token: String!, $filter: SubmissionFilterInput) {
    submissionsByToken(token: $token, filter: $filter) {
      id
      templateId
      templateName
      submittedBy
      submittedAt
      status
      fields {
        id
        label
        type
        value
      }
      photos {
        id
        url
        thumbnailUrl
        caption
        gpsLatitude
        gpsLongitude
        takenAt
      }
    }
  }
`;

const GET_SUBMISSION_BY_TOKEN = gql`
  query GetSubmissionByToken($token: String!, $submissionId: String!) {
    submissionByToken(token: $token, submissionId: $submissionId) {
      id
      templateId
      templateName
      submittedBy
      submittedAt
      status
      fields {
        id
        label
        type
        value
      }
      photos {
        id
        url
        thumbnailUrl
        caption
        gpsLatitude
        gpsLongitude
        takenAt
      }
    }
  }
`;

export async function fetchSubmissionsViaToken(
  token: string,
  filter?: SubmissionFilter
): Promise<FormSubmission[]> {
  try {
    const { data } = await apolloClient.query({
      query: GET_SUBMISSIONS_BY_TOKEN,
      variables: { token, filter },
      fetchPolicy: 'no-cache',
    });

    return data.submissionsByToken;
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return [];
  }
}

export async function fetchSubmissionByToken(
  token: string,
  submissionId: string
): Promise<FormSubmission | null> {
  try {
    const { data } = await apolloClient.query({
      query: GET_SUBMISSION_BY_TOKEN,
      variables: { token, submissionId },
      fetchPolicy: 'no-cache',
    });

    return data.submissionByToken;
  } catch (error) {
    console.error('Failed to fetch submission:', error);
    return null;
  }
}
```

**Backend Resolver (Required):**

Create `apps/backend/src/modules/qr-portal/resolvers/inspector-submissions.resolver.ts`:

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import { QRTokenService } from '../services/qr-token.service';
import { PrismaService } from '@/modules/database/prisma.service';

@Resolver()
export class InspectorSubmissionsResolver {
  constructor(
    private readonly qrTokenService: QRTokenService,
    private readonly prisma: PrismaService
  ) {}

  @Query(() => [FormSubmission])
  async submissionsByToken(
    @Args('token') token: string,
    @Args('filter', { nullable: true }) filter?: SubmissionFilterInput
  ) {
    // Validate token
    const payload = await this.qrTokenService.validateQRToken(token);
    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    // Fetch submissions for project
    const submissions = await this.prisma.formSubmission.findMany({
      where: {
        projectId: payload.projectId,
        orgId: payload.orgId,
        submittedAt: {
          gte: filter?.startDate,
          lte: filter?.endDate,
        },
        templateType: filter?.templateType,
        status: filter?.status,
      },
      include: {
        fields: true,
        photos: true,
        submittedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return submissions;
  }

  @Query(() => FormSubmission)
  async submissionByToken(
    @Args('token') token: string,
    @Args('submissionId') submissionId: string
  ) {
    // Validate token
    const payload = await this.qrTokenService.validateQRToken(token);
    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    // Fetch single submission
    const submission = await this.prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        projectId: payload.projectId,
        orgId: payload.orgId,
      },
      include: {
        fields: true,
        photos: true,
        submittedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission;
  }
}
```

### Step 2: Create Submission List Component (40 min)

Create `apps/web/components/Inspector/SubmissionList.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormSubmission, SubmissionFilter } from '@/lib/api/inspector-submissions';

interface SubmissionListProps {
  submissions: FormSubmission[];
  token: string;
  readOnly: boolean;
}

export function SubmissionList({ submissions, token, readOnly }: SubmissionListProps) {
  const [filter, setFilter] = useState<SubmissionFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubmissions = submissions.filter((submission) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !submission.templateName.toLowerCase().includes(searchLower) &&
        !submission.submittedBy.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Date range filter
    if (filter.startDate && new Date(submission.submittedAt) < filter.startDate) {
      return false;
    }
    if (filter.endDate && new Date(submission.submittedAt) > filter.endDate) {
      return false;
    }

    // Template type filter
    if (filter.templateType && submission.templateName !== filter.templateType) {
      return false;
    }

    // Status filter
    if (filter.status && submission.status !== filter.status) {
      return false;
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Date Range */}
          <input
            type="date"
            value={filter.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) =>
              setFilter({ ...filter, startDate: new Date(e.target.value) })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <input
            type="date"
            value={filter.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) =>
              setFilter({ ...filter, endDate: new Date(e.target.value) })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          {/* Status Filter */}
          <select
            value={filter.status || ''}
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value as any })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || filter.startDate || filter.endDate || filter.status) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilter({});
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No submissions found
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.templateName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{submission.submittedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        submission.status
                      )}`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/inspector/${token}/submissions/${submission.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <button
                      onClick={() =>
                        window.open(`/api/submissions/${submission.id}/pdf`, '_blank')
                      }
                      className="text-green-600 hover:text-green-900"
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Read-Only Warning (if inspector) */}
      {readOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Read-Only Access:</strong> You can view and export submissions,
            but cannot create, edit, or delete them.
          </p>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Create Submissions List Page (20 min)

Create `apps/web/app/inspector/[token]/submissions/page.tsx`:

```typescript
import { fetchSubmissionsViaToken } from '@/lib/api/inspector-submissions';
import { SubmissionList } from '@/components/Inspector/SubmissionList';

export default async function InspectorSubmissionsPage({
  params,
}: {
  params: { token: string };
}) {
  const submissions = await fetchSubmissionsViaToken(params.token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
        <p className="text-gray-600 mt-2">
          View inspection reports and submitted forms (Read-Only)
        </p>
      </div>

      <SubmissionList
        submissions={submissions}
        token={params.token}
        readOnly={true}
      />
    </div>
  );
}
```

### Step 4: Create Submission Detail Page (20 min)

Create `apps/web/app/inspector/[token]/submissions/[id]/page.tsx`:

```typescript
import { fetchSubmissionByToken } from '@/lib/api/inspector-submissions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InspectorSubmissionDetailPage({
  params,
}: {
  params: { token: string; id: string };
}) {
  const submission = await fetchSubmissionByToken(params.token, params.id);

  if (!submission) {
    redirect(`/inspector/${params.token}/submissions`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{submission.templateName}</h1>
          <p className="text-gray-600 mt-2">
            Submitted by {submission.submittedBy} on{' '}
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Print
          </button>
          <button
            onClick={() =>
              window.open(`/api/submissions/${submission.id}/pdf`, '_blank')
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Form Data</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submission.fields.map((field) => (
            <div key={field.id}>
              <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
              <dd className="text-base text-gray-900 mt-1">
                {field.type === 'checkbox'
                  ? field.value
                    ? 'Yes'
                    : 'No'
                  : field.value || '-'}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Photos */}
      {submission.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Photos ({submission.photos.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {submission.photos.map((photo) => (
              <div key={photo.id} className="space-y-2">
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80"
                  onClick={() => window.open(photo.url, '_blank')}
                />
                {photo.caption && (
                  <p className="text-xs text-gray-600">{photo.caption}</p>
                )}
                {photo.gpsLatitude && photo.gpsLongitude && (
                  <p className="text-xs text-gray-500">
                    GPS: {photo.gpsLatitude.toFixed(6)}, {photo.gpsLongitude.toFixed(6)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Link */}
      <Link
        href={`/inspector/${params.token}/submissions`}
        className="text-blue-600 hover:text-blue-800"
      >
        &larr; Back to All Submissions
      </Link>
    </div>
  );
}
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/__tests__/inspector-submissions.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmissionList } from '@/components/Inspector/SubmissionList';
import { FormSubmission } from '@/lib/api/inspector-submissions';

describe('SubmissionList', () => {
  const mockSubmissions: FormSubmission[] = [
    {
      id: 'sub-1',
      templateId: 'template-1',
      templateName: 'SWPPP Inspection',
      submittedBy: 'John Doe',
      submittedAt: new Date('2025-10-20'),
      status: 'submitted',
      fields: [],
      photos: [],
    },
    {
      id: 'sub-2',
      templateId: 'template-2',
      templateName: 'Daily Safety Log',
      submittedBy: 'Jane Smith',
      submittedAt: new Date('2025-10-21'),
      status: 'approved',
      fields: [],
      photos: [],
    },
  ];

  it('should render submissions list', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Daily Safety Log')).toBeInTheDocument();
  });

  it('should filter by search term', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search submissions...');
    fireEvent.change(searchInput, { target: { value: 'SWPPP' } });

    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.queryByText('Daily Safety Log')).not.toBeInTheDocument();
  });

  it('should filter by status', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'approved' } });

    expect(screen.queryByText('SWPPP Inspection')).not.toBeInTheDocument();
    expect(screen.getByText('Daily Safety Log')).toBeInTheDocument();
  });

  it('should show read-only warning when readOnly is true', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    expect(screen.getByText(/Read-Only Access/i)).toBeInTheDocument();
  });

  it('should not show edit/delete buttons in read-only mode', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should show View and Export PDF buttons', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    const viewButtons = screen.getAllByText('View');
    const exportButtons = screen.getAllByText('Export PDF');

    expect(viewButtons).toHaveLength(2);
    expect(exportButtons).toHaveLength(2);
  });

  it('should clear filters when Clear Filters clicked', () => {
    render(
      <SubmissionList
        submissions={mockSubmissions}
        token="test-token"
        readOnly={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search submissions...');
    fireEvent.change(searchInput, { target: { value: 'SWPPP' } });

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Daily Safety Log')).toBeInTheDocument();
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test inspector-submissions
```

**Screenshot:** Save failing test to `evidence/ISSUE-103/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test inspector-submissions
```

Expected: All tests pass

**Screenshot:** Save passing tests to `evidence/ISSUE-103/test-results/green-phase.png`

## Files to Create

**Frontend:**

- apps/web/lib/api/inspector-submissions.ts
- apps/web/components/Inspector/SubmissionList.tsx
- apps/web/app/inspector/[token]/submissions/page.tsx
- apps/web/app/inspector/[token]/submissions/[id]/page.tsx
- apps/web/**tests**/inspector-submissions.test.tsx

**Backend:**

- apps/backend/src/modules/qr-portal/resolvers/inspector-submissions.resolver.ts

## Verification Checklist

- [ ] Submissions API created
- [ ] SubmissionList component renders
- [ ] Filtering works (search, date, status)
- [ ] Read-only warning displays
- [ ] No edit/delete buttons visible
- [ ] View and Export PDF buttons work
- [ ] Submission detail page renders
- [ ] Print button functional
- [ ] Tests passing (8+ tests)
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-103/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests - 8+ tests)
  - coverage-report.png (>80% coverage)
- ui/
  - submissions-list.png (filtered list)
  - submission-detail.png (single submission view)
  - read-only-warning.png (warning banner)
- code/
  - submission-list-component.png (SubmissionList implementation)

## Troubleshooting

**Problem:** Submissions not loading

- **Cause:** Backend resolver not created
- **Solution:** Create InspectorSubmissionsResolver in backend

**Problem:** Filters not applying

- **Cause:** Filter state not propagating
- **Solution:** Check useState() and onChange handlers

**Problem:** Export PDF button does nothing

- **Cause:** PDF API endpoint doesn't exist
- **Solution:** Will be created in Phase 2 (Reports module)

## Success Criteria

- [ ] Submissions list loads via token
- [ ] Filtering works (search, date range, status)
- [ ] Read-only enforcement (no mutation buttons)
- [ ] Submission detail page renders
- [ ] Print button opens print dialog
- [ ] Export PDF button functional
- [ ] Tests pass with >80% coverage
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Create submissions API: 40 min
- Create submission list component: 40 min
- Create submissions list page: 20 min
- Create submission detail page: 20 min

## Next Issue

**ISSUE-104:** Photo Gallery Viewer (2h)

- Prerequisites: This issue complete (submissions viewer working)
- Creates: Lightbox photo viewer with GPS map
- Uses: Submission photos from this issue
