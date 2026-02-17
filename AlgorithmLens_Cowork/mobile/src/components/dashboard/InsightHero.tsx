import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';

interface InsightHeroProps {
  title: string;
  meaning: string;
  whyCare?: string | null;
  meta?: string | null;
  accent?: string;
}

export const InsightHero: React.FC<InsightHeroProps> = ({
  title,
  meaning,
  whyCare = null,
  meta = null,
  accent = '#2563EB',
}) => {
  // L3: Use useRef to persist animated value across re-renders
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chevronRotateAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Reset expanded state when title changes (tab switch)
    setExpanded(false);
  }, [title]); // Re-animate when title changes (tab switch)

  useEffect(() => {
    Animated.timing(chevronRotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const hexToRgb = (hex: string): string => {
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
      >
        <LinearGradient
          colors={[hexToRgb(accent), '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(30, 41, 59, 0.06)',
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
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
            }}
          />

          <View style={{ paddingLeft: 8 }}>
            {/* C3: Dramatically shrunk — title is 18px, meaning is 13px */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1E293B',
                marginBottom: 6,
                letterSpacing: -0.3,
              }}
              numberOfLines={expanded ? undefined : 2}
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: '#475569',
                lineHeight: 18,
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
                      fontSize: 12,
                      color: '#94A3B8',
                      lineHeight: 17,
                      marginTop: 8,
                    }}
                  >
                    {whyCare}
                  </Text>
                )}
                {meta && (
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      color: '#94A3B8',
                      marginTop: 6,
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
                  gap: 6,
                  marginTop: 8,
                  backgroundColor: accent,
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
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
                  <ChevronDown size={14} color="#FFFFFF" />
                </Animated.View>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
