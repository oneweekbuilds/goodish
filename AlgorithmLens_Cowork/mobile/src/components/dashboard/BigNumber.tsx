import React from 'react';
import {
  View,
  Text,
} from 'react-native';

interface BigNumberProps {
  value: string | number;
  label: string;
  suffix?: string;
}

export const BigNumber: React.FC<BigNumberProps> = ({
  value,
  label,
  suffix = '%',
}) => {
  const isZero = value === 0 || value === '0';
  const fontSize = isZero ? 24 : 40;
  const textColor = isZero ? '#94A3B8' : '#1E293B';

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessible={true}
      accessibilityLabel={`${label}: ${value}${suffix}`}
    >
      <Text
        style={{
          fontSize: fontSize,
          fontWeight: '700',
          color: textColor,
          letterSpacing: -0.03,
          marginBottom: 8,
        }}
      >
        {value}
        {suffix}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#4B5563',
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </View>
  );
};
