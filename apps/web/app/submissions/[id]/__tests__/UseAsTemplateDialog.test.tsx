import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { UseAsTemplateDialog } from '../UseAsTemplateDialog';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock app providers
vi.mock('@/app/providers', () => ({
  useAppAuth: vi.fn(() => ({
    userId: 'test-user-id',
    orgId: 'test-org-id',
    orgRole: 'ADMIN',
    orgSlug: 'test-org',
    isLoaded: true,
    isSignedIn: true,
    sessionId: 'test-session-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    getToken: vi.fn().mockResolvedValue('dev-token-123'),
  })),
}));

// Mock submissions API
vi.mock('@/lib/api/submissions', () => ({
  cloneSubmission: vi.fn(),
}));

describe('UseAsTemplateDialog', () => {
  let queryClient: QueryClient;

  const defaultProps = {
    submissionId: 'test-submission-123',
    templateId: 'test-template-456',
    isOpen: true,
    onClose: vi.fn(),
  };

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MantineProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MantineProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Use as Template')).toBeInTheDocument();
      expect(screen.getByText('Keep All Values')).toBeInTheDocument();
      expect(screen.getByText('Structure Only')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<UseAsTemplateDialog {...defaultProps} isOpen={false} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText('Use as Template')).not.toBeInTheDocument();
    });

    it('should render clone mode descriptions', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/Copy all field values. Date, time, and signature fields will be reset/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Keep form structure but clear all field values/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Start completely fresh. Same template, no pre-filled values/)
      ).toBeInTheDocument();
    });

    it('should render Cancel and Create Template buttons', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Template/i })).toBeInTheDocument();
    });

    it('should have Keep All Values selected by default', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const keepAllRadio = screen.getByRole('radio', { name: /Keep All Values/i });
      expect(keepAllRadio).toBeChecked();
    });
  });

  describe('User Interactions', () => {
    it('should allow selecting different clone modes', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      // Find radios by their value attribute since Mantine wraps labels differently
      const radios = screen.getAllByRole('radio');
      const structureOnlyRadio = radios.find(
        (r) => (r as HTMLInputElement).value === 'structure_only'
      );
      const clearAllRadio = radios.find((r) => (r as HTMLInputElement).value === 'clear_all');

      fireEvent.click(structureOnlyRadio!);
      expect(structureOnlyRadio).toBeChecked();

      fireEvent.click(clearAllRadio!);
      expect(clearAllRadio).toBeChecked();
    });

    it('should close dialog when Cancel button clicked', () => {
      const onClose = vi.fn();
      render(<UseAsTemplateDialog {...defaultProps} onClose={onClose} />, {
        wrapper: createWrapper(),
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    // Note: Mantine Modal's built-in close button and overlay click are tested by Mantine itself
    // We trust Mantine's implementation and don't duplicate those tests here
  });

  describe('Clone Functionality', () => {
    it('should call cloneSubmission with correct mode when Create Template clicked', async () => {
      const { cloneSubmission } = await import('@/lib/api/submissions');
      (cloneSubmission as any).mockResolvedValue({ id: 'cloned-123' });

      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(cloneSubmission).toHaveBeenCalledWith(
          'test-submission-123',
          'keep_all',
          'dev-token-123'
        );
      });
    });

    it('should call cloneSubmission with structure_only mode', async () => {
      const { cloneSubmission } = await import('@/lib/api/submissions');
      (cloneSubmission as any).mockResolvedValue({ id: 'cloned-123' });

      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const radios = screen.getAllByRole('radio');
      const structureOnlyRadio = radios.find(
        (r) => (r as HTMLInputElement).value === 'structure_only'
      );
      fireEvent.click(structureOnlyRadio!);

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(cloneSubmission).toHaveBeenCalledWith(
          'test-submission-123',
          'structure_only',
          'dev-token-123'
        );
      });
    });

    it('should show loading state while cloning', async () => {
      const { cloneSubmission } = await import('@/lib/api/submissions');
      (cloneSubmission as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'cloned-123' }), 100))
      );

      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      // Mantine's Button with loading prop shows a loader but keeps the same accessible name
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Creating.../i });
        expect(button).toBeInTheDocument();
      });
    });

    it('should navigate to form fill page after successful clone', async () => {
      const { cloneSubmission } = await import('@/lib/api/submissions');
      const { useRouter } = await import('next/navigation');
      const mockPush = vi.fn();

      (cloneSubmission as any).mockResolvedValue({ id: 'cloned-123' });
      (useRouter as any).mockReturnValue({ push: mockPush });

      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/forms/test-template-456/fill?draftId=cloned-123');
      });
    });

    it('should close dialog after successful clone', async () => {
      const { cloneSubmission } = await import('@/lib/api/submissions');
      const onClose = vi.fn();

      (cloneSubmission as any).mockResolvedValue({ id: 'cloned-123' });

      render(<UseAsTemplateDialog {...defaultProps} onClose={onClose} />, {
        wrapper: createWrapper(),
      });

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should display error message when clone fails', async () => {
      const { cloneSubmission } = await import('@/lib/api/submissions');

      // Suppress console.error for this test since we're testing error handling
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (cloneSubmission as any).mockRejectedValue(new Error('Failed to clone submission'));

      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        // Mantine Alert component with error message
        expect(screen.getByText('Clone Failed')).toBeInTheDocument();
        expect(screen.getByText(/Failed to clone submission/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper radio button values', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const radios = screen.getAllByRole('radio');
      const values = radios.map((r) => (r as HTMLInputElement).value);

      expect(values).toContain('keep_all');
      expect(values).toContain('structure_only');
      expect(values).toContain('clear_all');
    });

    it('should have first option checked by default', () => {
      render(<UseAsTemplateDialog {...defaultProps} />, { wrapper: createWrapper() });

      const radios = screen.getAllByRole('radio');
      const keepAllRadio = radios.find((r) => (r as HTMLInputElement).value === 'keep_all');
      expect(keepAllRadio).toBeChecked();
    });
  });
});
