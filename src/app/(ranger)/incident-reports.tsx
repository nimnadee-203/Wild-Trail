import { WildTrailBrand } from '../../components/WildTrailBrand';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRangerIncidents } from '../../services/api/incidents';
import { IncidentReport, IncidentStatus, IncidentSeverity } from '../../types/incident';
import { formatCoordinates } from '../../utils/formatting';
import { RangerIncidentOfflinePanel } from '../../components/RangerIncidentOfflinePanel';
import { getRangerIncidentQueue, isRangerIncidentOnline, subscribeRangerIncidentQueue } from '../../services/rangerIncidentQueue';

const STATUS: Record<IncidentStatus, { label: string; color: string; background: string }> = {
  pending: { label: 'Pending', color: '#94611B', background: '#FCF0D9' },
  investigating: { label: 'Investigating', color: '#286487', background: '#E8F2F8' },
  resolved: { label: 'Resolved', color: '#327257', background: '#E9F4EC' },
  dismissed: { label: 'Dismissed', color: '#69746F', background: '#EFF1EF' },
};
const PRIORITY: Record<IncidentSeverity, { color: string; background: string }> = {
  low: { color: '#245747', background: '#E5F0E8' },
  medium: { color: '#795000', background: '#FFF1C7' },
  high: { color: '#9B3911', background: '#FFE5D5' },
  critical: { color: '#A51D30', background: '#FFE1E7' },
};
type StatusFilter = 'all' | IncidentStatus;
type PriorityFilter = 'all' | 'high';
const dateLabel = (value: string) => Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  : 'Date unavailable';
const locationLabel = (report: IncidentReport) => report.location?.address
  || formatCoordinates(report.location?.latitude, report.location?.longitude);
const newReport = () => router.push('/(ranger)/report-incident');

export default function IncidentReportsScreen() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [oldestFirst, setOldestFirst] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(undefined);
    if (!isRangerIncidentOnline()) { setLoading(false); return; }
    try {
      const data = await getRangerIncidents();
      if (id === requestId.current) setReports(data);
    } catch (failure) {
      if (id === requestId.current) setError(failure instanceof Error ? failure.message : 'Unable to load your reports.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    let wasOnline = isRangerIncidentOnline();
    let syncedReferences = '';
    const unsubscribe = subscribeRangerIncidentQueue(() => {
      void getRangerIncidentQueue().then(entries => {
        if (!active) return;
        const online = isRangerIncidentOnline();
        const references = entries.filter(entry => entry.syncStatus === 'synced').map(entry => entry.id).join(',');
        if (online && (!wasOnline || references !== syncedReferences)) void load();
        wasOnline = online;
        syncedReferences = references;
      }).catch(() => undefined);
    });
    return () => { active = false; unsubscribe(); };
  }, [load]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current++; };
  }, [load]));

  const counts = useMemo(() => ({
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }), [reports]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter(report =>
      (statusFilter === 'all' || report.status === statusFilter)
      && (priority === 'all' || ['high', 'critical'].includes(report.severity))
      && (!term || [report.title, report.description, report.id, report.category.replace(/_/g, ' '), locationLabel(report)]
        .some(value => value.toLowerCase().includes(term)))
    ).sort((a, b) => (oldestFirst ? 1 : -1) * ((Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0)));
  }, [reports, search, statusFilter, priority, oldestFirst]);
  const hasFilters = !!search.trim() || statusFilter !== 'all' || priority !== 'all';
  const reset = () => { setSearch(''); setStatusFilter('all'); setPriority('all'); };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Pressable style={s.iconButton} onPress={() => router.replace('/(ranger)/dashboard')} accessibilityRole="button" accessibilityLabel="Back to dashboard">
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={s.grow}><WildTrailBrand light title="Ranger workspace" /></View>
        <Pressable style={s.iconButton} onPress={() => void load()} disabled={loading} accessibilityRole="button" accessibilityLabel="Refresh reports">
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="refresh-outline" size={21} color="#FFFFFF" />}
        </Pressable>
      </View>
      <FlatList
        data={filtered}
        extraData={expandedId}
        keyExtractor={item => item.id}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        refreshing={loading}
        onRefresh={load}
        initialNumToRender={8}
        ListHeaderComponent={<View>
          <Text style={s.eyebrow}>FIELD ACTIVITY</Text>
          <Text style={s.heading}>My incidents</Text>
          <Text style={s.subtitle}>Your observations, reports and response progress.</Text>
          <RangerIncidentOfflinePanel />
          <Pressable
            style={[s.primary, s.emergency]}
            onPress={() => router.push({ pathname: '/(ranger)/report-incident', params: { emergency: 'true' } })}
            accessibilityRole="button"
            accessibilityLabel="Emergency report"
            accessibilityHint="Open a quick report with Critical priority"
          >
            <Ionicons name="warning" size={24} color="#FFFFFF" /><Text style={s.primaryText}>Emergency report</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable style={s.primary} onPress={newReport} accessibilityRole="button">
            <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" /><Text style={s.primaryText}>Report an incident</Text><Ionicons name="arrow-forward" size={18} color="#D0DFD4" />
          </Pressable>
          <View style={s.stats}>
            {([
              { label: 'Total reports', value: counts.all },
              { label: 'Open', value: counts.pending + counts.investigating },
              { label: 'Resolved', value: counts.resolved },
            ] as const).map((stat, index) => <View key={stat.label} style={[s.stat, index > 0 && s.statBorder]}>
              <Text style={[s.statValue, index === 1 && { color: '#F6CF78' }]}>{loading && !reports.length ? '—' : stat.value}</Text><Text style={s.statLabel}>{stat.label}</Text>
            </View>)}
          </View>
          <View style={s.search}>
            <Ionicons name="search-outline" size={20} color="#7A8981" />
            <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search title, location or report ID" placeholderTextColor="#839087" accessibilityLabel="Search incident reports" autoCorrect={false} returnKeyType="search" />
            {!!search && <Pressable style={s.clear} onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search"><Ionicons name="close-circle" size={19} color="#7A8981" /></Pressable>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map(value => <Pressable key={value} style={[s.chip, statusFilter === value && s.chipSelected]} onPress={() => setStatusFilter(value)} accessibilityRole="button" accessibilityState={{ selected: statusFilter === value }}>
              <Text style={[s.chipText, statusFilter === value && s.chipTextSelected]}>{value === 'all' ? 'All reports' : STATUS[value].label} · {counts[value]}</Text>
            </Pressable>)}
          </ScrollView>
          <View style={s.toolbar}>
            <Pressable style={[s.priority, priority === 'high' && s.prioritySelected]} onPress={() => setPriority(current => current === 'all' ? 'high' : 'all')} accessibilityRole="button" accessibilityState={{ selected: priority === 'high' }}>
              <Ionicons name="flag-outline" size={15} color={priority === 'high' ? '#A44F38' : '#687B70'} /><Text style={s.secondaryText}>High & critical</Text>
            </Pressable>
            <Pressable style={s.sort} onPress={() => setOldestFirst(value => !value)} accessibilityRole="button" accessibilityLabel={`Sort ${oldestFirst ? 'newest' : 'oldest'} first`}>
              <Ionicons name="swap-vertical" size={15} color="#687B70" /><Text style={s.secondaryText}>{oldestFirst ? 'Oldest first' : 'Newest first'}</Text>
            </Pressable>
          </View>
          {!!error && <View style={s.error}><Text style={s.errorText}>{reports.length ? 'Could not refresh. Showing previously loaded reports.' : error}</Text><Pressable onPress={() => void load()} accessibilityRole="button" style={s.clear}><Text style={s.link}>Try again</Text></Pressable></View>}
          <View style={s.results}><Text style={s.resultsText}>{filtered.length} {filtered.length === 1 ? 'report' : 'reports'}{hasFilters ? ' found' : ''}</Text>{hasFilters ? <Pressable onPress={reset} style={s.clear} accessibilityRole="button"><Text style={s.link}>Reset filters</Text></Pressable> : <Text style={s.hint}>Pull down to refresh</Text>}</View>
        </View>}
        ListEmptyComponent={<View style={s.empty}>
          {loading ? <ActivityIndicator size="large" color="#245747" /> : <>
            <View style={s.emptyIcon}><Ionicons name={error ? 'cloud-offline-outline' : hasFilters ? 'search-outline' : 'documents-outline'} size={30} color="#52735F" /></View>
            <Text style={s.cardTitle}>{error ? 'Reports unavailable' : hasFilters ? 'No matching incidents' : 'Your field record starts here'}</Text>
            <Text style={s.emptyText}>{error ? 'Check your connection and try refreshing.' : hasFilters ? 'Try another keyword or reset the filters to see all reports.' : 'Submit your first incident to track its progress here.'}</Text>
            <Pressable onPress={error ? () => void load() : hasFilters ? reset : newReport} style={s.emptyAction} accessibilityRole="button"><Text style={s.link}>{error ? 'Retry' : hasFilters ? 'Reset filters' : 'Report an incident'}</Text></Pressable>
          </>}
        </View>}
        renderItem={({ item }) => {
          const status = STATUS[item.status] ?? STATUS.pending;
          const expanded = expandedId === item.id;
          const urgency = PRIORITY[item.severity] ?? PRIORITY.medium;
          const high = ['high', 'critical'].includes(item.severity);
          return <View style={[s.card, { borderLeftColor: urgency.color }]}>
            <View style={s.cardTop}><View style={[s.categoryIcon, high && { backgroundColor: '#FCF0EA' }]}><Ionicons name={high ? 'warning-outline' : 'document-text-outline'} size={22} color={high ? '#AD5C41' : '#52735F'} /></View><View style={s.grow}><Text style={s.category}>{item.category.replace(/_/g, ' ')}</Text><Text style={s.cardTitle}>{item.title}</Text></View></View>
            <View style={s.badges}><View style={[s.badge, { backgroundColor: status.background }]}><View style={[s.dot, { backgroundColor: status.color }]} /><Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text></View><View style={[s.badge, { backgroundColor: urgency.background }]}><Ionicons name="flag" size={12} color={urgency.color} /><Text style={[s.severity, { color: urgency.color }]}>{item.severity} priority</Text></View></View>
            <Text style={s.description} numberOfLines={expanded ? undefined : 2}>{item.description}</Text>
            <View style={s.metaRow}><Ionicons name="location-outline" size={15} color="#7A8981" /><Text style={s.meta} numberOfLines={expanded ? undefined : 1}>{locationLabel(item)}</Text></View>
            <View style={s.metaRow}><Ionicons name="calendar-outline" size={15} color="#7A8981" /><Text style={s.meta}>Reported {dateLabel(item.createdAt)}</Text></View>
            {expanded && <View style={s.details}><Text style={s.detailLabel}>REPORT REFERENCE</Text><Text selectable style={s.reference}>{item.id}</Text><Text style={s.meta}>Last updated {dateLabel(item.updatedAt)}</Text>{item.photoUris?.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={s.photo} resizeMode="contain" accessibilityLabel={`Incident attachment ${index + 1}`} />)}</View>}
            <View style={s.cardFooter}><View style={s.metaRow}><Ionicons name="attach-outline" size={15} color="#7A8981" /><Text style={s.hint}>{item.photoUris?.length ?? 0} attachments</Text></View><Pressable style={s.detailButton} onPress={() => setExpandedId(expanded ? null : item.id)} accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${expanded ? 'Hide' : 'View'} details for ${item.title}`}><Text style={s.link}>{expanded ? 'Hide details' : 'View details'}</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#245747" /></Pressable></View>
          </View>;
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8EEE8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#245747', backgroundColor: '#245747' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: '#3E614D', fontWeight: '700', marginTop: 4 },
  heading: { fontSize: 30, fontWeight: '700', letterSpacing: -0.8, color: '#193D30', marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#4C6053', marginTop: 7, marginBottom: 20 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#245747', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, minHeight: 50 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flex: 1 },
  emergency: { backgroundColor: '#B42332', minHeight: 56, marginBottom: 12 },
  stats: { flexDirection: 'row', borderWidth: 1, borderColor: '#173D2D', borderRadius: 18, backgroundColor: '#173D2D', paddingVertical: 18, marginVertical: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statBorder: { borderLeftWidth: 1, borderColor: '#476451' },
  statValue: { fontSize: 25, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { color: '#DCE8DE', fontSize: 11 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, borderRadius: 12, borderWidth: 1, borderColor: '#AABBAD', backgroundColor: '#FFFFFF', minHeight: 50 },
  searchInput: { flex: 1, fontSize: 13, color: '#304C3D', paddingVertical: 14, minWidth: 0 },
  clear: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingVertical: 14 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: '#B8C7BA', borderRadius: 22, backgroundColor: '#FFFFFF' },
  chipSelected: { backgroundColor: '#245747', borderColor: '#245747' },
  chipText: { color: '#435D4D', fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  priority: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EDF1E9' },
  prioritySelected: { backgroundColor: '#F9E6DC' },
  secondaryText: { fontSize: 12, fontWeight: '500', color: '#536B5C' },
  sort: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 44, paddingHorizontal: 4 },
  results: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 54 },
  resultsText: { fontSize: 13, fontWeight: '700', color: '#415C49' },
  hint: { fontSize: 11, color: '#52675A' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BDCCBF', borderLeftWidth: 4, borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: '#173D2D', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4EB' },
  category: { color: '#52675A', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#304C3D', lineHeight: 22 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  severity: { fontSize: 11, fontWeight: '700', color: '#52675A', textTransform: 'capitalize' },
  description: { color: '#435D4D', fontSize: 13, lineHeight: 21, marginVertical: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  meta: { fontSize: 12, lineHeight: 18, color: '#52675A', flexShrink: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#EDF0E9', marginTop: 12, paddingTop: 6 },
  detailButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingLeft: 10 },
  link: { fontSize: 12, color: '#245747', fontWeight: '700' },
  details: { marginTop: 16, gap: 8, padding: 14, borderRadius: 12, backgroundColor: '#F0F4EF' },
  detailLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#52675A' },
  reference: { fontSize: 12, color: '#415C49' },
  photo: { width: '100%', height: 210, backgroundColor: '#E8EEE8', borderRadius: 10 },
  empty: { paddingVertical: 38, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#EAF0E5', alignItems: 'center', justifyContent: 'center' },
  emptyText: { maxWidth: 280, textAlign: 'center', color: '#4C6053', fontSize: 13, lineHeight: 21 },
  emptyAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
  error: { marginTop: 12, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 10 },
  errorText: { color: '#A14436', fontSize: 12, lineHeight: 18 },
});
