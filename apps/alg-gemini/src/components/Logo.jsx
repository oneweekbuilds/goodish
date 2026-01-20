import React from 'react';

import logoCropped from '../assets/algorithmlens-logo-cropped.png';

const VARIANT_DEFAULTS = {
  // Navbar: compact height using the cropped asset (no clip needed)
  nav: {
    className: 'h-9 w-auto block max-w-none',
    style: {},
  },
  // Keep existing decorative placements unchanged.
  footer: {
    className: 'w-[270px] h-auto opacity-80',
    style: {},
  },
  loop: {
    className: 'w-72 max-w-[300px]',
    style: { filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' },
  },
};

export default function Logo({
  variant = 'nav',
  className = '',
  style = {},
  alt = 'AlgorithmLens',
  src = logoCropped,
  ...imgProps
}) {
  const defaults = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.nav;

  return (
    <img
      src={src}
      alt={alt}
      className={`${defaults.className} ${className}`.trim()}
      style={{ ...defaults.style, ...style }}
      {...imgProps}
    />
  );
}

