import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';

export interface AppleSymbolProps {
  /**
   * SF Symbol name on iOS (e.g. 'arrow.down.circle.fill', 'map.fill', 'checkmark.circle.fill')
   */
  iosName: SymbolViewProps['name'];
  /**
   * Fallback Ionicons name for Android & Web (e.g. 'arrow-down-circle', 'map', 'checkmark-circle')
   */
  fallbackName: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: any;
  weight?: SymbolViewProps['weight'];
  style?: ViewStyle;
}

export function AppleSymbol({
  iosName,
  fallbackName,
  size = 20,
  color = '#ffffff',
  weight = 'semibold',
  style,
}: AppleSymbolProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={iosName}
        size={size}
        tintColor={color}
        weight={weight}
        style={style}
      />
    );
  }

  const iconColor = typeof color === 'string' ? color : '#ffffff';
  return <Ionicons name={fallbackName} size={size} color={iconColor} style={style} />;
}
