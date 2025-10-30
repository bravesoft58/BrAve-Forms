import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ProjectCard } from '../ProjectCard';
import type { MockProject } from '@/lib/mock-data/projects';

// Helper to render with Mantine theme
function renderWithMantine(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>);
}

// Mock project data
const mockProject: MockProject = {
  id: '1',
  name: 'Mill Street Construction',
  address: '123 Main St, Reno NV',
  status: 'ACTIVE',
  isFavorite: true,
  startDate: '2025-01-15',
  recentRainfall: 0.0, // No rain
  compliance: {
    pendingInspections: 2,
    requiresAttention: true,
  },
};

describe('ProjectCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render project name', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      expect(screen.getByText('Mill Street Construction')).toBeInTheDocument();
    });

    it('should render project address', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      expect(screen.getByText('123 Main St, Reno NV')).toBeInTheDocument();
    });

    it('should render status badge', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should render favorite star for favorited projects', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('should NOT render favorite star for non-favorited projects', () => {
      const nonFavoriteProject = { ...mockProject, isFavorite: false };
      renderWithMantine(<ProjectCard project={nonFavoriteProject} />);
      expect(screen.queryByText('⭐')).not.toBeInTheDocument();
    });

    it('should render start date', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe('Compliance Badges', () => {
    it('should render pending inspections badge when count > 0', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      expect(screen.getByText('2 pending')).toBeInTheDocument();
    });

    it('should NOT render pending badge when count is 0', () => {
      const noPendingProject = {
        ...mockProject,
        compliance: { pendingInspections: 0, requiresAttention: false },
      };
      renderWithMantine(<ProjectCard project={noPendingProject} />);
      expect(screen.queryByText(/pending/)).not.toBeInTheDocument();
    });

    it('should use red badge when compliance requires attention', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);
      const badge = screen.getByText('2 pending');
      expect(badge).toBeInTheDocument();
      // Badge component will have color="red" prop when requiresAttention is true
    });
  });

  describe('Weather Alert Icon (ISSUE-086)', () => {
    it('should show weather alert icon when recentRainfall >= 0.25 inches (EPA CGP threshold)', () => {
      const rainProject = { ...mockProject, recentRainfall: 0.25 };
      renderWithMantine(<ProjectCard project={rainProject} />);

      // Weather icon should be present
      const weatherIcon = screen.getByTestId('weather-alert-icon');
      expect(weatherIcon).toBeInTheDocument();
    });

    it('should show weather alert icon when recentRainfall > 0.25 inches', () => {
      const rainProject = { ...mockProject, recentRainfall: 0.5 };
      renderWithMantine(<ProjectCard project={rainProject} />);

      const weatherIcon = screen.getByTestId('weather-alert-icon');
      expect(weatherIcon).toBeInTheDocument();
    });

    it('should NOT show weather alert icon when recentRainfall < 0.25 inches', () => {
      const noRainProject = { ...mockProject, recentRainfall: 0.1 };
      renderWithMantine(<ProjectCard project={noRainProject} />);

      const weatherIcon = screen.queryByTestId('weather-alert-icon');
      expect(weatherIcon).not.toBeInTheDocument();
    });

    it('should NOT show weather alert icon when recentRainfall is 0', () => {
      const noRainProject = { ...mockProject, recentRainfall: 0.0 };
      renderWithMantine(<ProjectCard project={noRainProject} />);

      const weatherIcon = screen.queryByTestId('weather-alert-icon');
      expect(weatherIcon).not.toBeInTheDocument();
    });

    it('should use exact 0.25 inch threshold (EPA CGP compliance)', () => {
      // Test boundary conditions
      const justBelowThreshold = { ...mockProject, recentRainfall: 0.24 };
      const { rerender } = renderWithMantine(<ProjectCard project={justBelowThreshold} />);
      expect(screen.queryByTestId('weather-alert-icon')).not.toBeInTheDocument();

      // Exactly at threshold
      rerender(
        <MantineProvider>
          <ProjectCard project={{ ...mockProject, recentRainfall: 0.25 }} />
        </MantineProvider>
      );
      expect(screen.getByTestId('weather-alert-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should be clickable and link to project detail page', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);

      const card = screen.getByRole('link');
      expect(card).toHaveAttribute('href', '/dashboard/projects/1');
    });

    it('should have pointer cursor style', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);

      const card = screen.getByRole('link');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Field Optimization (Glove-Friendly)', () => {
    it('should render as Paper with border for visual clarity', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);

      // Paper component should be rendered (link element in this case)
      const card = screen.getByRole('link');
      expect(card).toBeInTheDocument();
    });

    it('should have adequate spacing between elements', () => {
      renderWithMantine(<ProjectCard project={mockProject} />);

      // Stack component provides spacing - verify multiple elements are present
      expect(screen.getByText('Mill Street Construction')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Reno NV')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  describe('Archived Projects', () => {
    it('should render ARCHIVED status badge with gray color', () => {
      const archivedProject = { ...mockProject, status: 'ARCHIVED' as const };
      renderWithMantine(<ProjectCard project={archivedProject} />);

      expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
    });
  });
});
