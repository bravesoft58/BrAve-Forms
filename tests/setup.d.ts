/**
 * Global Test Setup for BrAve Forms
 *
 * This file is executed once before all tests run.
 * It sets up global test environment, mocks, and utilities.
 */
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
            workingHours: {
                start: number;
                end: number;
            };
            maxOfflineDays: number;
        };
        mockGPS: {
            latitude: number;
            longitude: number;
            accuracy: number;
        };
        mockWeather: {
            clear: {
                precipitation: number;
                temperature: number;
            };
            lightRain: {
                precipitation: number;
                temperature: number;
            };
            triggerRain: {
                precipitation: number;
                temperature: number;
            };
            heavyRain: {
                precipitation: number;
                temperature: number;
            };
        };
        mockProject: {
            id: string;
            name: string;
            location: {
                lat: number;
                lng: number;
            };
            organizationId: string;
        };
        sleep: (ms: number) => Promise<void>;
        createMockForm: (overrides?: any) => any;
        createMockRainTrigger: (precipitation?: number) => any;
    };
}
export {};
//# sourceMappingURL=setup.d.ts.map