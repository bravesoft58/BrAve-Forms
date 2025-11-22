import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { PhotoField } from '../PhotoField';
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
  IconCamera: () => <span>Camera Icon</span>,
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
    <PhotoField field={field} control={control} error={errors[field.id]} disabled={disabled} />
  );
}

describe('PhotoField', () => {
  const mockField: FormField = {
    id: 'photo_inspection',
    type: 'photo',
    label: 'Inspection Photo',
    required: true,
  };

  const createMockFile = (name: string, type: string, size: number): File => {
    const blob = new Blob(['a'.repeat(size)], { type });
    return new File([blob], name, { type });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: 'data:image/jpeg;base64,mockbase64data',
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    // Mock navigator.geolocation
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
  });

  describe('Initial Rendering', () => {
    it('should render upload button when no photo selected', () => {
      render(<TestWrapper field={mockField} />);

      expect(screen.getByRole('button', { name: /Upload Photo/i })).toBeInTheDocument();
    });

    it('should render label from field prop', () => {
      render(<TestWrapper field={mockField} />);

      expect(screen.getByText('Inspection Photo')).toBeInTheDocument();
    });

    it('should show required indicator when field is required', () => {
      render(<TestWrapper field={mockField} />);

      // FieldWrapper adds asterisk for required fields
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render hidden file input with accept="image/*"', () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      expect(fileInput).toHaveStyle({ display: 'none' });
    });
  });

  describe('File Upload', () => {
    it('should trigger file input click when Upload Photo button clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const uploadButton = screen.getByRole('button', { name: /Upload Photo/i });
      await user.click(uploadButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should accept valid image file and convert to base64', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Trigger FileReader onload
      fileReader.onload();

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Photo Uploaded',
          message: 'Photo uploaded successfully',
          color: 'green',
        });
      });
    });

    it('should reject non-image files', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = createMockFile('test.pdf', 'application/pdf', 1024);

      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Invalid File',
          message: 'Please select an image file (JPG, PNG, etc.)',
          color: 'red',
        });
      });
    });

    it('should reject files larger than 10MB', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024); // 11MB

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'File Too Large',
          message: 'Image must be less than 10MB',
          color: 'red',
        });
      });
    });

    it('should show uploading state during file processing', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Button should show loading state
      await waitFor(() => {
        const uploadButton = screen.queryByRole('button', { name: /Uploading.../i });
        expect(uploadButton).toBeInTheDocument();
      });
    });
  });

  describe('GPS Location Capture', () => {
    it('should capture GPS location when photo uploaded', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should display GPS coordinates on photo thumbnail', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        expect(screen.getByText(/GPS: 40.7128, -74.0060/i)).toBeInTheDocument();
      });
    });

    it('should handle GPS unavailable gracefully', async () => {
      // Mock geolocation as unavailable
      global.navigator.geolocation.getCurrentPosition = vi.fn((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      fileReader.onload();

      // Should still upload photo without GPS
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Photo Uploaded',
          message: 'Photo uploaded successfully',
          color: 'green',
        });
      });
    });
  });

  describe('Photo Management', () => {
    it('should display photo thumbnail after upload', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        const image = screen.getByRole('img', { name: /Inspection Photo/i });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64data');
      });
    });

    it('should show Retake and Delete buttons after photo uploaded', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retake/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });
    });

    it('should allow retaking photo', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      // Upload first photo
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });
      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retake/i })).toBeInTheDocument();
      });

      // Click retake button
      const clickSpy = vi.spyOn(fileInput, 'click');
      const retakeButton = screen.getByRole('button', { name: /Retake/i });
      await user.click(retakeButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should clear photo when Delete button clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      // Upload photo
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });
      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      // Photo should be removed
      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Upload Photo/i })).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable upload button when disabled prop is true', () => {
      render(<TestWrapper field={mockField} disabled={true} />);

      const uploadButton = screen.getByRole('button', { name: /Upload Photo/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should disable file input when disabled prop is true', () => {
      const { container } = render(<TestWrapper field={mockField} disabled={true} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });

    it('should disable Retake and Delete buttons when disabled prop is true', async () => {
      const { container, rerender } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      // Upload photo
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });
      fireEvent.change(fileInput);
      fileReader.onload();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retake/i })).toBeInTheDocument();
      });

      // Re-render with disabled=true
      rerender(<TestWrapper field={mockField} disabled={true} />);

      expect(screen.getByRole('button', { name: /Retake/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error notification on FileReader error', async () => {
      const { container } = render(<TestWrapper field={mockField} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);

      const fileReader = (global.FileReader as any).mock.results[0].value;

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Trigger FileReader onerror
      fileReader.onerror();

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith({
          title: 'Upload Failed',
          message: 'Failed to read file',
          color: 'red',
        });
      });
    });

    it('should display validation error message when provided', () => {
      const fieldWithError: FormField = {
        ...mockField,
        validation: {
          customMessage: 'Photo is required for inspection',
        },
      };

      // Mock useForm to return error
      const TestWrapperWithError = () => {
        const { control } = useForm({
          defaultValues: { [mockField.id]: '' },
        });

        return (
          <PhotoField
            field={fieldWithError}
            control={control}
            error={{ type: 'required', message: 'Photo is required for inspection' }}
          />
        );
      };

      render(<TestWrapperWithError />);

      expect(screen.getByText('Photo is required for inspection')).toBeInTheDocument();
    });
  });
});
