import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../lib/gluestackTheme';

export interface DividerProps {
  spacing?: number;
  color?: string;
  thickness?: number;
  testID?: string;
}

const DividerComponent: React.FC<DividerProps> = ({
  spacing = SPACING.lg,
  color,
  thickness = SPACING.xxs,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        height: thickness,
        backgroundColor: color || colors.borderDefault,
        marginVertical: spacing,
      }}
      accessible
      accessibilityElementsHidden
      testID={testID}
    />
  );
};

export const Divider = React.memo(DividerComponent);
