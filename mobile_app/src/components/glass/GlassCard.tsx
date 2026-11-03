import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { MinimalTheme } from '@/constants/theme';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glassStyle?: any;
  tintColor?: string;
  variant?: 'default' | 'elevated' | 'hero' | 'subtle' | 'tinted';
  isInteractive?: boolean;
  onPress?: () => void;
  activeOpacity?: number;
}

export function GlassCard({
  children,
  style,
  variant = 'default',
  onPress,
  activeOpacity = 0.85,
}: GlassCardProps) {
  const variantStyles = styles[variant] || styles.default;

  const content = (
    <View style={[styles.baseCard, variantStyles, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={styles.touchableWrapper}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchableWrapper: {
    borderRadius: MinimalTheme.radiusCard,
  },
  baseCard: {
    borderRadius: MinimalTheme.radiusCard,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    overflow: 'hidden',
    backgroundColor: MinimalTheme.card,
  },
  default: {
    padding: 16,
  },
  elevated: {
    padding: 18,
    borderColor: MinimalTheme.surfaceBorder,
  },
  hero: {
    padding: 20,
    borderColor: MinimalTheme.surfaceBorder,
  },
  subtle: {
    padding: 12,
    backgroundColor: MinimalTheme.surface,
  },
  tinted: {
    padding: 16,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
});
