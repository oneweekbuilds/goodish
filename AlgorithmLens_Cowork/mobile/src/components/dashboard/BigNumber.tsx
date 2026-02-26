import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY } from '../../lib/theme';

interface BigNumberProps {
  value: string | number;
  label: string;
  suffix?: string;
}

const BigNumberComponent: React.FC<BigNumberProps> = ({
  value,
  label,
  suffix = '%',
}) => {
  const { colors } = useTheme();
  const isZero = value === 0 || value === '0';
  const fontSize = isZero ? RFValue(24) : RFValue(32);
  const textColor = isZero ? colors.textSecondary : colors.textMain;

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessible={true}
      accessibilityRole="text"
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
          ...TYPOGRAPHY.label,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export const BigNumber = React.memo(BigNumberComponent);
