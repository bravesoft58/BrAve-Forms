import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from '@/components/Forms/TemplateSelector';
import { getMockFormTemplates } from '@/lib/mock-data/form-templates';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TemplateSelector', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders all templates by default', () => {
    render(<TemplateSelector projectId="1" />);
    const templates = getMockFormTemplates();
    templates.forEach((template) => {
      expect(screen.getByText(template.title)).toBeInTheDocument();
    });
  });

  it('filters templates by category', () => {
    render(<TemplateSelector projectId="1" />);

    // Click on Inspections category
    const inspectionsTab = screen.getByText('Inspections');
    fireEvent.click(inspectionsTab);

    // Should show inspection templates
    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Post-Storm Inspection')).toBeInTheDocument();

    // Should not show daily log templates
    expect(screen.queryByText('Daily Dust Log')).not.toBeInTheDocument();
  });

  it('searches templates by name', () => {
    render(<TemplateSelector projectId="1" />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'SWPPP' } });

    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Weekly SWPPP Review')).toBeInTheDocument();
    expect(screen.queryByText('Daily Dust Log')).not.toBeInTheDocument();
  });

  it('searches templates by description', () => {
    render(<TemplateSelector projectId="1" />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'dust' } });

    expect(screen.getByText('Daily Dust Log')).toBeInTheDocument();
    expect(screen.queryByText('SWPPP Inspection')).not.toBeInTheDocument();
  });

  it('combines category filter and search', () => {
    render(<TemplateSelector projectId="1" />);

    // Filter by Inspections
    const inspectionsTab = screen.getByText('Inspections');
    fireEvent.click(inspectionsTab);

    // Search for "SWPPP"
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'SWPPP' } });

    // Should only show SWPPP-related inspections
    expect(screen.getByText('SWPPP Inspection')).toBeInTheDocument();
    expect(screen.getByText('Weekly SWPPP Review')).toBeInTheDocument();
    expect(screen.queryByText('Post-Storm Inspection')).not.toBeInTheDocument();
  });

  it('navigates to form fill page on template click', () => {
    render(<TemplateSelector projectId="1" />);

    const templateCard = screen.getByTestId('template-card-daily-dust-log');
    fireEvent.click(templateCard);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/forms/daily-dust-log/fill?projectId=1');
  });

  it('shows empty state when no templates match', () => {
    render(<TemplateSelector projectId="1" />);

    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-template' } });

    expect(screen.getByText('No templates found')).toBeInTheDocument();
  });

  it('displays template category badges', () => {
    render(<TemplateSelector projectId="1" />);

    // Check that category badges are displayed
    const templates = getMockFormTemplates();
    templates.forEach((template) => {
      const categoryText = template.category.replace('-', ' ');
      expect(screen.getByText(categoryText)).toBeInTheDocument();
    });
  });

  it('displays estimated time when available', () => {
    render(<TemplateSelector projectId="1" />);

    const template = getMockFormTemplates().find((t) => t.estimatedTime);
    if (template) {
      expect(screen.getByText(template.estimatedTime!)).toBeInTheDocument();
    }
  });
});

