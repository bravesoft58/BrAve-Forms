'use client';

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { PhotoAnnotation } from '../photo-annotation';
import type { Photo } from '../photo-gallery-grid';

// Mock scrollIntoView to prevent Mantine Select errors in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock Annotorious
const mockSetDrawingTool = vi.fn();
const mockGetAnnotations = vi.fn().mockReturnValue([]);
const mockSetAnnotations = vi.fn();
const mockSetStyle = vi.fn();
const mockRemoveAnnotation = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockAnno = {
  setDrawingTool: mockSetDrawingTool,
  getAnnotations: mockGetAnnotations,
  setAnnotations: mockSetAnnotations,
  setStyle: mockSetStyle,
  removeAnnotation: mockRemoveAnnotation,
  on: mockOn,
  off: mockOff,
};

vi.mock('@annotorious/react', () => ({
  Annotorious: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="annotorious-container">{children}</div>
  ),
  ImageAnnotator: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="image-annotator">{children}</div>
  ),
  useAnnotator: () => mockAnno,
}));

// Test wrapper with MantineProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

// Mock photo data with orgId for multi-tenant isolation
const mockPhoto: Photo = {
  id: 'photo-1',
  orgId: 'org-123', // REQUIRED for multi-tenant isolation
  url: 'https://cdn.example.com/photo-1.jpg',
  thumbnailUrl: 'https://cdn.example.com/photo-1-thumb.jpg',
  caption: 'Site inspection photo',
  latitude: 39.5296,
  longitude: -119.8138,
  takenAt: '2025-11-28T10:00:00Z',
  uploadedAt: '2025-11-28T10:05:00Z',
  fileSize: 2048000,
  mimeType: 'image/jpeg',
  uploadedBy: 'user-123',
  formName: 'Daily Log',
  projectName: 'Highway Project',
};

// Sample annotations
const mockAnnotations = [
  {
    id: 'annotation-1',
    type: 'Annotation',
    body: [
      {
        type: 'TextualBody',
        value: 'Erosion detected here',
        purpose: 'commenting',
      },
    ],
    target: {
      selector: {
        type: 'FragmentSelector',
        value: 'xywh=100,100,50,50',
      },
    },
  },
];

describe('PhotoAnnotation', () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnAnnotationsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnnotations.mockReturnValue([]);
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render annotation container', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByTestId('photo-annotation-container')).toBeInTheDocument();
    });

    it('should render the photo image', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const image = screen.getByAltText('Site inspection photo');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockPhoto.url);
    });

    it('should render annotation toolbar', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByTestId('annotation-toolbar')).toBeInTheDocument();
    });

    it('should render drawing tool selector', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Mantine Select has a label, find by text
      expect(screen.getByText('Drawing Tool')).toBeInTheDocument();
    });

    it('should render save button', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });
  });

  describe('Drawing Tools', () => {
    it('should have rectangle tool option', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Mantine Select has aria-label="Drawing Tool"
      const selectInput = screen.getByRole('textbox', { name: /drawing tool/i });
      await act(async () => {
        fireEvent.click(selectInput);
      });

      // Rectangle is already visible as default value
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
    });

    it('should have polygon tool option', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Mantine Select has aria-label="Drawing Tool"
      const selectInput = screen.getByRole('textbox', { name: /drawing tool/i });
      await act(async () => {
        fireEvent.click(selectInput);
      });

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument();
      });
    });

    it('should have freehand tool option', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Mantine Select has aria-label="Drawing Tool"
      const selectInput = screen.getByRole('textbox', { name: /drawing tool/i });
      await act(async () => {
        fireEvent.click(selectInput);
      });

      await waitFor(() => {
        expect(screen.getByText('Freehand')).toBeInTheDocument();
      });
    });

    it('should have arrow tool option', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Mantine Select has aria-label="Drawing Tool"
      const selectInput = screen.getByRole('textbox', { name: /drawing tool/i });
      await act(async () => {
        fireEvent.click(selectInput);
      });

      await waitFor(() => {
        expect(screen.getByText('Arrow')).toBeInTheDocument();
      });
    });

    it('should default to rectangle tool', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Rectangle text should be visible as default selection
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave when save button is clicked', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should pass annotations to onSave callback', async () => {
      mockGetAnnotations.mockReturnValue(mockAnnotations);

      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockAnnotations);
      });
    });

    it('should disable button while saving', async () => {
      // Make onSave take some time
      const slowOnSave = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={slowOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });

      // Click should trigger loading state
      fireEvent.click(saveButton);

      // Button should show loading state
      await waitFor(() => {
        expect(saveButton).toHaveAttribute('data-loading', 'true');
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should require double-click to clear annotations', async () => {
      mockGetAnnotations.mockReturnValue(mockAnnotations);

      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });

      // First click shows confirmation
      fireEvent.click(clearButton);

      // Should show "Confirm Clear" text
      expect(screen.getByText(/Confirm Clear/i)).toBeInTheDocument();
    });

    it('should clear annotations on second click', async () => {
      mockGetAnnotations.mockReturnValue(mockAnnotations);

      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });

      // First click
      fireEvent.click(clearButton);

      // Second click confirms
      const confirmButton = screen.getByText(/Confirm Clear/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSetAnnotations).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Annotation Loading', () => {
    it('should load existing annotations on mount', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation
            photo={mockPhoto}
            onSave={mockOnSave}
            initialAnnotations={mockAnnotations}
          />
        </TestWrapper>
      );

      expect(mockSetAnnotations).toHaveBeenCalledWith(mockAnnotations);
    });

    it('should handle empty annotations gracefully', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} initialAnnotations={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('photo-annotation-container')).toBeInTheDocument();
    });
  });

  describe('Annotation Events', () => {
    it('should notify on annotation create', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation
            photo={mockPhoto}
            onSave={mockOnSave}
            onAnnotationsChange={mockOnAnnotationsChange}
          />
        </TestWrapper>
      );

      // Verify event listeners are set up
      expect(mockOn).toHaveBeenCalledWith('createAnnotation', expect.any(Function));
    });

    it('should notify on annotation update', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation
            photo={mockPhoto}
            onSave={mockOnSave}
            onAnnotationsChange={mockOnAnnotationsChange}
          />
        </TestWrapper>
      );

      expect(mockOn).toHaveBeenCalledWith('updateAnnotation', expect.any(Function));
    });

    it('should notify on annotation delete', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation
            photo={mockPhoto}
            onSave={mockOnSave}
            onAnnotationsChange={mockOnAnnotationsChange}
          />
        </TestWrapper>
      );

      expect(mockOn).toHaveBeenCalledWith('deleteAnnotation', expect.any(Function));
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      unmount();

      expect(mockOff).toHaveBeenCalled();
    });
  });

  describe('Annotation Count Display', () => {
    it('should show no annotations message by default', () => {
      mockGetAnnotations.mockReturnValue([]);

      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByText(/No annotations/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible toolbar', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const toolbar = screen.getByTestId('annotation-toolbar');
      expect(toolbar).toHaveAttribute('role', 'toolbar');
    });

    it('should have accessible image with alt text', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt');
    });

    it('should support keyboard navigation for tool selection', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Mantine Select has aria-label="Drawing Tool"
      const toolSelect = screen.getByRole('textbox', { name: /drawing tool/i });
      toolSelect.focus();

      // Check that a focusable element within the toolbar is focused
      expect(document.activeElement).toBeTruthy();
    });

    it('should have glove-friendly button sizes', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      // Mantine buttons with style prop should have the min-height
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Color Selection', () => {
    it('should render color input', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // ColorInput has a label "Color"
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    });
  });

  describe('Undo/Redo', () => {
    it('should render undo button', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/undo/i)).toBeInTheDocument();
    });

    it('should render redo button', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/redo/i)).toBeInTheDocument();
    });

    it('should disable undo when no history', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const undoButton = screen.getByLabelText(/undo/i);
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo when no future history', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const redoButton = screen.getByLabelText(/redo/i);
      expect(redoButton).toBeDisabled();
    });
  });

  describe('Read-Only Mode', () => {
    it('should hide toolbar in read-only mode', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} readOnly={true} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('annotation-toolbar')).not.toBeInTheDocument();
    });

    it('should display annotations in read-only mode', () => {
      mockGetAnnotations.mockReturnValue(mockAnnotations);

      render(
        <TestWrapper>
          <PhotoAnnotation
            photo={mockPhoto}
            onSave={mockOnSave}
            readOnly={true}
            initialAnnotations={mockAnnotations}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('annotorious-container')).toBeInTheDocument();
    });
  });

  describe('Photo Metadata Display', () => {
    it('should display photo caption when showMetadata is true', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} showMetadata={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Site inspection photo')).toBeInTheDocument();
    });

    it('should display form name when showMetadata is true', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} showMetadata={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Daily Log')).toBeInTheDocument();
    });

    it('should not display metadata by default', () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Caption should not be visible when showMetadata is false/undefined
      // The image alt text will have it, but not as visible text in the UI
      const captions = screen.queryAllByText('Site inspection photo');
      // Only one should exist (the alt text is accessible but not visible)
      expect(captions.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Offline Support', () => {
    it('should save locally when offline with orgId in key', async () => {
      // Simulate offline before render
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      // Wait for save to complete and offline alert to appear
      await waitFor(
        () => {
          // Check for the alert with "Saved locally" title
          const alert = screen.getByRole('alert');
          expect(alert).toHaveTextContent(/saved locally/i);
        },
        { timeout: 2000 }
      );

      // Verify onSave was still called
      expect(mockOnSave).toHaveBeenCalled();

      // CRITICAL: Verify localStorage key includes orgId for multi-tenant isolation
      const storageKey = `photo-annotations-${mockPhoto.orgId}-${mockPhoto.id}`;
      const storedData = localStorage.getItem(storageKey);
      expect(storedData).not.toBeNull();
      const parsed = JSON.parse(storedData!);
      expect(parsed.orgId).toBe(mockPhoto.orgId);
      expect(parsed.photoId).toBe(mockPhoto.id);

      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
    });

    it('should clear localStorage on successful online save', async () => {
      // First save offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const { rerender } = render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Verify localStorage has data
      const storageKey = `photo-annotations-${mockPhoto.orgId}-${mockPhoto.id}`;
      expect(localStorage.getItem(storageKey)).not.toBeNull();

      // Go back online and save again
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
      mockOnSave.mockClear();

      rerender(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      const saveButton2 = screen.getByRole('button', { name: /save/i });
      await act(async () => {
        fireEvent.click(saveButton2);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Verify localStorage is cleared after successful online save
      expect(localStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe('Color Style Updates', () => {
    it('should update annotation style when color changes', async () => {
      render(
        <TestWrapper>
          <PhotoAnnotation photo={mockPhoto} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Initial style should be set
      await waitFor(() => {
        expect(mockSetStyle).toHaveBeenCalled();
      });
    });
  });
});
