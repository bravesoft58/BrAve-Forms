import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsListPage from '../page';
import { MantineProvider } from '@mantine/core';

// Mock the auth provider
vi.mock('@/app/providers', () => ({
  useAppAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    isLoaded: true,
    isSignedIn: true,
  })),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('ProjectsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Rendering Tests
  describe('Page Rendering', () => {
    it('should render page title "Projects"', () => {
      renderWithMantine(<ProjectsListPage />);
      // Title has heading role
      expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    });

    it('should render breadcrumbs with Dashboard > Projects', () => {
      renderWithMantine(<ProjectsListPage />);
      // Breadcrumbs component should be present
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      // Check for all instances of "Projects" text
      const projectsText = screen.getAllByText('Projects');
      expect(projectsText.length).toBeGreaterThan(0);
    });

    it('should render New Project button', () => {
      renderWithMantine(<ProjectsListPage />);
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
    });

    it('should render filter tabs (Active, Favorites, Archived)', () => {
      renderWithMantine(<ProjectsListPage />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('should render search input with placeholder', () => {
      renderWithMantine(<ProjectsListPage />);
      expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
    });
  });

  // Grid Display Tests
  describe('Grid Display', () => {
    it('should render project cards in grid layout', () => {
      renderWithMantine(<ProjectsListPage />);

      // Should display mock projects
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();
      expect(screen.getByText(/Downtown Plaza/i)).toBeInTheDocument();
    });

    it('should render responsive grid (SimpleGrid present)', () => {
      const { container } = renderWithMantine(<ProjectsListPage />);

      // SimpleGrid should be present
      const grid = container.querySelector('[class*="SimpleGrid"]');
      expect(grid).toBeInTheDocument();
    });

    it('should display project card with name and address', () => {
      renderWithMantine(<ProjectsListPage />);

      // Check project details are visible
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Main St, Reno NV/i)).toBeInTheDocument();
    });
  });

  // Filter Functionality Tests
  describe('Filter Functionality', () => {
    it('should filter active projects by default', () => {
      renderWithMantine(<ProjectsListPage />);

      // Active projects should be visible
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Archived projects should NOT be visible
      expect(screen.queryByText(/Old Highway Project/i)).not.toBeInTheDocument();
    });

    it('should filter to show only favorite projects', () => {
      renderWithMantine(<ProjectsListPage />);

      // Click Favorites tab
      const favoritesTab = screen.getByText('Favorites');
      fireEvent.click(favoritesTab);

      // Only favorited projects should be visible
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Non-favorited projects should NOT be visible
      expect(screen.queryByText(/Downtown Plaza/i)).not.toBeInTheDocument();
    });

    it('should filter to show only archived projects', () => {
      renderWithMantine(<ProjectsListPage />);

      // Click Archived tab
      const archivedTab = screen.getByText('Archived');
      fireEvent.click(archivedTab);

      // Only archived projects should be visible
      expect(screen.getByText(/Old Highway Project/i)).toBeInTheDocument();

      // Active projects should NOT be visible
      expect(screen.queryByText(/Mill Street Construction/i)).not.toBeInTheDocument();
    });

    it('should update filter state when clicking tabs', () => {
      renderWithMantine(<ProjectsListPage />);

      // Start with Active
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Switch to Archived
      fireEvent.click(screen.getByText('Archived'));
      expect(screen.queryByText(/Mill Street Construction/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Old Highway Project/i)).toBeInTheDocument();

      // Switch back to Active
      fireEvent.click(screen.getByText('Active'));
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();
      expect(screen.queryByText(/Old Highway Project/i)).not.toBeInTheDocument();
    });
  });

  // Search Functionality Tests
  describe('Search Functionality', () => {
    it('should filter projects by project name', () => {
      renderWithMantine(<ProjectsListPage />);

      const searchInput = screen.getByPlaceholderText(/search projects/i);

      // Search for "Mill"
      fireEvent.change(searchInput, { target: { value: 'Mill' } });

      // Should show Mill Street Construction
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Should NOT show Downtown Plaza
      expect(screen.queryByText(/Downtown Plaza/i)).not.toBeInTheDocument();
    });

    it('should filter projects by address', () => {
      renderWithMantine(<ProjectsListPage />);

      const searchInput = screen.getByPlaceholderText(/search projects/i);

      // Search for "Reno"
      fireEvent.change(searchInput, { target: { value: 'Reno' } });

      // Should show projects with Reno address
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();
    });

    it('should perform case-insensitive search', () => {
      renderWithMantine(<ProjectsListPage />);

      const searchInput = screen.getByPlaceholderText(/search projects/i);

      // Search with different cases
      fireEvent.change(searchInput, { target: { value: 'MILL' } });
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'mill' } });
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();
    });

    it('should combine filter and search', () => {
      renderWithMantine(<ProjectsListPage />);

      // Switch to Archived
      fireEvent.click(screen.getByText('Archived'));

      // Search for "Highway"
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'Highway' } });

      // Should show only archived projects matching search
      expect(screen.getByText(/Old Highway Project/i)).toBeInTheDocument();

      // Should NOT show active projects
      expect(screen.queryByText(/Mill Street Construction/i)).not.toBeInTheDocument();
    });

    it('should clear search results when input is cleared', () => {
      renderWithMantine(<ProjectsListPage />);

      const searchInput = screen.getByPlaceholderText(/search projects/i);

      // Search for something
      fireEvent.change(searchInput, { target: { value: 'Mill' } });
      expect(screen.queryByText(/Downtown Plaza/i)).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Should show all active projects again
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();
      expect(screen.getByText(/Downtown Plaza/i)).toBeInTheDocument();
    });
  });

  // Empty State Tests
  describe('Empty State', () => {
    it('should show empty state when no projects match filter', () => {
      renderWithMantine(<ProjectsListPage />);

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'NonexistentProject' } });

      // Should show empty state
      expect(screen.getByText(/No projects found/i)).toBeInTheDocument();
    });

    it('should show empty state icon', () => {
      renderWithMantine(<ProjectsListPage />);

      // Search for non-existent project
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'XYZ123' } });

      // Should show empty state with icon
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      renderWithMantine(<ProjectsListPage />);

      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'NoMatch' } });

      // Should show helpful message
      expect(screen.getByText(/Try adjusting your search/i)).toBeInTheDocument();
    });
  });

  // Navigation Tests
  describe('Navigation', () => {
    it('should have clickable project cards', () => {
      renderWithMantine(<ProjectsListPage />);

      // Project cards should be clickable (rendered as links or buttons)
      const projectCard = screen.getByText(/Mill Street Construction/i).closest('a, button');
      expect(projectCard).toBeInTheDocument();
    });

    it('should render New Project button as clickable', () => {
      renderWithMantine(<ProjectsListPage />);

      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      expect(newProjectButton).not.toBeDisabled();
    });
  });

  // Responsive Layout Tests
  describe('Responsive Layout', () => {
    it('should use Stack for vertical layout', () => {
      const { container } = renderWithMantine(<ProjectsListPage />);

      // Should have Stack layout
      const stack = container.querySelector('[class*="Stack"]');
      expect(stack).toBeInTheDocument();
    });

    it('should use Group for horizontal controls', () => {
      const { container } = renderWithMantine(<ProjectsListPage />);

      // Should have Group for filter/search row
      const group = container.querySelector('[class*="Group"]');
      expect(group).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should handle multiple filter changes and search together', () => {
      renderWithMantine(<ProjectsListPage />);

      // Start with Active
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Add search
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'Mill' } });
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Switch to Favorites (Mill Street is favorited)
      fireEvent.click(screen.getByText('Favorites'));
      expect(screen.getByText(/Mill Street Construction/i)).toBeInTheDocument();

      // Change search to non-match
      fireEvent.change(searchInput, { target: { value: 'Downtown' } });
      expect(screen.queryByText(/Mill Street Construction/i)).not.toBeInTheDocument();
      expect(screen.getByText(/No projects found/i)).toBeInTheDocument();
    });

    it('should maintain search state when switching filters', () => {
      renderWithMantine(<ProjectsListPage />);

      // Search for "Construction"
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: 'Construction' } });

      // Switch filter
      fireEvent.click(screen.getByText('Favorites'));

      // Search input should still have value
      expect(searchInput).toHaveValue('Construction');
    });
  });
});
