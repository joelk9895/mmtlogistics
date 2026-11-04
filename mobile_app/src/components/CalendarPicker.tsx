import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AppleSymbol } from '@/components/glass/AppleSymbol';
import { Fonts, MinimalTheme } from '@/constants/theme';

export interface CalendarPickerProps {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  onSelectRange: (start: string, end: string) => void;
  minDate?: string;  // defaults to today's date 'YYYY-MM-DD'
  remainingQuota?: number;
}

export const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getDaysCount = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const dt1 = new Date(Date.UTC(y1, m1 - 1, d1));
  const dt2 = new Date(Date.UTC(y2, m2 - 1, d2));
  const diff = dt2.getTime() - dt1.getTime();
  if (diff < 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPicker({
  startDate,
  endDate,
  onSelectRange,
  minDate,
  remainingQuota,
}: CalendarPickerProps) {
  const todayStr = useMemo(() => toDateString(new Date()), []);
  const effectiveMinDate = minDate || todayStr;

  // Active selection target: 'start' or 'end'
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');

  // Month being viewed in the calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  // Month navigation
  const isAtMinMonth = useMemo(() => {
    const [minY, minM] = effectiveMinDate.split('-').map(Number);
    return year < minY || (year === minY && month <= minM - 1);
  }, [effectiveMinDate, year, month]);

  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Build calendar matrix
  const weeks = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    const rows: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [year, month]);

  // Handle tapping a day
  const handleDatePress = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr < effectiveMinDate) return;

    if (activeTarget === 'start') {
      onSelectRange(dateStr, endDate && dateStr <= endDate ? endDate : '');
      setActiveTarget('end');
    } else {
      // In 'end' mode
      if (!startDate || dateStr < startDate) {
        onSelectRange(dateStr, '');
        setActiveTarget('end');
      } else {
        onSelectRange(startDate, dateStr);
      }
    }
  };

  // Quick preset handlers
  const applyPreset = (days: number) => {
    const [y, m, d] = effectiveMinDate.split('-').map(Number);
    // Start tomorrow or today
    const startDt = new Date(y, m - 1, d);
    startDt.setDate(startDt.getDate() + 1); // start from tomorrow for planned leaves

    const endDt = new Date(startDt);
    endDt.setDate(endDt.getDate() + (days - 1));

    const sStr = toDateString(startDt);
    const eStr = toDateString(endDt);

    onSelectRange(sStr, eStr);
    setCurrentMonth(new Date(startDt.getFullYear(), startDt.getMonth(), 1));
    setActiveTarget('end');
  };

  const clearSelection = () => {
    onSelectRange('', '');
    setActiveTarget('start');
  };

  const totalDays = getDaysCount(startDate, endDate);
  const exceedsQuota = remainingQuota !== undefined && totalDays > remainingQuota;

  return (
    <View style={styles.container}>
      {/* ── Start / End Selection Cards ── */}
      <View style={styles.rangeCardsRow}>
        <TouchableOpacity
          style={[
            styles.rangeCard,
            activeTarget === 'start' && styles.rangeCardActive,
          ]}
          onPress={() => setActiveTarget('start')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.targetDot, activeTarget === 'start' && styles.targetDotActive]} />
            <Text style={styles.cardLabel}>START DATE</Text>
          </View>
          <Text style={[styles.cardValue, !startDate && styles.cardValueEmpty]}>
            {startDate ? formatDisplayDate(startDate) : 'Select date'}
          </Text>
        </TouchableOpacity>

        <View style={styles.cardSeparator}>
          <AppleSymbol iosName="arrow.right" fallbackName="arrow-forward" size={13} color="#71717A" />
        </View>

        <TouchableOpacity
          style={[
            styles.rangeCard,
            activeTarget === 'end' && styles.rangeCardActive,
          ]}
          onPress={() => setActiveTarget('end')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.targetDot, activeTarget === 'end' && styles.targetDotActive]} />
            <Text style={styles.cardLabel}>END DATE</Text>
          </View>
          <Text style={[styles.cardValue, !endDate && styles.cardValueEmpty]}>
            {endDate ? formatDisplayDate(endDate) : 'Select date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick Presets Scroll ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsContainer}
      >
        <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset(1)}>
          <Text style={styles.presetText}>Tomorrow (1d)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset(3)}>
          <Text style={styles.presetText}>3 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset(5)}>
          <Text style={styles.presetText}>Work Week (5d)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset(7)}>
          <Text style={styles.presetText}>1 Week (7d)</Text>
        </TouchableOpacity>
        {(startDate || endDate) && (
          <TouchableOpacity style={[styles.presetChip, styles.presetReset]} onPress={clearSelection}>
            <Text style={[styles.presetText, { color: '#FF453A' }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Calendar Header & Navigation ── */}
      <View style={styles.monthHeaderRow}>
        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            style={[styles.navBtn, isAtMinMonth && styles.navBtnDisabled]}
            onPress={handlePrevMonth}
            disabled={isAtMinMonth}
            activeOpacity={0.7}
          >
            <AppleSymbol
              iosName="chevron.left"
              fallbackName="chevron-back"
              size={15}
              color={isAtMinMonth ? '#3F3F46' : '#FAFAFA'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <AppleSymbol
              iosName="chevron.right"
              fallbackName="chevron-forward"
              size={15}
              color="#FAFAFA"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Days of Week Header ── */}
      <View style={styles.daysOfWeekRow}>
        {DAYS_OF_WEEK.map((dayName, idx) => (
          <View key={idx} style={styles.dayOfWeekCell}>
            <Text style={styles.dayOfWeekText}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* ── Calendar Days Matrix ── */}
      <View style={styles.matrixContainer}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekRow}>
            {week.map((day, dIdx) => {
              if (day === null) {
                return <View key={dIdx} style={styles.dayCell} />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isPast = dateStr < effectiveMinDate;
              const isStart = dateStr === startDate;
              const isEnd = dateStr === endDate;
              const isSingleDay = isStart && isEnd;
              const isInRange = Boolean(startDate && endDate && dateStr > startDate && dateStr < endDate);
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={dIdx}
                  style={styles.dayCell}
                  onPress={() => handleDatePress(day)}
                  disabled={isPast}
                  activeOpacity={0.7}
                >
                  {/* Connecting range highlight strips */}
                  {isInRange && <View style={styles.stripMiddle} />}
                  {isStart && endDate && !isSingleDay && <View style={styles.stripStart} />}
                  {isEnd && startDate && !isSingleDay && <View style={styles.stripEnd} />}

                  {/* Circular day indicator */}
                  <View
                    style={[
                      styles.dayCircle,
                      (isStart || isEnd) && styles.dayCircleSelected,
                      isToday && !isStart && !isEnd && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        (isStart || isEnd) && styles.dayNumberTextSelected,
                        isInRange && styles.dayNumberTextInRange,
                        isToday && !isStart && !isEnd && styles.dayNumberTextToday,
                        isPast && styles.dayNumberTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Selected Range & Quota Summary Box ── */}
      {startDate ? (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryPill}>
              <AppleSymbol iosName="calendar" fallbackName="calendar" size={13} color="#0A84FF" />
              <Text style={styles.summaryPillText}>
                {totalDays > 0 ? `${totalDays} ${totalDays === 1 ? 'DAY' : 'DAYS'}` : '1 DAY (SELECT END)'}
              </Text>
            </View>
            <Text style={styles.summaryDateRange}>
              {formatDisplayDate(startDate)}
              {endDate && endDate !== startDate ? ` → ${formatDisplayDate(endDate)}` : ''}
            </Text>
          </View>

          {remainingQuota !== undefined && (
            <View style={styles.quotaFeedbackRow}>
              <AppleSymbol
                iosName={exceedsQuota ? 'exclamationmark.triangle.fill' : 'checkmark.circle.fill'}
                fallbackName={exceedsQuota ? 'warning' : 'checkmark-circle'}
                size={13}
                color={exceedsQuota ? '#FF9F0A' : '#30D158'}
              />
              <Text style={[styles.quotaFeedbackText, exceedsQuota && { color: '#FF9F0A' }]}>
                {exceedsQuota
                  ? `Exceeds quota: ${totalDays} requested vs ${remainingQuota} available`
                  : `${remainingQuota - totalDays} days remaining in annual quota`}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.hintContainer}>
          <AppleSymbol iosName="hand.tap.fill" fallbackName="hand-left" size={13} color="#71717A" />
          <Text style={styles.hintText}>Tap a date to set Start Date, then tap another to set End Date.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MinimalTheme.surface,
    borderRadius: MinimalTheme.radiusCard,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    padding: 14,
    marginVertical: 6,
  },
  rangeCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeCard: {
    flex: 1,
    backgroundColor: MinimalTheme.card,
    borderRadius: MinimalTheme.radiusInput,
    borderWidth: 1.5,
    borderColor: MinimalTheme.cardBorder,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  rangeCardActive: {
    borderColor: MinimalTheme.accent,
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  targetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3F3F46',
  },
  targetDotActive: {
    backgroundColor: MinimalTheme.accent,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: MinimalTheme.textSecondary,
    letterSpacing: 0.4,
  },
  cardValue: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: '#FAFAFA',
  },
  cardValueEmpty: {
    color: '#71717A',
    fontFamily: Fonts.regular,
  },
  cardSeparator: {
    paddingHorizontal: 2,
  },
  presetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  presetChip: {
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  presetReset: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  presetText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#D4D4D8',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#FAFAFA',
    letterSpacing: -0.2,
  },
  navButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MinimalTheme.card,
    borderWidth: 1,
    borderColor: MinimalTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: '#71717A',
    textTransform: 'uppercase',
  },
  matrixContainer: {
    gap: 3,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCell: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stripMiddle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.18)',
  },
  stripStart: {
    position: 'absolute',
    left: '50%',
    right: 0,
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.18)',
  },
  stripEnd: {
    position: 'absolute',
    left: 0,
    right: '50%',
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.18)',
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: MinimalTheme.accent,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: MinimalTheme.accent,
  },
  dayNumberText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#FAFAFA',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  dayNumberTextInRange: {
    color: '#0A84FF',
    fontFamily: Fonts.semibold,
  },
  dayNumberTextToday: {
    color: '#0A84FF',
    fontFamily: Fonts.semibold,
  },
  dayNumberTextDisabled: {
    color: '#3F3F46',
  },
  summaryContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MinimalTheme.cardBorder,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryPillText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#0A84FF',
    letterSpacing: 0.3,
  },
  summaryDateRange: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: '#D4D4D8',
  },
  quotaFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  quotaFeedbackText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#30D158',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MinimalTheme.cardBorder,
  },
  hintText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#71717A',
  },
});
