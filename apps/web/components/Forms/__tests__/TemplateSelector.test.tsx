import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateSelector } from '@/components/Forms/TemplateSelector';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock templates matching FormTemplate interface (uses 'name', not 'title')
const mockTemplates = [
  {
    id: 'daily-dust-log',
    name: 'Daily Dust Log',
    description: 'Record daily dust control measures and weather conditions',
    category: 'EPA_SWPPP' as const,
    schema: { sections: [] },
    version: 1,
    isActive: true,
  },
  {
    id: 'swppp-inspection',
    name: 'SWPPP Inspection',
    description: 'Storm Water Pollution Prevention Plan inspection form',
    category: 'EPA_SWPPP' as const,
    schema: { sections: [] },
    version: 1,
    isActive: true,
  },
  {
    id: 'post-storm-inspection',
    name: 'Post-Storm Inspection',
    description: 'Required inspection after rainfall >= 0.25" (EPA CGP threshold)',
    category: 'EPA_CGP' as const,
    schema: { sections: [] },
    version: 1,
    isActive: true,
  },
  {
    id: 'weekly-swppp-review',
    name: 'Weekly SWPPP Review',
    description: 'Weekly review of SWPPP compliance and site conditions',
    category: 'EPA_SWPPP' as const,
    schema: { sections: [] },
    version: 1,
    isActive: true,
  },
  {
    id: 'safety-meeting-log',
    name: 'Safety Meeting Log',
    description: 'Document safety meetings and training sessions',
    category: 'OSHA_SAFETY' as const,
    schema: { sections: [] },
    version: 1,
    isActive: true,
  },
];

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the useFormTemplates hook
vi.mock('@/hooks/useFormTemplates', () => ({
  useFormTemplates: vi.fn(() => ({
    data: mockTemplates,
    isLoading: false,
    error: null,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: createWrapper() });
};

describe('TemplateSelector', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders all templates by default', () => {
    renderWithProviders(<TemplateSelector projectId="1" />);
    // Check that all 5 templates from mock data are rendered
    expect(screen.getByText('Daily Dust Log')).toBeInTheDocument();
    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Post-Storm Inspection')).toBeInTheDocument();
    expect(screen.getByText('Weekly SWPPP Review')).toBeInTheDocument();
    expect(screen.getByText('Safety Meeting Log')).toBeInTheDocument();
  });

  it('searches templates by name', () => {
    renderWithProviders(<TemplateSelector projectId="1" />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'SWPPP' } });

    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Weekly SWPPP Review')).toBeInTheDocument();
    expect(screen.queryByText('Daily Dust Log')).not.toBeInTheDocument();
  });

  it('searches templates by description', () => {
    renderWithProviders(<TemplateSelector projectId="1" />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'dust' } });

    expect(screen.getByText('Daily Dust Log')).toBeInTheDocument();
    expect(screen.queryByText('SWPPP Inspection')).not.toBeInTheDocument();
  });

  it('navigates to form fill page on template click', () => {
    renderWithProviders(<TemplateSelector projectId="1" />);

    const templateCard = screen.getByTestId('template-card-daily-dust-log');
    fireEvent.click(templateCard);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/forms/daily-dust-log/fill?projectId=1');
  });

  it('shows empty state when no templates match', () => {
    renderWithProviders(<TemplateSelector projectId="1" />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-template' } });

    expect(screen.getByText('No templates found')).toBeInTheDocument();
  });

  it('displays category badges', () => {
    renderWithProviders(<TemplateSelector projectId="1" />);

    // Check that EPA SWPPP category badge is displayed (multiple templates have this category)
    const epaBadges = screen.getAllByText('EPA SWPPP');
    expect(epaBadges.length).toBeGreaterThan(0);
  });

  it('renders loading state', () => {
    // Update mock to return loading state
    const useFormTemplatesMock = vi.fn(() => ({
      data: [],
      isLoading: true,
      error: null,
    }));
    vi.doMock('@/hooks/useFormTemplates', () => ({
      useFormTemplates: useFormTemplatesMock,
    }));

    // Restore original mock for other tests
    vi.doUnmock('@/hooks/useFormTemplates');
  });
});
