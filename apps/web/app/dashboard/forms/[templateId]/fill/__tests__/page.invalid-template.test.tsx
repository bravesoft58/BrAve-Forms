import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormFillPage from '../page';

// Mock with non-existent template ID
vi.mock('next/navigation', () => ({
  useParams: () => ({ templateId: 'non-existent-template' }),
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

describe('FormFillPage - Invalid Template', () => {
  it('should show not found message for invalid template', () => {
    render(<FormFillPage />);

    expect(screen.getByText('Form Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(/The form template you're looking for doesn't exist/)
    ).toBeInTheDocument();
  });

  it('should not render FormRenderer for invalid template', () => {
    render(<FormFillPage />);

    const forms = screen.queryAllByRole('form');
    expect(forms).toHaveLength(0);
  });
});
