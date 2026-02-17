import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  headline: string;
  value?: string | null;
  microLine?: string | null;
  denominatorText?: string;
  fallbackText?: string;
  hasData: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  headline,
  value = null,
  microLine = null,
  denominatorText = '',
  fallbackText = 'No data',
  hasData,
}) => {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#FAFBFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(37, 99, 235, 0.08)',
      }}
      accessible={true}
      accessibilityLabel={`${headline}${value ? ': ' + value : ''}`}
    >
      {hasData ? (
        <>
          {/* H4: Reduced from 28px to 22px */}
          {value && (
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#1E293B',
                marginBottom: 4,
              }}
            >
              {value}
            </Text>
          )}

          <Text
            style={{
              fontSize: 13,
              color: '#475569',
              fontWeight: '500',
              marginBottom: microLine || denominatorText ? 2 : 0,
            }}
          >
            {headline}
          </Text>

          {microLine && (
            <Text
              style={{
                fontSize: 11,
                color: '#94A3B8',
                fontWeight: '500',
              }}
            >
              {microLine}
            </Text>
          )}

          {denominatorText && (
            <Text
              style={{
                fontSize: 11,
                color: '#94A3B8',
                marginTop: 4,
              }}
            >
              {denominatorText}
            </Text>
          )}
        </>
      ) : (
        <Text
          style={{
            fontSize: 13,
            color: '#94A3B8',
            fontStyle: 'italic',
            textAlign: 'center',
            paddingVertical: 12,
          }}
        >
          {fallbackText}
        </Text>
      )}
    </LinearGradient>
  );
};
