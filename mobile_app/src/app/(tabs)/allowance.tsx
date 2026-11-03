import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { useRouter } from 'expo-router';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { Fonts, MinimalTheme } from '@/constants/theme';

export default function AllowanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllowance = useCallback(async () => {
    try {
      const res = await api.getAllowance();
      setData(res);
    } catch (err: any) {
      console.warn('Failed to load allowance:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllowance();
  };

  const summary = data?.summary || {
    baseMonthlyAllowance: 0,
    totalTripTa: 0,
    approvedExpensesReimbursable: 0,
    pendingExpenses: 0,
    totalNetEarnings: 0,
    currency: 'SAR',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
      >
        {/* Total Earnings Hero Inset Group */}
        <Text style={styles.iosSectionHeader}>CURRENT CYCLE NET EARNINGS</Text>
        <View style={styles.iosGroupedCard}>
          <View style={styles.heroBlock}>
            <Text style={styles.heroLabel}>Total Estimated Net</Text>
            <Text style={styles.heroAmount}>
              {summary.totalNetEarnings.toLocaleString()}{' '}
              <Text style={styles.currency}>{summary.currency}</Text>
            </Text>
            <Text style={styles.heroSub}>
              Base Allowance + Completed Trip TA + Approved Claims
            </Text>
          </View>
        </View>

        {/* Breakdown Inset Group */}
        <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>COMPENSATION BREAKDOWN</Text>
        <View style={styles.iosGroupedCard}>
          {/* Base Allowance */}
          <View style={styles.listRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(100, 210, 255, 0.15)' }]}>
              <AppleSymbol iosName="calendar" fallbackName="calendar-outline" size={17} color="#64D2FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Base Monthly Allowance</Text>
              <Text style={styles.rowSub}>Driver employment contract</Text>
            </View>
            <Text style={styles.rowValue}>{summary.baseMonthlyAllowance.toLocaleString()} SAR</Text>
          </View>

          <View style={styles.cellDivider} />

          {/* Trip TA */}
          <View style={styles.listRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
              <AppleSymbol iosName="car.fill" fallbackName="car-outline" size={17} color="#30D158" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Trip Travel Allowance (TA)</Text>
              <Text style={styles.rowSub}>Per-trip delivery allowance</Text>
            </View>
            <Text style={[styles.rowValue, { color: '#30D158' }]}>
              +{summary.totalTripTa.toLocaleString()} SAR
            </Text>
          </View>

          <View style={styles.cellDivider} />

          {/* Approved Claims */}
          <View style={styles.listRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(94, 92, 230, 0.15)' }]}>
              <AppleSymbol iosName="receipt.fill" fallbackName="receipt-outline" size={17} color="#5E5CE6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Approved Reimbursables</Text>
              <Text style={styles.rowSub}>Fuel, toll & maintenance claims</Text>
            </View>
            <Text style={[styles.rowValue, { color: '#5E5CE6' }]}>
              +{summary.approvedExpensesReimbursable.toLocaleString()} SAR
            </Text>
          </View>

          <View style={styles.cellDivider} />

          {/* Pending Review */}
          <View style={styles.listRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
              <AppleSymbol iosName="clock.fill" fallbackName="time-outline" size={17} color="#FF9F0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Pending Expense Claims</Text>
              <Text style={styles.rowSub}>Awaiting fleet manager approval</Text>
            </View>
            <Text style={[styles.rowValue, { color: '#FF9F0A' }]}>
              {summary.pendingExpenses.toLocaleString()} SAR
            </Text>
          </View>
        </View>

        {/* Quick Link to Leaves Inset Group */}
        <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>SCHEDULE & TIME OFF</Text>
        <View style={styles.iosGroupedCard}>
          <TouchableOpacity
            style={styles.leaveNavRow}
            onPress={() => router.push('/leaves')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
              <AppleSymbol iosName="calendar.badge.clock" fallbackName="calendar" size={18} color="#0A84FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Annual Leave & Duty Schedule</Text>
              <Text style={styles.rowSub}>Check quota, apply for vacation days</Text>
            </View>
            <AppleSymbol iosName="chevron.right" fallbackName="chevron-forward" size={14} color="#71717a" />
          </TouchableOpacity>
        </View>

        {/* Completed Trips with TA Inset Group */}
        <Text style={[styles.iosSectionHeader, { marginTop: 24 }]}>COMPLETED TRIPS (TA LOG)</Text>
        <View style={styles.iosGroupedCard}>
          {loading ? (
            <ActivityIndicator color="#0A84FF" style={{ marginVertical: 20 }} />
          ) : (data?.completedTripsWithTa || []).length === 0 ? (
            <View style={{ padding: 18, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No completed trips with TA logged yet.</Text>
            </View>
          ) : (
            (data.completedTripsWithTa || []).map((trip: any, index: number) => (
              <React.Fragment key={trip.id}>
                {index > 0 && <View style={styles.cellDivider} />}
                <View style={styles.tripRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripTracking}>{trip.trackingNumber}</Text>
                    <Text style={styles.tripDate}>
                      {trip.actualDelivery
                        ? new Date(trip.actualDelivery).toLocaleDateString()
                        : new Date(trip.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.tripAmountBadge}>
                    <Text style={styles.tripAmountText}>+{trip.driverTa} SAR</Text>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
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
  heroBlock: {
    padding: 20,
  },
  heroLabel: {
    fontSize: 12,
    color: MinimalTheme.textSecondary,
    fontFamily: Fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 34,
    fontFamily: Fonts.extrabold,
    color: MinimalTheme.text,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  currency: {
    fontSize: 20,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 6,
  },
  cellDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MinimalTheme.cardBorder,
    marginLeft: 56,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: MinimalTheme.text,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
  },
  leaveNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tripTracking: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.text,
  },
  tripDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  tripAmountBadge: {
    backgroundColor: MinimalTheme.successSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tripAmountText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: MinimalTheme.success,
  },
  emptyText: {
    color: MinimalTheme.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
});
