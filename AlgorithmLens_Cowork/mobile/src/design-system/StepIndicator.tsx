/**
 * StepIndicator: horizontal three-dot (or N-dot) progress indicator for
 * a linear analyze-style pipeline.
 *
 * Layout per step:
 *   pending  - hollow circle, textTertiary border
 *   active   - filled circle in brandPrimary
 *   complete - filled circle in brandPrimary with a small white check
 *
 * Dots are connected by thin horizontal lines. Lines on the "completed"
 * side of the active dot render in brandPrimary; lines after the active
 * dot render in textTertiary. Labels render below each dot in caption
 * type and textSecondary.
 *
 * Consumed by the analysis route's Analyzing card. Not a global flow
 * indicator; renders only when stage-by-stage progress is meaningful.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, spacing, type } from '../design-tokens/tokens';

export interface StepIndicatorProps {
  /** Step labels rendered beneath each dot. Length determines step count. */
  labels: string[];
  /** Index of the currently active step. -1 = none active (all pending). */
  currentStep: number;
}

const DOT_SIZE = 20;
const LINE_HEIGHT = 2;

export function StepIndicator({ labels, currentStep }: StepIndicatorProps) {
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.s3,
        }}
      >
        {labels.map((_, i) => {
          const isLast = i === labels.length - 1;
          const dotState =
            i < currentStep ? 'complete' : i === currentStep ? 'active' : 'pending';
          return (
            <React.Fragment key={i}>
              <Dot state={dotState} />
              {!isLast ? (
                <View
                  style={{
                    flex: 1,
                    height: LINE_HEIGHT,
                    backgroundColor:
                      i < currentStep ? colors.brandPrimary : colors.textTertiary,
                    opacity: i < currentStep ? 1 : 0.3,
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          marginTop: spacing.s2,
        }}
      >
        {labels.map((label, i) => (
          <View
            key={i}
            style={{
              flex: i === 0 || i === labels.length - 1 ? 1 : 2,
              alignItems:
                i === 0
                  ? 'flex-start'
                  : i === labels.length - 1
                  ? 'flex-end'
                  : 'center',
            }}
          >
            <Text
              accessible
              accessibilityLabel={`${label}, ${
                i < currentStep ? 'complete' : i === currentStep ? 'in progress' : 'pending'
              }`}
              style={{
                fontSize: type.caption.fontSize,
                lineHeight: type.caption.lineHeight,
                fontWeight: type.caption.fontWeight,
                color: colors.textSecondary,
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Dot({ state }: { state: 'pending' | 'active' | 'complete' }) {
  if (state === 'complete') {
    return (
      <View
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: colors.brandPrimary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          name="check"
          size={12}
          color={colors.textOnBrand}
          strokeWidth={3}
        />
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: colors.brandPrimary,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        borderWidth: 2,
        borderColor: colors.textTertiary,
        opacity: 0.5,
        backgroundColor: 'transparent',
      }}
    />
  );
}
