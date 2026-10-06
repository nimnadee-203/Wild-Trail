import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { FilterButton, StatusPill } from '../../components/manager/ManagerUI';
import { patrols as samplePatrols } from '../../components/manager/data';
import {
  createScheduledPatrol,
  getScheduledPatrolErrorMessage,
  subscribeToScheduledPatrols,
  updateScheduledPatrol,
} from '../../services/scheduledPatrols';
import { ScheduledPatrol, ScheduledPatrolInput, ScheduledPatrolStatus } from '../../types/patrol';

type PatrolForm = Omit<ScheduledPatrolInput, 'status'>;
type PatrolCard = {
  id?: string;
  name: string;
  ranger: string;
  zone: string;
  status: string;
  progress: number;
  last: string;
};

const emptyForm: PatrolForm = {
  teamName: '',
  rangerName: '',
  zone: '',
  date: '',
  startTime: '',
  endTime: '',
  notes: '',
};

const statuses = ['All teams', 'scheduled', 'on patrol', 'Break', 'completed'] as const;
const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
const timeOptions = Array.from({ length: 24 }, (_, hour) => `${pad(hour)}:00`);

function DatePicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(() => {
    const selected = parseDate(value);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const selected = parseDate(value);

  return (
    <View style={styles.pickerCard}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={20} color="#2B8263" /></Pressable>
        <Text style={styles.calendarTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={20} color="#2B8263" /></Pressable>
      </View>
      <View style={styles.weekRow}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
      <View style={styles.calendarGrid}>{days.map((day, index) => day === null ? <View key={`empty-${index}`} style={styles.dayCell} /> : <Pressable key={day} style={[styles.dayCell, selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && selected.getDate() === day && styles.selectedDay]} onPress={() => { onChange(formatDate(new Date(month.getFullYear(), month.getMonth(), day))); onClose(); }}><Text style={[styles.dayText, selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && selected.getDate() === day && styles.selectedDayText]}>{day}</Text></Pressable>)}</View>
    </View>
  );
}

export default function Patrols() {
  const [filter, setFilter] = useState<(typeof statuses)[number]>('All teams');
  const [scheduledPatrols, setScheduledPatrols] = useState<ScheduledPatrol[]>([]);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPatrol, setEditingPatrol] = useState<ScheduledPatrol | null>(null);
  const [form, setForm] = useState<PatrolForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePicker, setTimePicker] = useState<'startTime' | 'endTime' | null>(null);
  const [draftTime, setDraftTime] = useState('08:00');

  useEffect(() => {
    return subscribeToScheduledPatrols(
      (patrols) => {
        setScheduledPatrols(patrols);
        setDatabaseLoaded(true);
      },
      (error) => Alert.alert('Unable to load patrols', error.message)
    );
  }, []);

  const cards: PatrolCard[] = useMemo(() => {
    if (!databaseLoaded || scheduledPatrols.length === 0) return samplePatrols;
    return scheduledPatrols.map((patrol) => ({
      ...patrol,
      name: patrol.teamName,
      ranger: patrol.rangerName,
      status: patrol.status,
      progress: patrol.status === 'completed' ? 100 : patrol.status === 'on patrol' ? 45 : 0,
      last: `${patrol.date} at ${patrol.startTime}`,
    }));
  }, [databaseLoaded, scheduledPatrols]);

  const filtered = filter === 'All teams'
    ? cards
    : cards.filter((team) => team.status.toLowerCase() === filter.toLowerCase());

  const openCreate = () => {
    setEditingPatrol(null);
    setForm(emptyForm);
    setSaveError('');
    setModalVisible(true);
  };

  const openEdit = (patrol: ScheduledPatrol) => {
    setEditingPatrol(patrol);
    setForm({
      teamName: patrol.teamName,
      rangerName: patrol.rangerName,
      zone: patrol.zone,
      date: patrol.date,
      startTime: patrol.startTime,
      endTime: patrol.endTime ?? '',
      notes: patrol.notes ?? '',
    });
    setSaveError('');
    setModalVisible(true);
  };

  const savePatrol = async () => {
    const requiredFields: Array<keyof PatrolForm> = ['teamName', 'rangerName', 'zone', 'date', 'startTime'];
    if (requiredFields.some((field) => !form[field]?.trim())) {
      Alert.alert('Missing details', 'Enter a team, ranger, zone, date, and start time.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const input: ScheduledPatrolInput = { ...form, status: editingPatrol?.status ?? 'scheduled' };
    try {
      if (editingPatrol) {
        await updateScheduledPatrol(editingPatrol.id, input);
      } else {
        await createScheduledPatrol(input);
      }
      setModalVisible(false);
    } catch (error) {
      const message = getScheduledPatrolErrorMessage(error);
      setSaveError(message);
      Alert.alert('Unable to save patrol', message);
    } finally {
      setSaving(false);
    }
  };

  const openTimePicker = (field: 'startTime' | 'endTime') => {
    setDraftTime(form[field] || (field === 'startTime' ? '08:00' : '17:00'));
    setTimePicker(field);
  };

  return (
    <ManagerShell active="patrols">
      <View style={styles.titleRow}>
        <View><Text style={managerStyles.pageTitle}>Patrols</Text><Text style={managerStyles.pageSubtitle}>Track teams, coverage, and daily patrol performance.</Text></View>
        <Pressable style={styles.primary} onPress={openCreate}><Ionicons name="add" size={17} color="#FFF" /><Text style={styles.primaryText}>Schedule patrol</Text></Pressable>
      </View>
      <View style={styles.filters}>
        {statuses.map((status) => <FilterButton key={status} label={status === 'All teams' ? status : status.replace(/^\w/, (letter) => letter.toUpperCase())} selected={filter === status} onPress={() => setFilter(status)} />)}
      </View>
      <View style={styles.stats}>
        <View style={[managerStyles.card, styles.small]}><Text style={managerStyles.cardMuted}>Teams active now</Text><Text style={styles.big}>02</Text><StatusPill value="Live" /></View>
        <View style={[managerStyles.card, styles.small]}><Text style={managerStyles.cardMuted}>Coverage today</Text><Text style={styles.big}>78%</Text><Text style={styles.good}>+5.4% vs yesterday</Text></View>
        <View style={[managerStyles.card, styles.small]}><Text style={managerStyles.cardMuted}>Distance covered</Text><Text style={styles.big}>146.8 km</Text><Text style={styles.good}>Across 12 zones</Text></View>
      </View>
      <View style={styles.teamGrid}>
        {filtered.map((team) => {
          const scheduled = scheduledPatrols.find((patrol) => patrol.id === team.id);
          return <View key={team.id ?? team.name} style={[managerStyles.card, styles.team]}>
            <View style={styles.teamTop}><View style={styles.teamIcon}><Ionicons name="people-outline" size={21} color="#2B8263" /></View><StatusPill value={team.status} /></View>
            <Text style={styles.teamName}>{team.name}</Text><Text style={managerStyles.cardMuted}>{team.ranger}</Text>
            <View style={styles.zone}><Ionicons name="location-outline" size={14} color="#71817A" /><Text style={managerStyles.cardMuted}>{team.zone}</Text></View>
            <View style={styles.progressLabel}><Text style={managerStyles.cardMuted}>Patrol progress</Text><Text style={styles.percent}>{team.progress}%</Text></View>
            <View style={styles.progress}><View style={[styles.progressFill, { width: `${team.progress}%` }]} /></View>
            <Text style={styles.last}>{team.last}</Text>
            {scheduled ? <Pressable style={styles.details} onPress={() => openEdit(scheduled)}><Text style={managerStyles.link}>Edit assignment</Text><Ionicons name="create-outline" size={14} color="#2B8263" /></Pressable> : <View style={styles.details}><Text style={managerStyles.link}>Sample team</Text></View>}
          </View>;
        })}
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modal}>
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{editingPatrol ? 'Edit patrol assignment' : 'Schedule a patrol'}</Text><Text style={styles.modalSubtitle}>Assign a ranger and set the patrol details.</Text></View><Pressable onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#71817A" /></Pressable></View>
          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            {saveError ? <View style={styles.errorBanner}><Ionicons name="warning-outline" size={18} color="#B34D3E" /><Text style={styles.errorText}>{saveError}</Text></View> : null}
            {(['teamName', 'rangerName', 'zone'] as const).map((field) => <View key={field} style={styles.field}><Text style={styles.label}>{field === 'teamName' ? 'Team name' : field === 'rangerName' ? 'Assigned ranger' : 'Patrol zone'}</Text><TextInput style={styles.input} value={form[field]} onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))} placeholder={`Enter ${field === 'teamName' ? 'team name' : field === 'rangerName' ? 'ranger name' : 'patrol zone'}`} placeholderTextColor="#9BA8A2" /></View>)}
            <View style={styles.field}><Text style={styles.label}>Patrol date</Text><Pressable style={styles.pickerButton} onPress={() => setDatePickerVisible((visible) => !visible)}><Ionicons name="calendar-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.date && styles.placeholder]}>{form.date || 'Choose a date'}</Text><Ionicons name={datePickerVisible ? 'chevron-up' : 'chevron-down'} size={17} color="#71817A" /></Pressable>{datePickerVisible && <DatePicker value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} onClose={() => setDatePickerVisible(false)} />}</View>
            <View style={styles.timeRow}><View style={styles.timeField}><Text style={styles.label}>Start time</Text><Pressable style={styles.pickerButton} onPress={() => openTimePicker('startTime')}><Ionicons name="time-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.startTime && styles.placeholder]}>{form.startTime || 'Choose time'}</Text></Pressable></View><View style={styles.timeField}><Text style={styles.label}>End time <Text style={styles.optional}>(optional)</Text></Text><Pressable style={styles.pickerButton} onPress={() => openTimePicker('endTime')}><Ionicons name="time-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.endTime && styles.placeholder]}>{form.endTime || 'Choose time'}</Text></Pressable></View></View>
            <View style={styles.field}><Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text><TextInput style={styles.notesInput} value={form.notes} onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))} placeholder="Add instructions for the ranger" placeholderTextColor="#9BA8A2" multiline /></View>
            <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={savePatrol} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>{editingPatrol ? 'Save changes' : 'Schedule patrol'}</Text>}</Pressable>
          </ScrollView>
        </View></View>
      </Modal>
      <Modal visible={timePicker !== null} animationType="fade" transparent onRequestClose={() => setTimePicker(null)}>
        <View style={styles.modalBackdrop}><View style={styles.timeModal}><Text style={styles.modalTitle}>{timePicker === 'startTime' ? 'Choose start time' : 'Choose end time'}</Text><Text style={styles.modalSubtitle}>Select an hour for this patrol.</Text><View style={styles.timeOptions}>{timeOptions.map((time) => <Pressable key={time} style={[styles.timeOption, draftTime === time && styles.timeOptionSelected]} onPress={() => setDraftTime(time)}><Text style={[styles.timeOptionText, draftTime === time && styles.timeOptionSelectedText]}>{time}</Text></Pressable>)}</View><View style={styles.timeActions}><Pressable style={styles.cancelButton} onPress={() => setTimePicker(null)}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable style={styles.confirmButton} onPress={() => { if (timePicker) setForm((current) => ({ ...current, [timePicker]: draftTime })); setTimePicker(null); }}><Text style={styles.saveText}>Use this time</Text></Pressable></View></View></View>
      </Modal>
    </ManagerShell>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, primary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2B8263', borderRadius: 8, paddingHorizontal: 13, height: 38 }, primaryText: { color: '#FFF', fontSize: 12, fontWeight: '700' }, filters: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 }, small: { flex: 1, minWidth: 160, margin: 0 }, big: { color: '#17342B', fontSize: 25, fontWeight: '800', marginVertical: 8 }, good: { color: '#2B8263', fontSize: 11 }, teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 }, team: { flex: 1, minWidth: 245, margin: 0 }, teamTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, teamIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#E5F2EC', alignItems: 'center', justifyContent: 'center' }, teamName: { color: '#234138', fontSize: 16, fontWeight: '800', marginTop: 15, marginBottom: 4 }, zone: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13 }, progressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 7 }, percent: { color: '#2B8263', fontWeight: '800', fontSize: 12 }, progress: { height: 7, borderRadius: 5, backgroundColor: '#E5EEE9', overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#2B8263', borderRadius: 5 }, last: { color: '#8A9992', fontSize: 11, marginTop: 9 }, details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF2EF', paddingTop: 13, marginTop: 14 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(18, 48, 39, 0.45)', justifyContent: 'center', padding: 18 }, modal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '92%', width: '100%' }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }, modalTitle: { color: '#17342B', fontSize: 20, fontWeight: '800' }, modalSubtitle: { color: '#71817A', fontSize: 12, marginTop: 4 }, formScroll: { flexGrow: 0, maxHeight: 560 }, formContent: { paddingBottom: 2 }, errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FDECEA', borderRadius: 8, padding: 10, marginBottom: 12 }, errorText: { flex: 1, color: '#B34D3E', fontSize: 12, lineHeight: 17 }, field: { marginBottom: 10 }, label: { color: '#53655D', fontSize: 12, fontWeight: '700', marginBottom: 5 }, optional: { color: '#9BA8A2', fontWeight: '400' }, input: { borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, height: 40, paddingHorizontal: 11, color: '#17342B', fontSize: 13 }, pickerButton: { minHeight: 42, borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, pickerValue: { flex: 1, color: '#17342B', fontSize: 13 }, placeholder: { color: '#9BA8A2' }, timeRow: { flexDirection: 'row', gap: 10 }, timeField: { flex: 1 }, notesInput: { height: 64, borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, paddingHorizontal: 11, paddingTop: 10, color: '#17342B', textAlignVertical: 'top' }, saveButton: { height: 44, borderRadius: 8, backgroundColor: '#2B8263', alignItems: 'center', justifyContent: 'center', marginTop: 6 }, saveText: { color: '#FFF', fontSize: 13, fontWeight: '800' }, disabled: { opacity: 0.65 }, pickerCard: { borderWidth: 1, borderColor: '#E0EBE5', borderRadius: 10, padding: 10, marginTop: 8, backgroundColor: '#F9FCFA' }, calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, calendarTitle: { color: '#17342B', fontWeight: '800', fontSize: 14 }, weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 }, weekDay: { width: 34, textAlign: 'center', color: '#9BA8A2', fontSize: 11, fontWeight: '700' }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.285%', height: 34, alignItems: 'center', justifyContent: 'center' }, selectedDay: { backgroundColor: '#2B8263', borderRadius: 17 }, dayText: { color: '#53655D', fontSize: 12 }, selectedDayText: { color: '#FFF', fontWeight: '800' }, timeModal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '92%', maxWidth: 420, maxHeight: '80%' }, timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }, timeOption: { width: 66, paddingVertical: 9, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#DCE7E1' }, timeOptionSelected: { backgroundColor: '#2B8263', borderColor: '#2B8263' }, timeOptionText: { color: '#53655D', fontSize: 12, fontWeight: '700' }, timeOptionSelectedText: { color: '#FFF' }, timeActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 }, cancelButton: { paddingHorizontal: 14, height: 40, justifyContent: 'center' }, cancelText: { color: '#71817A', fontWeight: '700' }, confirmButton: { backgroundColor: '#2B8263', borderRadius: 8, paddingHorizontal: 14, height: 40, justifyContent: 'center' },
});
