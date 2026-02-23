import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING, COLORS } from '../../lib/theme';

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

  const hexToRgb = (hex: string): string => {
    if (!hex || typeof hex !== 'string') return 'rgba(37, 99, 235, 0.08)';
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, 0.08)`;
    }
    return 'rgba(37, 99, 235, 0.08)';
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
        <LinearGradient
          colors={[hexToRgb(accent), colors.bgCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
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

          <View style={{ paddingLeft: SPACING.sm }}>
            <Text
              style={{
                fontSize: RFValue(18),
                fontWeight: '700',
                color: colors.textMain,
                marginBottom: SPACING.sm,
                letterSpacing: -0.3,
              }}
              numberOfLines={expanded ? undefined : 2}
              accessibilityRole="header"
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: RFValue(14),
                color: colors.textMuted,
                lineHeight: RFValue(20),
              }}
              numberOfLines={expanded ? undefined : 2}
            >
              {meaning}
            </Text>

            {/* Expandable details */}
            {expanded && (
              <>
                {whyCare && (
                  <Text
                    style={{
                      fontSize: RFValue(14),
                      color: colors.textSecondary,
                      lineHeight: RFValue(20),
                      marginTop: SPACING.sm,
                    }}
                  >
                    {whyCare}
                  </Text>
                )}
                {meta && (
                  <Text
                    style={{
                      fontSize: RFValue(14),
                      fontWeight: '500',
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
                  backgroundColor: accent,
                  alignSelf: 'flex-start',
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.md,
                }}
              >
                <Text style={{ fontSize: RFValue(14), color: colors.white, fontWeight: '600' }}>
                  Tap for more context
                </Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: chevronRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <ChevronDown size={14} color={colors.white} />
                </Animated.View>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Counterfactual — collapsible "What this might also mean" */}
      {counterfactual && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowCounterfactual(!showCounterfactual)}
          style={{
            marginTop: SPACING.sm,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            backgroundColor: colors.bgCardGradientEnd,
            overflow: 'hidden',
            minHeight: 44,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="What this might also mean"
          accessibilityHint="Tap to expand alternative interpretations"
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
          }}>
            <Text style={{
              fontSize: RFValue(12),
              fontWeight: '600',
              color: colors.textMuted,
              letterSpacing: 0.3,
            }}>
              What this might also mean
            </Text>
            <ChevronDown
              size={14}
              color={colors.textSecondary}
              strokeWidth={2}
              style={{ transform: [{ rotate: showCounterfactual ? '180deg' : '0deg' }] }}
            />
          </View>
          {showCounterfactual && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}>
              <Text style={{
                fontSize: RFValue(12),
                color: colors.textSecondary,
                lineHeight: RFValue(18),
                fontStyle: 'italic',
              }}>
                {counterfactual}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* How we measure — collapsible methodology disclosure */}
      {howWeMeasure && (howWeMeasure.what || howWeMeasure.how || howWeMeasure.limitations) && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowHowWeMeasure(!showHowWeMeasure)}
          style={{
            marginTop: SPACING.sm,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            backgroundColor: colors.bgCardGradientEnd,
            overflow: 'hidden',
            minHeight: 44,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="How we measure"
          accessibilityHint="Tap to see methodology details"
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
          }}>
            <Text style={{
              fontSize: RFValue(11),
              fontWeight: '600',
              color: colors.textMuted,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
            }}>
              How we measure
            </Text>
            <ChevronDown
              size={14}
              color={colors.textSecondary}
              strokeWidth={2}
              style={{ transform: [{ rotate: showHowWeMeasure ? '180deg' : '0deg' }] }}
            />
          </View>
          {showHowWeMeasure && (
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm }}>
              {howWeMeasure.what && (
                <Text style={{ fontSize: RFValue(12), lineHeight: RFValue(18), color: colors.textMuted }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>What this measures: </Text>
                  <Text style={{ color: colors.textMuted }}>{howWeMeasure.what}</Text>
                </Text>
              )}
              {howWeMeasure.how && (
                <Text style={{ fontSize: RFValue(12), lineHeight: RFValue(18), color: colors.textMuted }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>How we measure it: </Text>
                  <Text style={{ color: colors.textMuted }}>{howWeMeasure.how}</Text>
                </Text>
              )}
              {howWeMeasure.limitations && (
                <Text style={{ fontSize: RFValue(12), lineHeight: RFValue(18), color: colors.textMuted }}>
                  <Text style={{ fontWeight: '600', color: colors.textMain }}>Limitations: </Text>
                  <Text style={{ color: colors.textMuted }}>{howWeMeasure.limitations}</Text>
                </Text>
              )}
              {howWeMeasure.learnMoreUrl && (
                <Text style={{
                  fontSize: RFValue(12),
                  color: accent,
                  fontWeight: '500',
                  marginTop: SPACING.xxs,
                }}>
                  Learn more on algorithmlens.com
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export const InsightHero = React.memo(InsightHeroComponent);
