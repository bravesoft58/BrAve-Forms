'use client';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { FieldPalette } from '../FieldPalette';

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('FieldPalette', () => {
  describe('Component Rendering', () => {
    it('should render the Field Library title', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Field Library')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Drag or click to add')).toBeInTheDocument();
    });

    it('should render all field categories', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Basic Fields')).toBeInTheDocument();
      expect(screen.getByText('Selection Fields')).toBeInTheDocument();
      expect(screen.getByText('Construction-Specific')).toBeInTheDocument();
      expect(screen.getByText('EPA Compliance')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('Basic Fields', () => {
    it('should render Text Input field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Text Input')).toBeInTheDocument();
    });

    it('should render Text Area field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Text Area')).toBeInTheDocument();
    });

    it('should render Number field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Number')).toBeInTheDocument();
    });

    it('should render Date field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('should render Time field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Time')).toBeInTheDocument();
    });
  });

  describe('Selection Fields', () => {
    it('should render Dropdown field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Dropdown')).toBeInTheDocument();
    });

    it('should render Multi-Select field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Multi-Select')).toBeInTheDocument();
    });

    it('should render Radio Buttons field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Radio Buttons')).toBeInTheDocument();
    });

    it('should render Checkboxes field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Checkboxes')).toBeInTheDocument();
    });
  });

  describe('Construction-Specific Fields', () => {
    it('should render Photo Capture field with GPS badge', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Photo Capture')).toBeInTheDocument();
      // GPS badge should be present
      expect(screen.getAllByText('GPS').length).toBeGreaterThan(0);
    });

    it('should render Digital Signature field with Legal badge', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Digital Signature')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('should render GPS Location field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('GPS Location')).toBeInTheDocument();
    });

    it('should render Measurement field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Measurement')).toBeInTheDocument();
    });

    it('should render Inspector Select field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Inspector Select')).toBeInTheDocument();
    });
  });

  describe('EPA Compliance Fields', () => {
    it('should render Weather Data field with EPA badge', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Weather Data')).toBeInTheDocument();
      expect(screen.getAllByText('EPA').length).toBeGreaterThan(0);
    });

    it('should render SWPPP Trigger field with Critical badge', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('SWPPP Trigger')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should render BMP Checklist field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('BMP Checklist')).toBeInTheDocument();
    });

    it('should render Violation Code field with Compliance badge', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Violation Code')).toBeInTheDocument();
      expect(screen.getByText('Compliance')).toBeInTheDocument();
    });

    it('should render Corrective Action field with Action badge', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Corrective Action')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Advanced Fields', () => {
    it('should render Repeater field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Repeater')).toBeInTheDocument();
    });

    it('should render Table field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Table')).toBeInTheDocument();
    });

    it('should render Calculated Field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Calculated Field')).toBeInTheDocument();
    });

    it('should render File Upload field', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('File Upload')).toBeInTheDocument();
    });
  });

  describe('Field Click Interactions', () => {
    it('should call onAddField with text type when Text Input is clicked', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const textButton = screen.getByText('Text Input').closest('button');
      expect(textButton).toBeInTheDocument();
      fireEvent.click(textButton!);

      expect(onAddField).toHaveBeenCalledWith('text');
    });

    it('should call onAddField with number type when Number is clicked', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const numberButton = screen.getByText('Number').closest('button');
      expect(numberButton).toBeInTheDocument();
      fireEvent.click(numberButton!);

      expect(onAddField).toHaveBeenCalledWith('number');
    });

    it('should call onAddField with photo type when Photo Capture is clicked', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const photoButton = screen.getByText('Photo Capture').closest('button');
      expect(photoButton).toBeInTheDocument();
      fireEvent.click(photoButton!);

      expect(onAddField).toHaveBeenCalledWith('photo');
    });

    it('should call onAddField with signature type when Digital Signature is clicked', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const signatureButton = screen.getByText('Digital Signature').closest('button');
      expect(signatureButton).toBeInTheDocument();
      fireEvent.click(signatureButton!);

      expect(onAddField).toHaveBeenCalledWith('signature');
    });

    it('should call onAddField with swpppTrigger type when SWPPP Trigger is clicked', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const swpppButton = screen.getByText('SWPPP Trigger').closest('button');
      expect(swpppButton).toBeInTheDocument();
      fireEvent.click(swpppButton!);

      expect(onAddField).toHaveBeenCalledWith('swpppTrigger');
    });

    it('should call onAddField with bmpChecklist type when BMP Checklist is clicked', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const bmpButton = screen.getByText('BMP Checklist').closest('button');
      expect(bmpButton).toBeInTheDocument();
      fireEvent.click(bmpButton!);

      expect(onAddField).toHaveBeenCalledWith('bmpChecklist');
    });
  });

  describe('Quick Templates', () => {
    it('should render Quick Templates section', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('Quick Templates')).toBeInTheDocument();
    });

    it('should render EPA SWPPP Template button', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText('EPA SWPPP Template')).toBeInTheDocument();
    });

    it('should call onAddField multiple times when EPA SWPPP Template is clicked', async () => {
      vi.useFakeTimers();
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const templateButton = screen.getByText('EPA SWPPP Template').closest('button');
      expect(templateButton).toBeInTheDocument();
      fireEvent.click(templateButton!);

      // Advance timers to trigger all the setTimeout calls
      vi.advanceTimersByTime(600);

      // Should add 6 fields: text, date, number, photo, bmpChecklist, signature
      expect(onAddField).toHaveBeenCalledTimes(6);
      expect(onAddField).toHaveBeenCalledWith('text');
      expect(onAddField).toHaveBeenCalledWith('date');
      expect(onAddField).toHaveBeenCalledWith('number');
      expect(onAddField).toHaveBeenCalledWith('photo');
      expect(onAddField).toHaveBeenCalledWith('bmpChecklist');
      expect(onAddField).toHaveBeenCalledWith('signature');

      vi.useRealTimers();
    });
  });

  describe('EPA Compliance Tip', () => {
    it('should render EPA compliance tip', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      expect(screen.getByText(/EPA forms require GPS-enabled photos/)).toBeInTheDocument();
      expect(screen.getByText(/exact 0.25" rainfall thresholds/)).toBeInTheDocument();
    });
  });

  describe('Construction Field Touch Targets', () => {
    it('should have large touch targets for glove-friendly use (48px)', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      const textButton = screen.getByText('Text Input').closest('button');
      expect(textButton).toHaveStyle({ height: '48px' });
    });
  });

  describe('Field Count', () => {
    it('should render all 22 field types', () => {
      const onAddField = vi.fn();
      renderWithMantine(<FieldPalette onAddField={onAddField} />);

      // Basic Fields: 5
      expect(screen.getByText('Text Input')).toBeInTheDocument();
      expect(screen.getByText('Text Area')).toBeInTheDocument();
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();

      // Selection Fields: 4
      expect(screen.getByText('Dropdown')).toBeInTheDocument();
      expect(screen.getByText('Multi-Select')).toBeInTheDocument();
      expect(screen.getByText('Radio Buttons')).toBeInTheDocument();
      expect(screen.getByText('Checkboxes')).toBeInTheDocument();

      // Construction-Specific: 5
      expect(screen.getByText('Photo Capture')).toBeInTheDocument();
      expect(screen.getByText('Digital Signature')).toBeInTheDocument();
      expect(screen.getByText('GPS Location')).toBeInTheDocument();
      expect(screen.getByText('Measurement')).toBeInTheDocument();
      expect(screen.getByText('Inspector Select')).toBeInTheDocument();

      // EPA Compliance: 5
      expect(screen.getByText('Weather Data')).toBeInTheDocument();
      expect(screen.getByText('SWPPP Trigger')).toBeInTheDocument();
      expect(screen.getByText('BMP Checklist')).toBeInTheDocument();
      expect(screen.getByText('Violation Code')).toBeInTheDocument();
      expect(screen.getByText('Corrective Action')).toBeInTheDocument();

      // Advanced: 4
      expect(screen.getByText('Repeater')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
      expect(screen.getByText('Calculated Field')).toBeInTheDocument();
      expect(screen.getByText('File Upload')).toBeInTheDocument();
    });
  });
});
