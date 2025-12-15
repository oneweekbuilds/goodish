import React from 'react';
import EmptyState from './EmptyState';
import {
  BarChartSimple,
  StackedBar100,
  LineChartSimple,
  BigNumber,
  SimpleTable,
  StatusCard,
  InsightCard,
} from './charts';

/**
 * ViewCard component - renders a single dashboard view card.
 * Supports multiple output types with takeaways and actions.
 */
const ViewCard = ({ view, dataResult }) => {
  const { title, description, outputType, takeaway, action } = view;
  const hasData = dataResult?.hasData === true;
  const data = dataResult?.data;
  const missing = dataResult?.missing;

  // Compute takeaway text
  const takeawayText = hasData && typeof takeaway === 'function'
    ? takeaway(data)
    : null;

  // Compute action text
  const actionText = hasData && typeof action === 'function'
    ? action(data)
    : null;

  // Render the appropriate chart/content based on outputType
  const renderContent = () => {
    if (!hasData) return null;

    switch (outputType) {
      case 'number':
      case 'number_line':
        return renderNumberLine(data, outputType);
      case 'number_bar':
        return renderNumberBar(data);
      case 'bar':
        return renderBar(data);
      case 'stacked100':
        return renderStacked100(data);
      case 'line':
        return renderLine(data);
      case 'table':
        return renderTable(data);
      case 'list':
        return renderList(data);
      case 'text':
        return renderText(data);
      case 'status':
        return renderStatus(data);
      default:
        return <p className="text-slate-500">Unknown output type: {outputType}</p>;
    }
  };

  // Number + optional line chart
  const renderNumberLine = (data, type) => {
    if (!data) return null;

    const value = data.currentPercent ?? data.concentration ?? data.discoveryRate ?? data.top3Percent;
    const showLine = type === 'number_line' && data.trend && data.trend.length >= 2;

    return (
      <div className="space-y-4">
        {value !== undefined && (
          <BigNumber value={`${value}%`} />
        )}
        {showLine && (
          <LineChartSimple
            data={data.trend.map(t => ({ label: t.label, value: t.value })).reverse()}
            valueLabel="%"
          />
        )}
      </div>
    );
  };

  // Number + bar chart for topic variety
  const renderNumberBar = (data) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        <BigNumber value={data.topicCount} label="topics detected" />
        {data.topTopics && data.topTopics.length > 0 && (
          <BarChartSimple data={data.topTopics} valueLabel="%" />
        )}
      </div>
    );
  };

  // Horizontal bar chart
  const renderBar = (data) => {
    if (!data || !Array.isArray(data)) return null;
    return <BarChartSimple data={data} valueLabel="%" />;
  };

  // 100% stacked bar
  const renderStacked100 = (data) => {
    if (!data) return null;
    const segments = data.segments || data;
    if (!Array.isArray(segments)) return null;
    return <StackedBar100 segments={segments} />;
  };

  // Line chart
  const renderLine = (data) => {
    if (!data) return null;
    const trend = data.trend || data;
    if (!Array.isArray(trend) || trend.length < 2) return null;

    // Reverse to show oldest to newest
    const chartData = [...trend].reverse().map(t => ({
      label: t.label,
      value: t.value,
    }));

    return (
      <div className="space-y-2">
        <LineChartSimple data={chartData} valueLabel="%" />
        {data.direction && (
          <p className="text-sm text-center text-slate-600">
            Trend: <span className="font-medium">{data.direction}</span>
          </p>
        )}
      </div>
    );
  };

  // Table
  const renderTable = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Auto-detect columns from first row
    const firstRow = data[0];
    const columns = Object.keys(firstRow).map(key => ({
      key,
      label: formatColumnLabel(key),
      align: typeof firstRow[key] === 'number' || key.includes('Percent') || key.includes('posts') ? 'right' : 'left',
    }));

    return <SimpleTable columns={columns} rows={data} />;
  };

  // List
  const renderList = (data) => {
    if (!data) return null;

    // Handle different data shapes
    let items = [];
    if (Array.isArray(data)) {
      items = data.map(d => d.topic || d.label || d);
    } else if (data.tips) {
      items = data.tips;
    } else if (data.interests) {
      items = data.interests;
    }

    if (items.length === 0) return null;

    return (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-slate-700">
            <span className="text-primary-blue mt-1">•</span>
            <span>{typeof item === 'string' ? item : item.topic || item.label || JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Text/insight card
  const renderText = (data) => {
    if (!data) return null;

    let content = [];
    if (data.insights) {
      content = data.insights;
    } else if (data.predictions) {
      content = data.predictions;
    } else if (data.interests) {
      content = [`Interests: ${data.interests.join(', ')}`];
    } else if (typeof data === 'string') {
      content = [data];
    }

    if (content.length === 0) return null;

    return <InsightCard content={content} />;
  };

  // Status card
  const renderStatus = (data) => {
    if (!data) return null;

    const status = data.status || data.breadth || data.diversity || data.stability || data.riskLevel || 'Unknown';
    const variant = getStatusVariant(status, data);
    const description = data.factors?.join('. ') || data.description;

    return <StatusCard status={status} variant={variant} description={description} />;
  };

  // Helper to format column labels
  const formatColumnLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Helper to determine status variant
  const getStatusVariant = (status, data) => {
    const s = status.toLowerCase();
    if (s.includes('broad') || s.includes('high') || s.includes('balanced') || s.includes('low') && data?.riskLevel) {
      return data?.riskLevel === 'low' ? 'positive' : 'positive';
    }
    if (s.includes('narrow') || s.includes('skewed') || s.includes('high') && data?.riskLevel) {
      return 'warning';
    }
    if (s.includes('moderate') || s.includes('stable') || s.includes('changing')) {
      return 'neutral';
    }
    return 'neutral';
  };

  return (
    <div className="bg-surface-card border border-border-card rounded-2xl overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-border-card">
        <h3 className="text-base font-semibold text-text-main mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-muted line-clamp-2">
          {description}
        </p>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-5">
        {hasData ? (
          <div className="space-y-4">
            {/* Main visualization */}
            {renderContent()}

            {/* Takeaway */}
            {takeawayText && (
              <div className="pt-4 border-t border-border-card">
                <p className="text-sm text-slate-700 font-medium">
                  {takeawayText}
                </p>
              </div>
            )}

            {/* Action */}
            {actionText && (
              <p className="text-sm text-slate-500 italic">
                {actionText}
              </p>
            )}
          </div>
        ) : (
          <EmptyState missing={missing} />
        )}
      </div>
    </div>
  );
};

export default ViewCard;
