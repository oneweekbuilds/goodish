/**
 * LikelySubline: renders a LIKELY sub-line in the Results screen's
 * four-mode interpretation system. The LIKELY mode marks inferred
 * causes or hypotheses — e.g., "Sustained engagement signals strong
 * interest, and the algorithm responds to that strongly."
 *
 * Visual: 12px hollow circle marker (1.5px tertiary-gray border, no
 * fill), uppercase "LIKELY" label, body text in near-black at body
 * weight.
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
const RING_BORDER_WIDTH = 1.5;

export interface LikelySublineProps {
  /** Sub-line body text. */
  children: React.ReactNode;
  testID?: string;
}

export function LikelySubline({ children, testID }: LikelySublineProps) {
  return (
    <SublineFrame
      testID={testID}
      label="LIKELY"
      marker={
        <View
          style={{
            width: MARKER_SIZE,
            height: MARKER_SIZE,
            borderRadius: MARKER_SIZE / 2,
            borderWidth: RING_BORDER_WIDTH,
            borderColor: colors.textTertiary,
          }}
        />
      }
    >
      {children}
    </SublineFrame>
  );
}
