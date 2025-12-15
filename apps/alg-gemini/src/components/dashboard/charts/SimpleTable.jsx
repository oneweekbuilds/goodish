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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`py-2 px-3 font-semibold text-slate-600 ${getAlignment(col.align)}`}
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
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`py-2 px-3 text-slate-700 ${getAlignment(col.align)}`}
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
