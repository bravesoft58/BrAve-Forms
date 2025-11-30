import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Define mocks before vi.mock calls
const mocks = {
  getToken: vi.fn().mockResolvedValue('test-token-123'),
  isSignedIn: true,
  getFormTemplates: vi.fn(),
  getFormTemplateById: vi.fn(),
  createFormTemplate: vi.fn(),
  updateFormTemplate: vi.fn(),
  deleteFormTemplate: vi.fn(),
  duplicateFormTemplate: vi.fn(),
};

// Mock @/app/providers
vi.mock('@/app/providers', () => ({
  useAppAuth: () => ({
    getToken: mocks.getToken,
    isSignedIn: mocks.isSignedIn,
  }),
}));

// Mock @/lib/api/forms
vi.mock('@/lib/api/forms', () => ({
  getFormTemplates: (...args: unknown[]) => mocks.getFormTemplates(...args),
  getFormTemplateById: (...args: unknown[]) => mocks.getFormTemplateById(...args),
  createFormTemplate: (...args: unknown[]) => mocks.createFormTemplate(...args),
  updateFormTemplate: (...args: unknown[]) => mocks.updateFormTemplate(...args),
  deleteFormTemplate: (...args: unknown[]) => mocks.deleteFormTemplate(...args),
  duplicateFormTemplate: (...args: unknown[]) => mocks.duplicateFormTemplate(...args),
}));

// Import after mocks
import {
  useFormTemplates,
  useFormTemplate,
  useCreateFormTemplate,
  useUpdateFormTemplate,
  useDeleteFormTemplate,
  useDuplicateFormTemplate,
  useInvalidateTemplates,
  formTemplateKeys,
} from '../useFormTemplates';

const mockTemplatesResponse = [
  {
    id: 'template-001',
    name: 'Daily Inspection Log',
    description: 'Standard daily inspection form',
    category: 'DAILY_LOG',
    schema: { fields: [], version: '1.0' },
    version: 1,
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'template-002',
    name: 'SWPPP Inspection',
    description: 'EPA SWPPP compliance form',
    category: 'EPA_SWPPP',
    schema: { fields: [], version: '1.0' },
    version: 1,
    isActive: true,
    createdAt: '2025-01-14T10:00:00Z',
    updatedAt: '2025-01-14T10:00:00Z',
  },
];

// Test wrapper with fresh QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useFormTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSignedIn = true;
    mocks.getFormTemplates.mockResolvedValue(mockTemplatesResponse);
    mocks.getFormTemplateById.mockResolvedValue(mockTemplatesResponse[0]);
    mocks.createFormTemplate.mockResolvedValue({
      id: 'template-new',
      name: 'New Template',
      category: 'CUSTOM',
      schema: { fields: [] },
      version: 1,
      isActive: true,
    });
    mocks.updateFormTemplate.mockResolvedValue({
      ...mockTemplatesResponse[0],
      name: 'Updated Name',
    });
    mocks.deleteFormTemplate.mockResolvedValue(true);
    mocks.duplicateFormTemplate.mockResolvedValue({
      ...mockTemplatesResponse[0],
      id: 'template-copy',
      name: 'Daily Inspection Log (Copy)',
    });
  });

  describe('useFormTemplates hook', () => {
    it('fetches templates successfully', async () => {
      const { result } = renderHook(() => useFormTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        id: 'template-001',
        name: 'Daily Inspection Log',
        category: 'DAILY_LOG',
      });
    });

    it('filters by category when provided', async () => {
      const { result } = renderHook(
        () => useFormTemplates({ category: 'EPA_SWPPP' as any }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mocks.getFormTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'EPA_SWPPP' }),
        'test-token-123'
      );
    });

    it('does not fetch when not signed in', async () => {
      mocks.isSignedIn = false;

      const { result } = renderHook(() => useFormTemplates(), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mocks.getFormTemplates).not.toHaveBeenCalled();
    });
  });

  describe('useFormTemplate hook', () => {
    it('fetches single template by ID', async () => {
      const { result } = renderHook(() => useFormTemplate('template-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatchObject({
        id: 'template-001',
        name: 'Daily Inspection Log',
      });
      expect(mocks.getFormTemplateById).toHaveBeenCalledWith('template-001', 'test-token-123');
    });

    it('does not fetch when ID is undefined', async () => {
      const { result } = renderHook(() => useFormTemplate(undefined), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mocks.getFormTemplateById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateFormTemplate hook', () => {
    it('creates template successfully', async () => {
      const { result } = renderHook(() => useCreateFormTemplate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Template',
          category: 'CUSTOM',
          schema: { fields: [] },
        });
      });

      expect(mocks.createFormTemplate).toHaveBeenCalledWith(
        {
          name: 'New Template',
          category: 'CUSTOM',
          schema: { fields: [] },
        },
        'test-token-123'
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles creation error', async () => {
      mocks.createFormTemplate.mockRejectedValueOnce(new Error('Validation failed'));

      const { result } = renderHook(() => useCreateFormTemplate(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            name: '',
            category: 'CUSTOM',
            schema: { fields: [] },
          });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateFormTemplate hook', () => {
    it('updates template successfully', async () => {
      const { result } = renderHook(() => useUpdateFormTemplate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'template-001',
          input: { name: 'Updated Name' },
        });
      });

      expect(mocks.updateFormTemplate).toHaveBeenCalledWith(
        'template-001',
        { name: 'Updated Name' },
        'test-token-123'
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteFormTemplate hook', () => {
    it('deletes template successfully', async () => {
      const { result } = renderHook(() => useDeleteFormTemplate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('template-001');
      });

      expect(mocks.deleteFormTemplate).toHaveBeenCalledWith('template-001', 'test-token-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDuplicateFormTemplate hook', () => {
    it('duplicates template successfully', async () => {
      const { result } = renderHook(() => useDuplicateFormTemplate(), { wrapper });

      await act(async () => {
        const newTemplate = await result.current.mutateAsync('template-001');
        expect(newTemplate.id).toBe('template-copy');
        expect(newTemplate.name).toContain('Copy');
      });

      expect(mocks.duplicateFormTemplate).toHaveBeenCalledWith('template-001', 'test-token-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('formTemplateKeys', () => {
    it('generates correct query keys', () => {
      expect(formTemplateKeys.all).toEqual(['formTemplates']);
      expect(formTemplateKeys.lists()).toEqual(['formTemplates', 'list']);
      expect(formTemplateKeys.list({ category: 'CUSTOM' as any })).toEqual([
        'formTemplates',
        'list',
        { category: 'CUSTOM' },
      ]);
      expect(formTemplateKeys.detail('template-123')).toEqual([
        'formTemplates',
        'detail',
        'template-123',
      ]);
    });
  });
});
