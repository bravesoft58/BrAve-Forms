# ISSUE-101: Inspector Portal Layout

**Sprint:** Sprint 4 | **Phase:** 1 - QR Inspector Portal | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-100 (QR token generation)
**Status:** COMPLETE

## What You'll Do

Create public inspector portal route with token validation, read-only layout, and mobile tablet optimization.

## Prerequisites

- [ ] ISSUE-100 complete (QR token service functional)
- [ ] Web frontend running at http://localhost:30102
- [ ] Code editor open to apps/web directory
- [ ] Token validation API accessible

## Step-by-Step Instructions

### Step 1: Create Token Validation API (60 min)

Create `apps/web/lib/api/qr-portal.ts`:

```typescript
import { ApolloClient, gql } from '@apollo/client';

export interface QRTokenPayload {
  projectId: string;
  orgId: string;
  permissions: string[];
  tokenType: 'inspector_access';
  expiresAt: Date;
}

export interface ProjectInfo {
  id: string;
  name: string;
  address: string;
  orgName: string;
  siteManager: string;
  permitNumber: string;
}

const VALIDATE_QR_TOKEN = gql`
  query ValidateQRToken($token: String!) {
    validateQRToken(token: $token) {
      valid
      projectId
      orgId
      permissions
      expiresAt
      error
    }
  }
`;

const GET_PROJECT_INFO = gql`
  query GetProjectInfoByToken($token: String!) {
    projectByToken(token: $token) {
      id
      name
      address
      orgName
      siteManager
      permitNumber
    }
  }
`;

export async function validateTokenAndGetProject(token: string): Promise<ProjectInfo | null> {
  try {
    // Validate token
    const { data: validationData } = await apolloClient.query({
      query: VALIDATE_QR_TOKEN,
      variables: { token },
      fetchPolicy: 'no-cache', // Always fresh validation
    });

    if (!validationData.validateQRToken.valid) {
      console.error('Invalid token:', validationData.validateQRToken.error);
      return null;
    }

    // Fetch project info
    const { data: projectData } = await apolloClient.query({
      query: GET_PROJECT_INFO,
      variables: { token },
      fetchPolicy: 'no-cache',
    });

    return projectData.projectByToken;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

export async function isTokenValid(token: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.query({
      query: VALIDATE_QR_TOKEN,
      variables: { token },
      fetchPolicy: 'no-cache',
    });

    return data.validateQRToken.valid;
  } catch (error) {
    return false;
  }
}
```

### Step 2: Create Inspector Portal Layout (60 min)

Create `apps/web/app/inspector/[token]/layout.tsx`:

```typescript
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { validateTokenAndGetProject } from '@/lib/api/qr-portal';

export default async function InspectorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { token: string };
}) {
  const projectData = await validateTokenAndGetProject(params.token);

  if (!projectData) {
    redirect('/inspector/invalid-token');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with BrAve Forms branding */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BrAve Forms</h1>
              <p className="text-sm text-gray-500">Inspector Portal - Read-Only Access</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{projectData.name}</p>
              <p className="text-xs text-gray-500">Permit: {projectData.permitNumber}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Read-only inspector access. Contact site manager to request changes.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### Step 3: Create Inspector Portal Page (30 min)

Create `apps/web/app/inspector/[token]/page.tsx`:

```typescript
import { validateTokenAndGetProject } from '@/lib/api/qr-portal';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InspectorPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const projectData = await validateTokenAndGetProject(params.token);

  if (!projectData) {
    redirect('/inspector/invalid-token');
  }

  return (
    <div className="space-y-6">
      {/* Project Information Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Project Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Project Name</dt>
            <dd className="text-base text-gray-900">{projectData.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="text-base text-gray-900">{projectData.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Organization</dt>
            <dd className="text-base text-gray-900">{projectData.orgName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Site Manager</dt>
            <dd className="text-base text-gray-900">{projectData.siteManager}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Permit Number</dt>
            <dd className="text-base text-gray-900">{projectData.permitNumber}</dd>
          </div>
        </dl>
      </div>

      {/* Navigation Cards (Tablet-Optimized) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Submissions Card */}
        <Link
          href={`/inspector/${params.token}/submissions`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">
            Form Submissions
          </h3>
          <p className="text-sm text-gray-600">
            View inspection reports, SWPPP forms, and daily logs
          </p>
        </Link>

        {/* Photos Card */}
        <Link
          href={`/inspector/${params.token}/photos`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600">
            Photo Gallery
          </h3>
          <p className="text-sm text-gray-600">
            Browse site photos with GPS locations and timestamps
          </p>
        </Link>

        {/* Reports Card */}
        <Link
          href={`/inspector/${params.token}/reports`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <svg
              className="w-12 h-12 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600">
            Reports
          </h3>
          <p className="text-sm text-gray-600">
            Download compliance reports and summaries
          </p>
        </Link>
      </div>

      {/* Access Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mr-3 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Read-Only Access
            </h4>
            <p className="text-sm text-blue-700">
              You have inspector-level access to view project data. To submit forms or
              make changes, contact the site manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Create Invalid Token Page (30 min)

Create `apps/web/app/inspector/invalid-token/page.tsx`:

```typescript
export default function InvalidTokenPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <svg
          className="w-24 h-24 text-red-600 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Invalid QR Code</h1>

        <p className="text-gray-600 mb-8">
          This QR code is expired, revoked, or invalid. Please request a new QR code
          from the site manager.
        </p>

        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium mb-2">Common reasons:</p>
          <ul className="text-sm text-gray-600 text-left space-y-1">
            <li>- QR code expired (24-hour limit)</li>
            <li>- QR code was regenerated by site manager</li>
            <li>- Invalid or malformed QR code</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/__tests__/inspector-portal.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { validateTokenAndGetProject } from '@/lib/api/qr-portal';
import InspectorPortalPage from '@/app/inspector/[token]/page';

jest.mock('@/lib/api/qr-portal');

describe('Inspector Portal', () => {
  const mockProjectData = {
    id: 'project-123',
    name: 'Downtown Construction',
    address: '123 Main St',
    orgName: 'ABC Construction',
    siteManager: 'John Doe',
    permitNumber: 'SW-2025-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render project information for valid token', async () => {
    (validateTokenAndGetProject as jest.Mock).mockResolvedValue(mockProjectData);

    const page = await InspectorPortalPage({ params: { token: 'valid-token' } });
    render(page);

    expect(screen.getByText('Downtown Construction')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('ABC Construction')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('SW-2025-001')).toBeInTheDocument();
  });

  it('should render navigation cards', async () => {
    (validateTokenAndGetProject as jest.Mock).mockResolvedValue(mockProjectData);

    const page = await InspectorPortalPage({ params: { token: 'valid-token' } });
    render(page);

    expect(screen.getByText('Form Submissions')).toBeInTheDocument();
    expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('should show read-only access message', async () => {
    (validateTokenAndGetProject as jest.Mock).mockResolvedValue(mockProjectData);

    const page = await InspectorPortalPage({ params: { token: 'valid-token' } });
    render(page);

    expect(screen.getByText(/Read-Only Access/i)).toBeInTheDocument();
    expect(screen.getByText(/contact the site manager/i)).toBeInTheDocument();
  });

  it('should redirect for invalid token', async () => {
    (validateTokenAndGetProject as jest.Mock).mockResolvedValue(null);

    // Should redirect to /inspector/invalid-token
    await expect(
      InspectorPortalPage({ params: { token: 'invalid-token' } })
    ).rejects.toThrow();
  });

  it('should have large touch targets for tablet use', async () => {
    (validateTokenAndGetProject as jest.Mock).mockResolvedValue(mockProjectData);

    const page = await InspectorPortalPage({ params: { token: 'valid-token' } });
    const { container } = render(page);

    const navCards = container.querySelectorAll('a');
    navCards.forEach((card) => {
      const styles = window.getComputedStyle(card);
      const padding = parseInt(styles.padding);
      expect(padding).toBeGreaterThanOrEqual(24); // 1.5rem = 24px (tablet-friendly)
    });
  });
});

describe('Invalid Token Page', () => {
  it('should render error message', () => {
    render(<InvalidTokenPage />);

    expect(screen.getByText('Invalid QR Code')).toBeInTheDocument();
    expect(screen.getByText(/expired, revoked, or invalid/i)).toBeInTheDocument();
  });

  it('should list common reasons', () => {
    render(<InvalidTokenPage />);

    expect(screen.getByText(/24-hour limit/i)).toBeInTheDocument();
    expect(screen.getByText(/regenerated by site manager/i)).toBeInTheDocument();
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test inspector-portal
```

**Screenshot:** Save failing test to `evidence/ISSUE-101/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test inspector-portal
```

Expected: All tests pass

**Screenshot:** Save passing tests to `evidence/ISSUE-101/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/lib/api/qr-portal.ts
- apps/web/app/inspector/[token]/layout.tsx
- apps/web/app/inspector/[token]/page.tsx
- apps/web/app/inspector/invalid-token/page.tsx
- apps/web/**tests**/inspector-portal.test.tsx

**Backend Resolver (Required):**

- apps/backend/src/modules/qr-portal/resolvers/validate-qr-token.resolver.ts

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import { QRTokenService } from '../services/qr-token.service';

@Resolver()
export class ValidateQRTokenResolver {
  constructor(private readonly qrTokenService: QRTokenService) {}

  @Query(() => ValidationResult)
  async validateQRToken(@Args('token') token: string) {
    const payload = await this.qrTokenService.validateQRToken(token);

    if (!payload) {
      return {
        valid: false,
        error: 'Invalid or expired token',
      };
    }

    return {
      valid: true,
      projectId: payload.projectId,
      orgId: payload.orgId,
      permissions: payload.permissions,
      expiresAt: payload.expiresAt,
    };
  }

  @Query(() => Project)
  async projectByToken(@Args('token') token: string) {
    const payload = await this.qrTokenService.validateQRToken(token);

    if (!payload) {
      throw new Error('Invalid token');
    }

    return this.prisma.project.findUnique({
      where: { id: payload.projectId },
      include: {
        organization: true,
      },
    });
  }
}
```

## Verification Checklist

- [ ] Token validation API created
- [ ] Inspector portal layout renders
- [ ] Project information displays
- [ ] Navigation cards work
- [ ] Invalid token page shows
- [ ] Read-only message visible
- [ ] Large touch targets (tablet-friendly)
- [ ] Tests passing (10+ tests)
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-101/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests - 10+ tests)
  - coverage-report.png (>80% coverage)
- ui/
  - portal-home.png (inspector portal page)
  - invalid-token.png (error page)
  - tablet-view.png (iPad viewport screenshot)
- code/
  - qr-portal-api.png (validateTokenAndGetProject implementation)

## Troubleshooting

**Problem:** Token validation fails with 401

- **Cause:** Backend ValidateQRTokenResolver not created
- **Solution:** Create resolver in apps/backend (see Files to Create)

**Problem:** Layout not applying to all pages

- **Cause:** layout.tsx in wrong directory
- **Solution:** Must be at /inspector/[token]/layout.tsx (not /inspector/layout.tsx)

**Problem:** Touch targets too small on tablet

- **Cause:** Insufficient padding on navigation cards
- **Solution:** Use p-6 (1.5rem = 24px minimum for gloves)

**Problem:** Invalid token doesn't redirect

- **Cause:** Next.js redirect() not working in Server Component
- **Solution:** Ensure redirect() imported from 'next/navigation'

## Success Criteria

- [ ] Token validation API functional
- [ ] Valid tokens render inspector portal
- [ ] Invalid tokens redirect to error page
- [ ] Project information displays correctly
- [ ] Navigation cards link to submissions/photos/reports
- [ ] Read-only access message visible
- [ ] Touch targets >= 24px (tablet-friendly)
- [ ] Tests pass with >80% coverage
- [ ] Build succeeds

## Time Estimate

**3 hours total:**

- Create token validation API: 60 min
- Create inspector portal layout: 60 min
- Create inspector portal page: 30 min
- Create invalid token page: 30 min

## Next Issue

**ISSUE-102:** Project-Level QR Code Display (1h)

- Prerequisites: This issue complete (portal layout working)
- Creates: QR code generator with print option
- Uses: generateQRToken() mutation from ISSUE-100
