/**
 * Error Logger Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logError,
  logMessage,
  logWarning,
  getErrorLog,
  clearErrorLog,
  createFeatureLogger,
} from '../error-logger';

describe('Error Logger', () => {
  beforeEach(() => {
    clearErrorLog();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // logError Tests
  // ============================================================================
  describe('logError', () => {
    it('should log an Error object', () => {
      const error = new Error('Test error');
      logError(error);

      const log = getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].severity).toBe('error');
      expect(log[0].message).toBe('Test error');
    });

    it('should log a string as an Error', () => {
      logError('String error message');

      const log = getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].message).toBe('String error message');
    });

    it('should include context in log entry', () => {
      const error = new Error('Test error');
      logError(error, { feature: 'photos', extra: { photoId: '123' } });

      const log = getErrorLog();
      expect(log[0].context?.feature).toBe('photos');
      expect(log[0].context?.extra?.photoId).toBe('123');
    });

    it('should support custom severity', () => {
      const error = new Error('Fatal error');
      logError(error, undefined, 'fatal');

      const log = getErrorLog();
      expect(log[0].severity).toBe('fatal');
    });

    it('should limit log size to 50 entries', () => {
      for (let i = 0; i < 60; i++) {
        logError(new Error(`Error ${i}`));
      }

      const log = getErrorLog();
      expect(log).toHaveLength(50);
      expect(log[0].message).toBe('Error 10'); // First 10 should be removed
    });
  });

  // ============================================================================
  // logMessage Tests
  // ============================================================================
  describe('logMessage', () => {
    it('should log an info message', () => {
      logMessage('Test info message');

      const log = getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].severity).toBe('info');
      expect(log[0].message).toBe('Test info message');
    });

    it('should log with custom severity', () => {
      logMessage('Warning message', undefined, 'warning');

      const log = getErrorLog();
      expect(log[0].severity).toBe('warning');
    });

    it('should include context in log entry', () => {
      logMessage('Info message', { feature: 'forms' });

      const log = getErrorLog();
      expect(log[0].context?.feature).toBe('forms');
    });
  });

  // ============================================================================
  // logWarning Tests
  // ============================================================================
  describe('logWarning', () => {
    it('should log a warning message', () => {
      logWarning('Test warning');

      const log = getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].severity).toBe('warning');
      expect(log[0].message).toBe('Test warning');
    });

    it('should include context', () => {
      logWarning('Warning message', { feature: 'sync' });

      const log = getErrorLog();
      expect(log[0].context?.feature).toBe('sync');
    });
  });

  // ============================================================================
  // getErrorLog Tests
  // ============================================================================
  describe('getErrorLog', () => {
    it('should return empty array when no logs', () => {
      const log = getErrorLog();
      expect(log).toEqual([]);
    });

    it('should return a copy of the log', () => {
      logError(new Error('Test'));
      const log1 = getErrorLog();
      const log2 = getErrorLog();
      expect(log1).not.toBe(log2); // Different array references
      expect(log1).toEqual(log2); // Same content
    });

    it('should include timestamp in log entries', () => {
      logError(new Error('Test'));
      const log = getErrorLog();
      expect(log[0].timestamp).toBeDefined();
      expect(new Date(log[0].timestamp).getTime()).not.toBeNaN();
    });
  });

  // ============================================================================
  // clearErrorLog Tests
  // ============================================================================
  describe('clearErrorLog', () => {
    it('should clear all log entries', () => {
      logError(new Error('Test 1'));
      logError(new Error('Test 2'));
      logError(new Error('Test 3'));

      expect(getErrorLog()).toHaveLength(3);

      clearErrorLog();

      expect(getErrorLog()).toHaveLength(0);
    });
  });

  // ============================================================================
  // createFeatureLogger Tests
  // ============================================================================
  describe('createFeatureLogger', () => {
    it('should create a scoped logger for a feature', () => {
      const logger = createFeatureLogger('photos');

      logger.error(new Error('Photo error'));
      logger.warning('Photo warning');
      logger.info('Photo info');

      const log = getErrorLog();
      expect(log).toHaveLength(3);
      expect(log[0].context?.feature).toBe('photos');
      expect(log[1].context?.feature).toBe('photos');
      expect(log[2].context?.feature).toBe('photos');
    });

    it('should support extra metadata', () => {
      const logger = createFeatureLogger('forms');

      logger.error('Form error', { formId: '123' });

      const log = getErrorLog();
      expect(log[0].context?.extra?.formId).toBe('123');
    });

    it('should log errors with correct severity', () => {
      const logger = createFeatureLogger('sync');

      logger.error('Error');
      logger.warning('Warning');
      logger.info('Info');

      const log = getErrorLog();
      expect(log[0].severity).toBe('error');
      expect(log[1].severity).toBe('warning');
      expect(log[2].severity).toBe('info');
    });
  });
});
