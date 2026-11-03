import { Platform } from 'react-native';

export const Fonts = {
  regular: 'HostGrotesk_400Regular',
  medium: 'HostGrotesk_500Medium',
  semibold: 'HostGrotesk_600SemiBold',
  bold: 'HostGrotesk_700Bold',
  extrabold: 'HostGrotesk_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export type ThemeColor = 'text' | 'background' | 'backgroundElement' | 'backgroundSelected' | 'textSecondary';

// Web-aligned minimal dark theme (zinc / neutral tones, crisp borders, no blur/glass)
export const MinimalTheme = {
  background: '#09090b',         // Web app --background (zinc-950)
  card: '#121215',               // Clean dark solid card surface
  cardBorder: '#27272a',         // Web app --border (zinc-800)
  surface: '#18181b',            // Web app --surface (zinc-900)
  surfaceBorder: '#3f3f46',      // Subtle active border (zinc-700)
  sheetBg: '#121215',            // Modal / bottom sheet background
  
  // Text
  text: '#fafafa',               // Web app --foreground (zinc-50)
  textSecondary: '#a1a1aa',      // Web app --muted (zinc-400)
  textMuted: '#71717a',          // Secondary muted text (zinc-500)
  
  // Accents
  accent: '#0A84FF',             // Apple iOS System Blue
  accentSubtle: 'rgba(10, 132, 255, 0.12)',
  success: '#30D158',            // Apple Green
  successSubtle: 'rgba(48, 209, 88, 0.14)',
  warning: '#FF9F0A',            // Apple Orange
  warningSubtle: 'rgba(255, 159, 10, 0.14)',
  danger: '#FF453A',             // Apple Red
  dangerSubtle: 'rgba(255, 69, 58, 0.14)',

  // Radii
  radiusCard: 14,
  radiusButton: 10,
  radiusInput: 10,
  radiusPill: 9999,
} as const;

export const Colors = {
  light: {
    text: MinimalTheme.background,
    background: '#ffffff',
    backgroundElement: '#f4f4f5',
    backgroundSelected: '#e4e4e7',
    textSecondary: MinimalTheme.textSecondary,
  },
  dark: {
    text: MinimalTheme.text,
    background: MinimalTheme.background,
    backgroundElement: MinimalTheme.surface,
    backgroundSelected: MinimalTheme.card,
    textSecondary: MinimalTheme.textSecondary,
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
