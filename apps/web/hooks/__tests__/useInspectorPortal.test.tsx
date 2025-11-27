import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module
const mocks = {
  getInspectorSubmissions: vi.fn(),
  getInspectorPhotos: vi.fn(),
};

vi.mock('@/lib/api/qr-portal', () => ({
  getInspectorSubmissions: (...args: unknown[]) => mocks.getInspectorSubmissions(...args),
  getInspectorPhotos: (...args: unknown[]) => mocks.getInspectorPhotos(...args),
  QRPortalAPIError: class QRPortalAPIError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      this.name = 'QRPortalAPIError';
    }
  },
}));

import { useInspectorSubmissions, useInspectorPhotos } from '../useInspectorPortal';

// Mock data
const mockSubmissions = [
  {
    id: 'sub_001',
    templateName: 'Daily Site Inspection',
    templateCategory: 'OSHA_SAFETY',
    status: 'APPROVED' as const,
    submittedBy: 'John Inspector',
    submittedAt: '2025-11-25T14:30:00Z',
    sections: [
      {
        id: 'sec_1',
        title: 'General Information',
        fields: [
          { id: 'f1', name: 'date', label: 'Inspection Date', type: 'date', value: '2025-11-25' },
        ],
      },
    ],
  },
  {
    id: 'sub_002',
    templateName: 'Storm Water Inspection',
    templateCategory: 'EPA_SWPPP',
    status: 'SUBMITTED' as const,
    submittedBy: 'Jane Compliance',
    submittedAt: '2025-11-24T09:15:00Z',
    sections: [],
  },
];

const mockPhotos = [
  {
    id: 'photo_001',
    url: '/photos/sediment-basin.jpg',
    thumbnailUrl: '/photos/sediment-basin-thumb.jpg',
    caption: 'Sediment basin - east side',
    takenAt: '2025-11-25T10:30:00Z',
    uploadedBy: 'John Inspector',
    location: {
      latitude: 39.5296,
      longitude: -119.8138,
      altitude: 1373,
    },
    fileSize: 2456789,
    mimeType: 'image/jpeg',
  },
  {
    id: 'photo_002',
    url: '/photos/erosion-control.jpg',
    thumbnailUrl: '/photos/erosion-control-thumb.jpg',
    caption: 'Erosion control measures',
    takenAt: '2025-11-25T10:45:00Z',
    uploadedBy: 'John Inspector',
    fileSize: 1987654,
    mimeType: 'image/jpeg',
  },
];

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useInspectorSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInspectorSubmissions.mockResolvedValue(mockSubmissions);
  });

  it('fetches submissions when token is provided', async () => {
    const { result } = renderHook(() => useInspectorSubmissions('valid-token'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSubmissions);
    expect(mocks.getInspectorSubmissions).toHaveBeenCalledWith('valid-token');
  });

  it('does not fetch when token is null', async () => {
    const { result } = renderHook(() => useInspectorSubmissions(null), {
      wrapper: createWrapper(),
    });

    // Should not be loading because query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mocks.getInspectorSubmissions).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useInspectorSubmissions('valid-token', false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mocks.getInspectorSubmissions).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    const apiError = new Error('API Error');
    mocks.getInspectorSubmissions.mockRejectedValue(apiError);

    const { result } = renderHook(() => useInspectorSubmissions('valid-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.error).toBeDefined();
  });

  it('returns empty array when no submissions exist', async () => {
    mocks.getInspectorSubmissions.mockResolvedValue([]);

    const { result } = renderHook(() => useInspectorSubmissions('valid-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useInspectorPhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInspectorPhotos.mockResolvedValue(mockPhotos);
  });

  it('fetches photos when token is provided', async () => {
    const { result } = renderHook(() => useInspectorPhotos('valid-token'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPhotos);
    expect(mocks.getInspectorPhotos).toHaveBeenCalledWith('valid-token');
  });

  it('does not fetch when token is null', async () => {
    const { result } = renderHook(() => useInspectorPhotos(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mocks.getInspectorPhotos).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useInspectorPhotos('valid-token', false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mocks.getInspectorPhotos).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    const apiError = new Error('API Error');
    mocks.getInspectorPhotos.mockRejectedValue(apiError);

    const { result } = renderHook(() => useInspectorPhotos('valid-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.error).toBeDefined();
  });

  it('returns photos with GPS coordinates', async () => {
    const { result } = renderHook(() => useInspectorPhotos('valid-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const photoWithLocation = result.current.data?.find((p) => p.location);
    expect(photoWithLocation).toBeDefined();
    expect(photoWithLocation?.location?.latitude).toBe(39.5296);
    expect(photoWithLocation?.location?.longitude).toBe(-119.8138);
  });

  it('returns photos without GPS coordinates', async () => {
    const { result } = renderHook(() => useInspectorPhotos('valid-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const photoWithoutLocation = result.current.data?.find((p) => !p.location);
    expect(photoWithoutLocation).toBeDefined();
    expect(photoWithoutLocation?.location).toBeUndefined();
  });
});
