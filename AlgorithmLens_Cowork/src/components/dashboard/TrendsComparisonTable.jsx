import React from 'react';

/**
 * TrendsComparisonTable - Renders the "Feed Makeup" and "Who and What" comparison tables
 *
 * Props:
 * - groupedMetrics: object with feedMakeup and whoWhat arrays
 */
const TrendsComparisonTable = ({ groupedMetrics }) => {
  return (
    <div className="space-y-4">
      {/* Feed Makeup Section */}
      {groupedMetrics.feedMakeup.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Feed makeup
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Metric</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Baseline</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Compare</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Change</th>
                </tr>
              </thead>
              <tbody>
                {groupedMetrics.feedMakeup.map((metric, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="py-2 px-3 text-slate-900">{metric.label}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.baseline}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.compare}</td>
                    <td className={`py-2 px-3 text-right font-mono text-xs font-medium ${
                      metric.delta.startsWith('+') ? 'text-teal-600' :
                      metric.delta.startsWith('-') ? 'text-slate-500' :
                      'text-slate-500'
                    }`}>
                      {metric.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Who and What Section */}
      {groupedMetrics.whoWhat.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Who and what you saw
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Metric</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Baseline</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Compare</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Change</th>
                </tr>
              </thead>
              <tbody>
                {groupedMetrics.whoWhat.map((metric, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="py-2 px-3 text-slate-900">{metric.label}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.baseline}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono text-xs">{metric.compare}</td>
                    <td className={`py-2 px-3 text-right font-mono text-xs font-medium ${
                      metric.delta.startsWith('+') ? 'text-teal-600' :
                      metric.delta.startsWith('-') ? 'text-slate-500' :
                      'text-slate-500'
                    }`}>
                      {metric.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendsComparisonTable;
