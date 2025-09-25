"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    // Use ts-jest for TypeScript support
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Root directories for tests
    roots: ['<rootDir>/apps', '<rootDir>/packages', '<rootDir>/tests'],
    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.spec.ts',
        '**/tests/**/*.test.ts',
        '**/tests/**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
    ],
    // Coverage configuration with EPA compliance requirements
    collectCoverage: true,
    collectCoverageFrom: [
        'apps/**/*.{ts,tsx}',
        'packages/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/build/**',
        '!**/*.stories.{ts,tsx}',
        '!**/migrations/**'
    ],
    // Critical coverage thresholds - EPA compliance requires high accuracy
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        // EPA compliance code requires 95% coverage
        './packages/compliance/': {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95
        },
        './apps/backend/src/modules/compliance/': {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95
        },
        // Weather monitoring is critical for 0.25" rain trigger
        './apps/backend/src/modules/weather/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        },
        // Offline sync must work for 30 days
        './apps/*/src/**/*sync*': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },
    // Coverage reporters
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json'
    ],
    // Coverage output directory
    coverageDirectory: '<rootDir>/coverage',
    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/tests/setup.ts'
    ],
    // Module name mapping for path aliases
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@backend/(.*)$': '<rootDir>/apps/backend/src/$1',
        '^@web/(.*)$': '<rootDir>/apps/web/$1',
        '^@mobile/(.*)$': '<rootDir>/apps/mobile/src/$1',
        '^@database/(.*)$': '<rootDir>/packages/database/$1',
        '^@types/(.*)$': '<rootDir>/packages/types/$1',
        '^@compliance/(.*)$': '<rootDir>/packages/compliance/$1',
        '^@test-utils/(.*)$': '<rootDir>/tests/utils/$1'
    },
    // Transform configuration
    transform: {
        '^.+\\.ts$': ['ts-jest', {
                tsconfig: {
                    // Allow JS in TS files for tests
                    allowJs: true,
                    // Enable strict mode for better type checking
                    strict: true,
                    // Target ES2020 for better async/await support
                    target: 'ES2020',
                    // Use CommonJS for Jest compatibility
                    module: 'CommonJS',
                    // Enable experimental decorators for NestJS
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                    // Enable source maps for better debugging
                    sourceMap: true,
                    inlineSourceMap: false,
                    // Skip lib checking to speed up tests
                    skipLibCheck: true,
                    // Enable all strict checks
                    noImplicitAny: true,
                    strictNullChecks: true,
                    strictFunctionTypes: true,
                    noImplicitReturns: true,
                    noFallthroughCasesInSwitch: true
                }
            }]
    },
    // File extensions Jest will process
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    // Global test timeout (30 seconds for EPA compliance tests)
    testTimeout: 30000,
    // Parallel execution settings
    maxWorkers: '50%',
    // Watch mode configuration
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ],
    // Clear mocks between tests for isolation
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
    // Verbose output for CI/CD
    verbose: process.env.CI === 'true',
    // Global variables available in tests
    globals: {
        'process.env': {
            NODE_ENV: 'test',
            // EPA compliance constants for testing
            EPA_RAIN_THRESHOLD_INCHES: '0.25',
            EPA_INSPECTION_HOURS: '24',
            EPA_WORKING_HOURS_START: '7',
            EPA_WORKING_HOURS_END: '17',
            // Test database configuration
            DATABASE_URL: 'postgresql://test:test@localhost:5432/brave_forms_test',
            REDIS_URL: 'redis://localhost:6379/1',
            // Disable external API calls in tests by default
            DISABLE_WEATHER_API: 'true',
            DISABLE_NOTIFICATIONS: 'true'
        }
    },
    // Test environment setup
    testEnvironmentOptions: {
        url: 'http://localhost:3002'
    },
    // Projects configuration for monorepo structure
    projects: [
        // Backend API tests
        {
            displayName: 'Backend API',
            testMatch: ['<rootDir>/apps/backend/**/*.{test,spec}.ts'],
            testEnvironment: 'node',
            setupFilesAfterEnv: ['<rootDir>/tests/setup-backend.ts']
        },
        // Web application tests  
        {
            displayName: 'Web App',
            testMatch: ['<rootDir>/apps/web/**/*.{test,spec}.{ts,tsx}'],
            testEnvironment: 'jsdom',
            setupFilesAfterEnv: [
                '<rootDir>/tests/setup-web.ts',
                '@testing-library/jest-dom'
            ],
            moduleNameMapping: {
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
                '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/tests/__mocks__/fileMock.js'
            }
        },
        // Mobile application tests
        {
            displayName: 'Mobile App',
            testMatch: ['<rootDir>/apps/mobile/**/*.{test,spec}.{ts,tsx}'],
            testEnvironment: 'jsdom',
            setupFilesAfterEnv: [
                '<rootDir>/tests/setup-mobile.ts',
                '@testing-library/jest-dom'
            ]
        },
        // EPA Compliance tests (critical - high coverage required)
        {
            displayName: 'EPA Compliance',
            testMatch: ['<rootDir>/tests/compliance/**/*.{test,spec}.ts'],
            testEnvironment: 'node',
            setupFilesAfterEnv: ['<rootDir>/tests/setup-compliance.ts'],
            // Longer timeout for compliance tests with real API calls
            testTimeout: 60000,
            // Higher coverage requirements
            coverageThreshold: {
                global: {
                    branches: 95,
                    functions: 95,
                    lines: 95,
                    statements: 95
                }
            }
        },
        // Package tests
        {
            displayName: 'Packages',
            testMatch: ['<rootDir>/packages/**/*.{test,spec}.ts'],
            testEnvironment: 'node'
        }
    ],
    // Error handling
    errorOnDeprecated: true,
    // Performance monitoring
    detectOpenHandles: true,
    forceExit: false,
    // Custom test sequences for different types
    testSequencer: '<rootDir>/tests/testSequencer.js'
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map