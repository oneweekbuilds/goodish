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
    <div className="relative rounded-xl" style={{ border: '1px solid rgba(37, 99, 235, 0.08)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-xl"
        onScroll={checkScroll}
      >
      {/* (Audit 8 Cycle 2) Added aria-label for screen readers */}
      <table className="w-full text-sm" style={{ minWidth: '480px' }} aria-label={columns.length > 1 ? `Data table with ${columns.length} columns and ${displayRows.length} rows` : undefined}>
        <thead>
          <tr
            style={{
              background: 'linear-gradient(180deg, #F8FAFF 0%, #F1F5FE 100%)',
              borderBottom: '1px solid rgba(37, 99, 235, 0.1)',
            }}
          >
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={`py-3 px-3 sm:px-4 font-semibold ${getAlignment(col.align)}`}
                style={{
                  fontSize: '0.75rem',
                  color: '#475569',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
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
                className="transition-colors duration-150"
                style={{
                  background: isEven ? '#FFFFFF' : 'rgba(248, 250, 255, 0.6)',
                  borderBottom: rowIndex < displayRows.length - 1 ? '1px solid rgba(226, 232, 240, 0.6)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isEven ? '#FFFFFF' : 'rgba(248, 250, 255, 0.6)';
                }}
              >
                {columns.map((col, colIndex) => {
                  const cellValue = row[col.key] ?? '-';
                  const isRankCell = hasRankColumn && colIndex === 0;

                  return (
                    <td
                      key={colIndex}
                      className={`py-3 px-3 sm:px-4 ${getAlignment(col.align)}`}
                      style={{
                        fontWeight: isTop3 ? 600 : 400,
                        color: isTop3 ? '#1E293B' : '#64748B',
                        fontSize: '0.875rem',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {isRankCell && isTop3 ? (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                          style={{
                            background: rowIndex === 0 ? 'linear-gradient(135deg, #2563EB, #3B82F6)'
                              : rowIndex === 1 ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.1))'
                              : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.05))',
                            color: rowIndex === 0 ? '#FFFFFF' : '#2563EB',
                            boxShadow: rowIndex === 0 ? '0 2px 6px rgba(37, 99, 235, 0.3)' : 'none',
                          }}
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
          className="text-center py-3"
          style={{
            background: 'rgba(248, 250, 255, 0.8)',
            borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          }}
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
          className="absolute top-0 right-0 bottom-0 w-6 pointer-events-none rounded-r-xl"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default SimpleTable;
