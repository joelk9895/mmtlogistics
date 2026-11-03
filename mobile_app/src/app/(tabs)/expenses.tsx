import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/services/api';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { Fonts, MinimalTheme } from '@/constants/theme';

const CATEGORIES = [
  { key: 'FUEL', label: 'Fuel / Diesel', iosIcon: 'fuelpump.fill', fallbackIcon: 'water-outline' as const, color: '#FF9F0A' },
  { key: 'TOLL', label: 'Highway Toll', iosIcon: 'creditcard.fill', fallbackIcon: 'card-outline' as const, color: '#0A84FF' },
  { key: 'MAINTENANCE', label: 'Repairs & Service', iosIcon: 'wrench.and.screwdriver.fill', fallbackIcon: 'construct-outline' as const, color: '#FF453A' },
  { key: 'FOOD_ALLOWANCE', label: 'Per Diem / Meal', iosIcon: 'fork.knife', fallbackIcon: 'restaurant-outline' as const, color: '#30D158' },
  { key: 'PARKING', label: 'Parking Fee', iosIcon: 'parkingsign.circle.fill', fallbackIcon: 'car-outline' as const, color: '#BF5AF2' },
  { key: 'OTHER', label: 'Miscellaneous', iosIcon: 'ellipsis.circle.fill', fallbackIcon: 'ellipsis-horizontal-circle-outline' as const, color: '#8E8E93' },
];

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('FUEL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [liters, setLiters] = useState('');
  const [station, setStation] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.getExpenses();
      if (res?.expenses) {
        setExpenses(res.expenses);
      }
    } catch (err: any) {
      console.warn('Failed to load expenses:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handlePickReceipt = () => {
    Alert.alert('Attach Receipt', 'Choose upload source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to photograph receipts.');
            return;
          }
          const res = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            setReceiptImage(res.assets[0].uri);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Media library access is needed to select receipt photos.');
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            setReceiptImage(res.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmitExpense = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount in SAR.');
      return;
    }

    setSubmitting(true);
    try {
      let receiptUrl: string | undefined = undefined;

      if (receiptImage) {
        const uploadRes = await api.uploadFile(receiptImage);
        receiptUrl = uploadRes?.url;
      }

      await api.createExpense({
        category,
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        liters: liters ? parseFloat(liters) : undefined,
        station: station.trim() || undefined,
        odometerKm: odometerKm ? parseFloat(odometerKm) : undefined,
        receiptUrl,
      });

      setModalVisible(false);
      setAmount('');
      setDescription('');
      setLiters('');
      setStation('');
      setOdometerKm('');
      setReceiptImage(null);
      fetchExpenses();

      Alert.alert('Expense Logged', 'Your expense claim was submitted for approval.');
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not log expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderExpenseItem = ({ item, index }: { item: any; index: number }) => {
    const cat = CATEGORIES.find((c) => c.key === item.category) || CATEGORIES[5];
    const isApproved = item.status === 'APPROVED';
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.expenseRow}>
        <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}20` }]}>
          <AppleSymbol
            iosName={cat.iosIcon as any}
            fallbackName={cat.fallbackIcon}
            size={18}
            color={cat.color}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.categoryName}>{cat.label}</Text>
          <Text style={styles.expenseDate}>
            {new Date(item.date).toLocaleDateString()}
            {item.description ? ` · ${item.description}` : ''}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.expenseAmount}>
            {item.amount.toLocaleString()} <Text style={styles.sarText}>SAR</Text>
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isApproved
                  ? 'rgba(48, 209, 88, 0.16)'
                  : isPending
                  ? 'rgba(255, 159, 10, 0.16)'
                  : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isApproved ? '#30D158' : isPending ? '#FF9F0A' : '#8E8E93',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Action Header Inset Group */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
      >
        <View style={styles.iosGroupedCard}>
          <View style={styles.actionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Trip & Fleet Expenses</Text>
              <Text style={styles.actionSub}>Reimbursements, fuel logs, and toll receipts</Text>
            </View>
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <AppleSymbol iosName="plus" fallbackName="add" size={14} color="#FFFFFF" />
              <Text style={styles.addExpenseBtnText}>Log Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Expenses Inset Grouped List */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={styles.iosSectionHeader}>CLAIMS HISTORY</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={styles.loadingText}>Loading expense records…</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={[styles.iosGroupedCard, styles.emptyCard]}>
            <AppleSymbol iosName="receipt" fallbackName="receipt-outline" size={44} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Expenses Logged</Text>
            <Text style={styles.emptySub}>
              Tap "+ Log Expense" above to record fuel receipts, tolls, or trip expenses.
            </Text>
          </View>
        ) : (
          <View style={styles.iosGroupedCard}>
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id}
              renderItem={renderExpenseItem}
              ItemSeparatorComponent={() => <View style={styles.cellDivider} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#0A84FF"
                />
              }
              contentContainerStyle={{
                paddingVertical: 4,
                paddingBottom: Math.max(insets.bottom, 16) + 24,
              }}
            />
          </View>
        )}
      </View>

      {/* ── LOG EXPENSE iOS SHEET MODAL ── */}
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
                  <Text style={styles.sheetTitle}>Record Expense Claim</Text>
                  <Text style={styles.sheetSubtitle}>Submit receipt for fleet reimbursement</Text>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* Category Selection */}
                    <Text style={styles.inputHeading}>EXPENSE CATEGORY</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((c) => (
                        <TouchableOpacity
                          key={c.key}
                          style={[
                            styles.categoryChip,
                            category === c.key && styles.categoryChipActive,
                          ]}
                          onPress={() => setCategory(c.key)}
                          activeOpacity={0.7}
                        >
                          <AppleSymbol
                            iosName={c.iosIcon as any}
                            fallbackName={c.fallbackIcon}
                            size={14}
                            color={category === c.key ? '#FFFFFF' : c.color}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              category === c.key && styles.categoryChipTextActive,
                            ]}
                          >
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Amount */}
                    <Text style={styles.inputHeading}>AMOUNT (SAR) *</Text>
                    <TextInput
                      style={styles.iosInput}
                      placeholder="0.00"
                      placeholderTextColor="#636366"
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={setAmount}
                    />

                    {/* Conditional Fuel Fields */}
                    {category === 'FUEL' && (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputHeading}>LITERS</Text>
                          <TextInput
                            style={styles.iosInput}
                            placeholder="e.g. 120"
                            placeholderTextColor="#636366"
                            keyboardType="decimal-pad"
                            value={liters}
                            onChangeText={setLiters}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputHeading}>ODOMETER (KM)</Text>
                          <TextInput
                            style={styles.iosInput}
                            placeholder="e.g. 48500"
                            placeholderTextColor="#636366"
                            keyboardType="numeric"
                            value={odometerKm}
                            onChangeText={setOdometerKm}
                          />
                        </View>
                      </View>
                    )}

                    {/* Description */}
                    <Text style={styles.inputHeading}>NOTES / VENDOR</Text>
                    <TextInput
                      style={styles.iosInput}
                      placeholder="Gas station, highway toll booth, invoice ref..."
                      placeholderTextColor="#636366"
                      value={description}
                      onChangeText={setDescription}
                    />

                    {/* Receipt Photo */}
                    <Text style={styles.inputHeading}>ATTACH RECEIPT PHOTO</Text>
                    <TouchableOpacity
                      style={styles.receiptPickerBtn}
                      onPress={handlePickReceipt}
                      activeOpacity={0.8}
                    >
                      <AppleSymbol iosName="camera.fill" fallbackName="camera" size={16} color="#0A84FF" />
                      <Text style={styles.receiptPickerText}>
                        {receiptImage ? 'Change Photo Receipt' : 'Take or Select Receipt Photo'}
                      </Text>
                    </TouchableOpacity>

                    {receiptImage && (
                      <View style={styles.receiptPreviewRow}>
                        <Image source={{ uri: receiptImage }} style={styles.receiptThumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.receiptSuccessText}>Receipt attached</Text>
                          <Text style={styles.receiptSuccessSub}>Verified for submission</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReceiptImage(null)}>
                          <AppleSymbol iosName="trash.fill" fallbackName="trash" size={16} color="#FF453A" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.iosPrimaryButton,
                        { marginTop: 18 },
                        submitting && { opacity: 0.6 },
                      ]}
                      onPress={handleSubmitExpense}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.iosPrimaryButtonText}>Submit Expense Claim</Text>
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
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
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
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    letterSpacing: -0.3,
  },
  actionSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  addExpenseBtn: {
    backgroundColor: MinimalTheme.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: MinimalTheme.radiusButton,
  },
  addExpenseBtnText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: '#FFFFFF',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 12,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  cellDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MinimalTheme.cardBorder,
    marginLeft: 56,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: MinimalTheme.text,
  },
  expenseDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: MinimalTheme.text,
  },
  sarText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  categoryChipActive: {
    backgroundColor: MinimalTheme.accent,
    borderColor: MinimalTheme.accent,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: MinimalTheme.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
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
  receiptPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MinimalTheme.surface,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    paddingVertical: 11,
    borderRadius: MinimalTheme.radiusInput,
  },
  receiptPickerText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.accent,
  },
  receiptPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: MinimalTheme.successSubtle,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  receiptThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  receiptSuccessText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: MinimalTheme.success,
  },
  receiptSuccessSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: MinimalTheme.textMuted,
  },
  iosPrimaryButton: {
    height: 48,
    backgroundColor: MinimalTheme.accent,
    borderRadius: MinimalTheme.radiusButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPrimaryButtonText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
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
