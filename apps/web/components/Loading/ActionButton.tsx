/**
 * ActionButton Component
 *
 * Button that automatically handles loading state during async operations.
 * Shows spinner and disables button while action is in progress.
 */

'use client';

import { useState, useCallback } from 'react';
import { Button, type ButtonProps } from '@mantine/core';

/**
 * Props for ActionButton component
 */
export interface ActionButtonProps extends Omit<ButtonProps, 'onClick' | 'loading'> {
  /** Async function to execute on click */
  onClick: () => Promise<void>;
  /** Text to show while loading (optional) */
  loadingText?: string;
  /** Whether to disable button when loading (default: true) */
  disableOnLoading?: boolean;
  /** Callback when action completes successfully */
  onSuccess?: () => void;
  /** Callback when action fails */
  onError?: (error: Error) => void;
  /** Children content */
  children: React.ReactNode;
}

/**
 * ActionButton - Button with automatic loading state management
 *
 * Automatically shows loading spinner and disables button during async operations.
 * Useful for form submissions, API calls, and other async actions.
 *
 * @example
 * ```tsx
 * <ActionButton
 *   onClick={async () => await saveData()}
 *   loadingText="Saving..."
 *   color="blue"
 * >
 *   Save Changes
 * </ActionButton>
 * ```
 */
export function ActionButton({
  onClick,
  loadingText,
  disableOnLoading = true,
  onSuccess,
  onError,
  children,
  disabled,
  ...buttonProps
}: ActionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      await onClick();
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [onClick, loading, onSuccess, onError]);

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      loading={loading}
      disabled={disabled || (disableOnLoading && loading)}
      data-testid="action-button"
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

/**
 * LoadingButton - Simpler version that just accepts loading prop externally
 */
export interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Text to show while loading (optional) */
  loadingText?: string;
  /** Children content */
  children: React.ReactNode;
}

export function LoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  ...buttonProps
}: LoadingButtonProps) {
  return (
    <Button
      {...buttonProps}
      loading={loading}
      disabled={disabled || loading}
      data-testid="loading-button"
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
