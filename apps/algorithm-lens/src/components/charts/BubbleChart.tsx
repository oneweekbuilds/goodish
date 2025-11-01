import React, { useState } from 'react';

export interface BubbleData {
  category: string;
  x: number; // frequency
  y: number; // intensity
  size: number; // bubble size
  color: string;
  brands?: string[];
}

interface BubbleChartProps {
  data: BubbleData[];
  width?: number;
  height?: number;
}

export function BubbleChart({ data, width = 500, height = 300 }: BubbleChartProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hoveredBubble, setHoveredBubble] = useState<BubbleData | null>(null);

  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const maxX = Math.max(...data.map(d => d.x), 10);
  const maxY = Math.max(...data.map(d => d.y), 100);
  const maxSize = Math.max(...data.map(d => d.size), 10);

  const filteredData = activeCategory
    ? data.filter(d => d.category === activeCategory)
    : data;

  return (
    <div className="space-y-4">
      {/* Legend with filters */}
      <div className="flex flex-wrap gap-2">
        {data.map(d => (
          <button
            key={d.category}
            onClick={() => setActiveCategory(activeCategory === d.category ? null : d.category)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeCategory === d.category || activeCategory === null
                ? 'opacity-100'
                : 'opacity-40'
            }`}
            style={{
              backgroundColor: `${d.color}15`,
              color: d.color,
              border: `2px solid ${activeCategory === d.category ? d.color : 'transparent'}`
            }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            {d.category}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative bg-slate-50 rounded-lg p-4">
        <svg width={width} height={height} className="overflow-visible">
          {/* Axes */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Axis labels */}
          <text x={width / 2} y={height - 5} textAnchor="middle" className="text-xs fill-slate-500">
            Frequency (per week)
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 15 ${height / 2})`}
            className="text-xs fill-slate-500"
          >
            Intensity (% share)
          </text>

          {/* Bubbles */}
          {filteredData.map((bubble, idx) => {
            const cx = padding + (bubble.x / maxX) * chartWidth;
            const cy = height - padding - (bubble.y / maxY) * chartHeight;
            const r = 10 + (bubble.size / maxSize) * 30;

            return (
              <g key={idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={bubble.color}
                  fillOpacity={0.6}
                  stroke={bubble.color}
                  strokeWidth={hoveredBubble === bubble ? 3 : 2}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredBubble(bubble)}
                  onMouseLeave={() => setHoveredBubble(null)}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-white pointer-events-none"
                >
                  {bubble.y}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredBubble && (
          <div className="absolute top-2 left-2 bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm max-w-xs">
            <div className="font-semibold mb-1" style={{ color: hoveredBubble.color }}>
              {hoveredBubble.category}
            </div>
            <div className="text-slate-600 space-y-1">
              <div>Frequency: {hoveredBubble.x} / week</div>
              <div>Share: {hoveredBubble.y}%</div>
              {hoveredBubble.brands && hoveredBubble.brands.length > 0 && (
                <div>
                  <span className="font-medium">Brands:</span> {hoveredBubble.brands.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
