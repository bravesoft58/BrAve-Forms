import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowRequests: number;
  errorCount: number;
  throughput: number; // requests per second
}

interface RequestTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
  path: string;
  method: string;
  statusCode?: number;
}

/**
 * Performance Monitoring Middleware
 * Tracks API performance for construction site optimization
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);
  
  // Performance tracking
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private activeRequests: Map<string, RequestTiming> = new Map();
  private slowRequestThreshold = 200; // ms - construction site requirement
  private criticalThreshold = 1000; // ms - log critical performance issues
  
  // Request tracking for throughput calculation
  private requestTimestamps: number[] = [];
  private metricsWindow = 60000; // 1 minute window for throughput calculation

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    const path = this.normalizePath(req.path);
    
    // Store request timing
    this.activeRequests.set(requestId, {
      startTime,
      path,
      method: req.method
    });
    
    // Add request ID to response headers for debugging
    res.setHeader('X-Request-ID', requestId);
    
    // Track request timestamp for throughput calculation
    this.requestTimestamps.push(Date.now());
    this.cleanupOldTimestamps();
    
    // Override response.end to capture completion time
    const originalEnd = res.end.bind(res);
    
    res.end = (...args: any[]) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Update request timing
      const timing = this.activeRequests.get(requestId);
      if (timing) {
        timing.endTime = endTime;
        timing.duration = duration;
        timing.statusCode = res.statusCode;
      }
      
      // Track metrics
      this.updateMetrics(path, duration, res.statusCode);
      
      // Log performance data
      this.logPerformance(req, res, duration, requestId);
      
      // Cleanup
      this.activeRequests.delete(requestId);
      
      // Call original end
      return originalEnd(...args);
    };

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizePath(path: string): string {
    // Group similar paths to avoid metric explosion
    // Replace IDs with placeholders for aggregation
    return path
      .replace(/\/[a-f0-9-]{36}/g, '/:id') // UUID
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token'); // Long tokens
  }

  private updateMetrics(path: string, duration: number, statusCode: number): void {
    const key = path;
    const existing = this.metrics.get(key) || {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorCount: 0,
      throughput: 0
    };

    existing.requestCount++;
    existing.totalResponseTime += duration;
    existing.averageResponseTime = existing.totalResponseTime / existing.requestCount;
    
    if (duration > this.slowRequestThreshold) {
      existing.slowRequests++;
    }
    
    if (statusCode >= 400) {
      existing.errorCount++;
    }
    
    // Calculate throughput (requests per second in last minute)
    existing.throughput = this.calculateThroughput();
    
    this.metrics.set(key, existing);
  }

  private calculateThroughput(): number {
    const now = Date.now();
    const oneMinuteAgo = now - this.metricsWindow;
    const recentRequests = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    return Math.round(recentRequests.length / 60); // requests per second
  }

  private cleanupOldTimestamps(): void {
    const cutoff = Date.now() - this.metricsWindow;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > cutoff);
  }

  private logPerformance(req: Request, res: Response, duration: number, requestId: string): void {
    const { method, originalUrl, headers } = req;
    const { statusCode } = res;
    
    // Basic request logging
    const logData = {
      requestId,
      method,
      url: originalUrl,
      statusCode,
      duration: Math.round(duration),
      userAgent: headers['user-agent'],
      contentLength: res.get('content-length') || '0',
      timestamp: new Date().toISOString()
    };

    // Log level based on performance and status
    if (statusCode >= 500) {
      this.logger.error(`Server error: ${method} ${originalUrl}`, logData);
    } else if (statusCode >= 400) {
      this.logger.warn(`Client error: ${method} ${originalUrl}`, logData);
    } else if (duration > this.criticalThreshold) {
      this.logger.warn(`Critical performance: ${method} ${originalUrl} took ${Math.round(duration)}ms`, logData);
    } else if (duration > this.slowRequestThreshold) {
      this.logger.debug(`Slow request: ${method} ${originalUrl} took ${Math.round(duration)}ms`, logData);
    } else {
      this.logger.debug(`Request completed: ${method} ${originalUrl}`, logData);
    }

    // Alert for construction site critical paths
    if (this.isCriticalConstructionPath(originalUrl) && duration > this.slowRequestThreshold) {
      this.logger.error(
        `CONSTRUCTION SITE ALERT: Critical path ${originalUrl} exceeded ${this.slowRequestThreshold}ms (actual: ${Math.round(duration)}ms)`,
        {
          ...logData,
          alert: 'CONSTRUCTION_PERFORMANCE',
          threshold: this.slowRequestThreshold
        }
      );
    }
  }

  private isCriticalConstructionPath(url: string): boolean {
    const criticalPaths = [
      '/graphql', // GraphQL endpoint
      '/weather', // Weather monitoring
      '/forms', // Form submissions
      '/photos', // Photo uploads
      '/compliance', // EPA compliance checks
      '/health', // Health checks
    ];
    
    return criticalPaths.some(path => url.includes(path));
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Record<string, PerformanceMetrics> {
    const metrics: Record<string, PerformanceMetrics> = {};
    
    this.metrics.forEach((value, key) => {
      metrics[key] = { ...value };
    });
    
    return metrics;
  }

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary(): {
    totalRequests: number;
    averageResponseTime: number;
    slowRequestsPercent: number;
    errorRate: number;
    throughput: number;
    activeRequests: number;
    topSlowEndpoints: Array<{ path: string; avgTime: number; count: number }>;
  } {
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalSlowRequests = 0;
    let totalErrors = 0;
    let currentThroughput = 0;

    const endpointPerformance: Array<{ path: string; avgTime: number; count: number }> = [];

    this.metrics.forEach((metrics, path) => {
      totalRequests += metrics.requestCount;
      totalResponseTime += metrics.totalResponseTime;
      totalSlowRequests += metrics.slowRequests;
      totalErrors += metrics.errorCount;
      currentThroughput = Math.max(currentThroughput, metrics.throughput);

      if (metrics.averageResponseTime > 50) { // Only include endpoints > 50ms
        endpointPerformance.push({
          path,
          avgTime: Math.round(metrics.averageResponseTime),
          count: metrics.requestCount
        });
      }
    });

    // Sort by average response time descending
    endpointPerformance.sort((a, b) => b.avgTime - a.avgTime);

    return {
      totalRequests,
      averageResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
      slowRequestsPercent: totalRequests > 0 ? Math.round((totalSlowRequests / totalRequests) * 100) : 0,
      errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100) : 0,
      throughput: currentThroughput,
      activeRequests: this.activeRequests.size,
      topSlowEndpoints: endpointPerformance.slice(0, 10)
    };
  }

  /**
   * Get active requests for monitoring
   */
  getActiveRequests(): Array<{
    requestId: string;
    path: string;
    method: string;
    duration: number;
    isLongRunning: boolean;
  }> {
    const now = performance.now();
    const activeRequests: Array<{
      requestId: string;
      path: string;
      method: string;
      duration: number;
      isLongRunning: boolean;
    }> = [];

    this.activeRequests.forEach((timing, requestId) => {
      const currentDuration = now - timing.startTime;
      
      activeRequests.push({
        requestId,
        path: timing.path,
        method: timing.method,
        duration: Math.round(currentDuration),
        isLongRunning: currentDuration > this.criticalThreshold
      });
    });

    // Sort by duration descending
    return activeRequests.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Reset metrics (useful for testing or fresh starts)
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.activeRequests.clear();
    this.requestTimestamps = [];
    
    this.logger.log('Performance metrics reset');
  }

  /**
   * Set performance thresholds
   */
  setThresholds(slow: number, critical: number): void {
    this.slowRequestThreshold = slow;
    this.criticalThreshold = critical;
    
    this.logger.log(`Performance thresholds updated: slow=${slow}ms, critical=${critical}ms`);
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetricsForMonitoring(): {
    timestamp: string;
    summary: ReturnType<typeof this.getPerformanceSummary>;
    detailed: Record<string, PerformanceMetrics>;
    active: ReturnType<typeof this.getActiveRequests>;
  } {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getPerformanceSummary(),
      detailed: this.getMetrics(),
      active: this.getActiveRequests()
    };
  }

  /**
   * Health check for performance monitoring
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: {
      averageResponseTime: number;
      errorRate: number;
      activeRequests: number;
    };
  } {
    const summary = this.getPerformanceSummary();
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check average response time
    if (summary.averageResponseTime > this.criticalThreshold) {
      issues.push(`Average response time too high: ${summary.averageResponseTime}ms`);
      status = 'unhealthy';
    } else if (summary.averageResponseTime > this.slowRequestThreshold) {
      issues.push(`Average response time elevated: ${summary.averageResponseTime}ms`);
      if (status === 'healthy') status = 'degraded';
    }

    // Check error rate
    if (summary.errorRate > 10) {
      issues.push(`High error rate: ${summary.errorRate}%`);
      status = 'unhealthy';
    } else if (summary.errorRate > 5) {
      issues.push(`Elevated error rate: ${summary.errorRate}%`);
      if (status === 'healthy') status = 'degraded';
    }

    // Check active requests
    if (summary.activeRequests > 100) {
      issues.push(`High number of active requests: ${summary.activeRequests}`);
      if (status === 'healthy') status = 'degraded';
    }

    return {
      status,
      issues,
      metrics: {
        averageResponseTime: summary.averageResponseTime,
        errorRate: summary.errorRate,
        activeRequests: summary.activeRequests
      }
    };
  }
}