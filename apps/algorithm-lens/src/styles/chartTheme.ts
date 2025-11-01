/**
 * Chart Theme Configuration for AlgorithmLens
 * Unified colors and styles for all data visualizations
 */

export const chartPalette = [
  '#7C8DA0', // tone-blue
  '#6D8B83', // tone-teal
  '#C1A874', // tone-gold
  '#8D83A3', // tone-violet
  '#A78688', // tone-rose
  '#87A189'  // tone-green
];

export const gridColor = 'rgba(0,0,0,0.08)';
export const axisColor = '#82827C';
export const labelColor = '#5D5E58';

export const ringBgBands = {
  diverse: 'rgba(135,161,137,0.20)',   // green 20%
  mixed:   'rgba(193,168,116,0.20)',   // gold 20%
  narrow:  'rgba(167,134,136,0.20)'    // rose 20%
};

export const ringFore = '#7C8DA0';     // tone-blue

// Common chart configuration
export const chartDefaults = {
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  fontSize: 13,
  fontFamily: 'Inter, Manrope, system-ui, sans-serif',
  lineWidth: 2.25,
  barRadius: 8,
  donutInnerRadius: 68
};
