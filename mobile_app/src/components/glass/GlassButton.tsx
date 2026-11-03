import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Fonts, MinimalTheme } from '@/constants/theme';

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'navigation' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  shape?: 'capsule' | 'rounded';
}

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'md',
  style,
  textStyle,
  shape = 'rounded',
}: GlassButtonProps) {
  const variantConfig = buttonVariants[variant] || buttonVariants.primary;
  const sizeStyle = buttonSizes[size] || buttonSizes.md;
  const isCapsule = shape === 'capsule';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      style={[
        styles.touchable,
        isCapsule ? styles.capsuleShape : styles.roundedShape,
        { backgroundColor: variantConfig.backgroundColor, borderColor: variantConfig.borderColor },
        disabled && styles.disabled,
        sizeStyle.button,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantConfig.textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              sizeStyle.text,
              { color: variantConfig.textColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const buttonVariants = {
  primary: {
    backgroundColor: MinimalTheme.accent,
    borderColor: MinimalTheme.accent,
    textColor: '#FFFFFF',
  },
  navigation: {
    backgroundColor: MinimalTheme.accent,
    borderColor: MinimalTheme.accent,
    textColor: '#FFFFFF',
  },
  success: {
    backgroundColor: MinimalTheme.success,
    borderColor: MinimalTheme.success,
    textColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: MinimalTheme.surface,
    borderColor: MinimalTheme.cardBorder,
    textColor: MinimalTheme.text,
  },
  danger: {
    backgroundColor: MinimalTheme.danger,
    borderColor: MinimalTheme.danger,
    textColor: '#FFFFFF',
  },
};

const buttonSizes = {
  sm: {
    button: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 36,
    },
    text: {
      fontSize: 13,
      fontFamily: Fonts.semibold,
    },
  },
  md: {
    button: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      minHeight: 48,
    },
    text: {
      fontSize: 15,
      fontFamily: Fonts.bold,
    },
  },
  lg: {
    button: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      minHeight: 56,
    },
    text: {
      fontSize: 17,
      fontFamily: Fonts.bold,
    },
  },
};

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  capsuleShape: {
    borderRadius: MinimalTheme.radiusPill,
  },
  roundedShape: {
    borderRadius: MinimalTheme.radiusButton,
  },
  disabled: {
    opacity: 0.45,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
