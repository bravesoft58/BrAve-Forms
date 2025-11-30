import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FieldError } from 'react-hook-form';
import { MantineProvider } from '@mantine/core';
import { SignatureField } from '../SignatureField';
import { FormField } from '../../types';
import { notifications } from '@mantine/notifications';

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Mock Tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconTrash: () => <span>Trash Icon</span>,
  IconRefresh: () => <span>Refresh Icon</span>,
}));

// Test wrapper component
function TestWrapper({ field, disabled = false }: { field: FormField; disabled?: boolean }) {
  const {
    control,
    formState: { errors },
  } = useForm();

  return (
    <MantineProvider>
      <SignatureField
        field={field}
        control={control}
        error={errors[field.id] as FieldError | undefined}
        disabled={disabled}
      />
    </MantineProvider>
  );
}

// Store original createElement before any spying
const originalCreateElement = document.createElement.bind(document);

describe('SignatureField', () => {
  const mockField: FormField = {
    id: 'signature_inspector',
    type: 'signature',
    label: 'Inspector Signature',
    required: true,
  };

  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock canvas context
    mockContext = {
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textAlign: '',
    } as any;

    // Mock canvas
    const mockGetContext = vi.fn(() => mockContext);
    const mockToDataURL = vi.fn(() => 'data:image/png;base64,mockSignatureData');

    mockCanvas = {
      width: 500,
      height: 150,
      getContext: mockGetContext,
      toDataURL: mockToDataURL,
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 500,
        height: 150,
        right: 500,
        bottom: 150,
        x: 0,
        y: 0,
        toJSON: () => {},
      })),
    } as any;

    // Mock document.createElement for canvas
    // Uses originalCreateElement defined outside describe block to avoid infinite recursion
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement(tagName);
    });

    // Mock Image constructor
    global.Image = class {
      onload: (() => void) | null = null;
      src = '';
      width = 500;
      height = 150;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;
  });

  describe('Initial Rendering', () => {
    it('should render signature canvas when no signature exists', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render label from field prop', () => {
      render(<TestWrapper field={mockField} />);

      expect(screen.getByText('Inspector Signature')).toBeInTheDocument();
    });

    it('should show required indicator when field is required', () => {
      render(<TestWrapper field={mockField} />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render Clear and Save Signature buttons', () => {
      render(<TestWrapper field={mockField} />);

      expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Signature/i })).toBeInTheDocument();
    });

    it('should render signature line and X marker', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      // Check for signature line (div with specific styles)
      const signatureLine = container.querySelector('div[style*="height: 1px"]');
      expect(signatureLine).toBeInTheDocument();

      // Check for X marker
      expect(container.textContent).toContain('X');
    });

    it('should disable Clear and Save buttons when signature is empty', () => {
      render(<TestWrapper field={mockField} />);

      expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Save Signature/i })).toBeDisabled();
    });
  });

  describe('Drawing Functionality', () => {
    it('should initialize canvas with correct dimensions', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(150);
    });

    it('should set drawing style on canvas context', () => {
      render(<TestWrapper field={mockField} />);

      expect(mockContext.strokeStyle).toBe('#000000');
      expect(mockContext.lineWidth).toBe(2);
      expect(mockContext.lineCap).toBe('round');
      expect(mockContext.lineJoin).toBe('round');
    });

    it('should handle mouse drawing events', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalledWith(10, 10);

      // Draw
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      expect(mockContext.lineTo).toHaveBeenCalledWith(20, 20);
      expect(mockContext.stroke).toHaveBeenCalled();

      // Stop drawing
      fireEvent.mouseUp(canvas);
    });

    it('should handle touch drawing events', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Start drawing with touch
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 15, clientY: 15 }],
      });
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalledWith(15, 15);

      // Draw with touch
      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 25, clientY: 25 }],
      });
      expect(mockContext.lineTo).toHaveBeenCalledWith(25, 25);
      expect(mockContext.stroke).toHaveBeenCalled();

      // Stop drawing
      fireEvent.touchEnd(canvas);
    });

    it('should enable Clear and Save buttons after drawing', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Start drawing (isEmpty becomes false)
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      expect(screen.getByRole('button', { name: /Clear/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Save Signature/i })).not.toBeDisabled();
    });

    it('should not draw when disabled', () => {
      const { container } = render(<TestWrapper field={mockField} disabled={true} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

      // Drawing should not occur
      expect(mockContext.lineTo).not.toHaveBeenCalled();
    });
  });

  describe('Clear Signature', () => {
    it('should clear canvas when Clear button clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw something
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      // Clear button should be enabled now
      const clearButton = screen.getByRole('button', { name: /Clear/i });
      await user.click(clearButton);

      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 500, 150);
    });

    it('should re-disable buttons after clearing', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      // Clear
      const clearButton = screen.getByRole('button', { name: /Clear/i });
      await user.click(clearButton);

      // Buttons should be disabled again
      expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Save Signature/i })).toBeDisabled();
    });
  });

  describe('Save Signature', () => {
    it('should show error notification when saving empty signature', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _user = userEvent.setup(); // Setup but not needed for fireEvent test
      render(<TestWrapper field={mockField} />);

      const saveButton = screen.getByRole('button', { name: /Save Signature/i });

      // Try to save without drawing (button is disabled, but test the logic)
      // We need to force-enable the button for this test
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Signature Required',
          message: 'Please provide a signature',
          color: 'red',
        });
      });
    });

    it('should save signature with timestamp when drawn', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw signature
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(canvas);

      // Save
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
      });
    });

    it('should show success notification after saving signature', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      // Save
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Signature Saved',
          message: 'Signature saved successfully',
          color: 'green',
        });
      });
    });

    it('should embed timestamp in signature image', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      // Save
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockContext.fillText).toHaveBeenCalled();
        const fillTextCall = (mockContext.fillText as any).mock.calls[0];
        expect(fillTextCall[0]).toMatch(/Signed:/);
      });
    });
  });

  describe('Signature Display After Save', () => {
    it('should display signature image after saving', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw and save
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        const image = screen.getByRole('img', { name: /Signature/i });
        expect(image).toBeInTheDocument();
      });
    });

    it('should hide canvas after saving signature', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw and save
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        // Canvas should not be visible (parent Stack is hidden)
        const canvasParent = canvas.closest('div[class*="Stack"]');
        expect(canvasParent).not.toBeVisible();
      });
    });

    it('should show Redo Signature button after saving', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw and save
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Redo Signature/i })).toBeInTheDocument();
      });
    });
  });

  describe('Redo Signature', () => {
    it('should clear signature and show canvas when Redo clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw and save
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      // Wait for image to appear
      await waitFor(() => {
        expect(screen.getByRole('img', { name: /Signature/i })).toBeInTheDocument();
      });

      // Click Redo
      const redoButton = screen.getByRole('button', { name: /Redo Signature/i });
      await user.click(redoButton);

      await waitFor(() => {
        expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 500, 150);
      });
    });

    it('should hide signature image after redo', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw and save
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /Signature/i })).toBeInTheDocument();
      });

      // Redo
      const redoButton = screen.getByRole('button', { name: /Redo Signature/i });
      await user.click(redoButton);

      await waitFor(() => {
        expect(screen.queryByRole('img', { name: /Signature/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable canvas drawing when disabled prop is true', () => {
      const { container } = render(<TestWrapper field={mockField} disabled={true} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Try to draw
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

      // Should not draw
      expect(mockContext.lineTo).not.toHaveBeenCalled();
    });

    it('should show not-allowed cursor when disabled', () => {
      const { container } = render(<TestWrapper field={mockField} disabled={true} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('should disable Clear button when disabled prop is true', () => {
      const { container } = render(<TestWrapper field={mockField} disabled={true} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw to enable buttons
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      // Button should still be disabled due to disabled prop
      expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();
    });

    it('should disable Save Signature button when disabled prop is true', () => {
      const { container } = render(<TestWrapper field={mockField} disabled={true} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

      // Button should be disabled
      expect(screen.getByRole('button', { name: /Save Signature/i })).toBeDisabled();
    });

    it('should disable Redo button when disabled prop is true', async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(<TestWrapper field={mockField} />);

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Draw and save
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      const saveButton = screen.getByRole('button', { name: /Save Signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Redo Signature/i })).toBeInTheDocument();
      });

      // Re-render with disabled=true
      rerender(<TestWrapper field={mockField} disabled={true} />);

      expect(screen.getByRole('button', { name: /Redo Signature/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display validation error message when provided', () => {
      const fieldWithError: FormField = {
        ...mockField,
        validation: {
          customMessage: 'Signature is required for approval',
        },
      };

      const TestWrapperWithError = () => {
        const { control } = useForm({
          defaultValues: { [mockField.id]: '' },
        });

        return (
          <MantineProvider>
            <SignatureField
              field={fieldWithError}
              control={control}
              error={{ type: 'required', message: 'Signature is required for approval' }}
            />
          </MantineProvider>
        );
      };

      render(<TestWrapperWithError />);

      expect(screen.getByText('Signature is required for approval')).toBeInTheDocument();
    });
  });
});
