import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Fonts, MinimalTheme } from '@/constants/theme';

export interface GlassBadgeProps {
  label: string;
  variant?: 'pickup' | 'delivery' | 'intermediate' | 'active' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassBadge({
  label,
  variant = 'neutral',
  icon,
  showDot = false,
  style,
}: GlassBadgeProps) {
  const config = badgeConfigs[variant] || badgeConfigs.neutral;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: config.textColor }]} />
      )}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: config.textColor }]}>{label}</Text>
    </View>
  );
}

const badgeConfigs = {
  pickup: {
    backgroundColor: MinimalTheme.successSubtle,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    textColor: MinimalTheme.success,
  },
  delivery: {
    backgroundColor: MinimalTheme.accentSubtle,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    textColor: MinimalTheme.accent,
  },
  intermediate: {
    backgroundColor: 'rgba(191, 90, 242, 0.14)',
    borderColor: 'rgba(191, 90, 242, 0.3)',
    textColor: '#BF5AF2',
  },
  active: {
    backgroundColor: MinimalTheme.accentSubtle,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    textColor: MinimalTheme.accent,
  },
  warning: {
    backgroundColor: MinimalTheme.warningSubtle,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    textColor: MinimalTheme.warning,
  },
  danger: {
    backgroundColor: MinimalTheme.dangerSubtle,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    textColor: MinimalTheme.danger,
  },
  neutral: {
    backgroundColor: MinimalTheme.surface,
    borderColor: MinimalTheme.cardBorder,
    textColor: MinimalTheme.textSecondary,
  },
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: MinimalTheme.radiusPill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  iconContainer: {
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    letterSpacing: -0.1,
  },
});
