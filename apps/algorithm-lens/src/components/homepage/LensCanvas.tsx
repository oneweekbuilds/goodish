import React, { useRef, useState, useEffect, useCallback } from 'react';

export type LensMode = 'bias' | 'ads' | 'tone';

export interface LensCanvasProps {
  mode: LensMode;
}

interface ContentTile {
  id: string;
  x: number;
  y: number;
  bias: 'left' | 'neutral' | 'right';
  tone: 'analytical' | 'empathetic' | 'outrage';
  adCategory?: 'technology' | 'wellness' | 'finance' | 'fashion' | 'food';
  headline: string;
}

const LENS_RADIUS = 100; // pixels
const MOVE_STEP = 24; // pixels for keyboard movement
const MOVE_STEP_LARGE = 64; // pixels for shift+arrow

/**
 * LensCanvas - Interactive magnifying glass over feed content
 *
 * Features:
 * - Pre-generated 12x6 grid of content tiles (blurred background)
 * - Circular lens reveals sharpened content + annotations
 * - Three modes: Bias, Ads, Tone (toggle above canvas)
 * - Mouse, touch, and keyboard (WASD/arrows) support
 * - Edge label rails show live stats as lens moves
 * - Respects prefers-reduced-motion
 * - Screen reader live region for accessibility
 */
export function LensCanvas({ mode }: LensCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lensPos, setLensPos] = useState({ x: 300, y: 200 });
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });
  const [tiles, setTiles] = useState<ContentTile[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Generate deterministic tiles on mount
  useEffect(() => {
    const generated: ContentTile[] = [];
    const cols = 12;
    const rows = 6;
    const tileWidth = 100;
    const tileHeight = 80;

    // Seeded random for consistency
    let seed = 12345;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const biasOptions: ('left' | 'neutral' | 'right')[] = ['left', 'neutral', 'right'];
    const toneOptions: ('analytical' | 'empathetic' | 'outrage')[] = ['analytical', 'empathetic', 'outrage'];
    const adCategories: ('technology' | 'wellness' | 'finance' | 'fashion' | 'food' | undefined)[] = [
      'technology', 'wellness', 'finance', 'fashion', 'food', undefined, undefined
    ];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const bias = biasOptions[Math.floor(seededRandom() * biasOptions.length)];
        const tone = toneOptions[Math.floor(seededRandom() * toneOptions.length)];
        const adCategory = adCategories[Math.floor(seededRandom() * adCategories.length)];

        generated.push({
          id: `tile-${row}-${col}`,
          x: col * tileWidth,
          y: row * tileHeight,
          bias,
          tone,
          adCategory,
          headline: `Content ${row * cols + col + 1}`,
        });
      }
    }

    setTiles(generated);
  }, []);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
        // Center lens initially
        setLensPos({ x: rect.width / 2, y: rect.height / 2 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(LENS_RADIUS, Math.min(containerSize.width - LENS_RADIUS, e.clientX - rect.left));
      const y = Math.max(LENS_RADIUS, Math.min(containerSize.height - LENS_RADIUS, e.clientY - rect.top));
      setLensPos({ x, y });
    }
  }, [containerSize]);

  // Touch movement
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (containerRef.current && e.touches.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(LENS_RADIUS, Math.min(containerSize.width - LENS_RADIUS, e.touches[0].clientX - rect.left));
      const y = Math.max(LENS_RADIUS, Math.min(containerSize.height - LENS_RADIUS, e.touches[0].clientY - rect.top));
      setLensPos({ x, y });
    }
  }, [containerSize]);

  // Keyboard movement
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP;
    let newX = lensPos.x;
    let newY = lensPos.y;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      newX = Math.max(LENS_RADIUS, lensPos.x - step);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      newX = Math.min(containerSize.width - LENS_RADIUS, lensPos.x + step);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      newY = Math.max(LENS_RADIUS, lensPos.y - step);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      newY = Math.min(containerSize.height - LENS_RADIUS, lensPos.y + step);
    } else {
      return;
    }

    e.preventDefault();
    setLensPos({ x: newX, y: newY });
  }, [lensPos, containerSize]);

  // Compute stats within lens
  const computeLensStats = useCallback(() => {
    const tilesInLens = tiles.filter((tile) => {
      const dx = tile.x + 50 - lensPos.x; // +50 for tile center
      const dy = tile.y + 40 - lensPos.y; // +40 for tile center
      return Math.sqrt(dx * dx + dy * dy) < LENS_RADIUS;
    });

    const biasCount = { left: 0, neutral: 0, right: 0 };
    const toneCount = { analytical: 0, empathetic: 0, outrage: 0 };
    const adCount: Record<string, number> = {};

    tilesInLens.forEach((tile) => {
      biasCount[tile.bias]++;
      toneCount[tile.tone]++;
      if (tile.adCategory) {
        adCount[tile.adCategory] = (adCount[tile.adCategory] || 0) + 1;
      }
    });

    const total = tilesInLens.length || 1;
    const biasPercent = {
      left: Math.round((biasCount.left / total) * 100),
      neutral: Math.round((biasCount.neutral / total) * 100),
      right: Math.round((biasCount.right / total) * 100),
    };

    const topProduct = Object.entries(adCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return { biasPercent, toneCount, topProduct };
  }, [tiles, lensPos]);

  const stats = computeLensStats();

  const biasColor = { left: '#4A90E2', neutral: '#9CA3AF', right: '#E74C3C' };
  const toneColor = { analytical: '#01B1C0', empathetic: '#2ec27e', outrage: '#eb5757' };
  const adColor = { technology: '#725cfd', wellness: '#2ec27e', finance: '#f2c94c', fashion: '#ff7a59', food: '#eb5757' };

  return (
    <div className="relative">
      {/* Container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-e3 bg-neuLight"
        style={{ width: '100%', height: '400px', cursor: 'none' }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label={`Interactive lens canvas. Use arrow keys or WASD to move the lens. Current mode: ${mode}`}
      >
        {/* Background tiles (blurred) */}
        <div className="absolute inset-0" style={{ filter: 'blur(2px)', opacity: 0.6 }}>
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className="absolute bg-panel border border-line rounded p-2 text-xs text-inkMuted"
              style={{
                left: tile.x,
                top: tile.y,
                width: '100px',
                height: '80px',
              }}
            >
              {tile.headline}
            </div>
          ))}
        </div>

        {/* Lens circle (sharpened content + annotations) */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: lensPos.x - LENS_RADIUS,
            top: lensPos.y - LENS_RADIUS,
            width: LENS_RADIUS * 2,
            height: LENS_RADIUS * 2,
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(1, 177, 192, 0.4)',
            border: '3px solid #01B1C0',
            transition: isReducedMotion ? 'none' : 'transform 0.16s ease-out',
          }}
        >
          {/* Sharpened tiles inside lens */}
          <div className="absolute" style={{ left: -lensPos.x + LENS_RADIUS, top: -lensPos.y + LENS_RADIUS }}>
            {tiles.filter((tile) => {
              const dx = tile.x + 50 - lensPos.x;
              const dy = tile.y + 40 - lensPos.y;
              return Math.sqrt(dx * dx + dy * dy) < LENS_RADIUS + 50;
            }).map((tile) => (
              <div
                key={tile.id}
                className="absolute bg-panel border border-brand rounded p-2 text-xs"
                style={{
                  left: tile.x,
                  top: tile.y,
                  width: '100px',
                  height: '80px',
                  transform: 'scale(1.02)',
                }}
              >
                <div className="font-medium text-ink">{tile.headline}</div>

                {/* Annotations based on mode */}
                {mode === 'bias' && (
                  <div
                    className="absolute top-1 right-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: biasColor[tile.bias] }}
                    title={tile.bias}
                  />
                )}

                {mode === 'ads' && tile.adCategory && (
                  <div
                    className="absolute bottom-1 left-1 px-1 py-0.5 text-[10px] rounded"
                    style={{ backgroundColor: adColor[tile.adCategory], color: 'white' }}
                  >
                    Ad: {tile.adCategory}
                  </div>
                )}

                {mode === 'tone' && (
                  <div
                    className="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] rounded text-white"
                    style={{ backgroundColor: toneColor[tile.tone] }}
                  >
                    {tile.tone}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lens cursor circle (visual indicator) */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: lensPos.x - LENS_RADIUS,
            top: lensPos.y - LENS_RADIUS,
            width: LENS_RADIUS * 2,
            height: LENS_RADIUS * 2,
            borderRadius: '50%',
            border: '3px solid #01B1C0',
            transition: isReducedMotion ? 'none' : 'left 0.16s ease-out, top 0.16s ease-out',
          }}
        />
      </div>

      {/* Edge label rails */}
      <div className="mt-4 flex items-center justify-between text-sm text-inkMuted">
        {mode === 'bias' && (
          <div>
            <span className="font-medium text-ink">Left {stats.biasPercent.left}%</span>
            {' · '}
            <span className="font-medium text-ink">Neutral {stats.biasPercent.neutral}%</span>
            {' · '}
            <span className="font-medium text-ink">Right {stats.biasPercent.right}%</span>
          </div>
        )}

        {mode === 'ads' && (
          <div>
            <span className="font-medium text-ink">Top Product: {stats.topProduct}</span>
          </div>
        )}

        {mode === 'tone' && (
          <div>
            <span className="font-medium text-ink">
              Analytical {stats.toneCount.analytical} · Empathetic {stats.toneCount.empathetic} · Outrage {stats.toneCount.outrage}
            </span>
          </div>
        )}
      </div>

      {/* Screen reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {mode === 'bias' && `Lens summary: Left ${stats.biasPercent.left}%, Neutral ${stats.biasPercent.neutral}%, Right ${stats.biasPercent.right}%.`}
        {mode === 'ads' && `Lens summary: Top product category is ${stats.topProduct}.`}
        {mode === 'tone' && `Lens summary: ${stats.toneCount.analytical} analytical, ${stats.toneCount.empathetic} empathetic, ${stats.toneCount.outrage} outrage.`}
      </div>

      {/* Instructions */}
      <p className="mt-2 text-xs text-inkMuted text-center">
        Move with mouse, touch, or arrow keys (Shift for large steps)
      </p>
    </div>
  );
}
