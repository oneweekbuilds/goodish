import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../lib/theme';

interface DividerProps {
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

  const finalColor = color || colors.borderDefault;

  const styles = StyleSheet.create({
    container: {
      height: thickness,
      backgroundColor: finalColor,
      marginVertical: spacing,
    },
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityElementsHidden={true}
      testID={testID}
    />
  );
};

export default React.memo(DividerComponent);
