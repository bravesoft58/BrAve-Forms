# ISSUE-102: Signature Capture Integration

**Sprint:** Sprint 3 | **Phase:** 5 - Form Submission Workflow | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-101 (photo integration working)
**Status:** NOT STARTED

## What You'll Do

Implement canvas-based signature pad with timestamp overlay, clear/redo functionality, and save as PNG.

## Step-by-Step Instructions

### Step 1: Create SignatureField Component (60 min)

Create `apps/web/components/Forms/FormRenderer/Fields/SignatureField.tsx`:

```tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';
import Image from 'next/image';

interface SignatureFieldProps {
  fieldId: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  mode: 'mobile' | 'desktop';
}

export function SignatureField({
  fieldId,
  label,
  required = false,
  value,
  onChange,
  mode,
}: SignatureFieldProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    if (value) {
      setIsEmpty(false);
      // Extract timestamp from existing signature if present
      // (timestamp is embedded in the image as metadata)
    }
  }, [value]);

  const handleEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
      onChange('');
      setTimestamp('');
    }
  };

  const handleSave = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    // Get signature as base64
    const dataUrl = signatureRef.current.toDataURL('image/png');

    // Add timestamp
    const now = new Date();
    const timestampString = now.toISOString();
    setTimestamp(timestampString);

    // Embed timestamp in signature image
    const signatureWithTimestamp = embedTimestamp(dataUrl, timestampString);

    onChange(signatureWithTimestamp);
    toast.success('Signature saved');
  };

  const embedTimestamp = (dataUrl: string, timestamp: string): string => {
    // Create a new canvas to overlay timestamp
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 30; // Extra space for timestamp

      // Draw signature
      ctx.drawImage(img, 0, 0);

      // Draw timestamp overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, img.height, canvas.width, 30);

      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Signed: ${new Date(timestamp).toLocaleString()}`,
        canvas.width / 2,
        img.height + 20
      );
    };
    img.src = dataUrl;

    return canvas.toDataURL('image/png');
  };

  const canvasProps = {
    canvasProps: {
      className: mode === 'mobile' ? 'signature-canvas mobile' : 'signature-canvas desktop',
      width: mode === 'mobile' ? 340 : 500,
      height: mode === 'mobile' ? 200 : 150,
    },
    penColor: '#000000',
    minWidth: mode === 'mobile' ? 2 : 1,
    maxWidth: mode === 'mobile' ? 4 : 2,
  };

  return (
    <div className="signature-field">
      <label className="field-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>

      {!value ? (
        <div className="signature-pad-container">
          <div className="signature-pad-border">
            <SignatureCanvas ref={signatureRef} {...canvasProps} onEnd={handleEnd} />
            <div className="signature-line">
              <span className="signature-x">X</span>
            </div>
          </div>

          <div className="signature-actions">
            <button type="button" onClick={handleClear} className="clear-button" disabled={isEmpty}>
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="save-signature-button"
              disabled={isEmpty}
            >
              Save Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="signature-preview">
          <div className="signature-thumbnail">
            <Image
              src={value}
              alt="Signature"
              width={canvasProps.canvasProps.width}
              height={canvasProps.canvasProps.height + 30}
              className="signature-image"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setTimestamp('');
            }}
            className="redo-signature-button"
          >
            Redo Signature
          </button>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Add SignatureField Styles (30 min)

Add to `apps/web/styles/globals.css`:

```css
.signature-field {
  margin-bottom: 24px;
}

.signature-pad-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signature-pad-border {
  position: relative;
  border: 2px solid #2d3748;
  border-radius: 8px;
  background-color: white;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.signature-canvas {
  display: block;
  touch-action: none; /* Prevent scrolling on touch */
}

.signature-canvas.mobile {
  width: 340px;
  height: 200px;
}

.signature-canvas.desktop {
  width: 500px;
  height: 150px;
}

.signature-line {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 1px;
  background-color: #cbd5e0;
  pointer-events: none;
}

.signature-x {
  position: absolute;
  left: 0;
  bottom: -20px;
  font-size: 18px;
  font-weight: bold;
  color: #4a5568;
}

.signature-actions {
  display: flex;
  gap: 12px;
}

.clear-button,
.save-signature-button,
.redo-signature-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-button {
  background-color: #edf2f7;
  color: #2d3748;
}

.clear-button:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.clear-button:disabled {
  background-color: #f7fafc;
  color: #cbd5e0;
  cursor: not-allowed;
}

.save-signature-button {
  background-color: #48bb78;
  color: white;
}

.save-signature-button:hover:not(:disabled) {
  background-color: #38a169;
}

.save-signature-button:disabled {
  background-color: #c6f6d5;
  color: #9ae6b4;
  cursor: not-allowed;
}

.redo-signature-button {
  background-color: #fed7d7;
  color: #c53030;
}

.redo-signature-button:hover {
  background-color: #fc8181;
  color: white;
}

.signature-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signature-thumbnail {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.signature-image {
  display: block;
}
```

### Step 3: Integrate SignatureField into FormRenderer (20 min)

Update `apps/web/components/Forms/FormRenderer.tsx`:

```tsx
import { SignatureField } from './Fields/SignatureField';

export function FormRenderer({ schema, onSubmit, onSaveDraft, mode }) {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {schema.sections.map((section) => (
        <div key={section.id} className="form-section">
          <h2>{section.title}</h2>
          {section.fields.map((field) => {
            if (field.type === 'signature') {
              return (
                <Controller
                  key={field.id}
                  name={field.id}
                  control={control}
                  rules={{ required: field.required }}
                  render={({ field: { value, onChange } }) => (
                    <SignatureField
                      fieldId={field.id}
                      label={field.label}
                      required={field.required}
                      value={value || ''}
                      onChange={onChange}
                      mode={mode}
                    />
                  )}
                />
              );
            }

            // Other field types...
          })}
        </div>
      ))}
    </form>
  );
}
```

### Step 4: Test SignatureField Component (10 min)

Create test file `apps/web/components/Forms/FormRenderer/Fields/SignatureField.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureField } from './SignatureField';

// Mock react-signature-canvas
jest.mock('react-signature-canvas', () => {
  return function MockSignatureCanvas({ onEnd, canvasProps }: any) {
    return (
      <canvas
        data-testid="signature-canvas"
        width={canvasProps.width}
        height={canvasProps.height}
        onClick={() => onEnd && onEnd()}
      />
    );
  };
});

describe('SignatureField', () => {
  const mockOnChange = jest.fn();

  it('should render signature pad when no signature', () => {
    render(
      <SignatureField
        fieldId="test-signature"
        label="Foreman Signature"
        value=""
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Save Signature')).toBeInTheDocument();
  });

  it('should show redo button when signature exists', () => {
    render(
      <SignatureField
        fieldId="test-signature"
        label="Foreman Signature"
        value="data:image/png;base64,fake-signature"
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    expect(screen.getByText('Redo Signature')).toBeInTheDocument();
    expect(screen.queryByTestId('signature-canvas')).not.toBeInTheDocument();
  });

  it('should clear signature', () => {
    const { rerender } = render(
      <SignatureField
        fieldId="test-signature"
        label="Foreman Signature"
        value="data:image/png;base64,fake-signature"
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    fireEvent.click(screen.getByText('Redo Signature'));

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should show required asterisk', () => {
    render(
      <SignatureField
        fieldId="test-signature"
        label="Foreman Signature"
        required
        value=""
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
```

Run tests:

```bash
cd apps/web
pnpm test components/Forms/FormRenderer/Fields/SignatureField
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should render signature pad when no signature"
2. Write test: "should show redo button when signature exists"
3. Write test: "should clear signature"
4. Write test: "should show required asterisk"
5. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create SignatureField.tsx component
2. Add SignatureCanvas integration
3. Add save/clear/redo functionality
4. Add timestamp overlay
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract timestamp logic to utility function
2. Add proper TypeScript types
3. Improve canvas cleanup

## Troubleshooting

**Issue: Signature not saving**

```tsx
// Ensure canvas is not empty before saving
if (signatureRef.current && !signatureRef.current.isEmpty()) {
  const dataUrl = signatureRef.current.toDataURL('image/png');
  onChange(dataUrl);
}
```

**Issue: Touch not working on mobile**

```css
/* Prevent touch scrolling on canvas */
.signature-canvas {
  touch-action: none;
}
```

**Issue: Signature quality poor**

```tsx
// Increase canvas resolution
<SignatureCanvas
  canvasProps={{
    width: 500,
    height: 150,
    className: 'signature-canvas',
  }}
  minWidth={1}
  maxWidth={2}
  penColor="#000000"
/>
```

## Completion Checklist

- [ ] Install react-signature-canvas package (`pnpm add react-signature-canvas @types/react-signature-canvas`)
- [ ] Create apps/web/components/Forms/FormRenderer/Fields/SignatureField.tsx
- [ ] Implement signature pad with SignatureCanvas
- [ ] Add timestamp overlay to signature
- [ ] Add clear button
- [ ] Add save button
- [ ] Add redo button (when signature exists)
- [ ] Add signature preview with timestamp
- [ ] Integrate SignatureField into FormRenderer
- [ ] Create SignatureField tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: signature field with timestamp overlay"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-102/

## Evidence Requirements

**Screenshots:**

- Signature pad (empty state)
- Signature pad with drawing
- Signature preview with timestamp
- Redo button

**Test Results:**

- SignatureField tests passing (4 tests)
- Screenshot of test coverage report

**Code Review:**

- Timestamp embedded correctly
- Canvas size appropriate for mobile/desktop
- Touch interaction working smoothly

## Files Created/Modified

**Created:**

- apps/web/components/Forms/FormRenderer/Fields/SignatureField.tsx
- apps/web/components/Forms/FormRenderer/Fields/SignatureField.test.tsx

**Modified:**

- apps/web/components/Forms/FormRenderer.tsx (integrate SignatureField)
- apps/web/styles/globals.css (add signature field styles)
- apps/web/package.json (add react-signature-canvas dependency)

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Create SignatureField component (60 min)
- Step 2: Add styles (30 min)
- Step 3: Integrate into FormRenderer (20 min)
- Step 4: Testing (10 min)

## Next Issue

**ISSUE-103:** Form Submission Confirmation (1h)
