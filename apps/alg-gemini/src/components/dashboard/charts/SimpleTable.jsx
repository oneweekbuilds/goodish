import React from 'react';

/**
 * Simple table component for dashboard views.
 *
 * @param {Array} columns - Array of { key: string, label: string, align?: 'left'|'right'|'center' }
 * @param {Array} rows - Array of objects with keys matching column keys
 * @param {number} maxRows - Maximum rows to display (default 10)
 */
const SimpleTable = ({ columns = [], rows = [], maxRows = 10 }) => {
  if (!columns.length || !rows.length) return null;

  const displayRows = rows.slice(0, maxRows);

  const getAlignment = (align) => {
    switch (align) {
      case 'right': return 'text-right';
      case 'center': return 'text-center';
      default: return 'text-left';
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* R2-C2 FIX: Increased text contrast, padding, and visual separation for better scannability */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300">
            {/* R2-C2: Stronger border, darker header text */}
            {columns.map((col, i) => (
              <th
                key={i}
                className={`py-2.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wide ${getAlignment(col.align)}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              {/* R2-C2: Alternating row backgrounds, darker text, more padding */}
              {/* R2-P5: First column emphasized for focal hierarchy */}
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`py-3 px-4 text-slate-800 ${getAlignment(col.align)} ${colIndex === 0 ? 'font-semibold text-slate-900' : ''}`}
                >
                  {row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="text-xs text-slate-400 mt-2 text-center">
          Showing {maxRows} of {rows.length} rows
        </p>
      )}
    </div>
  );
};

export default SimpleTable;
