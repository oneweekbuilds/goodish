import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type HeaderLevel = 'h2' | 'h3';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | null;
  level?: HeaderLevel;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle = null,
  level = 'h2',
}) => {
  const isH2 = level === 'h2';
  const barHeight = isH2 ? 20 : 16;
  const titleSize = isH2 ? 16 : 14;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        marginTop: 0,
      }}
    >
      {/* Gradient Accent Bar */}
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: 2,
          height: barHeight,
          borderRadius: 1,
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            fontSize: titleSize,
            fontWeight: '600',
            color: '#1E293B',
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: '#94A3B8',
              lineHeight: 20,
              maxWidth: 560,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};
