import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @clerk/nextjs - must be before any component imports
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_test123',
    sessionId: 'sess_test123',
    orgId: 'org_test123',
    orgRole: 'admin',
    orgSlug: 'test-org',
    getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_test123',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
  }),
  useOrganization: () => ({
    isLoaded: true,
    organization: {
      id: 'org_test123',
      name: 'Test Organization',
      slug: 'test-org',
    },
  }),
  useClerk: () => ({
    signOut: vi.fn(),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: ({ children: _children }: { children: React.ReactNode }) => null,
  SignInButton: () => null,
  SignOutButton: () => null,
  UserButton: () => null,
  OrganizationSwitcher: () => null,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock @mantine/notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
    cleanQueue: vi.fn(),
  },
  showNotification: vi.fn(),
  hideNotification: vi.fn(),
  updateNotification: vi.fn(),
  cleanNotifications: vi.fn(),
  cleanNotificationsQueue: vi.fn(),
  Notifications: () => null,
}));

// Mock window.matchMedia for Mantine components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock ResizeObserver for Mantine SegmentedControl
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for Mantine Combobox
Element.prototype.scrollIntoView = vi.fn();

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Mock IndexedDB for offline storage tests
const mockIndexedDB = {
  open: vi.fn(() => ({
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ result: null })),
          put: vi.fn(),
          delete: vi.fn(),
          clear: vi.fn(),
          getAll: vi.fn(() => ({ result: [] })),
        })),
      })),
      close: vi.fn(),
    },
    onsuccess: null,
    onerror: null,
  })),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock crypto.getRandomValues for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => `test-uuid-${Math.random().toString(36).substring(7)}`,
  },
});
