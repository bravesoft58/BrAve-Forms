# ISSUE-101: Photo Attachment to Form Fields

**Sprint:** Sprint 3 | **Phase:** 5 - Form Submission Workflow | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-100 (form pages ready)
**Status:** NOT STARTED

## What You'll Do

Integrate camera/file upload in PhotoField component with GPS EXIF extraction, thumbnail preview, and delete/retake functionality.

## Step-by-Step Instructions

### Step 1: Create PhotoField Component (60 min)

Create `apps/web/components/Forms/FormRenderer/Fields/PhotoField.tsx`:

```tsx
'use client';

import { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';

interface PhotoFieldProps {
  fieldId: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  mode: 'mobile' | 'desktop';
  gpsEnabled?: boolean;
}

export function PhotoField({
  fieldId,
  label,
  required = false,
  value,
  onChange,
  mode,
  gpsEnabled = true,
}: PhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number } | null>(null);

  const isMobile = Capacitor.isNativePlatform() || mode === 'mobile';

  const handleCameraCapture = async () => {
    if (!isMobile) {
      // Desktop: Trigger file input
      fileInputRef.current?.click();
      return;
    }

    // Mobile: Use Capacitor Camera
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      await uploadPhoto(photo.dataUrl!, 'camera');
    } catch (error) {
      if ((error as any).message !== 'User cancelled photos app') {
        toast.error('Failed to capture photo');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        await uploadPhoto(reader.result as string, 'file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  const uploadPhoto = async (dataUrl: string, source: 'camera' | 'file') => {
    setIsUploading(true);

    try {
      // Get GPS location if enabled
      let gps = null;
      if (gpsEnabled && source === 'camera') {
        gps = await getCurrentLocation();
        setGpsData(gps);
      }

      // Upload photo with GPS metadata
      const result = await api.photos.upload({
        dataUrl,
        fieldId,
        gps,
      });

      onChange(result.url);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      console.warn('Failed to get GPS location:', error);
      return null;
    }
  };

  const handleDelete = () => {
    onChange('');
    setGpsData(null);
    toast.success('Photo removed');
  };

  return (
    <div className="photo-field">
      <label className="field-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>

      {/* Hidden file input for desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {!value ? (
        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={isUploading}
          className={`photo-button ${isMobile ? 'mobile' : 'desktop'}`}
        >
          {isUploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <CameraIcon />
              <span>{isMobile ? 'Take Photo' : 'Upload Photo'}</span>
            </>
          )}
        </button>
      ) : (
        <div className="photo-preview">
          <div className="photo-thumbnail">
            <Image src={value} alt={label} width={200} height={200} className="thumbnail-image" />
            {gpsData && (
              <div className="gps-badge">
                GPS: {gpsData.lat.toFixed(4)}, {gpsData.lng.toFixed(4)}
              </div>
            )}
          </div>
          <div className="photo-actions">
            <button type="button" onClick={handleCameraCapture} className="retake-button">
              Retake
            </button>
            <button type="button" onClick={handleDelete} className="delete-button">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
```

### Step 2: Add PhotoField Styles (30 min)

Add to `apps/web/styles/globals.css`:

```css
.photo-field {
  margin-bottom: 24px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.required-asterisk {
  color: #e53e3e;
  margin-left: 4px;
}

.photo-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.photo-button:hover:not(:disabled) {
  background-color: #3182ce;
}

.photo-button:disabled {
  background-color: #cbd5e0;
  cursor: not-allowed;
}

.photo-button.mobile {
  min-height: 48px;
  min-width: 200px;
}

.camera-icon {
  width: 24px;
  height: 24px;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.photo-thumbnail {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gps-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  font-family: monospace;
}

.photo-actions {
  display: flex;
  gap: 12px;
}

.retake-button,
.delete-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retake-button {
  background-color: #edf2f7;
  color: #2d3748;
}

.retake-button:hover {
  background-color: #e2e8f0;
}

.delete-button {
  background-color: #fed7d7;
  color: #c53030;
}

.delete-button:hover {
  background-color: #fc8181;
  color: white;
}
```

### Step 3: Integrate PhotoField into FormRenderer (20 min)

Update `apps/web/components/Forms/FormRenderer.tsx`:

```tsx
import { PhotoField } from './Fields/PhotoField';

export function FormRenderer({ schema, onSubmit, onSaveDraft, mode }) {
  const { control, handleSubmit, watch, setValue } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {schema.sections.map((section) => (
        <div key={section.id} className="form-section">
          <h2>{section.title}</h2>
          {section.fields.map((field) => {
            if (field.type === 'photo') {
              return (
                <Controller
                  key={field.id}
                  name={field.id}
                  control={control}
                  rules={{ required: field.required }}
                  render={({ field: { value, onChange } }) => (
                    <PhotoField
                      fieldId={field.id}
                      label={field.label}
                      required={field.required}
                      value={value || ''}
                      onChange={onChange}
                      mode={mode}
                      gpsEnabled={field.gpsEnabled}
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

### Step 4: Test PhotoField Component (10 min)

Create test file `apps/web/components/Forms/FormRenderer/Fields/PhotoField.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoField } from './PhotoField';

jest.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: jest.fn().mockResolvedValue({
      dataUrl: 'data:image/png;base64,fake-image-data',
    }),
  },
  CameraResultType: { DataUrl: 'dataUrl' },
  CameraSource: { Camera: 'camera' },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

describe('PhotoField', () => {
  const mockOnChange = jest.fn();

  it('should render upload button when no photo', () => {
    render(
      <PhotoField
        fieldId="test-photo"
        label="Site Photo"
        value=""
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
  });

  it('should show preview when photo exists', () => {
    render(
      <PhotoField
        fieldId="test-photo"
        label="Site Photo"
        value="https://example.com/photo.jpg"
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    expect(screen.getByAltText('Site Photo')).toBeInTheDocument();
    expect(screen.getByText('Retake')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should delete photo', () => {
    render(
      <PhotoField
        fieldId="test-photo"
        label="Site Photo"
        value="https://example.com/photo.jpg"
        onChange={mockOnChange}
        mode="desktop"
      />
    );

    fireEvent.click(screen.getByText('Delete'));

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should show required asterisk', () => {
    render(
      <PhotoField
        fieldId="test-photo"
        label="Site Photo"
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
pnpm test components/Forms/FormRenderer/Fields/PhotoField
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should render upload button when no photo"
2. Write test: "should show preview when photo exists"
3. Write test: "should delete photo"
4. Write test: "should show required asterisk"
5. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create PhotoField.tsx component
2. Add upload/camera button
3. Add preview with delete/retake
4. Add required field indicator
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract GPS logic to custom hook
2. Add error boundaries
3. Improve TypeScript types

## Troubleshooting

**Issue: GPS not working**

```tsx
// Check browser permissions
navigator.permissions.query({ name: 'geolocation' }).then((result) => {
  console.log('Geolocation permission:', result.state);
});
```

**Issue: Photo upload fails**

```bash
# Check backend photo upload endpoint
curl -X POST http://localhost:30101/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { uploadPhoto(input: { dataUrl: \"...\", fieldId: \"test\" }) { url } }"}'
```

**Issue: Thumbnail not displaying**

```tsx
// Use Next.js Image component with proper config
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
  },
};
```

## Completion Checklist

- [ ] Create apps/web/components/Forms/FormRenderer/Fields/PhotoField.tsx
- [ ] Implement camera capture for mobile (Capacitor Camera)
- [ ] Implement file upload for desktop (HTML input)
- [ ] Add GPS EXIF extraction (getCurrentLocation)
- [ ] Add photo thumbnail preview (Next.js Image)
- [ ] Add delete/retake buttons
- [ ] Add GPS badge display on thumbnail
- [ ] Add file type validation (images only)
- [ ] Add file size validation (max 10MB)
- [ ] Add loading state during upload
- [ ] Integrate PhotoField into FormRenderer
- [ ] Create PhotoField tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: photo field with GPS EXIF extraction and thumbnail preview"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-101/

## Evidence Requirements

**Screenshots:**

- Photo upload button (mobile and desktop)
- Photo thumbnail with GPS badge
- Delete/retake buttons
- File upload validation error

**Test Results:**

- PhotoField tests passing (4 tests)
- Screenshot of test coverage report

**Code Review:**

- GPS extraction working correctly
- File validation prevents invalid uploads
- Thumbnail preview displays correctly

## Files Created/Modified

**Created:**

- apps/web/components/Forms/FormRenderer/Fields/PhotoField.tsx
- apps/web/components/Forms/FormRenderer/Fields/PhotoField.test.tsx

**Modified:**

- apps/web/components/Forms/FormRenderer.tsx (integrate PhotoField)
- apps/web/styles/globals.css (add photo field styles)

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Create PhotoField component (60 min)
- Step 2: Add styles (30 min)
- Step 3: Integrate into FormRenderer (20 min)
- Step 4: Testing (10 min)

## Next Issue

**ISSUE-102:** Signature Capture Integration (2h)
