import { goBackOrReplace } from '../utils/navigation';
import { useStaffProfile } from '../hooks/useStaffProfile';
import { ManagerShell } from './manager/ManagerShell';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WildTrailBrand } from './WildTrailBrand';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { communityStyles as base } from './communityStyles';
import { acceptCommunityOperation, parseCommunitySms, queueCommunityReport, respondToCommunityReport, syncCommunityReports, watchCommunityReports } from '../services/communityReports';
import { COMMUNITY_REPORT_TYPES, COMMUNITY_SMS_KEYWORDS, CommunityReport } from '../types/community';
import { IncidentStatus } from '../types/incident';
import { useRoleGuard } from '../hooks/useRoleGuard';

const STATUS_TONES: Record<IncidentStatus, { color: string; background: string }> = {
  pending: { color: '#805400', background: '#FFF0C7' },
  investigating: { color: '#235B85', background: '#E4EFF9' },
  resolved: { color: '#245747', background: '#E3F0E6' },
  dismissed: { color: '#52605A', background: '#EAEDEB' },
};
const RESPONDER_ROLES = ['ranger', 'liaison', 'manager', 'admin'] as const;

export default function CommunityOperationsScreen({ manager = false }: { manager?: boolean }) {
  useRoleGuard([...RESPONDER_ROLES]);
  const profile = useStaffProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | IncidentStatus>('all');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [sms, setSms] = useState('ELEPHANT | Village name | East boundary | Near the gate | 3 elephants');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [simulating, setSimulating] = useState(false);
  useFocusEffect(useCallback(() => {
    setError('');
    return watchCommunityReports((items) => { setReports(items); setLoaded(true); }, (failure) => { setError(failure.message); setLoaded(true); });
  }, []));
  const patterns = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of reports.filter((entry) => entry.source !== 'sms_simulated')) {
      const key = `${report.village} · ${report.boundarySection} · ${report.occurredAt.slice(0, 7)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const simulate = async () => {
    if (simulating) return;
    setSimulating(true); setError('');
    try {
      const entry = await queueCommunityReport(parseCommunitySms(sms, phone), []);
      setNotice(`Simulated SMS saved: ${entry.id}. No SMS was sent or received.`);
      void syncCommunityReports().catch((failure) => setError(String(failure)));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Invalid simulated SMS.'); }
    finally { setSimulating(false); }
  };
  const visibleReports = reports.filter(report => (filter === 'all' || report.status === filter)
    && [report.village, report.boundarySection, report.description, report.id, COMMUNITY_REPORT_TYPES[report.kind]?.label || report.kind]
      .some(value => value.toLowerCase().includes(search.trim().toLowerCase())));
  const selectedReport = reports.find(report => report.id === selectedId);
  const content = <View style={{ gap: 16 }}>
    <View style={ui.hero}><Text style={ui.eyebrow}>COMMUNITY RESPONSE</Text><Text style={ui.heroTitle}>Every report matters.</Text><Text style={ui.heroText}>Coordinate field responses and help communities coexist with wildlife.</Text></View>
    <View style={ui.stats}>{[
      { label: 'Total reports', value: reports.length },
      { label: 'Awaiting action', value: reports.filter(r => r.status === 'pending').length },
      { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length },
    ].map(item => <View key={item.label} style={ui.stat}><Text style={ui.statValue}>{loaded ? item.value : '?'}</Text><Text style={ui.statLabel}>{item.label}</Text></View>)}</View>
    <Text style={s.heading}>Community reports</Text>
    <Text style={s.text}>Incoming community wildlife reports. Accept an operation and record follow-up.</Text>
    <Text style={s.text}>Demo ranger and liaison accounts can accept reports and save responses on this device. Real staff accounts update shared operations.</Text>
    <View style={ui.search}><Ionicons name="search-outline" size={20} color="#52675A" /><TextInput style={ui.searchInput} value={search} onChangeText={setSearch} placeholder="Search village, report or boundary" placeholderTextColor="#63796B" accessibilityLabel="Search community reports" /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.filters}>{(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map(value => <Pressable key={value} style={[ui.chip, value === filter && ui.chipSelected]} onPress={() => setFilter(value)} accessibilityRole="button" accessibilityState={{ selected: value === filter }}><Text style={[ui.chipText, value === filter && ui.chipTextSelected]}>{value === 'all' ? 'All reports' : value}</Text></Pressable>)}</ScrollView>
    {!!error && <Text style={s.error}>{error}</Text>}
    {!loaded && <ActivityIndicator color="#245747" style={{ padding: 20 }} />}
    {loaded && !reports.length && !error && <Text style={s.text}>No community reports received yet.</Text>}
    <View style={ui.tableFrame}>
      <View style={ui.tableIntro}><Text style={s.title}>Report register</Text><Text style={s.text}>{visibleReports.length} reports</Text></View>
      <Text style={ui.tableHint}>Select a report to view details and respond. Swipe sideways for more columns.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled">
        <View style={ui.table}>
          <View style={ui.tableHead}>{[
            ['Report / type', 230], ['Village / boundary', 200], ['Status', 140], ['Reported', 150], ['Assigned to', 170], ['Action', 100],
          ].map(([label, width]) => <Text key={label} style={[ui.columnHeading, { width: Number(width) }]}>{label}</Text>)}</View>
          {visibleReports.map((report, index) => <View key={report.id} style={[ui.tableRow, index % 2 === 1 && ui.alternateRow, selectedId === report.id && ui.selectedRow]}>
            <View style={[ui.cell, { width: 230 }]}><Text style={ui.cellTitle}>{COMMUNITY_REPORT_TYPES[report.kind]?.label || report.kind}</Text><Text style={ui.cellSecondary} numberOfLines={1}>{report.id}</Text></View>
            <View style={[ui.cell, { width: 200 }]}><Text style={ui.cellTitle}>{report.village}</Text><Text style={ui.cellSecondary}>{report.boundarySection}</Text></View>
            <View style={[ui.cell, { width: 140 }]}><View style={[ui.tableStatus, { backgroundColor: STATUS_TONES[report.status].background }]}><Text style={[ui.tableStatusText, { color: STATUS_TONES[report.status].color }]}>{report.status}</Text></View></View>
            <View style={[ui.cell, { width: 150 }]}><Text style={ui.cellTitle}>{new Date(report.occurredAt).toLocaleDateString()}</Text><Text style={ui.cellSecondary}>{new Date(report.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
            <View style={[ui.cell, { width: 170 }]}><Text style={ui.cellTitle} numberOfLines={2}>{report.assignedName || report.assignedTo || 'Unassigned'}</Text></View>
            <View style={[ui.cell, { width: 100 }]}><Pressable onPress={() => setSelectedId(current => current === report.id ? null : report.id)} style={ui.viewButton} accessibilityRole="button" accessibilityState={{ expanded: selectedId === report.id }} accessibilityLabel={`View report from ${report.village}`}><Text style={ui.viewButtonText}>{selectedId === report.id ? 'Close' : 'View'}</Text><Ionicons name="chevron-down" size={14} color="#245747" /></Pressable></View>
          </View>)}
        </View>
      </ScrollView>
    </View>
    {!!selectedReport && <View style={{ gap: 12 }}><View style={ui.tableIntro}><Text style={s.title}>Report details & response</Text><Pressable onPress={() => setSelectedId(null)} accessibilityRole="button" accessibilityLabel="Close report details" style={ui.viewButton}><Ionicons name="close" size={20} color="#245747" /></Pressable></View><ResponseCard key={selectedReport.id} report={selectedReport} /></View>}
    {loaded && reports.length > 0 && !visibleReports.length && <View style={s.card}><Text style={s.title}>No matching reports</Text><Text style={s.text}>Try another search or status filter.</Text></View>}
    <View style={s.card}><View style={ui.sectionRow}><Ionicons name="analytics-outline" size={22} color="#245747" /><Text style={s.title}>Boundary conflict patterns</Text></View>
    <Text style={s.text}>Reports per boundary section and month. Simulated SMS reports are excluded.</Text>
    {patterns.map(([key, count]) => <View key={key} style={ui.patternRow}><Text style={[s.text, { flex: 1 }]}>{key}</Text><Text style={ui.count}>{count}</Text></View>)}
    {!patterns.length && <Text style={s.text}>Patterns will appear as community reports arrive.</Text>}</View>
    <View style={s.card}>
      <Text style={s.title}>SMS simulator · prototype only</Text>
      <Text style={s.text}>No live SMS service is connected. Format: keyword | village | boundary section | landmark | description. Keywords: {COMMUNITY_SMS_KEYWORDS}</Text>
      <TextInput style={s.input} accessibilityLabel="Simulated sender phone" placeholder="Sender phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={s.input} accessibilityLabel="Simulated SMS message" multiline value={sms} onChangeText={setSms} />
      <Pressable disabled={simulating} style={s.button} onPress={simulate}><Text style={s.buttonText}>{simulating ? 'Saving…' : 'Simulate Incoming SMS'}</Text></Pressable>
      {!!notice && <Text style={s.text}>{notice}</Text>}
    </View>
  </View>;
  if (manager || profile?.role === 'manager' || profile?.role === 'admin') {
    return <ManagerShell active="community-reports">{content}</ManagerShell>;
  }
  return <SafeAreaView style={ui.screen} edges={['top', 'bottom', 'left', 'right']}>
    <View style={ui.header}><Pressable onPress={() => goBackOrReplace(profile?.role === 'manager' || profile?.role === 'admin' ? '/(manager)/overview' : profile?.role === 'liaison' ? '/(liaison)/dashboard' : '/(ranger)/dashboard')} style={ui.back} accessibilityRole="button" accessibilityLabel="Back to dashboard"><Ionicons name="arrow-back" size={22} color="#FFFFFF" /></Pressable><WildTrailBrand light title="Community reports & response" /></View>
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{content}</ScrollView>
  </SafeAreaView>;
}

function ResponseCard({ report }: { report: CommunityReport }) {
  const [status, setStatus] = useState<IncidentStatus>(report.status);
  const [notes, setNotes] = useState(report.responseNotes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true); setError('');
    try { await respondToCommunityReport(report.id, status, notes); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save response.'); }
    finally { setBusy(false); }
  };
  const accept = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await acceptCommunityOperation(report.id); setStatus('investigating'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to accept operation.'); }
    finally { setBusy(false); }
  };
  return <View style={s.card}>
    <View style={ui.sectionRow}><View style={ui.reportIcon}><Ionicons name="shield-checkmark-outline" size={23} color="#245747" /></View><Text style={[s.title, { flex: 1 }]}>{COMMUNITY_REPORT_TYPES[report.kind]?.label || report.kind}</Text><View style={ui.statusBadge}><Text style={ui.statusText}>{report.status}</Text></View></View>
    <Text style={s.text}>{report.source === 'sms_simulated' ? 'SIMULATED SMS' : 'Community app'} · {report.village} · {report.boundarySection}</Text>
    <Text style={s.text}>{report.landmark} · Event: {new Date(report.occurredAt).toLocaleString()}</Text>
    <Text style={s.text}>{report.description}</Text>
    {!!report.contactPhone && <Text style={s.text}>Contact: {report.contactPhone}</Text>}
    <Text style={s.text}>Reference: {report.id} · Received: {report.receivedAt ? new Date(report.receivedAt).toLocaleString() : 'Awaiting server confirmation'}</Text>
    {report.photoUris?.map((uri) => <Image key={uri} source={{ uri }} style={s.photo} resizeMode="contain" />)}
    <Text style={ui.fieldLabel}>RESPONSE STATUS</Text><View style={s.row}>{(['pending', 'investigating', 'resolved', 'dismissed'] as const).map((value) => <Pressable key={value} style={status === value ? s.button : s.outline} onPress={() => setStatus(value)}><Text style={status === value ? s.buttonText : s.link}>{value}</Text></Pressable>)}</View>
    {report.assignedTo
      ? <Text style={s.text}>Accepted by: {report.assignedName || report.assignedTo}</Text>
      : report.status === 'pending' && <Pressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={accept}><Text style={s.buttonText}>{busy ? 'Please wait…' : 'Accept Operation'}</Text></Pressable>}
    {report.demoAcceptance && <Text style={s.text}>Demo acceptance: saved on this device only. Shared operations assignment is unchanged.</Text>}
    <Text style={ui.fieldLabel}>FOLLOW-UP NOTES</Text><TextInput style={[s.input, { minHeight: 96, textAlignVertical: 'top' }]} accessibilityLabel="Response notes" placeholder="Response / follow-up notes" multiline value={notes} onChangeText={setNotes} />
    <Pressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={save}><Text style={s.buttonText}>{busy ? 'Saving…' : 'Save Response'}</Text></Pressable>
    {!!error && <Text style={s.error}>{error}</Text>}
  </View>;
}

const ui = StyleSheet.create({
  tableFrame: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C5D4C8', borderRadius: 16, overflow: 'hidden' },
  tableIntro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, gap: 12 },
  tableHint: { color: '#63796B', fontSize: 11, paddingHorizontal: 16, paddingBottom: 14 },
  table: { width: 990 },
  tableHead: { flexDirection: 'row', backgroundColor: '#245747', paddingVertical: 15 },
  columnHeading: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', paddingHorizontal: 14 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E4EBE4', minHeight: 80 },
  alternateRow: { backgroundColor: '#F3F6F1' },
  selectedRow: { backgroundColor: '#E0EDDF' },
  cell: { paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  cellTitle: { color: '#243F30', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  cellSecondary: { color: '#63796B', fontSize: 11, lineHeight: 16 },
  tableStatus: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 7, alignSelf: 'flex-start' },
  tableStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  viewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 6 },
  viewButtonText: { color: '#245747', fontSize: 12, fontWeight: '700' },
  screen: { flex: 1, backgroundColor: '#EAF0E9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#245747', padding: 14 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { padding: 24, borderRadius: 20, backgroundColor: '#173D2D', gap: 10 },
  eyebrow: { color: '#D9CE9B', fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  heroText: { color: '#DCE8DE', fontSize: 14, lineHeight: 22 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 18, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', gap: 6 },
  statValue: { color: '#245747', fontSize: 25, fontWeight: '800' },
  statLabel: { color: '#52675A', fontSize: 10, textAlign: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BCCEBF', borderRadius: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 50, color: '#173D2D', fontSize: 13 },
  filters: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BCCDBD' },
  chipSelected: { backgroundColor: '#245747', borderColor: '#245747' },
  chipText: { color: '#435D4D', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  chipTextSelected: { color: '#FFFFFF' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  reportIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E6EFE3', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { backgroundColor: '#EAF0E5', padding: 8, borderRadius: 8 },
  statusText: { color: '#245747', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  fieldLabel: { color: '#52675A', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  patternRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8EEE6' },
  count: { color: '#245747', fontWeight: '800', fontSize: 17 },
});
const s = { ...base, ...StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAF0E9' },
  content: { padding: 18, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: '#173D2D' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C8D8C9', borderRadius: 18, padding: 20, gap: 12 },
  text: { fontSize: 13, lineHeight: 21, color: '#4E6556' },
  title: { fontSize: 17, fontWeight: '700', color: '#173D2D' },
  button: { backgroundColor: '#245747', borderRadius: 12, padding: 14, alignItems: 'center', minHeight: 48 },
  outline: { borderWidth: 1, borderColor: '#B8CBBC', backgroundColor: '#F1F5EF', borderRadius: 12, padding: 12, minHeight: 48 },
  link: { color: '#245747', fontWeight: '700', textTransform: 'capitalize' },
}) };
