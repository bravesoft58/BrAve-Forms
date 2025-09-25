/**
 * Mobile Performance Optimization Utilities
 * Optimized for construction site conditions and low-end devices
 */

// Memory management utilities
export class MemoryManager {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static maxCacheSize = 50 * 1024 * 1024; // 50MB
  private static currentCacheSize = 0;

  /**
   * Optimize image loading for construction site photos
   */
  static optimizeImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions
        const { width, height } = this.calculateOptimalDimensions(
          img.width,
          img.height,
          maxWidth
        );

        canvas.width = width;
        canvas.height = height;

        // Use better image smoothing for construction photos
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image optimization failed'));
            }
          },
          'image/webp', // Use WebP for better compression
          quality
        );
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  private static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalHeight / originalWidth;
    return {
      width: maxWidth,
      height: Math.round(maxWidth * aspectRatio)
    };
  }

  /**
   * Cached image loader with memory management
   */
  static async loadImage(src: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    // Create new image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Estimate image size in memory
        const estimatedSize = img.width * img.height * 4; // RGBA
        
        // Check if we need to free up memory
        if (this.currentCacheSize + estimatedSize > this.maxCacheSize) {
          this.cleanupImageCache();
        }

        // Add to cache
        this.imageCache.set(src, img);
        this.currentCacheSize += estimatedSize;
        
        resolve(img);
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Clean up image cache using LRU strategy
   */
  private static cleanupImageCache(): void {
    const entries = Array.from(this.imageCache.entries());
    const toRemove = Math.ceil(entries.length * 0.3); // Remove 30% of cache

    // Remove oldest entries (simple LRU approximation)
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.imageCache.delete(key);
    }

    // Recalculate cache size
    this.currentCacheSize = 0;
    this.imageCache.forEach((img) => {
      this.currentCacheSize += img.width * img.height * 4;
    });
  }

  /**
   * Force garbage collection (if available)
   */
  static forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (error) {
        console.debug('GC not available or failed:', error);
      }
    }
  }

  /**
   * Get current memory usage estimate
   */
  static getMemoryUsage(): {
    imageCacheSize: number;
    imageCacheCount: number;
    jsHeapUsed?: number;
    jsHeapTotal?: number;
  } {
    const usage: any = {
      imageCacheSize: this.currentCacheSize,
      imageCacheCount: this.imageCache.size,
    };

    // Add JS heap info if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      usage.jsHeapUsed = memory.usedJSHeapSize;
      usage.jsHeapTotal = memory.totalJSHeapSize;
    }

    return usage;
  }
}

// Battery optimization utilities
export class BatteryOptimizer {
  private static updateFrequency = 30000; // 30 seconds default
  private static isLowPowerMode = false;
  private static networkType: string = 'unknown';

  /**
   * Initialize battery optimization
   */
  static async initialize(): Promise<void> {
    try {
      // Check battery API support
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        
        this.isLowPowerMode = battery.level < 0.2 || battery.charging === false;
        
        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          this.isLowPowerMode = battery.level < 0.2;
          this.adjustPerformanceForBattery();
        });

        battery.addEventListener('chargingchange', () => {
          this.isLowPowerMode = !battery.charging && battery.level < 0.5;
          this.adjustPerformanceForBattery();
        });
      }

      // Check network connection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.networkType = connection.effectiveType || connection.type || 'unknown';
        
        connection.addEventListener('change', () => {
          this.networkType = connection.effectiveType || connection.type || 'unknown';
          this.adjustPerformanceForNetwork();
        });
      }

      // Initial optimization
      this.adjustPerformanceForBattery();
      this.adjustPerformanceForNetwork();
      
    } catch (error) {
      console.warn('Battery optimization initialization failed:', error);
    }
  }

  /**
   * Adjust performance based on battery level
   */
  private static adjustPerformanceForBattery(): void {
    if (this.isLowPowerMode) {
      // Reduce update frequency
      this.updateFrequency = 60000; // 1 minute
      
      // Disable non-critical animations
      document.body.classList.add('low-power-mode');
      
      // Reduce image quality
      document.documentElement.style.setProperty('--image-quality', '0.6');
      
      console.log('Low power mode enabled - reduced performance settings');
    } else {
      // Normal performance
      this.updateFrequency = 30000; // 30 seconds
      
      document.body.classList.remove('low-power-mode');
      document.documentElement.style.setProperty('--image-quality', '0.8');
    }
  }

  /**
   * Adjust performance based on network conditions
   */
  private static adjustPerformanceForNetwork(): void {
    switch (this.networkType) {
      case 'slow-2g':
      case '2g':
        // Ultra-conservative for poor connections
        this.updateFrequency = 120000; // 2 minutes
        document.documentElement.style.setProperty('--image-quality', '0.4');
        document.body.classList.add('slow-network');
        break;
        
      case '3g':
        // Conservative for moderate connections
        this.updateFrequency = 60000; // 1 minute
        document.documentElement.style.setProperty('--image-quality', '0.6');
        document.body.classList.add('moderate-network');
        break;
        
      case '4g':
      default:
        // Normal performance for good connections
        if (!this.isLowPowerMode) {
          this.updateFrequency = 30000; // 30 seconds
          document.documentElement.style.setProperty('--image-quality', '0.8');
        }
        document.body.classList.remove('slow-network', 'moderate-network');
        break;
    }
  }

  /**
   * Get recommended update frequency based on current conditions
   */
  static getUpdateFrequency(): number {
    return this.updateFrequency;
  }

  /**
   * Check if device is in power saving mode
   */
  static isInLowPowerMode(): boolean {
    return this.isLowPowerMode;
  }

  /**
   * Get current network quality
   */
  static getNetworkQuality(): 'poor' | 'moderate' | 'good' | 'unknown' {
    switch (this.networkType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'moderate';
      case '4g':
      case 'wifi':
        return 'good';
      default:
        return 'unknown';
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static startTimes: Map<string, number> = new Map();

  /**
   * Start measuring performance for a specific operation
   */
  static startMeasure(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  /**
   * End measurement and record the result
   */
  static endMeasure(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    
    // Store measurement
    const existing = this.metrics.get(name) || [];
    existing.push(duration);
    
    // Keep only last 100 measurements per metric
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(name, existing);
    this.startTimes.delete(name);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${Math.round(duration)}ms`);
    }
    
    return duration;
  }

  /**
   * Get average performance for a metric
   */
  static getAverageTime(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  /**
   * Get 95th percentile for a metric
   */
  static getP95Time(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }

  /**
   * Get all performance metrics
   */
  static getAllMetrics(): Record<string, { 
    count: number; 
    avg: number; 
    p95: number; 
    latest: number; 
  }> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((measurements, name) => {
      if (measurements.length > 0) {
        const sorted = [...measurements].sort((a, b) => a - b);
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
        
        result[name] = {
          count: measurements.length,
          avg: Math.round(avg),
          p95: Math.round(p95),
          latest: Math.round(measurements[measurements.length - 1])
        };
      }
    });
    
    return result;
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Get device performance information
   */
  static getDeviceInfo(): {
    userAgent: string;
    platform: string;
    memory?: number;
    cores?: number;
    connectionType?: string;
  } {
    const info: any = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    };

    // Add memory info if available
    if ('memory' in navigator) {
      info.memory = (navigator as any).memory.deviceMemory;
    }

    // Add CPU info if available
    if ('hardwareConcurrency' in navigator) {
      info.cores = navigator.hardwareConcurrency;
    }

    // Add connection info if available
    if ('connection' in navigator) {
      info.connectionType = (navigator as any).connection.effectiveType;
    }

    return info;
  }
}

// Startup optimization utilities
export class StartupOptimizer {
  private static criticalResources: string[] = [];
  private static nonCriticalResources: string[] = [];

  /**
   * Preload critical resources for construction site app
   */
  static async preloadCriticalResources(): Promise<void> {
    const critical = [
      '/icons/app-icon-192.png',
      '/icons/app-icon-512.png',
      // Add other critical resources
    ];

    const promises = critical.map(async (url) => {
      try {
        PerformanceMonitor.startMeasure(`preload-${url}`);
        
        if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.webp')) {
          await MemoryManager.loadImage(url);
        } else {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to load ${url}`);
        }
        
        PerformanceMonitor.endMeasure(`preload-${url}`);
      } catch (error) {
        console.warn(`Failed to preload critical resource ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Lazy load non-critical resources
   */
  static lazyLoadNonCritical(): void {
    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLImageElement;
          if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
            observer.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before visible
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img);
    });
  }

  /**
   * Optimize service worker registration for fast startup
   */
  static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        PerformanceMonitor.startMeasure('sw-registration');
        
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Update service worker when new version available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New version available. Refresh to update.');
              }
            });
          }
        });
        
        PerformanceMonitor.endMeasure('sw-registration');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }
  }

  /**
   * Initialize performance optimizations
   */
  static async initialize(): Promise<void> {
    try {
      // Start all optimizations in parallel
      await Promise.all([
        BatteryOptimizer.initialize(),
        this.preloadCriticalResources(),
        this.registerServiceWorker(),
      ]);

      // Initialize lazy loading
      this.lazyLoadNonCritical();

      console.log('Mobile performance optimizations initialized');
    } catch (error) {
      console.error('Failed to initialize performance optimizations:', error);
    }
  }
}

// Export utilities
export {
  MemoryManager,
  BatteryOptimizer,
  PerformanceMonitor,
  StartupOptimizer,
};