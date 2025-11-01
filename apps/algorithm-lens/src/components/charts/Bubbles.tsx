import React, { useState, useRef, useEffect } from 'react';

export interface BubbleData {
  id: string;
  label: string;
  x: number; // 0-1 (frequency)
  y: number; // 0-1 (recency score)
  size: number; // exposure intensity
  color: string;
  category: string;
}

export interface BubblesProps {
  data: BubbleData[];
  width?: number;
  height?: number;
}

/**
 * Bubble scatter chart for Ad Influence Map
 * - x = frequency, y = recency score, size = exposure intensity
 * - Interactive hover tooltips
 * - Responsive SVG
 */
export function Bubbles({ data, width = 600, height = 400 }: BubblesProps) {
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const maxSize = Math.max(...data.map((d) => d.size));
  const minRadius = 10;
  const maxRadius = 40;

  const handleMouseEnter = (bubble: BubbleData, event: React.MouseEvent) => {
    setHoveredBubble(bubble.id);
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredBubble(null);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
        role="img"
        aria-label="Ad influence bubble chart"
      >
        {/* Grid lines */}
        <g className="text-grid">
          {[0, 0.25, 0.5, 0.75, 1].map((val) => (
            <line
              key={`h-${val}`}
              x1={padding}
              y1={padding + val * innerHeight}
              x2={padding + innerWidth}
              y2={padding + val * innerHeight}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((val) => (
            <line
              key={`v-${val}`}
              x1={padding + val * innerWidth}
              y1={padding}
              x2={padding + val * innerWidth}
              y2={padding + innerHeight}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
        </g>

        {/* Axes */}
        <line
          x1={padding}
          y1={padding + innerHeight}
          x2={padding + innerWidth}
          y2={padding + innerHeight}
          stroke="#0e0f11"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + innerHeight}
          stroke="#0e0f11"
          strokeWidth="2"
        />

        {/* Axis labels */}
        <text
          x={padding + innerWidth / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-xs fill-inkMuted"
        >
          Frequency →
        </text>
        <text
          x={15}
          y={padding + innerHeight / 2}
          textAnchor="middle"
          className="text-xs fill-inkMuted"
          transform={`rotate(-90 15 ${padding + innerHeight / 2})`}
        >
          Recency →
        </text>

        {/* Bubbles */}
        <g>
          {data.map((bubble) => {
            const cx = padding + bubble.x * innerWidth;
            const cy = padding + (1 - bubble.y) * innerHeight; // Invert y
            const r = minRadius + (bubble.size / maxSize) * (maxRadius - minRadius);

            return (
              <circle
                key={bubble.id}
                cx={cx}
                cy={cy}
                r={r}
                fill={bubble.color}
                fillOpacity={hoveredBubble === bubble.id ? 0.9 : 0.7}
                stroke={bubble.color}
                strokeWidth={hoveredBubble === bubble.id ? 3 : 0}
                className="transition-all cursor-pointer"
                onMouseEnter={(e) => handleMouseEnter(bubble, e)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => setHoveredBubble(bubble.id)}
                onBlur={() => setHoveredBubble(null)}
                tabIndex={0}
                role="button"
                aria-label={`${bubble.label}: frequency ${Math.round(bubble.x * 100)}%, recency ${Math.round(bubble.y * 100)}%`}
              />
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredBubble && (
        <div
          className="absolute z-tooltip bg-inkDim text-white px-3 py-2 rounded-lg text-sm shadow-e3 pointer-events-none animate-fade-in"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 10,
          }}
        >
          {data.find((b) => b.id === hoveredBubble)?.label}
          <div className="text-xs opacity-80 mt-1">
            {data.find((b) => b.id === hoveredBubble)?.category}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 text-xs text-inkMuted">
        <p>Bubble size = exposure intensity</p>
      </div>
    </div>
  );
}
