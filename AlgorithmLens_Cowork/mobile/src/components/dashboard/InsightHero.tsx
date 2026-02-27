import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING, COLORS, TYPOGRAPHY, withOpacity, MIN_TOUCH_TARGET } from '../../lib/theme';

interface HowWeMeasureData {
  what?: string | null;
  how?: string | null;
  limitations?: string | null;
  learnMoreUrl?: string | null;
}

interface InsightHeroProps {
  title: string;
  meaning: string;
  whyCare?: string | null;
  meta?: string | null;
  accent?: string;
  /** Counterfactual text acknowledging alternative interpretations (PRIMARY cards only) */
  counterfactual?: string | null;
  /** Methodology disclosure section */
  howWeMeasure?: HowWeMeasureData | null;
}

// Web-safe gradient wrapper for LinearGradient
const GradientWrapper = Platform.OS === 'web'
  ? ({ colors: gradientColors, start, end, style, children, ...props }: any) => {
      const flatStyle = style ? (Array.isArray(style) ? Object.assign({}, ...style) : style) : {};
      return (
        <View
          style={{
            ...flatStyle,
            background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          }}
          {...props}
        >
          {children}
        </View>
      );
    }
  : LinearGradient;

const InsightHeroComponent: React.FC<InsightHeroProps> = ({
  title,
  meaning,
  whyCare = null,
  meta = null,
  accent = COLORS.primary,
  counterfactual = null,
  howWeMeasure = null,
}) => {
  const { colors } = useTheme();
  // L3: Use useRef to persist animated value across re-renders
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chevronRotateAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const [showCounterfactual, setShowCounterfactual] = useState(false);
  const [showHowWeMeasure, setShowHowWeMeasure] = useState(false);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Reset expanded state when title changes (tab switch)
    setExpanded(false);
    setShowCounterfactual(false);
    setShowHowWeMeasure(false);
  }, [title]); // Re-animate when title changes (tab switch)

  useEffect(() => {
    Animated.timing(chevronRotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  // Use theme utility for accent-based background tint
  const accentBg = (hex: string): string => {
    try {
      return withOpacity(hex, 0.08);
    } catch {
      return 'rgba(37, 99, 235, 0.08)';
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Insight: ${title}. ${meaning}`}
        accessibilityHint={whyCare || meta ? 'Tap to expand for more context' : undefined}
        accessibilityState={{expanded}}
      >
        <GradientWrapper
          colors={[accentBg(accent), colors.bgCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            marginBottom: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
          }}
        >
          {/* Accent Bar */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: accent,
              borderTopLeftRadius: RADIUS.lg,
              borderBottomLeftRadius: RADIUS.lg,
            }}
          />

          <View style={{ paddingLeft: SPACING.md }}>
            <Text
              style={{
                ...TYPOGRAPHY.heroTitle,
                color: colors.textMain,
                marginBottom: SPACING.md,
              }}
              numberOfLines={expanded ? undefined : 3}
              accessibilityRole="header"
            >
              {title}
            </Text>

            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.textMuted,
              }}
              numberOfLines={expanded ? undefined : 3}
            >
              {meaning}
            </Text>

            {/* Expandable details */}
            {expanded && (
              <>
                {whyCare && (
                  <Text
                    style={{
                      ...TYPOGRAPHY.bodySmall,
                      color: colors.textSecondary,
                      marginTop: SPACING.sm,
                    }}
                  >
                    {whyCare}
                  </Text>
                )}
                {meta && (
                  <Text
                    style={{
                      ...TYPOGRAPHY.label,
                      color: colors.textSecondary,
                      marginTop: SPACING.sm,
                    }}
                  >
                    {meta}
                  </Text>
                )}
              </>
            )}

            {/* Expand hint */}
            {!expanded && (whyCare || meta) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  marginTop: SPACING.sm,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: accent,
                  alignSelf: 'flex-start',
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.xs,
                  borderRadius: RADIUS.full,
                }}
              >
                <Text style={{ ...TYPOGRAPHY.labelBold, color: accent }}>
                  Tap for more context
                </Text>
                <Animated.View
                  style={Platform.OS === 'web'
                    ? {
                        transform: `rotate(${chevronRotateAnim.__getValue ? chevronRotateAnim.__getValue() : 0}deg)`,
                      }
                    : {
                        transform: [
                          {
                            rotate: chevronRotateAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '180deg'],
                            }),
                          },
                        ],
                      }
                  }
                >
                  <ChevronDown size={14} color={accent} />
                </Animated.View>
              </View>
            )}
          </View>
        </GradientWrapper>
      </TouchableOpacity>

      {/* About this analysis — combined counterfactual + methodology */}
      {(counterfactual || (howWeMeasure && (howWeMeasure.what || howWeMeasure.how || howWeMeasure.limitations))) && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setShowCounterfactual(!showCounterfactual);
            setShowHowWeMeasure(!showCounterfactual);
          }}
          style={{
            marginTop: SPACING.sm,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            backgroundColor: colors.bgCardGradientEnd,
            overflow: 'hidden',
            minHeight: MIN_TOUCH_TARGET,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="About this analysis"
          accessibilityHint="Tap to see context and methodology"
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
          }}>
            <Text style={{
              ...TYPOGRAPHY.label,
              color: colors.textMuted,
            }}>
              About this analysis
            </Text>
            <ChevronDown
              size={14}
              color={colors.textSecondary}
              strokeWidth={2}
              style={{
                transform: [{ rotate: showCounterfactual ? '180deg' : '0deg' }],
              }}
            />
          </View>
          {showCounterfactual && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.lg }}>
              {counterfactual && (
                <Text style={{
                  ...TYPOGRAPHY.caption,
                  color: colors.textSecondary,
                  fontStyle: 'italic',
                }}>
                  {counterfactual}
                </Text>
              )}
              {counterfactual && howWeMeasure && (howWeMeasure.what || howWeMeasure.how) && (
                <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
              )}
              {howWeMeasure?.what && (
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>What this measures: </Text>
                  {howWeMeasure.what}
                </Text>
              )}
              {howWeMeasure?.how && (
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>How we measure it: </Text>
                  {howWeMeasure.how}
                </Text>
              )}
              {howWeMeasure?.limitations && (
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>Limitations: </Text>
                  {howWeMeasure.limitations}
                </Text>
              )}
              {howWeMeasure?.learnMoreUrl && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(howWeMeasure.learnMoreUrl!)}
                  activeOpacity={0.7}
                  accessibilityRole="link"
                  accessibilityLabel="Learn more"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{
                    ...TYPOGRAPHY.caption,
                    color: colors.primaryBlue,
                    fontWeight: '500',
                  }}>
                    Learn more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export const InsightHero = React.memo(InsightHeroComponent);
