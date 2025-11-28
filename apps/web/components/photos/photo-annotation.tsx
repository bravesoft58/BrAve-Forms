'use client';

import { Annotorious, ImageAnnotator, useAnnotator } from '@annotorious/react';
import '@annotorious/annotorious/annotorious.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stack,
  Group,
  Button,
  Select,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  ColorInput,
  Alert,
  Paper,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconTrash,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { Photo } from './photo-gallery-grid';

/**
 * Maximum number of annotations allowed per photo
 * Prevents performance issues and excessive data storage
 */
const MAX_ANNOTATIONS = 50;

/**
 * Annotation type from Annotorious
 */
export interface Annotation {
  id: string;
  type: string;
  body: Array<{
    type: string;
    value: string;
    purpose?: string;
    creator?: {
      name: string;
      id: string;
    };
    created?: string;
  }>;
  target: {
    selector: {
      type: string;
      value: string;
    };
  };
}

/**
 * Drawing tool options for annotations
 */
type DrawingTool = 'rect' | 'polygon' | 'freehand' | 'arrow';

/**
 * Props for PhotoAnnotation component
 */
interface PhotoAnnotationProps {
  photo: Photo;
  onSave: (annotations: Annotation[]) => void | Promise<void>;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  initialAnnotations?: Annotation[];
  readOnly?: boolean;
  showMetadata?: boolean;
}

/**
 * Helper to safely cast annotator return types
 * Annotorious library returns unknown[] but we know the shape
 */
function getTypedAnnotations(anno: ReturnType<typeof useAnnotator>): Annotation[] {
  if (!anno) return [];
  return (anno.getAnnotations() || []) as Annotation[];
}

/**
 * Inner component that uses the annotator context
 */
function AnnotationToolbar({
  photo,
  onSave,
  onAnnotationsChange,
  initialAnnotations,
  readOnly,
  showMetadata,
}: PhotoAnnotationProps) {
  const anno = useAnnotator();
  const [tool, setTool] = useState<DrawingTool>('rect');
  const [color, setColor] = useState('#ff0000');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [annotationCount, setAnnotationCount] = useState(0);
  const [savedLocally, setSavedLocally] = useState(false);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const syncPendingRef = useRef(false);

  // Update annotation count and check limits
  const updateAnnotationCount = useCallback(() => {
    if (anno) {
      const annotations = getTypedAnnotations(anno);
      setAnnotationCount(annotations.length);
      setHasReachedLimit(annotations.length >= MAX_ANNOTATIONS);
    }
  }, [anno]);

  /**
   * Get localStorage key with orgId for multi-tenant isolation
   * CRITICAL: Must include orgId to prevent cross-tenant data leakage
   */
  const getStorageKey = useCallback(() => {
    return `photo-annotations-${photo.orgId}-${photo.id}`;
  }, [photo.orgId, photo.id]);

  // Load initial annotations
  useEffect(() => {
    if (anno && initialAnnotations && initialAnnotations.length > 0) {
      anno.setAnnotations(initialAnnotations);
      updateAnnotationCount();
    }
  }, [anno, initialAnnotations, updateAnnotationCount]);

  // Set up event listeners with complete undo/redo support
  useEffect(() => {
    if (!anno) return;

    // Track previous state for undo
    let previousState: Annotation[] = (anno.getAnnotations() || []) as Annotation[];

    const handleCreate = (_annotation: Annotation) => {
      // Check annotation limit before proceeding
      const currentCount = ((anno.getAnnotations() || []) as Annotation[]).length;
      if (currentCount > MAX_ANNOTATIONS) {
        // Remove the annotation that exceeds the limit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (anno as any).removeAnnotation(_annotation.id);
        setHasReachedLimit(true);
        return;
      }

      // Save previous state to undo stack
      setUndoStack((prev) => [...prev, previousState]);
      setRedoStack([]);
      previousState = (anno.getAnnotations() || []) as Annotation[];

      updateAnnotationCount();
      onAnnotationsChange?.((anno.getAnnotations() || []) as Annotation[]);
    };

    const handleUpdate = (_annotation: Annotation) => {
      // Save previous state to undo stack for update operations
      setUndoStack((prev) => [...prev, previousState]);
      setRedoStack([]);
      previousState = (anno.getAnnotations() || []) as Annotation[];

      updateAnnotationCount();
      onAnnotationsChange?.((anno.getAnnotations() || []) as Annotation[]);
    };

    const handleDelete = (_annotation: Annotation) => {
      // Save previous state to undo stack for delete operations
      setUndoStack((prev) => [...prev, previousState]);
      setRedoStack([]);
      previousState = (anno.getAnnotations() || []) as Annotation[];

      updateAnnotationCount();
      onAnnotationsChange?.((anno.getAnnotations() || []) as Annotation[]);
    };

    anno.on('createAnnotation', handleCreate);
    anno.on('updateAnnotation', handleUpdate);
    anno.on('deleteAnnotation', handleDelete);

    return () => {
      anno.off('createAnnotation', handleCreate);
      anno.off('updateAnnotation', handleUpdate);
      anno.off('deleteAnnotation', handleDelete);
    };
  }, [anno, onAnnotationsChange, updateAnnotationCount]);

  // Update drawing tool when selection changes
  useEffect(() => {
    if (anno) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (anno as any).setDrawingTool?.(tool);
    }
  }, [anno, tool]);

  // Update annotation style when color changes (HIGH-1 fix)
  useEffect(() => {
    if (anno) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (anno as any).setStyle?.({
        stroke: color,
        strokeWidth: 2,
      });
    }
  }, [anno, color]);

  // Sync-on-reconnect mechanism (HIGH-3 fix)
  useEffect(() => {
    const handleOnline = async () => {
      // Check if we have pending annotations to sync
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (stored && syncPendingRef.current) {
        try {
          const data = JSON.parse(stored);
          if (data.annotations && Array.isArray(data.annotations)) {
            await onSave(data.annotations);
            // Clear local storage after successful sync
            localStorage.removeItem(storageKey);
            syncPendingRef.current = false;
            setSavedLocally(false);
          }
        } catch (error) {
          console.error('Failed to sync annotations on reconnect:', error);
          setSaveError('Failed to sync annotations. Please try saving again.');
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [getStorageKey, onSave]);

  /**
   * Handle save annotations with error handling and offline support
   * MEDIUM-1 fix: Proper error handling for onSave failures
   */
  const handleSave = async () => {
    if (!anno) return;

    setIsSaving(true);
    setSavedLocally(false);
    setSaveError(null);

    try {
      const annotations = getTypedAnnotations(anno);
      const storageKey = getStorageKey();

      // Check if offline - store locally and mark for sync
      if (!navigator.onLine) {
        setSavedLocally(true);
        syncPendingRef.current = true;
        // Store in localStorage for offline persistence with orgId isolation
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            annotations,
            timestamp: new Date().toISOString(),
            photoId: photo.id,
            orgId: photo.orgId,
          })
        );
        // Still call onSave for local state management
        await onSave(annotations);
        return;
      }

      // Online - save to backend
      await onSave(annotations);

      // Clear any locally stored annotations on successful online save
      localStorage.removeItem(storageKey);
      syncPendingRef.current = false;
    } catch (error) {
      // MEDIUM-1: Handle save errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(`Failed to save annotations: ${errorMessage}`);
      console.error('Error saving annotations:', error);

      // Store locally as fallback on error
      const storageKey = getStorageKey();
      const annotations = getTypedAnnotations(anno);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          annotations,
          timestamp: new Date().toISOString(),
          photoId: photo.id,
          orgId: photo.orgId,
          error: errorMessage,
        })
      );
      syncPendingRef.current = true;
      setSavedLocally(true);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle clear all annotations
   */
  const handleClear = () => {
    if (!anno) return;

    if (showConfirmClear) {
      // Save to undo stack before clearing
      const currentAnnotations = getTypedAnnotations(anno);
      setUndoStack((prev) => [...prev, currentAnnotations]);
      setRedoStack([]);

      anno.setAnnotations([]);
      setShowConfirmClear(false);
      updateAnnotationCount();
      onAnnotationsChange?.([]);
    } else {
      setShowConfirmClear(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  };

  /**
   * Handle undo
   */
  const handleUndo = () => {
    if (!anno || undoStack.length === 0) return;

    const currentAnnotations = getTypedAnnotations(anno);
    const previousState = undoStack[undoStack.length - 1];

    setRedoStack((prev) => [...prev, currentAnnotations]);
    setUndoStack((prev) => prev.slice(0, -1));

    anno.setAnnotations(previousState);
    updateAnnotationCount();
  };

  /**
   * Handle redo
   */
  const handleRedo = () => {
    if (!anno || redoStack.length === 0) return;

    const currentAnnotations = getTypedAnnotations(anno);
    const nextState = redoStack[redoStack.length - 1];

    setUndoStack((prev) => [...prev, currentAnnotations]);
    setRedoStack((prev) => prev.slice(0, -1));

    anno.setAnnotations(nextState);
    updateAnnotationCount();
  };

  /**
   * Get annotation count text
   */
  const getAnnotationCountText = () => {
    if (annotationCount === 0) return 'No annotations';
    if (annotationCount === 1) return '1 annotation';
    return `${annotationCount} annotations`;
  };

  // Tool options for select
  const toolOptions = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'freehand', label: 'Freehand' },
    { value: 'arrow', label: 'Arrow' },
  ];

  return (
    <Stack gap="md" data-testid="photo-annotation-container">
      {/* Metadata display */}
      {showMetadata && (
        <Group gap="xs">
          {photo.caption && (
            <Text size="sm" fw={500}>
              {photo.caption}
            </Text>
          )}
          {photo.formName && (
            <Badge size="sm" variant="light" color="blue">
              {photo.formName}
            </Badge>
          )}
        </Group>
      )}

      {/* Toolbar - hidden in read-only mode */}
      {!readOnly && (
        <Paper
          shadow="xs"
          p="sm"
          withBorder
          data-testid="annotation-toolbar"
          role="toolbar"
          aria-label="Annotation tools"
        >
          <Group gap="md" wrap="wrap">
            {/* Drawing Tool Select */}
            <Select
              label="Drawing Tool"
              aria-label="Drawing Tool"
              value={tool}
              onChange={(value) => setTool((value as DrawingTool) || 'rect')}
              data={toolOptions}
              w={140}
              size="sm"
            />

            {/* Color Picker */}
            <ColorInput
              label="Color"
              value={color}
              onChange={setColor}
              w={120}
              size="sm"
              swatches={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']}
              data-testid="color-picker"
            />

            {/* Undo/Redo */}
            <Group gap="xs">
              <Tooltip label="Undo">
                <ActionIcon
                  variant="light"
                  size="lg"
                  aria-label="Undo"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <IconArrowBackUp size={18} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Redo">
                <ActionIcon
                  variant="light"
                  size="lg"
                  aria-label="Redo"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <IconArrowForwardUp size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {/* Annotation Count */}
            <Badge variant="outline" size="lg">
              {getAnnotationCountText()}
            </Badge>

            {/* Action Buttons */}
            <Group gap="xs" ml="auto">
              <Tooltip label={showConfirmClear ? 'Click again to confirm' : 'Clear all'}>
                <Button
                  variant={showConfirmClear ? 'filled' : 'light'}
                  color={showConfirmClear ? 'red' : 'gray'}
                  size="sm"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleClear}
                  aria-label="Clear all annotations"
                  style={{ minHeight: '44px' }}
                >
                  {showConfirmClear ? 'Confirm Clear' : 'Clear'}
                </Button>
              </Tooltip>

              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection={isSaving ? null : <IconDeviceFloppy size={16} />}
                onClick={handleSave}
                loading={isSaving}
                disabled={isSaving}
                aria-label="Save annotations"
                style={{ minHeight: '44px' }}
              >
                Save
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Error indicator */}
      {saveError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Save Error"
          variant="light"
          withCloseButton
          onClose={() => setSaveError(null)}
          data-testid="save-error-alert"
        >
          {saveError}
        </Alert>
      )}

      {/* Annotation limit warning */}
      {hasReachedLimit && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          title="Annotation limit reached"
          variant="light"
          data-testid="limit-warning-alert"
        >
          Maximum of {MAX_ANNOTATIONS} annotations allowed. Delete some annotations to add more.
        </Alert>
      )}

      {/* Saved locally indicator */}
      {savedLocally && (
        <Alert icon={<IconCheck size={16} />} color="yellow" title="Saved locally" variant="light">
          Annotations saved locally. They will sync when you&apos;re back online.
        </Alert>
      )}

      {/* Image with Annotorious */}
      <div style={{ position: 'relative', width: '100%' }}>
        <ImageAnnotator
          tool={tool}
          style={{
            stroke: color,
            strokeWidth: 2,
          }}
        >
          {/* Annotorious requires a standard img tag, not Next.js Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.caption || `Photo ${photo.id}`}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </ImageAnnotator>
      </div>
    </Stack>
  );
}

/**
 * PhotoAnnotation - Component for annotating photos with shapes, arrows, and text
 *
 * IMPORTANT: Multi-Tenancy Consideration
 * Annotations are stored per-photo and inherit the photo's orgId.
 * The backend API must validate orgId before saving/loading annotations.
 *
 * Features:
 * - Drawing tools: Rectangle, Polygon, Freehand, Arrow
 * - Color picker for annotation color
 * - Undo/Redo support
 * - Save annotations with metadata
 * - Read-only mode for viewing
 * - Offline support with local storage
 * - Glove-friendly 44x44px touch targets
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <PhotoAnnotation
 *   photo={photo}
 *   onSave={handleSaveAnnotations}
 *   initialAnnotations={photo.annotations}
 * />
 * ```
 */
export function PhotoAnnotation(props: PhotoAnnotationProps) {
  return (
    <Annotorious>
      <AnnotationToolbar {...props} />
    </Annotorious>
  );
}

export default PhotoAnnotation;
