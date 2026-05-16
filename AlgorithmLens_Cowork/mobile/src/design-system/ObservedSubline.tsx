/**
 * ObservedSubline: renders an OBSERVED sub-line in the Results screen's
 * four-mode interpretation system. The OBSERVED mode marks direct
 * measurements from the scan — e.g., "Your top creator made up 32% of
 * what you saw."
 *
 * Visual: 12px filled brand-blue square marker, uppercase "OBSERVED"
 * label, body text in near-black at body weight.
 *
 * The shared layout (marker + label row, body beneath) lives in
 * SublineFrame, which is private to the design system.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { View } from 'react-native';
import { SublineFrame } from './SublineFrame';
import { colors } from '../design-tokens/tokens';

const MARKER_SIZE = 12;

export interface ObservedSublineProps {
  /** Sub-line body text. */
  children: React.ReactNode;
  testID?: string;
}

export function ObservedSubline({ children, testID }: ObservedSublineProps) {
  return (
    <SublineFrame
      testID={testID}
      label="OBSERVED"
      marker={
        <View
          style={{
            width: MARKER_SIZE,
            height: MARKER_SIZE,
            backgroundColor: colors.brandPrimary,
          }}
        />
      }
    >
      {children}
    </SublineFrame>
  );
}
