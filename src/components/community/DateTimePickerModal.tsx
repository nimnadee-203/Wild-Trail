import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DD HH:mm" or ISO string
  onChange: (value: string) => void;
}

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

function parseLocalDateTime(val: string): Date {
  const date = new Date(val.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const currentDate = parseLocalDateTime(value);

  const [draftDate, setDraftDate] = useState<Date>(() => currentDate);
  const [activeMonth, setActiveMonth] = useState<Date>(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });

  const handleOpen = () => {
    const d = parseLocalDateTime(value);
    setDraftDate(d);
    setActiveMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setModalOpen(true);
  };

  const handleSetNow = () => {
    const now = new Date();
    const formatted = formatLocalDateTime(now);
    onChange(formatted);
  };

  const handleApply = () => {
    onChange(formatLocalDateTime(draftDate));
    setModalOpen(false);
  };

  // Calendar calculations
  const year = activeMonth.getFullYear();
  const monthIndex = activeMonth.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const handleSelectDay = (day: number) => {
    const next = new Date(draftDate);
    next.setFullYear(year);
    next.setMonth(monthIndex);
    next.setDate(day);
    setDraftDate(next);
  };

  const handleSelectHour = (hour: number) => {
    const next = new Date(draftDate);
    next.setHours(hour);
    setDraftDate(next);
  };

  const handleSelectMinute = (minute: number) => {
    const next = new Date(draftDate);
    next.setMinutes(minute);
    setDraftDate(next);
  };

  const handleQuickPreset = (preset: 'now' | 'oneHourAgo' | 'morning' | 'dusk' | 'night') => {
    const next = new Date();
    if (preset === 'now') {
      // current
    } else if (preset === 'oneHourAgo') {
      next.setHours(next.getHours() - 1);
    } else if (preset === 'morning') {
      next.setHours(7, 30, 0, 0);
    } else if (preset === 'dusk') {
      next.setHours(18, 0, 0, 0);
    } else if (preset === 'night') {
      next.setHours(21, 30, 0, 0);
    }
    setDraftDate(next);
    setActiveMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  // Friendly formatted label
  const readableLabel = `${currentDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Event Date and Time <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.row}>
        {/* Main interactive button */}
        <Pressable
          style={styles.pickerTrigger}
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel="Open date and time picker"
        >
          <View style={styles.triggerLeft}>
            <Ionicons name="calendar-outline" size={18} color="#166534" />
            <Text style={styles.triggerText}>{readableLabel}</Text>
          </View>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
        </Pressable>

        {/* Quick Now button */}
        <Pressable
          style={styles.nowButton}
          onPress={handleSetNow}
          accessibilityRole="button"
          accessibilityLabel="Set event time to right now"
        >
          <Ionicons name="flash-outline" size={14} color="#166534" />
          <Text style={styles.nowText}>Now</Text>
        </Pressable>
      </View>

      {/* Web hidden/direct input fallback helper for accessibility */}
      {Platform.OS === 'web' && (
        <input
          type="datetime-local"
          style={{ display: 'none' }}
          id="community-datetime-hidden"
          value={value.replace(' ', 'T').slice(0, 16)}
          onChange={(e: any) => {
            if (e.target.value) {
              onChange(e.target.value.replace('T', ' '));
            }
          }}
        />
      )}

      {/* DateTime Picker Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalOpen(false)}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="calendar" size={20} color="#166534" />
                <Text style={styles.modalTitle}>Choose Date & Time</Text>
              </View>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </Pressable>
            </View>

            {/* Quick Presets */}
            <View style={styles.quickRow}>
              <Text style={styles.quickLabel}>Presets:</Text>
              <Pressable
                style={styles.quickChip}
                onPress={() => handleQuickPreset('now')}
              >
                <Text style={styles.quickChipText}>Right Now</Text>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => handleQuickPreset('oneHourAgo')}
              >
                <Text style={styles.quickChipText}>1 hr ago</Text>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => handleQuickPreset('morning')}
              >
                <Text style={styles.quickChipText}>Morning (07:30)</Text>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => handleQuickPreset('dusk')}
              >
                <Text style={styles.quickChipText}>Dusk (18:00)</Text>
              </Pressable>
            </View>

            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Pressable
                style={styles.monthNavBtn}
                onPress={() =>
                  setActiveMonth(new Date(year, monthIndex - 1, 1))
                }
              >
                <Ionicons name="chevron-back" size={18} color="#166534" />
              </Pressable>
              <Text style={styles.monthTitle}>
                {activeMonth.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Pressable
                style={styles.monthNavBtn}
                onPress={() =>
                  setActiveMonth(new Date(year, monthIndex + 1, 1))
                }
              >
                <Ionicons name="chevron-forward" size={18} color="#166534" />
              </Pressable>
            </View>

            {/* Days of week */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                <Text key={w} style={styles.weekdayText}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {days.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }
                const isSelected =
                  draftDate.getFullYear() === year &&
                  draftDate.getMonth() === monthIndex &&
                  draftDate.getDate() === day;

                const isToday =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === monthIndex &&
                  new Date().getDate() === day;

                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayCell,
                      isToday && styles.todayCell,
                      isSelected && styles.selectedDayCell,
                    ]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.todayText,
                        isSelected && styles.selectedDayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Time Selection Header */}
            <View style={styles.timeSection}>
              <View style={styles.timeHeader}>
                <Ionicons name="time" size={16} color="#166534" />
                <Text style={styles.timeTitle}>
                  Select Time ({pad(draftDate.getHours())}:
                  {pad(draftDate.getMinutes())})
                </Text>
              </View>

              {/* Hours row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hoursScroll}
              >
                {Array.from({ length: 24 }, (_, h) => {
                  const sel = draftDate.getHours() === h;
                  return (
                    <Pressable
                      key={h}
                      style={[styles.timeChip, sel && styles.timeChipSelected]}
                      onPress={() => handleSelectHour(h)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          sel && styles.timeChipTextSelected,
                        ]}
                      >
                        {pad(h)}:00
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Minutes row */}
              <View style={styles.minutesRow}>
                <Text style={styles.minLabel}>Min:</Text>
                {[0, 15, 30, 45].map((m) => {
                  const sel = draftDate.getMinutes() === m;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.minChip, sel && styles.minChipSelected]}
                      onPress={() => handleSelectMinute(m)}
                    >
                      <Text
                        style={[
                          styles.minChipText,
                          sel && styles.minChipTextSelected,
                        ]}
                      >
                        :{pad(m)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyText}>Apply Date & Time</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  required: {
    color: '#DC2626',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 46,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  triggerText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  nowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 46,
  },
  nowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#166534',
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 4,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  quickChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickChipText: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: '500',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#166534',
  },
  selectedDayCell: {
    backgroundColor: '#166534',
  },
  dayText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  todayText: {
    color: '#166534',
    fontWeight: '700',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    gap: 8,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  hoursScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeChipSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  timeChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  minutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  minChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  minChipSelected: {
    backgroundColor: '#166534',
  },
  minChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  minChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#166534',
  },
  applyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
