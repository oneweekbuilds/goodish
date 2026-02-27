import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * SimpleTable - PREMIER QUALITY
 * Features: alternating row tints, rank badges for top 3, refined hover states,
 * better typography, polished header design, and mobile scroll affordance.
 *
 * @param {Array} columns - Array of { key: string, label: string, align?: 'left'|'right'|'center', width?: string }
 * @param {Array} rows - Array of objects with keys matching column keys
 * @param {number} maxRows - Maximum rows to display (default 10)
 */
const SimpleTable = ({ columns = [], rows = [], maxRows = 10 }) => {
  if (!columns.length || !rows.length) return null;

  const displayRows = rows.slice(0, maxRows);
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollRight(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, rows, columns]);

  const getAlignment = (align) => {
    switch (align) {
      case 'right': return 'text-right';
      case 'center': return 'text-center';
      default: return 'text-left';
    }
  };

  // Check if first column is a rank column
  const hasRankColumn = columns[0]?.key === 'rank';

  return (
    <div className="relative rounded-xl border border-primary-blue/8 shadow-sm">
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-xl"
        onScroll={checkScroll}
      >
      {/* (Audit 8 Cycle 2) Added aria-label for screen readers */}
      <table className="w-full text-sm" style={{ minWidth: '480px' }} aria-label={columns.length > 1 ? `Data table with ${columns.length} columns and ${displayRows.length} rows` : undefined}>
        <thead>
          <tr
            className="bg-gradient-to-b from-blue-50 to-blue-100 border-b border-primary-blue/10"
          >
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={`py-3 px-3 sm:px-4 font-semibold text-xs text-slate-600 uppercase tracking-wide ${getAlignment(col.align)}`}
                style={{
                  width: col.width || 'auto',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => {
            const isTop3 = rowIndex < 3;
            const isEven = rowIndex % 2 === 0;

            return (
              <tr
                key={rowIndex}
                className={`transition-colors duration-150 hover:bg-primary-blue/4 ${isEven ? 'bg-white' : 'bg-blue-50/60'} ${rowIndex < displayRows.length - 1 ? 'border-b border-slate-200/60' : ''}`}
              >
                {columns.map((col, colIndex) => {
                  const cellValue = row[col.key] ?? '-';
                  const isRankCell = hasRankColumn && colIndex === 0;

                  return (
                    <td
                      key={colIndex}
                      className={`py-3 px-3 sm:px-4 text-sm ${isTop3 ? 'font-semibold text-slate-900' : 'font-normal text-slate-700'} tracking-tight ${getAlignment(col.align)}`}
                    >
                      {isRankCell && isTop3 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                            rowIndex === 0 ? 'bg-gradient-to-br from-primary-blue to-blue-500 text-white shadow-lg shadow-primary-blue/30' :
                            rowIndex === 1 ? 'bg-gradient-to-br from-primary-blue/15 to-primary-blue/10 text-primary-blue' :
                            'bg-gradient-to-br from-primary-blue/8 to-primary-blue/5 text-primary-blue'
                          }`}
                        >
                          {cellValue}
                        </span>
                      ) : (
                        cellValue
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div
          className="text-center py-3 bg-blue-50/80 border-t border-slate-200/60"
        >
          <p className="text-sm text-text-muted font-medium">
            Showing {maxRows} of {rows.length} rows
          </p>
        </div>
      )}
      </div>
      {/* Scroll affordance: subtle right-edge shadow when table overflows */}
      {canScrollRight && (
        <div
          className="absolute top-0 right-0 bottom-0 w-6 pointer-events-none rounded-r-xl bg-gradient-to-l from-black/6 to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default SimpleTable;
