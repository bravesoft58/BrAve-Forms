import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormFillPage from '../page';

const TEST_TEMPLATE_ID = 'daily-log';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ templateId: TEST_TEMPLATE_ID }),
  useRouter: () => ({
    push: vi.fn(),
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

  it('should apply mobile-optimized class to container', () => {
    const { container } = render(<FormFillPage />);

    const mobileOptimized = container.querySelector('.mobile-optimized');
    expect(mobileOptimized).toBeInTheDocument();
  });
});
