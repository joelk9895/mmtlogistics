import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, MinimalTheme } from '@/constants/theme';

export interface GlassSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string | number;
  title?: string;
  subtitle?: string;
}

export function GlassSheetModal({
  visible,
  onClose,
  children,
  maxHeight = '90%',
  title,
  subtitle,
}: GlassSheetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.sheetContainer, { maxHeight }]}>
                {/* Grabber Bar */}
                <View style={styles.grabberContainer}>
                  <View style={styles.grabberBar} />
                </View>

                {title && (
                  <View style={styles.header}>
                    <View style={styles.headerTextGroup}>
                      <Text style={styles.title}>{title}</Text>
                      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={20} color={MinimalTheme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.content}>{children}</View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderBottomWidth: 0,
    overflow: 'hidden',
    backgroundColor: MinimalTheme.sheetBg,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  grabberBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MinimalTheme.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: MinimalTheme.cardBorder,
    marginBottom: 12,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MinimalTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingVertical: 4,
  },
});
