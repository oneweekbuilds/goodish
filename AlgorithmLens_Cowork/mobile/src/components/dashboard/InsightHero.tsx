import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Pressable,
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
  const { colors, shadows } = useTheme();
  // L3: Use useRef to persist animated value across re-renders
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chevronRotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);
  const [showCounterfactual, setShowCounterfactual] = useState(false);
  const [showHowWeMeasure, setShowHowWeMeasure] = useState(false);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }, [scaleAnim]);

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

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Insight: ${title}. ${meaning}`}
        accessibilityHint={whyCare || meta ? 'Tap to expand for more context' : undefined}
        accessibilityState={{expanded}}
      >
        <View style={{
          borderRadius: RADIUS.xl,
          overflow: 'hidden',
          marginBottom: SPACING.md,
          ...shadows.card,
        }}>
          {/* Accent top edge — subtle colored bar for visual pop */}
          <View style={{
            height: 3,
            backgroundColor: accent,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
          }} />
          <View
            style={{
              padding: SPACING['2xl'],
              backgroundColor: colors.bgCard,
              borderBottomLeftRadius: RADIUS.xl,
              borderBottomRightRadius: RADIUS.xl,
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: colors.borderSoft,
            }}
          >
            {/* Title — large, bold, headline-first */}
            <Text
              style={{
                fontSize: RFValue(22),
                fontWeight: '700',
                lineHeight: RFValue(30),
                letterSpacing: -0.4,
                color: colors.textMain,
                marginBottom: SPACING.md,
              }}
              numberOfLines={expanded ? undefined : 3}
              accessibilityRole="header"
            >
              {title}
            </Text>

            {/* Meaning — secondary text */}
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: colors.textSecondary,
                lineHeight: RFValue(22),
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
                      marginTop: SPACING.md,
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

            {/* Expand hint — subtle inline with chevron */}
            {(whyCare || meta) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  marginTop: SPACING.lg,
                  paddingTop: SPACING.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.borderSoft,
                }}
              >
                <Text style={{
                  ...TYPOGRAPHY.caption,
                  fontWeight: '500',
                  color: colors.primaryBlue,
                }}>
                  {expanded ? 'Show less' : 'Tap for more context'}
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
                  <ChevronDown size={13} color={colors.primaryBlue} strokeWidth={2.5} />
                </Animated.View>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* About this analysis — combined counterfactual + methodology */}
      {(counterfactual || (howWeMeasure && (howWeMeasure.what || howWeMeasure.how || howWeMeasure.limitations))) && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setShowCounterfactual(!showCounterfactual);
            setShowHowWeMeasure(!showCounterfactual);
          }}
          style={{
            marginTop: SPACING.xs,
            marginBottom: SPACING.sm,
            borderRadius: RADIUS.lg,
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
              ...TYPOGRAPHY.caption,
              fontWeight: '500',
              color: colors.textMuted,
            }}>
              About this analysis
            </Text>
            <ChevronDown
              size={13}
              color={colors.textMuted}
              strokeWidth={2}
              style={{
                transform: [{ rotate: showCounterfactual ? '180deg' : '0deg' }],
              }}
            />
          </View>
          {showCounterfactual && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, gap: SPACING.md }}>
              {counterfactual && (
                <Text style={{
                  ...TYPOGRAPHY.caption,
                  color: colors.textSecondary,
                  fontStyle: 'italic',
                  lineHeight: RFValue(18),
                }}>
                  {counterfactual}
                </Text>
              )}
              {counterfactual && howWeMeasure && (howWeMeasure.what || howWeMeasure.how) && (
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSoft }} />
              )}
              {howWeMeasure?.what && (
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted, lineHeight: RFValue(18) }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>What this measures: </Text>
                  {howWeMeasure.what}
                </Text>
              )}
              {howWeMeasure?.how && (
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted, lineHeight: RFValue(18) }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>How we measure it: </Text>
                  {howWeMeasure.how}
                </Text>
              )}
              {howWeMeasure?.limitations && (
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted, lineHeight: RFValue(18) }}>
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
