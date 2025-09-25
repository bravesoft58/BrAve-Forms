/**
 * Global Test Setup for BrAve Forms
 * 
 * This file is executed once before all tests run.
 * It sets up global test environment, mocks, and utilities.
 */

import { jest } from '@jest/globals';

// Extend Jest matchers with custom EPA compliance matchers
expect.extend({
  toBeExactly025Inches(received: number) {
    const pass = received === 0.25;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be exactly 0.25 inches`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected ${received} to be exactly 0.25 inches (EPA CGP requirement). ` +
          `Received: ${received}. This MUST be exact to avoid regulatory violations.`,
        pass: false,
      };
    }
  },
  
  toBeWithin24Hours(received: Date, baseDate: Date = new Date()) {
    const diffHours = Math.abs(received.getTime() - baseDate.getTime()) / (1000 * 60 * 60);
    const pass = diffHours <= 24;
    
    if (pass) {
      return {
        message: () => `Expected ${received.toISOString()} not to be within 24 hours of ${baseDate.toISOString()}`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected ${received.toISOString()} to be within 24 hours of ${baseDate.toISOString()}. ` +
          `Difference: ${diffHours.toFixed(2)} hours. EPA requires inspection within 24 hours.`,
        pass: false,
      };
    }
  },
  
  toBeValidGPSCoordinates(received: { lat: number; lng: number }) {
    const validLat = received.lat >= -90 && received.lat <= 90;
    const validLng = received.lng >= -180 && received.lng <= 180;
    const pass = validLat && validLng;
    
    if (pass) {
      return {
        message: () => `Expected {lat: ${received.lat}, lng: ${received.lng}} not to be valid GPS coordinates`,
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected valid GPS coordinates but received {lat: ${received.lat}, lng: ${received.lng}}. ` +
          `Latitude must be between -90 and 90, longitude between -180 and 180.`,
        pass: false,
      };
    }
  }
});

// Global test environment setup
beforeAll(async () => {
  console.log('🧪 Setting up BrAve Forms test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/brave_forms_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  
  // EPA Compliance constants (CRITICAL - do not change)
  process.env.EPA_RAIN_THRESHOLD_INCHES = '0.25';
  process.env.EPA_INSPECTION_HOURS = '24';
  process.env.EPA_WORKING_HOURS_START = '7';
  process.env.EPA_WORKING_HOURS_END = '17';
  process.env.MAX_OFFLINE_DAYS = '30';
  
  // Disable external services in tests
  process.env.DISABLE_WEATHER_API = 'true';
  process.env.DISABLE_NOTIFICATIONS = 'true';
  process.env.DISABLE_PUSH_NOTIFICATIONS = 'true';
  
  // Mock Clerk authentication globally
  process.env.CLERK_SECRET_KEY = 'sk_test_mock_key_for_testing';
  process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing';
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Close any open database connections
  // Close Redis connections
  // Clean up temporary files
});

// Mock external dependencies globally
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-123',
    orgId: 'test-org-456',
    orgRole: 'admin',
    orgSlug: 'test-construction-co'
  })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignOutButton: ({ children }: { children: React.ReactNode }) => children,
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-123',
      primaryEmailAddress: { emailAddress: 'test@braveforms.com' }
    }
  }))
}));

// Mock Capacitor for mobile testing
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web'
  }
}));

jest.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: jest.fn(() => Promise.resolve({
      base64String: 'mock-base64-image-data',
      dataUrl: 'data:image/jpeg;base64,mock-data',
      format: 'jpeg',
      saved: false
    }))
  }
}));

jest.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: jest.fn(() => Promise.resolve({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    }))
  }
}));

// Mock weather APIs to prevent external calls
jest.mock('axios', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({
      data: {
        main: {
          temp: 72,
          humidity: 65
        },
        weather: [
          {
            main: 'Clear',
            description: 'clear sky'
          }
        ],
        // Mock precipitation data for testing
        rain: {
          '1h': 0.0,
          '3h': 0.0
        }
      }
    })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} }))
    }))
  }
}));

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Console log filtering for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  // Filter out common React testing warnings
  const message = args.join(' ');
  if (
    !message.includes('Warning: ReactDOM.render is no longer supported') &&
    !message.includes('Warning: React.createFactory() is deprecated') &&
    !message.includes('act(() => {}) warning')
  ) {
    originalConsoleError(...args);
  }
};

console.warn = (...args: any[]) => {
  // Filter out common warnings in test environment
  const message = args.join(' ');
  if (
    !message.includes('componentWillReceiveProps has been renamed') &&
    !message.includes('componentWillMount has been renamed')
  ) {
    originalConsoleWarn(...args);
  }
};

// Test utilities available globally
global.testUtils = {
  // EPA compliance test data
  epaCompliance: {
    exactRainThreshold: 0.25,
    inspectionDeadlineHours: 24,
    workingHours: { start: 7, end: 17 },
    maxOfflineDays: 30
  },
  
  // Mock GPS coordinates (NYC construction site)
  mockGPS: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10
  },
  
  // Mock weather data
  mockWeather: {
    clear: { precipitation: 0.0, temperature: 72 },
    lightRain: { precipitation: 0.15, temperature: 65 },
    triggerRain: { precipitation: 0.25, temperature: 60 }, // Exact EPA trigger
    heavyRain: { precipitation: 0.50, temperature: 58 }
  },
  
  // Test project data
  mockProject: {
    id: 'test-project-123',
    name: 'NYC Construction Site',
    location: { lat: 40.7128, lng: -74.0060 },
    organizationId: 'test-org-456'
  },
  
  // Sleep utility for async tests
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create mock form data
  createMockForm: (overrides = {}) => ({
    id: 'test-form-' + Math.random().toString(36).substr(2, 9),
    type: 'SWPPP_INSPECTION',
    projectId: 'test-project-123',
    submittedBy: 'test-user-123',
    submittedAt: new Date(),
    data: {
      inspectionDate: new Date().toISOString().split('T')[0],
      weather: {
        temperature: 72,
        precipitation: 0.0,
        windSpeed: 5
      },
      bmps: ['silt_fence', 'inlet_protection'],
      violations: [],
      photos: [],
      notes: 'Test inspection data'
    },
    ...overrides
  }),
  
  // Create mock rain trigger
  createMockRainTrigger: (precipitation = 0.25) => ({
    triggered: precipitation >= 0.25,
    precipitationAmount: precipitation,
    threshold: 0.25,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    triggeredAt: new Date(),
    regulation: 'EPA_CGP_2022_SECTION_4_2',
    type: 'SWPPP_INSPECTION'
  })
};

// Type declarations for global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeExactly025Inches(): R;
      toBeWithin24Hours(baseDate?: Date): R;
      toBeValidGPSCoordinates(): R;
    }
  }
  
  var testUtils: {
    epaCompliance: {
      exactRainThreshold: number;
      inspectionDeadlineHours: number;
      workingHours: { start: number; end: number };
      maxOfflineDays: number;
    };
    mockGPS: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    mockWeather: {
      clear: { precipitation: number; temperature: number };
      lightRain: { precipitation: number; temperature: number };
      triggerRain: { precipitation: number; temperature: number };
      heavyRain: { precipitation: number; temperature: number };
    };
    mockProject: {
      id: string;
      name: string;
      location: { lat: number; lng: number };
      organizationId: string;
    };
    sleep: (ms: number) => Promise<void>;
    createMockForm: (overrides?: any) => any;
    createMockRainTrigger: (precipitation?: number) => any;
  };
}

console.log('✅ BrAve Forms test environment setup complete');