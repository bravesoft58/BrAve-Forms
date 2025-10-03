/**
 * NOAA Weather Service API TypeScript Type Definitions
 *
 * Based on NOAA API v1 (api.weather.gov)
 * Research: docs/sprints/sprint1/research/NOAA_API_NOTES.md
 * Created: 2025-10-02
 *
 * EPA CGP Compliance: 0.25 inch precipitation threshold (Section 4.4)
 */

/**
 * Response from GET /points/{lat},{lon}
 *
 * Converts GPS coordinates to NOAA grid coordinates and provides
 * URLs for weather stations, forecasts, and other data sources.
 *
 * @example
 * GET https://api.weather.gov/points/38.8951,-77.0364
 */
export interface NOAAPointResponse {
  properties: {
    /**
     * NOAA grid identifier (e.g., "LWX" for Washington DC area)
     */
    gridId: string;

    /**
     * Grid X coordinate
     */
    gridX: number;

    /**
     * Grid Y coordinate
     */
    gridY: number;

    /**
     * URL to observation stations endpoint
     * Format: https://api.weather.gov/gridpoints/{gridId}/{gridX},{gridY}/stations
     */
    observationStations: string;

    /**
     * URL to forecast endpoint
     */
    forecast?: string;

    /**
     * URL to hourly forecast endpoint
     */
    forecastHourly?: string;

    /**
     * IANA timezone identifier (e.g., "America/New_York")
     * Used for calculating EPA working hours deadlines
     */
    timeZone: string;

    /**
     * Radar station identifier
     */
    radarStation?: string;

    /**
     * Relative location information
     */
    relativeLocation?: {
      properties: {
        city: string;
        state: string;
        distance?: {
          value: number;
          unitCode: string;
        };
        bearing?: {
          value: number;
          unitCode: string;
        };
      };
    };
  };
}

/**
 * Response from GET /gridpoints/{gridId}/{gridX},{gridY}/stations
 *
 * List of weather observation stations near a grid point,
 * ordered by distance (closest first).
 */
export interface NOAAStationListResponse {
  /**
   * Array of weather stations (GeoJSON features)
   */
  features: NOAAStation[];
}

/**
 * Individual weather station (GeoJSON feature)
 *
 * Use the closest station (first in features array) as primary data source.
 * Fallback to next stations if primary returns null precipitation data.
 */
export interface NOAAStation {
  /**
   * Station URL
   * Format: https://api.weather.gov/stations/{stationId}
   */
  id: string;

  /**
   * Station properties
   */
  properties: {
    /**
     * Station identifier (e.g., "KDCA" for Reagan National Airport)
     * Use this ID to fetch observations
     */
    stationIdentifier: string;

    /**
     * Human-readable station name
     */
    name: string;

    /**
     * Station elevation (optional)
     */
    elevation?: {
      value: number;
      unitCode: string; // "wmoUnit:m"
    };

    /**
     * Station timezone (optional)
     */
    timeZone?: string;
  };

  /**
   * Station coordinates (GeoJSON geometry)
   */
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

/**
 * Response from GET /stations/{stationId}/observations
 * or GET /stations/{stationId}/observations/latest
 *
 * Weather observation data with precipitation measurements.
 */
export interface NOAAObservationsResponse {
  /**
   * Array of observations (GeoJSON features)
   * For /observations endpoint: multiple hourly readings
   * For /observations/latest endpoint: single most recent reading
   */
  features: NOAAObservation[];
}

/**
 * Individual weather observation (GeoJSON feature)
 *
 * Contains precipitation data for EPA CGP compliance monitoring.
 */
export interface NOAAObservation {
  /**
   * Observation ID
   */
  id: string;

  /**
   * Observation properties
   */
  properties: {
    /**
     * Observation timestamp (ISO 8601 format, UTC)
     * Example: "2025-10-02T14:55:00+00:00"
     */
    timestamp: string;

    /**
     * Human-readable conditions (e.g., "Partly Cloudy", "Light Rain")
     */
    textDescription?: string;

    /**
     * Temperature
     */
    temperature?: {
      value: number | null;
      unitCode: string; // "wmoUnit:degC"
      qualityControl?: string;
    };

    /**
     * Precipitation in last hour (CRITICAL for EPA compliance)
     *
     * WARNING: Frequently null even during rain events
     * Use precipitationLast3Hours as fallback
     *
     * Unit: millimeters (mm)
     * EPA threshold: 0.25 inches = 6.35 mm
     */
    precipitationLastHour?: {
      value: number | null; // millimeters or null
      unitCode: string; // "wmoUnit:mm"
      qualityControl?: string;
    };

    /**
     * Precipitation in last 3 hours (fallback for hourly data)
     *
     * Use when precipitationLastHour is null
     */
    precipitationLast3Hours?: {
      value: number | null; // millimeters or null
      unitCode: string; // "wmoUnit:mm"
      qualityControl?: string;
    };

    /**
     * Precipitation in last 6 hours (additional fallback)
     */
    precipitationLast6Hours?: {
      value: number | null;
      unitCode: string;
      qualityControl?: string;
    };

    /**
     * Barometric pressure
     */
    barometricPressure?: {
      value: number | null;
      unitCode: string;
      qualityControl?: string;
    };

    /**
     * Wind speed
     */
    windSpeed?: {
      value: number | null;
      unitCode: string;
      qualityControl?: string;
    };

    /**
     * Wind direction
     */
    windDirection?: {
      value: number | null; // degrees
      unitCode: string;
      qualityControl?: string;
    };

    /**
     * Relative humidity
     */
    relativeHumidity?: {
      value: number | null; // percentage
      unitCode: string;
      qualityControl?: string;
    };
  };
}

/**
 * Internal precipitation data format (after conversion from NOAA)
 *
 * This is our application's internal representation after:
 * 1. Converting millimeters to inches (EPA requirement)
 * 2. Parsing ISO 8601 timestamp to Date
 * 3. Adding metadata (station, source)
 */
export interface PrecipitationData {
  /**
   * Observation timestamp (parsed from ISO 8601)
   */
  timestamp: Date;

  /**
   * Precipitation amount in INCHES (converted from mm)
   *
   * EPA CGP threshold: >= 0.25 inches
   * Conversion: inches = millimeters / 25.4
   */
  precipitationInches: number;

  /**
   * Station identifier that provided this data (e.g., "KDCA")
   */
  stationId: string;

  /**
   * Data source identifier
   */
  source: 'NOAA' | 'OpenWeatherMap';

  /**
   * Original value in millimeters (for debugging/auditing)
   */
  precipitationMm?: number;

  /**
   * Data quality flag (if provided by NOAA)
   */
  qualityControl?: string;
}

/**
 * Aggregated precipitation data for 24-hour EPA compliance check
 *
 * EPA CGP requires accumulation over 24-hour period, not single observation.
 */
export interface PrecipitationAccumulation {
  /**
   * Start of 24-hour window (ISO 8601)
   */
  startTime: Date;

  /**
   * End of 24-hour window (ISO 8601)
   */
  endTime: Date;

  /**
   * Total precipitation in 24-hour window (inches)
   */
  totalInches: number;

  /**
   * Number of hourly observations included in total
   */
  observationCount: number;

  /**
   * Number of null/missing observations in window
   */
  missingObservations: number;

  /**
   * Whether this meets EPA CGP 0.25" threshold
   */
  meetsEPAThreshold: boolean;

  /**
   * Array of individual observations used in calculation
   */
  observations: PrecipitationData[];

  /**
   * Primary station used for data
   */
  stationId: string;

  /**
   * Project coordinates (for reference)
   */
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Error response from NOAA API
 */
export interface NOAAErrorResponse {
  /**
   * Error title
   */
  title: string;

  /**
   * Error detail message
   */
  detail: string;

  /**
   * HTTP status code
   */
  status: number;

  /**
   * Correlation ID (for debugging)
   */
  correlationId?: string;
}
