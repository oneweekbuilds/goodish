import React from 'react';
import { SimpleTable } from '../charts';

/**
 * Helper to format column labels from camelCase keys
 * @param {string} key - The column key
 * @returns {string} - Formatted label
 */
const formatColumnLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * TableRenderer - Data table display
 * Handles 'table' output type
 *
 * PHASE 6A: Supports both rows field and data array format
 * Auto-detects columns from first row
 *
 * @param {Object} data - The data object containing rows array
 * @param {Object} dataResult - The full dataResult object (for missing states)
 * @param {Object} view - View configuration object
 * @returns {React.ReactNode}
 */
const TableRenderer = ({ data, dataResult, view }) => {
  if (!data) return null;

  // PHASE 6A: Handle rows field for creator-topic and creator-tone views
  const rows = data.rows || data;
  if (!Array.isArray(rows) || rows.length === 0) {
    // Handle empty state for politics-creators view
    if (view?.id === 'politics-creators' && dataResult?.missing) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">{dataResult.missing}</p>
          <p className="text-sm text-text-muted">As you scan more, this section will highlight which accounts contribute most to political content in the feed.</p>
        </div>
      );
    }
    return null;
  }

  // Filter out internal fields (those starting with _)
  const filteredRows = rows.map(row => {
    const filtered = {};
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_')) {
        filtered[key] = row[key];
      }
    });
    return filtered;
  });

  // Auto-detect columns from first row (after filtering)
  const firstRow = filteredRows[0];
  const columns = Object.keys(firstRow).map(key => ({
    key,
    label: formatColumnLabel(key),
    align: typeof firstRow[key] === 'number' || key.includes('Percent') || key.includes('posts') || key.includes('count') ? 'right' : 'left',
  }));

  return (
    <div className="space-y-3">
      {/* PHASE 6A: Show takeaway above table if present */}
      {data.takeaway && (
        <p className="text-sm text-text-main font-medium bg-primary-blue/5 px-3 py-2 rounded-lg">
          {data.takeaway}
        </p>
      )}
      <SimpleTable columns={columns} rows={filteredRows} />
    </div>
  );
};

export default TableRenderer;
