import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { Fonts, MinimalTheme } from '@/constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, serverUrl, setServerUrl } = useAuth();

  const [email, setEmail] = useState('driver@mmt.com');
  const [password, setPassword] = useState('driver123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your driver email or employee ID and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials or server unavailable.';
      setErrorMessage(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!tempUrl.trim()) return;
    await setServerUrl(tempUrl.trim());
    setShowConfig(false);
    Alert.alert('Server Updated', `API server configured to: ${tempUrl.trim()}`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Apple iOS Branding Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>M</Text>
          </View>
          <Text style={styles.title}>MMT Logistics</Text>
          <Text style={styles.subtitle}>Driver Operations & Navigation</Text>
        </View>

        {/* Form Grouped Container */}
        <View style={styles.iosGroupedCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sign in to your shift</Text>
            <Text style={styles.cardSub}>Access active dispatches, navigation & tasks</Text>
          </View>

          {/* Email / ID Input */}
          <View style={styles.inputRow}>
            <AppleSymbol iosName="person.fill" fallbackName="person-outline" size={16} color="#8E8E93" />
            <TextInput
              style={styles.textInput}
              placeholder="driver@mmt.sa"
              placeholderTextColor="#636366"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.cellDivider} />

          {/* Password Input */}
          <View style={styles.inputRow}>
            <AppleSymbol iosName="lock.fill" fallbackName="lock-closed-outline" size={16} color="#8E8E93" />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#636366"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <AppleSymbol
                iosName={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                fallbackName={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <AppleSymbol iosName="exclamationmark.triangle.fill" fallbackName="alert-circle" size={16} color="#FF453A" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Quick Demo Fill Buttons */}
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setEmail('driver@mmt.com');
                setPassword('driver123');
                setErrorMessage(null);
              }}
            >
              <Text style={styles.demoChipText}>Driver Demo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setEmail('admin@mmt.com');
                setPassword('admin123');
                setErrorMessage(null);
              }}
            >
              <Text style={styles.demoChipText}>Admin Demo</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.iosPrimaryButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.iosPrimaryButtonText}>Start Shift</Text>
                <AppleSymbol iosName="arrow.right" fallbackName="arrow-forward" size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Server Config Toggle */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <AppleSymbol iosName="network" fallbackName="server-outline" size={13} color="#8E8E93" />
            <Text style={styles.configToggleText} numberOfLines={1}>
              Backend: {serverUrl}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>API SERVER URL</Text>
              <TextInput
                style={styles.configInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                placeholder="https://mmtlogistics.vercel.app"
                placeholderTextColor="#636366"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
                <Text style={styles.saveUrlText}>Save Server URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>
          Saudi Transport General Authority (TGA) Compliant Fleet Dispatch
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MinimalTheme.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: MinimalTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: Fonts.extrabold,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.extrabold,
    color: MinimalTheme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  iosGroupedCard: {
    borderRadius: MinimalTheme.radiusCard,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: MinimalTheme.text,
  },
  cellDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MinimalTheme.cardBorder,
    marginLeft: 26,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: MinimalTheme.dangerSubtle,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.danger,
    flex: 1,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  demoChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
  },
  iosPrimaryButton: {
    height: 48,
    backgroundColor: MinimalTheme.accent,
    borderRadius: MinimalTheme.radiusButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iosPrimaryButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  configToggleText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
  },
  configBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 10,
  },
  configLabel: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: MinimalTheme.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  configInput: {
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: MinimalTheme.text,
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginBottom: 8,
  },
  saveUrlBtn: {
    backgroundColor: MinimalTheme.accent,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveUrlText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  footerText: {
    textAlign: 'center',
    color: MinimalTheme.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 11,
    marginTop: 24,
    lineHeight: 16,
  },
});
