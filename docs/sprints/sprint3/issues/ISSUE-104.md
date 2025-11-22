# ISSUE-104: Submission History View

**Sprint:** Sprint 3 | **Phase:** 5 - Form Submission Workflow | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-103 (submission working)
**Status:** COMPLETE
**Completed:** 2025-11-22

## What You'll Do

Create submission history list page with date/template/status filters, search functionality, and detailed submission view.

## Step-by-Step Instructions

### Step 1: Create Submissions List Page (60 min)

Create `apps/web/app/submissions/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubmissionsPage() {
  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    templateId: '',
    status: '',
    search: '',
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', filters],
    queryFn: () =>
      api.submissions.findAll({
        filter: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          templateId: filters.templateId || undefined,
          status: filters.status || undefined,
        },
        search: filters.search || undefined,
        orderBy: { submittedAt: 'desc' },
      }),
  });

  const { data: templates } = useQuery({
    queryKey: ['formTemplates'],
    queryFn: () => api.forms.getTemplates(),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      templateId: '',
      status: '',
      search: '',
    });
  };

  return (
    <div className="submissions-page">
      <div className="page-header">
        <h1>Form Submissions</h1>
        <Link href="/forms" className="new-form-button">
          Fill New Form
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search submissions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Form Template</label>
          <select
            value={filters.templateId}
            onChange={(e) => handleFilterChange('templateId', e.target.value)}
            className="filter-select"
          >
            <option value="">All Templates</option>
            {templates?.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button onClick={handleClearFilters} className="clear-filters-button">
          Clear Filters
        </button>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="loading">Loading submissions...</div>
      ) : (
        <div className="submissions-list">
          {submissions?.length === 0 ? (
            <div className="empty-state">
              <p>No submissions found</p>
              <Link href="/forms" className="empty-state-action">
                Fill your first form
              </Link>
            </div>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions?.map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.template.name}</td>
                    <td>{submission.createdBy.name}</td>
                    <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={submission.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => router.push(`/submissions/${submission.id}`)}
                        className="view-button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    draft: 'bg-gray-200 text-gray-800',
    submitted: 'bg-blue-200 text-blue-800',
    approved: 'bg-green-200 text-green-800',
    rejected: 'bg-red-200 text-red-800',
  };

  return (
    <span className={`status-badge ${statusColors[status as keyof typeof statusColors]}`}>
      {status}
    </span>
  );
}
```

### Step 2: Create Submission Detail Page (40 min)

Create `apps/web/app/submissions/[id]/page.tsx`:

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Image from 'next/image';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.submissions.findById(submissionId),
  });

  if (isLoading) {
    return <div className="loading">Loading submission...</div>;
  }

  if (!submission) {
    return <div className="error">Submission not found</div>;
  }

  return (
    <div className="submission-detail">
      <div className="detail-header">
        <button onClick={() => router.back()} className="back-button">
          ← Back
        </button>
        <h1>{submission.template.name}</h1>
        <StatusBadge status={submission.status} />
      </div>

      <div className="submission-meta">
        <div className="meta-item">
          <span className="meta-label">Submitted By:</span>
          <span className="meta-value">{submission.createdBy.name}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Submitted At:</span>
          <span className="meta-value">{new Date(submission.submittedAt).toLocaleString()}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Template Version:</span>
          <span className="meta-value">{submission.template.version}</span>
        </div>
      </div>

      {/* Form Data */}
      <div className="form-data">
        {submission.template.schema.sections.map((section: any) => (
          <div key={section.id} className="section">
            <h2 className="section-title">{section.title}</h2>
            <div className="section-fields">
              {section.fields.map((field: any) => {
                const value = submission.data[field.id];

                return (
                  <div key={field.id} className="field-display">
                    <label className="field-label">{field.label}</label>
                    <div className="field-value">
                      {field.type === 'photo' && value ? (
                        <Image
                          src={value}
                          alt={field.label}
                          width={200}
                          height={200}
                          className="photo-value"
                        />
                      ) : field.type === 'signature' && value ? (
                        <Image
                          src={value}
                          alt="Signature"
                          width={300}
                          height={100}
                          className="signature-value"
                        />
                      ) : (
                        <span>{value || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <button onClick={() => window.print()} className="print-button">
          Print
        </button>
        <button
          onClick={() => router.push(`/submissions/${submissionId}/clone`)}
          className="clone-button"
        >
          Use as Template
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Add Submission Styles (15 min)

Add to `apps/web/styles/globals.css`:

```css
.submissions-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.new-form-button {
  padding: 10px 20px;
  background-color: #4299e1;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
}

.filters-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.search-input,
.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
}

.clear-filters-button {
  padding: 8px 16px;
  background-color: #edf2f7;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  align-self: flex-end;
}

.submissions-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.submissions-table th,
.submissions-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.submissions-table th {
  background-color: #f7fafc;
  font-weight: 600;
  color: #2d3748;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.view-button {
  padding: 6px 12px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background-color: #f7fafc;
  border-radius: 8px;
}

.submission-detail {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}

.back-button {
  padding: 8px 16px;
  background-color: #edf2f7;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.submission-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
}

.meta-value {
  font-size: 14px;
  color: #2d3748;
}

.section {
  margin-bottom: 32px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
}

.field-display {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 4px;
}

.field-value {
  font-size: 14px;
  color: #2d3748;
}

.photo-value,
.signature-value {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.print-button,
.clone-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

.print-button {
  background-color: #edf2f7;
  color: #2d3748;
}

.clone-button {
  background-color: #48bb78;
  color: white;
}
```

### Step 4: Test Submissions Pages (5 min)

Create test file `apps/web/app/submissions/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import SubmissionsPage from './page';

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      {
        id: '1',
        template: { name: 'Daily Log' },
        createdBy: { name: 'John Doe' },
        submittedAt: '2025-10-23T10:00:00Z',
        status: 'submitted',
      },
    ],
    isLoading: false,
  }),
}));

describe('SubmissionsPage', () => {
  it('should render submissions list', () => {
    render(<SubmissionsPage />);

    expect(screen.getByText('Form Submissions')).toBeInTheDocument();
    expect(screen.getByText('Daily Log')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render filters', () => {
    render(<SubmissionsPage />);

    expect(screen.getByPlaceholderText('Search submissions...')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });
});
```

Run tests:

```bash
cd apps/web
pnpm test app/submissions
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should render submissions list"
2. Write test: "should render filters"
3. Write test: "should filter by date"
4. Write test: "should filter by template"
5. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create submissions list page
2. Add filter UI
3. Implement filter logic with useQuery
4. Add submission detail page
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract filter logic to custom hook
2. Add pagination for large lists
3. Improve TypeScript types

## Troubleshooting

**Issue: Filters not working**

```tsx
// Ensure filters are in queryKey
const { data } = useQuery({
  queryKey: ['submissions', filters], // CRITICAL: Include filters
  queryFn: () => api.submissions.findAll({ filter: filters }),
});
```

**Issue: Empty state not showing**

```tsx
// Check array length correctly
{
  submissions?.length === 0 ? <EmptyState /> : <SubmissionsList data={submissions} />;
}
```

## Completion Checklist

- [ ] Create apps/web/app/submissions/page.tsx (list page)
- [ ] Create apps/web/app/submissions/[id]/page.tsx (detail page)
- [ ] Add search input
- [ ] Add date filter (start/end)
- [ ] Add template filter (dropdown)
- [ ] Add status filter (dropdown)
- [ ] Add clear filters button
- [ ] Implement filter logic with TanStack Query
- [ ] Add submissions table
- [ ] Add status badges
- [ ] Add view button (navigate to detail)
- [ ] Create detail page with form data display
- [ ] Add print button
- [ ] Add "Use as Template" button
- [ ] Create submissions page tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: submission history with filters and detail view"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-104/

## Evidence Requirements

**Screenshots:**

- Submissions list with filters
- Filtered results (by date, template, status)
- Empty state
- Submission detail page

**Test Results:**

- Submissions page tests passing (2+ tests)
- Screenshot of test coverage report

**Code Review:**

- Filters working correctly
- Detail page displays all field types
- Print functionality working

## Files Created/Modified

**Created:**

- apps/web/app/submissions/page.tsx
- apps/web/app/submissions/[id]/page.tsx
- apps/web/app/submissions/page.test.tsx

**Modified:**

- apps/web/styles/globals.css (add submission styles)

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Create list page (60 min)
- Step 2: Create detail page (40 min)
- Step 3: Add styles (15 min)
- Step 4: Testing (5 min)

## Next Issue

**ISSUE-105:** SubmissionCloningService (2h) - Phase 3 begins
