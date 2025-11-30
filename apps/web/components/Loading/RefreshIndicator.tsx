/**
 * RefreshIndicator Component
 *
 * Shows a subtle indicator when data is being refreshed in the background.
 * Useful with TanStack Query's isFetching state.
 */

'use client';

import { Group, Loader, Text, Transition } from '@mantine/core';

/**
 * Props for RefreshIndicator component
 */
export interface RefreshIndicatorProps {
  /** Whether data is being refreshed */
  refreshing: boolean;
  /** Text to display while refreshing */
  text?: string;
  /** Loader size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Position: inline or fixed */
  position?: 'inline' | 'fixed';
}

/**
 * RefreshIndicator - Shows when data is being refreshed in background
 *
 * @example
 * ```tsx
 * const { data, isFetching } = useQuery({ queryKey: ['photos'], queryFn: fetchPhotos });
 *
 * return (
 *   <>
 *     <RefreshIndicator refreshing={isFetching} text="Refreshing photos..." />
 *     <PhotoGallery photos={data} />
 *   </>
 * );
 * ```
 */
export function RefreshIndicator({
  refreshing,
  text = 'Refreshing...',
  size = 'sm',
  position = 'inline',
}: RefreshIndicatorProps) {
  const content = (
    <Group
      gap="xs"
      data-testid="refresh-indicator"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader size={size} aria-label={text} />
      <Text size="sm" c="dimmed">
        {text}
      </Text>
    </Group>
  );

  if (position === 'fixed') {
    return (
      <Transition mounted={refreshing} transition="slide-down" duration={200}>
        {(styles) => (
          <div
            style={{
              ...styles,
              position: 'fixed',
              top: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'var(--mantine-color-body)',
              padding: '12px 20px',
              minHeight: '44px',
              borderRadius: 'var(--mantine-radius-md)',
              boxShadow: 'var(--mantine-shadow-md)',
              border: '1px solid var(--mantine-color-default-border)',
            }}
            data-testid="refresh-indicator-fixed"
          >
            {content}
          </div>
        )}
      </Transition>
    );
  }

  return (
    <Transition mounted={refreshing} transition="fade" duration={200}>
      {(styles) => (
        <div style={styles} data-testid="refresh-indicator-inline">
          {content}
        </div>
      )}
    </Transition>
  );
}

/**
 * FullPageLoader - Full page loading overlay
 */
export interface FullPageLoaderProps {
  /** Whether to show the loader */
  visible: boolean;
  /** Text to display */
  text?: string;
}

export function FullPageLoader({ visible, text = 'Loading...' }: FullPageLoaderProps) {
  return (
    <Transition mounted={visible} transition="fade" duration={200}>
      {(styles) => (
        <div
          style={{
            ...styles,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            zIndex: 1001,
          }}
          data-testid="full-page-loader"
          role="status"
          aria-live="assertive"
          aria-busy="true"
        >
          <Loader size="lg" aria-label={text} />
          <Text mt="md" c="dimmed">
            {text}
          </Text>
        </div>
      )}
    </Transition>
  );
}
