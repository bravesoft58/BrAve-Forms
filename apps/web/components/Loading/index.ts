/**
 * Loading Components Library
 *
 * Professional loading states and skeleton screens for Sprint 5 features.
 * Provides consistent loading UI across the application.
 */

// Skeleton Components
export {
  PhotoGallerySkeleton,
  MapViewSkeleton,
  SyncQueueSkeleton,
  SettingsFormSkeleton,
  DashboardStatsSkeleton,
  TableSkeleton,
  CardListSkeleton,
  ProfileSkeleton,
  InspectionDetailsSkeleton,
  type PhotoGallerySkeletonProps,
  type MapViewSkeletonProps,
  type SyncQueueSkeletonProps,
  type SettingsFormSkeletonProps,
  type DashboardStatsSkeletonProps,
  type TableSkeletonProps,
  type CardListSkeletonProps,
} from './Skeletons';

// ActionButton Components
export {
  ActionButton,
  LoadingButton,
  type ActionButtonProps,
  type LoadingButtonProps,
} from './ActionButton';

// RefreshIndicator Components
export {
  RefreshIndicator,
  FullPageLoader,
  type RefreshIndicatorProps,
  type FullPageLoaderProps,
} from './RefreshIndicator';

// Loading Hooks and Utilities
export {
  useLoadingAction,
  useLoadingState,
  simulateSlowNetwork,
  withMinDelay,
  type UseLoadingActionResult,
  type UseLoadingActionOptions,
} from './useLoadingAction';
