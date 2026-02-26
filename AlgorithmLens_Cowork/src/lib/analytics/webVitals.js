/**
 * Web Vitals Monitoring (#45)
 *
 * Monitors Core Web Vitals and sends them to analytics.
 * These metrics are critical for user experience and SEO.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): When main content is visible (~2.5s target)
 * - FID (First Input Delay): Responsiveness to first user interaction (~100ms target)
 * - CLS (Cumulative Layout Shift): Visual stability (~0.1 target)
 * - TTFB (Time to First Byte): Server response time (~600ms target)
 * - FCP (First Contentful Paint): When first content appears (~1.8s target)
 *
 * See: https://web.dev/vitals/
 */

import { logError } from '../errorLogger.js';

/**
 * Report Web Vitals metrics using the Performance Observer API
 * This doesn't require any external library and works in all modern browsers.
 *
 * @param {Function} onMetric - Callback function to handle metric data
 */
export function reportWebVitals(onMetric = null) {
  // Guard for SSR and old browsers
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  // Callback to handle metrics
  const handleMetric = (metric) => {
    const { name, value, delta, id } = metric;

    // Log to console in development
    if (import.meta.env.DEV) {
    }

    // Send to analytics in production
    if (!import.meta.env.DEV && window.gtag) {
      window.gtag('event', name, {
        value: Math.round(value),
        event_category: 'Web Vitals',
        event_label: id,
      });
    }
  };

  try {
    // LCP - Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      handleMetric({
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        delta: lastEntry.renderTime || lastEntry.loadTime,
        id: `lcp-${new Date().getTime()}`,
      });
    });

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // FCP - First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          handleMetric({
            name: 'FCP',
            value: entry.startTime,
            delta: entry.startTime,
            id: `fcp-${new Date().getTime()}`,
          });
        }
      });
    });

    fcpObserver.observe({ type: 'paint', buffered: true });

    // FID - First Input Delay (via durationStart timing)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.interactionId) {
          // First Input Delay is the duration
          handleMetric({
            name: 'FID',
            value: entry.processingDuration,
            delta: entry.processingDuration,
            id: `fid-${entry.interactionId}`,
          });
        }
      });
    });

    fidObserver.observe({ type: 'first-input', buffered: true });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          handleMetric({
            name: 'CLS',
            value: clsValue,
            delta: entry.value,
            id: `cls-${new Date().getTime()}`,
          });
        }
      });
    });

    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // TTFB - Time to First Byte (from navigation timing)
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      if (navigationTiming) {
        const ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
        handleMetric({
          name: 'TTFB',
          value: ttfb,
          delta: ttfb,
          id: `ttfb-${new Date().getTime()}`,
        });
      }
    });

  } catch (error) {
    logError('webVitals', '[WebVitals] Error setting up Performance Observers:', error);
  }
}

/**
 * Utility function to assess Web Vitals scores
 * Returns "good", "needs improvement", or "poor"
 *
 * @param {string} metric - Metric name (LCP, FID, CLS, etc.)
 * @param {number} value - Metric value
 * @returns {string} Assessment: "good", "needs-improvement", or "poor"
 */
export function assessWebVitalScore(metric, value) {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 600, poor: 1800 },
    FCP: { good: 1800, poor: 3000 },
  };

  const threshold = thresholds[metric];
  if (!threshold) {
    return 'unknown';
  }

  if (value <= threshold.good) {
    return 'good';
  } else if (value <= threshold.poor) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Example usage in src/main.jsx:
 *
 * import { reportWebVitals } from './lib/analytics/webVitals';
 *
 * reportWebVitals((metric) => {
 *   // Send to your analytics service
 *   if (window.gtag) {
 *     window.gtag('event', metric.name, {
 *       value: metric.value,
 *       event_category: 'Web Vitals',
 *       event_label: metric.id,
 *     });
 *   }
 *
 *   // Or to Sentry
 *   if (window.Sentry) {
 *     window.Sentry.captureMessage(`WebVital ${metric.name}: ${metric.value}ms`, 'info');
 *   }
 * });
 */
