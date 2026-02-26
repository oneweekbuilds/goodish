import { StyleSheet, Platform, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';

/**
 * Flatten style arrays for web compatibility.
 * react-native-web sometimes fails to flatten style arrays before passing to React DOM,
 * causing "Failed to set an indexed property on CSSStyleDeclaration" errors.
 *
 * This utility ensures style arrays are properly flattened on web, while native
 * platforms handle arrays natively.
 */
export function flattenStyle<T extends ViewStyle | TextStyle | ImageStyle>(
  style: StyleProp<T>
): T | undefined {
  if (style == null) return undefined;
  if (Platform.OS === 'web') {
    return StyleSheet.flatten(style) as T;
  }
  // On native, pass through as-is (RN handles arrays natively)
  return style as any;
}
