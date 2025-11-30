/**
 * GlobalErrorBoundary Component
 *
 * Catches unhandled errors in the React component tree and provides
 * a fallback UI with retry functionality.
 */

'use client';

import { Component, ReactNode } from 'react';
import { ErrorFallback, ErrorFallbackProps } from './ErrorFallback';
import { logError } from './error-logger';

/**
 * Props for GlobalErrorBoundary
 */
export interface GlobalErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Custom fallback render function */
  FallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Called when error is reset */
  onReset?: () => void;
  /** Feature name for error context */
  feature?: string;
}

/**
 * State for GlobalErrorBoundary
 */
interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * GlobalErrorBoundary - Catches all unhandled errors in child components
 *
 * @example
 * ```tsx
 * <GlobalErrorBoundary feature="dashboard">
 *   <Dashboard />
 * </GlobalErrorBoundary>
 * ```
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error with context
    logError(error, {
      feature: this.props.feature || 'unknown',
      componentStack: errorInfo.componentStack || '',
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
    // Note: Console logging handled by logError (devLog utility)
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use custom FallbackComponent if provided
      if (this.props.FallbackComponent) {
        const FallbackComp = this.props.FallbackComponent;
        return (
          <FallbackComp
            error={this.state.error}
            resetError={this.resetError}
            feature={this.props.feature}
          />
        );
      }

      // Use default ErrorFallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          feature={this.props.feature}
        />
      );
    }

    return this.props.children;
  }
}
