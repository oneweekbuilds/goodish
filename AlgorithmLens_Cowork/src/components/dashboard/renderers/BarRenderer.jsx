import React from 'react';
import { BarChartSimple } from '../charts';

/**
 * BarRenderer - Horizontal bar chart
 * Handles 'bar' output type
 *
 * UI Refoundation: De-emphasized on secondary cards
 *
 * @param {Object} data - The data object containing bars/themes
 * @param {Object} view - View configuration object
 * @param {boolean} deemphasizeCharts - Whether to reduce chart opacity
 * @returns {React.ReactNode}
 */
const BarRenderer = ({ data, view, deemphasizeCharts }) => {
  if (!data) return null;

  // Special handling for ads-products: show message if no themes
  const isAdProducts = view?.id === 'ads-products';
  if (isAdProducts && data.message) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-muted">{data.message}</p>
      </div>
    );
  }

  // PHASE 6A: Handle bars field for promo themes, or themes array for ads-products
  const bars = data.bars || data.themes || data;
  if (!Array.isArray(bars)) return null;

  // Special handling for ads-by-platform: show denominator explanation
  const isAdsByPlatform = view?.id === 'ads-by-platform';

  return (
    <div className="space-y-3">
      {/* Denominator explanation for ads-by-platform */}
      {isAdsByPlatform && (
        <p className="text-sm text-text-muted mt-2 mb-2">
          Percent shown is ads out of total posts on that platform in your scans.
        </p>
      )}
      {/* Denominator explanation for ads-products */}
      {isAdProducts && (
        <p className="text-sm text-text-muted mt-2 mb-2">
          Percent of ads in the selected date range
        </p>
      )}
      <div className={deemphasizeCharts ? 'opacity-80' : ''}>
        <BarChartSimple data={bars} valueLabel="%" />
      </div>
      {/* Show examples for ads-products themes */}
      {isAdProducts && bars.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="text-sm font-medium text-text-muted mb-3">Examples from your scans</p>
          <div className="space-y-3">
            {bars.slice(0, 3).map((theme, idx) => (
              theme.examples && theme.examples.length > 0 && (
                <div key={idx}>
                  <p className="text-sm font-medium text-text-muted mb-1">{theme.label}</p>
                  <ul className="space-y-0.5">
                    {theme.examples.map((example, exIdx) => (
                      <li key={exIdx} className="text-sm text-text-muted flex items-center gap-2">
                        <span className="text-text-muted">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      )}
      {/* PHASE 6A: Show note if present */}
      {data.note && (
        <p className="text-sm text-text-muted italic">{data.note}</p>
      )}
    </div>
  );
};

export default BarRenderer;
