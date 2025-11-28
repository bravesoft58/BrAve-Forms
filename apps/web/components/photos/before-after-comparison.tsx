'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  Stack,
  Group,
  Image,
  Slider,
  Badge,
  Text,
  Tabs,
  Box,
  Button,
  Tooltip,
} from '@mantine/core';
import { IconMapPin, IconArrowsSplit, IconLayersSubtract, IconUnlink } from '@tabler/icons-react';
import { formatDate } from '@/lib/format-utils';

/**
 * Photo type for before/after comparison
 * Matches the Photo interface from photo-gallery-grid
 */
export interface Photo {
  id: string;
  orgId: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  latitude?: number | null;
  longitude?: number | null;
  takenAt: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  formName?: string;
  projectName?: string;
}

interface BeforeAfterComparisonProps {
  beforePhoto: Photo;
  afterPhoto: Photo;
  onUnpair?: () => void;
}

type ViewMode = 'side-by-side' | 'fade' | 'slider';

/**
 * BeforeAfterComparison - Compare two photos with multiple view modes
 *
 * Features:
 * - Side-by-side view with Before/After badges
 * - Fade slider for opacity blending between photos
 * - Slider view for horizontal wipe comparison
 * - Photo metadata display (caption, date, GPS)
 * - Unpair functionality when callback provided
 *
 * Used for construction progress tracking where before/after
 * photo pairs document work completion and compliance.
 */
export function BeforeAfterComparison({
  beforePhoto,
  afterPhoto,
  onUnpair,
}: BeforeAfterComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [sliderValue, setSliderValue] = useState(50);

  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  const handleTabChange = useCallback((value: string | null) => {
    if (value) {
      setViewMode(value as ViewMode);
    }
  }, []);

  const hasGpsBefore = beforePhoto.latitude != null && beforePhoto.longitude != null;
  const hasGpsAfter = afterPhoto.latitude != null && afterPhoto.longitude != null;

  return (
    <Card shadow="md" padding="lg" radius="md" data-testid="before-after-comparison">
      <Stack gap="md">
        {/* Header with unpair button */}
        <Group justify="space-between">
          <Text fw={600} size="lg">
            Before / After Comparison
          </Text>
          {onUnpair && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<IconUnlink size={14} />}
              onClick={onUnpair}
            >
              Unpair
            </Button>
          )}
        </Group>

        {/* View mode tabs */}
        <Tabs value={viewMode} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="side-by-side" leftSection={<IconArrowsSplit size={14} />}>
              Side by Side
            </Tabs.Tab>
            <Tabs.Tab value="fade" leftSection={<IconLayersSubtract size={14} />}>
              Fade
            </Tabs.Tab>
            <Tabs.Tab value="slider">Slider</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Side-by-side view */}
        {viewMode === 'side-by-side' && (
          <Group grow align="flex-start" data-testid="side-by-side-view">
            {/* Before Photo */}
            <Stack gap="xs">
              <Badge color="blue" size="lg">
                Before
              </Badge>
              <Box pos="relative">
                <Image
                  src={beforePhoto.thumbnailUrl || beforePhoto.url}
                  alt="Before"
                  height={250}
                  fit="cover"
                  radius="sm"
                  fallbackSrc="/images/photo-placeholder.png"
                />
                {hasGpsBefore && (
                  <Tooltip
                    label={`Lat: ${beforePhoto.latitude?.toFixed(6)}, Lon: ${beforePhoto.longitude?.toFixed(6)}`}
                    position="bottom"
                  >
                    <Badge
                      size="xs"
                      variant="filled"
                      color="blue"
                      leftSection={<IconMapPin size={10} />}
                      pos="absolute"
                      top={8}
                      right={8}
                      data-testid="gps-indicator-before"
                      style={{ cursor: 'help' }}
                    >
                      GPS
                    </Badge>
                  </Tooltip>
                )}
              </Box>
              {beforePhoto.caption && (
                <Text size="sm" fw={500}>
                  {beforePhoto.caption}
                </Text>
              )}
              <Text size="xs" c="dimmed" data-testid="before-date">
                {formatDate(beforePhoto.takenAt)}
              </Text>
            </Stack>

            {/* After Photo */}
            <Stack gap="xs">
              <Badge color="green" size="lg">
                After
              </Badge>
              <Box pos="relative">
                <Image
                  src={afterPhoto.thumbnailUrl || afterPhoto.url}
                  alt="After"
                  height={250}
                  fit="cover"
                  radius="sm"
                  fallbackSrc="/images/photo-placeholder.png"
                />
                {hasGpsAfter && (
                  <Tooltip
                    label={`Lat: ${afterPhoto.latitude?.toFixed(6)}, Lon: ${afterPhoto.longitude?.toFixed(6)}`}
                    position="bottom"
                  >
                    <Badge
                      size="xs"
                      variant="filled"
                      color="blue"
                      leftSection={<IconMapPin size={10} />}
                      pos="absolute"
                      top={8}
                      right={8}
                      data-testid="gps-indicator-after"
                      style={{ cursor: 'help' }}
                    >
                      GPS
                    </Badge>
                  </Tooltip>
                )}
              </Box>
              {afterPhoto.caption && (
                <Text size="sm" fw={500}>
                  {afterPhoto.caption}
                </Text>
              )}
              <Text size="xs" c="dimmed" data-testid="after-date">
                {formatDate(afterPhoto.takenAt)}
              </Text>
            </Stack>
          </Group>
        )}

        {/* Fade view - overlay with opacity control */}
        {viewMode === 'fade' && (
          <Stack gap="md" data-testid="fade-view">
            <Box pos="relative" h={300}>
              {/* After image (background) */}
              <Image
                src={afterPhoto.thumbnailUrl || afterPhoto.url}
                alt="After"
                height={300}
                fit="cover"
                radius="sm"
                fallbackSrc="/images/photo-placeholder.png"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: 1 - sliderValue / 100,
                }}
              />
              {/* Before image (foreground with variable opacity) */}
              <Image
                src={beforePhoto.thumbnailUrl || beforePhoto.url}
                alt="Before"
                height={300}
                fit="cover"
                radius="sm"
                fallbackSrc="/images/photo-placeholder.png"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: sliderValue / 100,
                }}
              />
            </Box>

            <Group gap="xs" justify="center">
              <Badge color="green" variant="light">
                After
              </Badge>
              <Slider
                value={sliderValue}
                onChange={handleSliderChange}
                min={0}
                max={100}
                step={1}
                w={300}
                marks={[
                  { value: 0, label: 'After' },
                  { value: 50, label: 'Blend' },
                  { value: 100, label: 'Before' },
                ]}
                aria-label="Fade between before and after photos"
              />
              <Badge color="blue" variant="light">
                Before
              </Badge>
            </Group>
          </Stack>
        )}

        {/* Slider view - horizontal wipe comparison */}
        {viewMode === 'slider' && (
          <Stack gap="md" data-testid="slider-view">
            <Box pos="relative" h={300} style={{ overflow: 'hidden' }}>
              {/* After image (full width, background) */}
              <Image
                src={afterPhoto.thumbnailUrl || afterPhoto.url}
                alt="After"
                height={300}
                fit="cover"
                radius="sm"
                fallbackSrc="/images/photo-placeholder.png"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              />
              {/* Before image (clipped by slider value) */}
              <Box
                pos="absolute"
                top={0}
                left={0}
                h={300}
                style={{
                  width: `${sliderValue}%`,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={beforePhoto.thumbnailUrl || beforePhoto.url}
                  alt="Before"
                  height={300}
                  fit="cover"
                  radius="sm"
                  fallbackSrc="/images/photo-placeholder.png"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    minWidth: '100%',
                    width: 'max-content',
                  }}
                />
              </Box>
              {/* Slider line indicator */}
              <Box
                pos="absolute"
                top={0}
                bottom={0}
                left={`${sliderValue}%`}
                w={2}
                bg="white"
                style={{
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                  transform: 'translateX(-50%)',
                }}
              />
              {/* Labels */}
              <Badge
                color="blue"
                pos="absolute"
                top={8}
                left={8}
                style={{ opacity: sliderValue > 20 ? 1 : 0.5 }}
              >
                Before
              </Badge>
              <Badge
                color="green"
                pos="absolute"
                top={8}
                right={8}
                style={{ opacity: sliderValue < 80 ? 1 : 0.5 }}
              >
                After
              </Badge>
            </Box>

            <Slider
              value={sliderValue}
              onChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              marks={[
                { value: 0, label: 'After' },
                { value: 50, label: 'Blend' },
                { value: 100, label: 'Before' },
              ]}
              aria-label="Slide to compare before and after photos"
            />
          </Stack>
        )}

        {/* Photo metadata summary */}
        <Group justify="space-between" mt="xs">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Before: {formatDate(beforePhoto.takenAt)}
            </Text>
            <Text size="xs" c="dimmed">
              After: {formatDate(afterPhoto.takenAt)}
            </Text>
          </Stack>
          {(hasGpsBefore || hasGpsAfter) && (
            <Badge color="blue" variant="light" leftSection={<IconMapPin size={12} />}>
              {hasGpsBefore && hasGpsAfter ? 'Both have GPS' : 'Partial GPS'}
            </Badge>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

export default BeforeAfterComparison;
