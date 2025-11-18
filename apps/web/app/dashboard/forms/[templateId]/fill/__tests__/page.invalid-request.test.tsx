import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormFillPage from '../page';

// Mock with invalid templateId (not a string)
vi.mock('next/navigation', () => ({
  useParams: () => ({ templateId: null }),
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

describe('FormFillPage - Invalid Request', () => {
  it('should show invalid request message when templateId is missing', () => {
    render(<FormFillPage />);

    expect(screen.getByText('Invalid Request')).toBeInTheDocument();
    expect(
      screen.getByText(/Template ID is missing or invalid/)
    ).toBeInTheDocument();
  });

  it('should not render FormRenderer for invalid request', () => {
    render(<FormFillPage />);

    const forms = screen.queryAllByRole('form');
    expect(forms).toHaveLength(0);
  });
});
