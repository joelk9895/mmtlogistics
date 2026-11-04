import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { api } from '@/services/api';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { Fonts, MinimalTheme } from '@/constants/theme';
import CalendarPicker, { getDaysCount } from '@/components/CalendarPicker';

interface LeaveRecord {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface LeaveBalance {
  allowance: number;
  approvedDays: number;
  pendingDays: number;
  remaining: number;
  year: number;
}

export default function LeavesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  // New leave request modal
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaveData = useCallback(async () => {
    try {
      const res = await api.getLeaves();
      setLeaves(res?.leaves || []);
      setBalance(res?.leaveBalance || null);
    } catch (err: any) {
      console.warn('Failed to load leaves:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveData();
  };

  const calculateDays = (start: string, end: string): number => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
      return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 0;
    }
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Required Fields', 'Please select leave dates on the calendar and enter a reason.');
      return;
    }

    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const s = new Date(Date.UTC(y1, m1 - 1, d1, 0, 0, 0));
    const e = new Date(Date.UTC(y2, m2 - 1, d2, 23, 59, 59));

    if (e < s) {
      Alert.alert('Invalid Dates', 'End date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      await api.requestLeave({
        startDate: s.toISOString(),
        endDate: e.toISOString(),
        reason: reason.trim(),
      });

      Alert.alert('Request Submitted', 'Your leave application has been routed to dispatch HR.');
      setModalVisible(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaveData();
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
      >
        {/* Balance Inset Group */}
        <Text style={styles.iosSectionHeader}>ANNUAL LEAVE QUOTA ({balance?.year || 2026})</Text>
        <View style={styles.iosGroupedCard}>
          <View style={styles.balanceGrid}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceNum}>{balance?.remaining ?? 21}</Text>
              <Text style={styles.balanceLabel}>Days Left</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceNum, { color: '#30D158' }]}>
                {balance?.approvedDays ?? 0}
              </Text>
              <Text style={styles.balanceLabel}>Taken</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceNum, { color: '#FF9F0A' }]}>
                {balance?.pendingDays ?? 0}
              </Text>
              <Text style={styles.balanceLabel}>Pending</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceNum, { color: '#8E8E93' }]}>
                {balance?.allowance ?? 21}
              </Text>
              <Text style={styles.balanceLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Leave Requests Inset Group */}
        <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>APPLICATIONS HISTORY</Text>
        <View style={styles.iosGroupedCard}>
          {loading ? (
            <ActivityIndicator color="#0A84FF" style={{ marginVertical: 24 }} />
          ) : leaves.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No leave applications filed for this cycle.</Text>
            </View>
          ) : (
            leaves.map((item, idx) => {
              const days = calculateDays(item.startDate, item.endDate);
              const isApproved = item.status === 'APPROVED';
              const isPending = item.status === 'PENDING';

              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.cellDivider} />}
                  <View style={styles.leaveRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leaveDates}>
                        {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                      </Text>
                      <Text style={styles.leaveDays}>{days} {days === 1 ? 'day' : 'days'}</Text>
                      <Text style={styles.leaveReason}>{item.reason}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isApproved
                            ? 'rgba(48, 209, 88, 0.16)'
                            : isPending
                            ? 'rgba(255, 159, 10, 0.16)'
                            : 'rgba(255, 69, 58, 0.16)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isApproved ? '#30D158' : isPending ? '#FF9F0A' : '#FF453A',
                          },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              );
            })
          )}
        </View>

        {/* Action Button */}
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            style={styles.iosPrimaryButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <AppleSymbol iosName="plus.circle.fill" fallbackName="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.iosPrimaryButtonText}>Request Time Off</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── REQUEST LEAVE iOS SHEET MODAL ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => !submitting && setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', justifyContent: 'flex-end' }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.sheetContainer}>
                  <View style={styles.sheetGrabberBar} />
                  <Text style={styles.sheetTitle}>Request Leave / Time Off</Text>
                  <Text style={styles.sheetSubtitle}>Submit dates for supervisor and fleet HR sign-off</Text>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <Text style={styles.inputHeading}>PICK LEAVE DATES *</Text>
                    <CalendarPicker
                      startDate={startDate}
                      endDate={endDate}
                      onSelectRange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      remainingQuota={balance?.remaining}
                    />

                    <Text style={styles.inputHeading}>REASON / REMARKS *</Text>
                    <TextInput
                      style={[styles.iosInput, { height: 74, textAlignVertical: 'top' }]}
                      placeholder="Annual vacation, family obligations, medical..."
                      placeholderTextColor="#636366"
                      multiline
                      value={reason}
                      onChangeText={setReason}
                    />

                    <TouchableOpacity
                      style={[
                        styles.iosPrimaryButton,
                        { marginTop: 18 },
                        (!startDate || !endDate || !reason.trim() || submitting) && { opacity: 0.6 },
                      ]}
                      onPress={handleSubmitRequest}
                      disabled={!startDate || !endDate || !reason.trim() || submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.iosPrimaryButtonText}>
                          {startDate && endDate
                            ? `Submit Application (${getDaysCount(startDate, endDate)} ${getDaysCount(startDate, endDate) === 1 ? 'Day' : 'Days'})`
                            : 'Select Dates to Submit'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => !submitting && setModalVisible(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MinimalTheme.background,
  },
  scrollBody: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iosSectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  iosGroupedCard: {
    borderRadius: MinimalTheme.radiusCard,
    overflow: 'hidden',
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
  },
  balanceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceNum: {
    fontSize: 22,
    fontFamily: Fonts.extrabold,
    color: MinimalTheme.accent,
  },
  balanceLabel: {
    fontSize: 11,
    color: MinimalTheme.textSecondary,
    fontFamily: Fonts.medium,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: '60%',
    backgroundColor: MinimalTheme.cardBorder,
  },
  cellDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MinimalTheme.cardBorder,
    marginLeft: 16,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  leaveDates: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
  },
  leaveDays: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.accent,
    marginTop: 2,
  },
  leaveReason: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  emptyText: {
    color: MinimalTheme.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: MinimalTheme.sheetBg,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    maxHeight: '92%',
  },
  sheetGrabberBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MinimalTheme.surfaceBorder,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  inputHeading: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  iosInput: {
    backgroundColor: MinimalTheme.surface,
    borderRadius: MinimalTheme.radiusInput,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: MinimalTheme.text,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  daysBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MinimalTheme.accentSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  daysBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.accent,
  },
  cancelBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textMuted,
  },
});
