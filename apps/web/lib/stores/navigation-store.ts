import { proxy } from 'valtio';
import { persist } from 'valtio-persist';

/**
 * Navigation Store
 *
 * Manages application navigation state including:
 * - Sidebar collapsed/expanded state
 * - Mobile menu open/closed state
 * - Active route highlighting
 * - Breadcrumb trail
 *
 * State persists to localStorage for consistent UX across sessions.
 */

interface NavigationState {
  /**
   * Sidebar collapsed state
   * Desktop: false (expanded by default)
   * Mobile: true (collapsed by default)
   */
  sidebarCollapsed: boolean;

  /**
   * Mobile menu open state
   * Only used on mobile (<768px)
   */
  mobileMenuOpen: boolean;

  /**
   * Current active route
   * Used for navigation highlighting
   */
  activeRoute: string;

  /**
   * Breadcrumb trail
   * Array of route segments for breadcrumb navigation
   */
  breadcrumbs: Array<{ label: string; href: string }>;
}

/**
 * Initial navigation state
 */
const initialState: NavigationState = {
  sidebarCollapsed: false, // Expanded by default on desktop
  mobileMenuOpen: false,
  activeRoute: '/',
  breadcrumbs: [],
};

/**
 * Navigation store with localStorage persistence
 */
export const navigationStore = persist({
  name: 'brave-forms-navigation',
  initialState: proxy<NavigationState>(initialState),
  version: 1,
  migrations: {
    // Migration function for future state shape changes
  },
  getStorage: () => localStorage,
});

/**
 * Toggle sidebar collapsed state
 * Desktop: Collapses/expands sidebar
 * Mobile: No effect (handled by mobileMenuOpen)
 */
export const toggleSidebar = () => {
  navigationStore.sidebarCollapsed = !navigationStore.sidebarCollapsed;
};

/**
 * Toggle mobile menu open state
 * Mobile only: Opens/closes mobile menu overlay
 */
export const toggleMobileMenu = () => {
  navigationStore.mobileMenuOpen = !navigationStore.mobileMenuOpen;
};

/**
 * Close mobile menu
 * Called after route navigation on mobile
 */
export const closeMobileMenu = () => {
  navigationStore.mobileMenuOpen = false;
};

/**
 * Set active route
 * Updates navigation highlighting
 *
 * @param route - Current route path
 */
export const setActiveRoute = (route: string) => {
  navigationStore.activeRoute = route;
};

/**
 * Set breadcrumbs
 * Updates breadcrumb trail for current route
 *
 * @param breadcrumbs - Array of breadcrumb items
 */
export const setBreadcrumbs = (breadcrumbs: Array<{ label: string; href: string }>) => {
  navigationStore.breadcrumbs = breadcrumbs;
};

/**
 * Reset navigation state
 * Useful for logout or testing
 */
export const resetNavigationState = () => {
  Object.assign(navigationStore, initialState);
};

/**
 * Check if current device is mobile
 * Based on window width < 768px
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Initialize navigation state based on device
 * Called on app mount
 */
export const initializeNavigation = () => {
  if (typeof window === 'undefined') return;

  // On mobile, ensure sidebar is collapsed
  if (isMobile()) {
    navigationStore.sidebarCollapsed = true;
    navigationStore.mobileMenuOpen = false;
  }

  // Set initial active route from window location
  navigationStore.activeRoute = window.location.pathname;
};
