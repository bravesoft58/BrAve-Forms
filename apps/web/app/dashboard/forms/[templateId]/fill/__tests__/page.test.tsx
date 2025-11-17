import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormFillPage from '../page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ templateId: 'daily-log' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

describe('FormFillPage', () => {
  it('should render form title from template', () => {
    render(<FormFillPage />);

    expect(screen.getByText('Daily Dust Control Log')).toBeInTheDocument();
  });

  it('should render form description', () => {
    render(<FormFillPage />);

    expect(
      screen.getByText(/Track daily dust control measures/)
    ).toBeInTheDocument();
  });

  it('should render FormRenderer component', () => {
    render(<FormFillPage />);

    // FormRenderer renders a form element
    const forms = screen.getAllByRole('form');
    expect(forms.length).toBeGreaterThan(0);
  });

  it('should show not found message for invalid template', () => {
    // Override mock to return non-existent template
    vi.mock('next/navigation', () => ({
      useParams: () => ({ templateId: 'non-existent-template' }),
      useRouter: () => ({
        push: vi.fn(),
        back: vi.fn(),
      }),
    }));

    render(<FormFillPage />);

    expect(screen.getByText('Form Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(/The form template you're looking for doesn't exist/)
    ).toBeInTheDocument();
  });

  it('should apply mobile-optimized class to container', () => {
    const { container } = render(<FormFillPage />);

    const mobileOptimized = container.querySelector('.mobile-optimized');
    expect(mobileOptimized).toBeInTheDocument();
  });
});
