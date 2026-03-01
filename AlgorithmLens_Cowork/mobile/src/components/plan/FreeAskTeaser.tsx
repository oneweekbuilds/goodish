import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MessageCircleQuestion } from 'lucide-react-native';
import { Text } from '../glue';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../lib/gluestackTheme';
import { MIN_TOUCH_TARGET } from '../../lib/theme';

interface FreeAskTeaserProps {
  exampleQuestion: string;
  onUpgrade: () => void;
}

export const FreeAskTeaser: React.FC<FreeAskTeaserProps> = ({ exampleQuestion, onUpgrade }) => {
  const { colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.bgCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      gap: SPACING.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <MessageCircleQuestion size={16} color={colors.primaryBlue} strokeWidth={2} />
        <Text variant="label" color={colors.textMain}>Ask About Your Feed</Text>
      </View>
      <Text variant="bodySmall" color={colors.textSecondary} style={{ lineHeight: 19, fontStyle: 'italic' }}>
        "{exampleQuestion}"
      </Text>
      <TouchableOpacity
        onPress={onUpgrade}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        accessibilityRole="link"
        accessibilityLabel="Upgrade to ask questions about your feed"
      >
        <Text variant="labelBold" color={colors.primaryBlue}>
          Unlock with Plus →
        </Text>
      </TouchableOpacity>
    </View>
  );
};
