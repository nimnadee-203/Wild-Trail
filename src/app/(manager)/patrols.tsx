import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { FilterButton, StatusPill } from '../../components/manager/ManagerUI';
import { mockRangers } from '../../components/manager/data';
import { PatrolRouteMap } from '../../components/manager/PatrolRouteMap';
import { PatrolMapMode } from '../../components/manager/patrolMapHtml';
import {
  createScheduledPatrol,
  deleteScheduledPatrol,
  getScheduledPatrolErrorMessage,
  subscribeToScheduledPatrols,
  updateScheduledPatrol,
} from '../../services/scheduledPatrols';
import { ScheduledPatrol, ScheduledPatrolInput } from '../../types/patrol';

type PatrolForm = Omit<ScheduledPatrolInput, 'status'>;
type PatrolCard = {
  id?: string;
  name: string;
  ranger: string;
  zone: string;
  status: string;
  progress: number;
  last: string;
  checkpoints: number;
};

const emptyForm: PatrolForm = {
  teamName: '',
  rangerName: '',
  rangerId: '',
  zone: '',
  date: '',
  startTime: '',
  endTime: '',
  notes: '',
  route: [],
  checkpoints: [],
};

const overlayColors = ['#2B8263', '#4D84A8', '#C98A2E', '#D35F50'];

const statuses = ['All teams', 'scheduled', 'on patrol', 'Unassigned', 'Break', 'completed'] as const;
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
  const [mapMode, setMapMode] = useState<PatrolMapMode>('route');

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
    if (!databaseLoaded) return [];
    return scheduledPatrols.map((patrol) => ({
      ...patrol,
      name: patrol.teamName,
      ranger: patrol.rangerName || 'No ranger assigned',
      status: patrol.rangerName ? patrol.status : 'Unassigned',
      progress: patrol.status === 'completed' ? 100 : patrol.status === 'on patrol' ? 45 : 0,
      last: `${patrol.date} at ${patrol.startTime}`,
      checkpoints: patrol.checkpoints.length,
    }));
  }, [databaseLoaded, scheduledPatrols]);

  const mapOverlays = useMemo(
    () => scheduledPatrols
      .filter((patrol) => patrol.route.length > 1)
      .map((patrol, index) => ({
        id: patrol.id,
        color: patrol.rangerName ? overlayColors[index % overlayColors.length] : '#D35F50',
        route: patrol.route,
        checkpoints: patrol.checkpoints,
      })),
    [scheduledPatrols]
  );

  const filtered = filter === 'All teams'
    ? cards
    : cards.filter((team) => team.status.toLowerCase() === filter.toLowerCase());

  const rangerOptions = useMemo(() => mockRangers.map((ranger) => {
    const assigned = scheduledPatrols.find((patrol) =>
      patrol.id !== editingPatrol?.id
      && patrol.status !== 'completed'
      && patrol.status !== 'cancelled'
      && (patrol.rangerId === ranger.id || patrol.rangerName === ranger.name)
    );
    const status = ranger.status === 'off duty' ? 'off duty' : assigned ? 'on patrol' : ranger.status;
    return { ...ranger, status, available: status === 'available' };
  }), [editingPatrol?.id, scheduledPatrols]);

  const openCreate = () => {
    setEditingPatrol(null);
    setForm(emptyForm);
    setMapMode('route');
    setSaveError('');
    setModalVisible(true);
  };

  const openEdit = (patrol: ScheduledPatrol) => {
    setEditingPatrol(patrol);
    setForm({
      teamName: patrol.teamName,
      rangerName: patrol.rangerName,
      rangerId: patrol.rangerId ?? '',
      zone: patrol.zone,
      date: patrol.date,
      startTime: patrol.startTime,
      endTime: patrol.endTime ?? '',
      notes: patrol.notes ?? '',
      route: patrol.route ?? [],
      checkpoints: patrol.checkpoints ?? [],
    });
    setMapMode('route');
    setSaveError('');
    setModalVisible(true);
  };

  const savePatrol = async () => {
    const requiredFields: Array<keyof PatrolForm> = ['teamName', 'zone', 'date', 'startTime'];
    if (requiredFields.some((field) => !String(form[field] ?? '').trim())) {
      Alert.alert('Missing details', 'Enter a team, zone, date, and start time.');
      return;
    }
    if (form.route.length < 2) {
      Alert.alert('Patrol route needed', 'Draw a route on the map with at least two points.');
      return;
    }
    if (form.checkpoints.length < 1) {
      Alert.alert('Checkpoints needed', 'Select at least one checkpoint along the route.');
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

  const unassignRanger = async () => {
    if (!editingPatrol) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateScheduledPatrol(editingPatrol.id, { ...form, rangerId: '', rangerName: '', status: editingPatrol.status });
      setForm((current) => ({ ...current, rangerId: '', rangerName: '' }));
      setEditingPatrol((current) => current ? { ...current, rangerId: undefined, rangerName: '' } : current);
    } catch (error) {
      const message = getScheduledPatrolErrorMessage(error);
      setSaveError(message);
      Alert.alert('Unable to unassign ranger', message);
    } finally {
      setSaving(false);
    }
  };

  const deletePatrol = () => {
    if (!editingPatrol) return;
    Alert.alert(
      'Delete patrol?',
      `This will permanently delete ${editingPatrol.teamName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Patrol',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            setSaveError('');
            try {
              await deleteScheduledPatrol(editingPatrol.id);
              setModalVisible(false);
            } catch (error) {
              const message = getScheduledPatrolErrorMessage(error);
              setSaveError(message);
              Alert.alert('Unable to delete patrol', message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const openTimePicker = (field: 'startTime' | 'endTime') => {
    setDraftTime(form[field] || (field === 'startTime' ? '08:00' : '17:00'));
    setTimePicker(field);
  };

  return (
    <ManagerShell active="patrols">
      <View style={[styles.titleRow, modernStyles.titleRow]}>
        <View><Text style={managerStyles.pageTitle}>Patrols</Text><Text style={managerStyles.pageSubtitle}>Track teams, coverage, and daily patrol performance.</Text></View>
        <Pressable style={[styles.primary, modernStyles.primary]} onPress={openCreate}><Ionicons name="add" size={17} color="#FFF" /><Text style={styles.primaryText}>Schedule patrol</Text></Pressable>
      </View>
      <View style={styles.filters}>
        {statuses.map((status) => <FilterButton key={status} label={status === 'All teams' ? status : status.replace(/^\w/, (letter) => letter.toUpperCase())} selected={filter === status} onPress={() => setFilter(status)} />)}
      </View>
      <View style={[styles.stats, modernStyles.stats]}>
        <View style={[managerStyles.card, styles.small, modernStyles.statCard]}><Text style={managerStyles.cardMuted}>Teams active now</Text><Text style={styles.big}>02</Text><StatusPill value="Live" /></View>
        <View style={[managerStyles.card, styles.small, modernStyles.statCard]}><Text style={managerStyles.cardMuted}>Coverage today</Text><Text style={styles.big}>78%</Text><Text style={styles.good}>+5.4% vs yesterday</Text></View>
        <View style={[managerStyles.card, styles.small, modernStyles.statCard]}><Text style={managerStyles.cardMuted}>Distance covered</Text><Text style={styles.big}>146.8 km</Text><Text style={styles.good}>Across 12 zones</Text></View>
      </View>
      <View style={[managerStyles.card, styles.mapCard]}>
        <View style={managerStyles.sectionRow}>
          <View>
            <Text style={managerStyles.cardTitle}>Patrol routes</Text>
            <Text style={managerStyles.cardMuted}>Saved routes and checkpoints from scheduled patrols.</Text>
          </View>
        </View>
        <PatrolRouteMap route={[]} checkpoints={[]} overlays={mapOverlays} />
      </View>
      <View style={styles.teamGrid}>
        {filtered.map((team) => {
          const scheduled = scheduledPatrols.find((patrol) => patrol.id === team.id);
          const isUnassigned = team.status === 'Unassigned';
          return <View key={team.id ?? team.name} style={[managerStyles.card, styles.team, modernStyles.team, isUnassigned && modernStyles.unassignedTeam]}>
            <View style={styles.teamTop}><View style={[styles.teamIcon, isUnassigned && modernStyles.unassignedIcon]}><Ionicons name={isUnassigned ? 'alert-circle-outline' : 'people-outline'} size={21} color={isUnassigned ? '#D35F50' : '#2B8263'} /></View><StatusPill value={team.status} /></View>
            <Text style={styles.teamName}>{team.name}</Text><Text style={managerStyles.cardMuted}>{team.ranger}</Text>
            {isUnassigned ? <View style={modernStyles.assignmentNotice}><Ionicons name="warning-outline" size={14} color="#B34D3E" /><Text style={modernStyles.assignmentNoticeText}>Needs a ranger before patrol</Text></View> : null}
            <View style={styles.zone}><Ionicons name="location-outline" size={14} color="#71817A" /><Text style={managerStyles.cardMuted}>{team.zone}</Text></View>
            <View style={styles.progressLabel}><Text style={managerStyles.cardMuted}>Patrol progress</Text><Text style={styles.percent}>{team.progress}%</Text></View>
            <View style={styles.progress}><View style={[styles.progressFill, { width: `${team.progress}%` }]} /></View>
            <Text style={styles.last}>{team.last}{team.checkpoints ? ` · ${team.checkpoints} checkpoints` : ''}</Text>
            {scheduled ? <Pressable style={styles.details} onPress={() => openEdit(scheduled)}><Text style={managerStyles.link}>{team.ranger === 'No ranger assigned' ? 'Assign ranger' : 'Edit assignment'}</Text><Ionicons name="create-outline" size={14} color="#2B8263" /></Pressable> : <View style={styles.details}><Text style={managerStyles.link}>Sample team</Text></View>}
          </View>;
        })}
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modal}>
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{editingPatrol ? 'Edit patrol assignment' : 'Schedule a patrol'}</Text><Text style={styles.modalSubtitle}>Assign a ranger and set the patrol details.</Text></View><Pressable onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#71817A" /></Pressable></View>
          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            {saveError ? <View style={styles.errorBanner}><Ionicons name="warning-outline" size={18} color="#B34D3E" /><Text style={styles.errorText}>{saveError}</Text></View> : null}
            <View style={styles.field}><Text style={styles.label}>Team name</Text><TextInput style={styles.input} value={form.teamName} onChangeText={(value) => setForm((current) => ({ ...current, teamName: value }))} placeholder="Enter team name" placeholderTextColor="#9BA8A2" /></View>
            <View style={styles.field}>
              <Text style={styles.label}>Assigned ranger</Text>
              <View style={modernStyles.assignmentRow}><View style={[styles.pickerButton, modernStyles.assignmentPicker]}><Ionicons name="person-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.rangerName && styles.placeholder]}>{form.rangerName || 'No ranger assigned'}</Text></View>{editingPatrol && form.rangerName ? <Pressable style={[modernStyles.unassignButton, saving && styles.disabled]} onPress={unassignRanger} disabled={saving}><Ionicons name="person-remove-outline" size={17} color="#B34D3E" /><Text style={modernStyles.unassignText}>Unassign</Text></Pressable> : null}</View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Available rangers</Text>
              <Text style={styles.helpText}>Choose an available ranger, or unassign the current ranger to make them available again.</Text>
              <View style={styles.rangerList}>
                {rangerOptions.map((ranger) => {
                  const selected = form.rangerId === ranger.id || form.rangerName === ranger.name;
                  return (
                    <Pressable
                      key={ranger.id}
                      style={[styles.rangerRow, selected && styles.rangerRowSelected, !ranger.available && styles.rangerRowDisabled]}
                      onPress={() => {
                        if (!ranger.available) return;
                        setForm((current) => ({
                          ...current,
                          rangerId: ranger.id,
                          rangerName: ranger.name,
                          zone: current.zone || ranger.zone,
                        }));
                      }}
                    >
                      <View style={styles.rangerCopy}>
                        <Text style={styles.rangerName}>{ranger.name}</Text>
                        <Text style={managerStyles.cardMuted}>{ranger.badge} · {ranger.zone}</Text>
                      </View>
                      <StatusPill value={ranger.status} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.field}><Text style={styles.label}>Patrol zone</Text><TextInput style={styles.input} value={form.zone} onChangeText={(value) => setForm((current) => ({ ...current, zone: value }))} placeholder="Enter patrol zone" placeholderTextColor="#9BA8A2" /></View>
            <View style={styles.field}>
              <Text style={styles.label}>Patrol route and checkpoints</Text>
              <Text style={styles.helpText}>{mapMode === 'route' ? 'Tap the map to draw the route.' : 'Tap the map to place checkpoints along the route.'} {form.route.length} points · {form.checkpoints.length} checkpoints.</Text>
              <View style={styles.mapTools}>
                <Pressable style={[styles.toolButton, mapMode === 'route' && styles.toolButtonSelected]} onPress={() => setMapMode('route')}><Text style={[styles.toolText, mapMode === 'route' && styles.toolTextSelected]}>Draw route</Text></Pressable>
                <Pressable style={[styles.toolButton, mapMode === 'checkpoint' && styles.toolButtonSelected]} onPress={() => setMapMode('checkpoint')}><Text style={[styles.toolText, mapMode === 'checkpoint' && styles.toolTextSelected]}>Add checkpoints</Text></Pressable>
                <Pressable style={styles.toolButton} onPress={() => setForm((current) => mapMode === 'checkpoint' ? { ...current, checkpoints: current.checkpoints.slice(0, -1) } : { ...current, route: current.route.slice(0, -1) })}><Text style={styles.toolText}>Undo</Text></Pressable>
                <Pressable style={styles.toolButton} onPress={() => setForm((current) => ({ ...current, route: [], checkpoints: [] }))}><Text style={styles.toolText}>Clear</Text></Pressable>
              </View>
              <PatrolRouteMap
                editable
                mode={mapMode}
                route={form.route}
                checkpoints={form.checkpoints}
                onChange={({ route, checkpoints }) => setForm((current) => ({ ...current, route, checkpoints }))}
              />
            </View>
            <View style={styles.field}><Text style={styles.label}>Patrol date</Text><Pressable style={styles.pickerButton} onPress={() => setDatePickerVisible((visible) => !visible)}><Ionicons name="calendar-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.date && styles.placeholder]}>{form.date || 'Choose a date'}</Text><Ionicons name={datePickerVisible ? 'chevron-up' : 'chevron-down'} size={17} color="#71817A" /></Pressable>{datePickerVisible && <DatePicker value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} onClose={() => setDatePickerVisible(false)} />}</View>
            <View style={styles.timeRow}><View style={styles.timeField}><Text style={styles.label}>Start time</Text><Pressable style={styles.pickerButton} onPress={() => openTimePicker('startTime')}><Ionicons name="time-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.startTime && styles.placeholder]}>{form.startTime || 'Choose time'}</Text></Pressable></View><View style={styles.timeField}><Text style={styles.label}>End time <Text style={styles.optional}>(optional)</Text></Text><Pressable style={styles.pickerButton} onPress={() => openTimePicker('endTime')}><Ionicons name="time-outline" size={19} color="#2B8263" /><Text style={[styles.pickerValue, !form.endTime && styles.placeholder]}>{form.endTime || 'Choose time'}</Text></Pressable></View></View>
            <View style={styles.field}><Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text><TextInput style={styles.notesInput} value={form.notes} onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))} placeholder="Add instructions for the ranger" placeholderTextColor="#9BA8A2" multiline /></View>
            {editingPatrol ? <Pressable style={[modernStyles.deleteButton, saving && styles.disabled]} onPress={deletePatrol} disabled={saving}><Ionicons name="trash-outline" size={17} color="#B34D3E" /><Text style={modernStyles.deleteText}>Delete Patrol</Text></Pressable> : null}
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

const modernStyles = StyleSheet.create({
  titleRow: { marginBottom: 8 },
  primary: { borderRadius: 12, paddingHorizontal: 16, height: 44, shadowColor: '#2B8263', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  stats: { marginBottom: 22 },
  statCard: { borderRadius: 16, borderColor: '#E2EEE7', padding: 18 },
  team: { borderRadius: 16, borderColor: '#E2EEE7', padding: 18 },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignmentPicker: { flex: 1, backgroundColor: '#F8FCFA' },
  unassignButton: { height: 44, borderWidth: 1, borderColor: '#F0C8C1', borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8F6' },
  unassignText: { color: '#B34D3E', fontSize: 12, fontWeight: '800' },
  deleteButton: { height: 44, borderWidth: 1, borderColor: '#F0C8C1', borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FFF8F6', marginBottom: 10 },
  deleteText: { color: '#B34D3E', fontSize: 13, fontWeight: '800' },
  unassignedTeam: { borderColor: '#E7A39A', backgroundColor: '#FFF9F7', shadowColor: '#D35F50', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  unassignedIcon: { backgroundColor: '#FDE9E5' },
  assignmentNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, backgroundColor: '#FDE9E5', paddingHorizontal: 9, paddingVertical: 7, marginTop: 12 },
  assignmentNoticeText: { color: '#B34D3E', fontSize: 11, fontWeight: '800' },
});

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, primary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2B8263', borderRadius: 8, paddingHorizontal: 13, height: 38 }, primaryText: { color: '#FFF', fontSize: 12, fontWeight: '700' }, filters: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 }, small: { flex: 1, minWidth: 160, margin: 0 }, big: { color: '#17342B', fontSize: 25, fontWeight: '800', marginVertical: 8 }, good: { color: '#2B8263', fontSize: 11 }, teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 }, team: { flex: 1, minWidth: 245, margin: 0 }, teamTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, teamIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#E5F2EC', alignItems: 'center', justifyContent: 'center' }, teamName: { color: '#234138', fontSize: 16, fontWeight: '800', marginTop: 15, marginBottom: 4 }, zone: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13 }, progressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 7 }, percent: { color: '#2B8263', fontWeight: '800', fontSize: 12 }, progress: { height: 7, borderRadius: 5, backgroundColor: '#E5EEE9', overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#2B8263', borderRadius: 5 }, last: { color: '#8A9992', fontSize: 11, marginTop: 9 }, details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF2EF', paddingTop: 13, marginTop: 14 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(18, 48, 39, 0.45)', justifyContent: 'center', padding: 18 }, modal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '92%', width: '100%' }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }, modalTitle: { color: '#17342B', fontSize: 20, fontWeight: '800' }, modalSubtitle: { color: '#71817A', fontSize: 12, marginTop: 4 }, formScroll: { flexGrow: 0, maxHeight: 640 }, mapCard: { marginBottom: 18 }, helpText: { color: '#71817A', fontSize: 11, lineHeight: 16, marginBottom: 8 }, rangerList: { gap: 8 }, rangerRow: { minHeight: 54, borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, rangerRowSelected: { borderColor: '#2B8263', backgroundColor: '#F3FAF6' }, rangerRowDisabled: { opacity: 0.55 }, rangerCopy: { flex: 1 }, rangerName: { color: '#17342B', fontSize: 13, fontWeight: '700', marginBottom: 2 }, mapTools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }, toolButton: { borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, paddingHorizontal: 10, height: 32, justifyContent: 'center' }, toolButtonSelected: { backgroundColor: '#2B8263', borderColor: '#2B8263' }, toolText: { color: '#53655D', fontSize: 11, fontWeight: '700' }, toolTextSelected: { color: '#FFF' }, formContent: { paddingBottom: 2 }, errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FDECEA', borderRadius: 8, padding: 10, marginBottom: 12 }, errorText: { flex: 1, color: '#B34D3E', fontSize: 12, lineHeight: 17 }, field: { marginBottom: 10 }, label: { color: '#53655D', fontSize: 12, fontWeight: '700', marginBottom: 5 }, optional: { color: '#9BA8A2', fontWeight: '400' }, input: { borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, height: 40, paddingHorizontal: 11, color: '#17342B', fontSize: 13 }, pickerButton: { minHeight: 42, borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, pickerValue: { flex: 1, color: '#17342B', fontSize: 13 }, placeholder: { color: '#9BA8A2' }, timeRow: { flexDirection: 'row', gap: 10 }, timeField: { flex: 1 }, notesInput: { height: 64, borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, paddingHorizontal: 11, paddingTop: 10, color: '#17342B', textAlignVertical: 'top' }, saveButton: { height: 44, borderRadius: 8, backgroundColor: '#2B8263', alignItems: 'center', justifyContent: 'center', marginTop: 6 }, saveText: { color: '#FFF', fontSize: 13, fontWeight: '800' }, disabled: { opacity: 0.65 }, pickerCard: { borderWidth: 1, borderColor: '#E0EBE5', borderRadius: 10, padding: 10, marginTop: 8, backgroundColor: '#F9FCFA' }, calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, calendarTitle: { color: '#17342B', fontWeight: '800', fontSize: 14 }, weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 }, weekDay: { width: 34, textAlign: 'center', color: '#9BA8A2', fontSize: 11, fontWeight: '700' }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.285%', height: 34, alignItems: 'center', justifyContent: 'center' }, selectedDay: { backgroundColor: '#2B8263', borderRadius: 17 }, dayText: { color: '#53655D', fontSize: 12 }, selectedDayText: { color: '#FFF', fontWeight: '800' }, timeModal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '92%', maxWidth: 420, maxHeight: '80%' }, timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }, timeOption: { width: 66, paddingVertical: 9, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#DCE7E1' }, timeOptionSelected: { backgroundColor: '#2B8263', borderColor: '#2B8263' }, timeOptionText: { color: '#53655D', fontSize: 12, fontWeight: '700' }, timeOptionSelectedText: { color: '#FFF' }, timeActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 }, cancelButton: { paddingHorizontal: 14, height: 40, justifyContent: 'center' }, cancelText: { color: '#71817A', fontWeight: '700' }, confirmButton: { backgroundColor: '#2B8263', borderRadius: 8, paddingHorizontal: 14, height: 40, justifyContent: 'center' },
});
