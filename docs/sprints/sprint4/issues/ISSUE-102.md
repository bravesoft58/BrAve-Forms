# ISSUE-102: Project-Level QR Code Display

**Sprint:** Sprint 4 | **Phase:** 1 - QR Inspector Portal | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-101 (Inspector portal layout)
**Status:** COMPLETE

## What You'll Do

Add QR code generation and display to project pages with print and regenerate functionality.

## Prerequisites

- [ ] ISSUE-101 complete (Inspector portal functional)
- [ ] Web frontend running at http://localhost:30102
- [ ] Code editor open to apps/web directory
- [ ] qrcode.react library installed

## Step-by-Step Instructions

### Step 1: Install QR Code Library (5 min)

```bash
cd apps/web
pnpm add qrcode.react
pnpm add -D @types/qrcode.react
```

### Step 2: Create QR Code Generator Hook (20 min)

Create `apps/web/lib/hooks/useGenerateQRToken.ts`:

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

const GENERATE_QR_TOKEN = gql`
  mutation GenerateQRToken($projectId: String!) {
    generateQRToken(projectId: $projectId)
  }
`;

const REGENERATE_QR_TOKEN = gql`
  mutation RegenerateQRToken($projectId: String!) {
    regenerateQRToken(projectId: $projectId)
  }
`;

export interface QRTokenData {
  token: string;
  expiresAt: Date;
  url: string;
}

export function useGenerateQRToken(projectId: string) {
  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apolloClient.mutate({
        mutation: GENERATE_QR_TOKEN,
        variables: { projectId },
      });
      return data.generateQRToken;
    },
    onSuccess: (token) => {
      console.log('QR token generated:', token);
    },
    onError: (error) => {
      console.error('Failed to generate QR token:', error);
    },
  });

  return {
    generateToken: mutation.mutate,
    isGenerating: mutation.isPending,
    token: mutation.data,
    error: mutation.error,
  };
}

export function useRegenerateQRToken(projectId: string) {
  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apolloClient.mutate({
        mutation: REGENERATE_QR_TOKEN,
        variables: { projectId },
      });
      return data.regenerateQRToken;
    },
  });

  return {
    regenerateToken: mutation.mutate,
    isRegenerating: mutation.isPending,
    newToken: mutation.data,
  };
}
```

### Step 3: Create QR Code Generator Component (25 min)

Create `apps/web/components/QR/QRCodeGenerator.tsx`:

```typescript
'use client';

import { useState } from 'react';
import QRCode from 'qrcode.react';
import { useGenerateQRToken, useRegenerateQRToken } from '@/lib/hooks/useGenerateQRToken';

interface QRCodeGeneratorProps {
  projectId: string;
  projectName: string;
}

export function QRCodeGenerator({ projectId, projectName }: QRCodeGeneratorProps) {
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const { generateToken, isGenerating, token } = useGenerateQRToken(projectId);
  const { regenerateToken, isRegenerating, newToken } = useRegenerateQRToken(projectId);

  const currentToken = newToken || token;
  const qrUrl = currentToken
    ? `${window.location.origin}/inspector/${currentToken}`
    : '';

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = () => {
    regenerateToken();
    setShowRegenConfirm(false);
  };

  const formatExpiration = (token: string) => {
    // JWT tokens expire in 24 hours
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return expires.toLocaleString();
  };

  if (!currentToken) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Generate QR Code for Inspectors</h2>
        <p className="text-gray-600 mb-6">
          Generate a QR code that allows inspectors to access this project's data
          without logging in. The code expires after 24 hours.
        </p>
        <button
          onClick={() => generateToken()}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate QR Code'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 print:shadow-none">
      <div className="print:hidden">
        <h2 className="text-xl font-semibold mb-4">Inspector QR Code</h2>
      </div>

      {/* QR Code (optimized for print) */}
      <div className="flex flex-col items-center space-y-4">
        <div className="border-4 border-gray-200 p-4 rounded-lg bg-white">
          <QRCode
            value={qrUrl}
            size={256}
            level="H"
            includeMargin={true}
            className="print:w-64 print:h-64"
          />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold print:text-2xl">{projectName}</p>
          <p className="text-sm text-gray-600 print:text-base">Inspector Access Portal</p>
          <p className="text-xs text-gray-500 mt-2 print:text-sm">
            Expires: {formatExpiration(currentToken)}
          </p>
        </div>
      </div>

      {/* Instructions (print-friendly) */}
      <div className="mt-6 border-t pt-4 print:border-t-2">
        <h3 className="font-semibold mb-2 print:text-lg">Instructions for Inspector:</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside print:text-base">
          <li>Scan this QR code with your mobile device camera</li>
          <li>Tap the notification to open the inspector portal</li>
          <li>View form submissions, photos, and reports</li>
          <li>Read-only access (no editing allowed)</li>
        </ol>
      </div>

      {/* Actions (hidden when printing) */}
      <div className="mt-6 flex gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Print QR Code
        </button>

        {showRegenConfirm ? (
          <div className="flex-1 flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              {isRegenerating ? 'Regenerating...' : 'Confirm Regenerate'}
            </button>
            <button
              onClick={() => setShowRegenConfirm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRegenConfirm(true)}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Regenerate QR Code
          </button>
        )}
      </div>

      {/* Warning (hidden when printing) */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 print:hidden">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Regenerating the QR code will invalidate the current code
          and any existing inspector links.
        </p>
      </div>
    </div>
  );
}
```

### Step 4: Add QR Code Page to Project (10 min)

Create `apps/web/app/dashboard/projects/[id]/qr/page.tsx`:

```typescript
import { QRCodeGenerator } from '@/components/QR/QRCodeGenerator';
import { getProjectById } from '@/lib/api/projects';
import { redirect } from 'next/navigation';

export default async function ProjectQRCodePage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProjectById(params.id);

  if (!project) {
    redirect('/dashboard/projects');
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inspector QR Code</h1>
        <p className="text-gray-600 mt-2">
          Generate a QR code for inspectors to access this project
        </p>
      </div>

      <QRCodeGenerator projectId={project.id} projectName={project.name} />

      {/* Back to Project Link */}
      <div className="mt-6 print:hidden">
        <a
          href={`/dashboard/projects/${project.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Project
        </a>
      </div>
    </div>
  );
}
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/web/__tests__/qr-code-generator.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QRCodeGenerator } from '@/components/QR/QRCodeGenerator';
import { useGenerateQRToken, useRegenerateQRToken } from '@/lib/hooks/useGenerateQRToken';

jest.mock('@/lib/hooks/useGenerateQRToken');
jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

describe('QRCodeGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: null,
    });
    (useRegenerateQRToken as jest.Mock).mockReturnValue({
      regenerateToken: jest.fn(),
      isRegenerating: false,
      newToken: null,
    });
  });

  it('should show generate button when no token exists', () => {
    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    expect(screen.getByText('Generate QR Code')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('should call generateToken when button clicked', () => {
    const mockGenerate = jest.fn();
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: mockGenerate,
      isGenerating: false,
      token: null,
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    fireEvent.click(screen.getByText('Generate QR Code'));

    expect(mockGenerate).toHaveBeenCalled();
  });

  it('should display QR code when token exists', () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    const qrCode = screen.getByTestId('qr-code');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode.textContent).toContain('/inspector/mock-token-123');
  });

  it('should display project name with QR code', () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Downtown Site" />);

    expect(screen.getByText('Downtown Site')).toBeInTheDocument();
  });

  it('should show expiration time', () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    expect(screen.getByText(/Expires:/i)).toBeInTheDocument();
  });

  it('should show print button when token exists', () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    expect(screen.getByText('Print QR Code')).toBeInTheDocument();
  });

  it('should call window.print when print button clicked', () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation();

    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    fireEvent.click(screen.getByText('Print QR Code'));

    expect(printSpy).toHaveBeenCalled();

    printSpy.mockRestore();
  });

  it('should show confirmation before regenerating', () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    fireEvent.click(screen.getByText('Regenerate QR Code'));

    expect(screen.getByText('Confirm Regenerate')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call regenerateToken when confirmed', () => {
    const mockRegenerate = jest.fn();

    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    (useRegenerateQRToken as jest.Mock).mockReturnValue({
      regenerateToken: mockRegenerate,
      isRegenerating: false,
      newToken: null,
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    fireEvent.click(screen.getByText('Regenerate QR Code'));
    fireEvent.click(screen.getByText('Confirm Regenerate'));

    expect(mockRegenerate).toHaveBeenCalled();
  });

  it('should cancel regeneration when cancel clicked', () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'mock-token-123',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    fireEvent.click(screen.getByText('Regenerate QR Code'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Regenerate QR Code')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Regenerate')).not.toBeInTheDocument();
  });

  it('should display new token after regeneration', async () => {
    (useGenerateQRToken as jest.Mock).mockReturnValue({
      generateToken: jest.fn(),
      isGenerating: false,
      token: 'old-token-123',
    });

    (useRegenerateQRToken as jest.Mock).mockReturnValue({
      regenerateToken: jest.fn(),
      isRegenerating: false,
      newToken: 'new-token-456',
    });

    render(<QRCodeGenerator projectId="project-123" projectName="Test Project" />);

    const qrCode = screen.getByTestId('qr-code');
    expect(qrCode.textContent).toContain('/inspector/new-token-456');
  });
});
```

Run tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test qr-code-generator
```

**Screenshot:** Save failing test to `evidence/ISSUE-102/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement all code as shown in Steps 1-4.

Run tests:

```bash
pnpm test qr-code-generator
```

Expected: All tests pass

**Screenshot:** Save passing tests to `evidence/ISSUE-102/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/lib/hooks/useGenerateQRToken.ts
- apps/web/components/QR/QRCodeGenerator.tsx
- apps/web/app/dashboard/projects/[id]/qr/page.tsx
- apps/web/**tests**/qr-code-generator.test.tsx

**Modify:**

- apps/web/app/dashboard/projects/[id]/page.tsx (add "Generate QR Code" button)

```typescript
<Link
  href={`/dashboard/projects/${project.id}/qr`}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  Generate QR Code for Inspectors
</Link>
```

## Verification Checklist

- [ ] qrcode.react library installed
- [ ] useGenerateQRToken hook created
- [ ] QRCodeGenerator component renders
- [ ] QR code displays with token
- [ ] Print button opens print dialog
- [ ] Regenerate requires confirmation
- [ ] Regenerate invalidates old token
- [ ] Expiration time shows
- [ ] Tests passing (11+ tests)
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-102/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests - 11+ tests)
  - coverage-report.png (>80% coverage)
- ui/
  - qr-code-display.png (generated QR code)
  - print-preview.png (print view)
  - regenerate-confirm.png (confirmation dialog)
- code/
  - qr-generator-component.png (QRCodeGenerator implementation)

## Troubleshooting

**Problem:** QR code not rendering

- **Cause:** qrcode.react not installed
- **Solution:** Run `pnpm add qrcode.react`

**Problem:** Print styles not applying

- **Cause:** Tailwind print: prefix not working
- **Solution:** Ensure tailwind.config.js has `mode: 'jit'`

**Problem:** Token not persisting after regeneration

- **Cause:** React Query cache not invalidating
- **Solution:** Add `queryClient.invalidateQueries(['qr-token', projectId])`

**Problem:** Window.print() not working in tests

- **Cause:** Jest doesn't implement window.print
- **Solution:** Mock with `jest.spyOn(window, 'print').mockImplementation()`

## Success Criteria

- [ ] QR code generates with valid token
- [ ] QR code displays correctly (256x256)
- [ ] Print button opens print dialog
- [ ] Print view optimized (no buttons, clean layout)
- [ ] Regenerate shows confirmation
- [ ] Regenerate invalidates old token
- [ ] Expiration time accurate (24 hours)
- [ ] Tests pass with >80% coverage
- [ ] Build succeeds

## Time Estimate

**1 hour total:**

- Install library: 5 min
- Create hook: 20 min
- Create component: 25 min
- Add to project page: 10 min

## Next Issue

**ISSUE-103:** Form Submission Viewer (Read-Only) (2h)

- Prerequisites: This issue complete (QR tokens functional)
- Creates: Inspector view of form submissions
- Uses: Token validation from ISSUE-101
