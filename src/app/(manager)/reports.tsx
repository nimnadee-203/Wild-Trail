import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { FilterButton, StatCard, StatusPill } from '../../components/manager/ManagerUI';
import { getFirebaseIncidents } from '../../services/api/incidents';
import { ManagerAlert, subscribeToManagerAlerts } from '../../services/managerAlerts';
import { subscribeToScheduledPatrols } from '../../services/scheduledPatrols';
import { ScheduledPatrol } from '../../types/patrol';

type IncidentSummary = { location: string; priority: string; status: string };
type ZoneSummary = { zone: string; incidents: number; highIncidents: number; alerts: number; patrols: number; score: number };
const periods = ['This month', 'Last month'] as const;

function downloadReport(content: string) {
  if (Platform.OS !== 'web') return false;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wildtrail-operational-report.txt';
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

export default function Reports() {
  const [period, setPeriod] = useState<(typeof periods)[number]>('This month');
  const [zone, setZone] = useState('All zones');
  const [alerts, setAlerts] = useState<ManagerAlert[]>([]);
  const [patrols, setPatrols] = useState<ScheduledPatrol[]>([]);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');

  useEffect(() => {
    let active = true;
    getFirebaseIncidents()
      .then((reports) => {
        if (!active) return;
        setIncidents(reports.map((report) => ({
          location: report.location.address || 'Unknown location',
          priority: report.severity,
          status: report.status,
        })));
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load incidents.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => subscribeToScheduledPatrols(setPatrols, (loadError) => setError(loadError.message)), []);
  useEffect(() => subscribeToManagerAlerts(setAlerts, (loadError) => setError(loadError.message)), []);

  const zones = useMemo(() => {
    const names = new Set<string>();
    patrols.forEach((patrol) => names.add(patrol.zone));
    alerts.forEach((alert) => names.add(alert.zone));
    incidents.forEach((incident) => names.add(incident.location));
    return ['All zones', ...Array.from(names).filter(Boolean).sort()];
  }, [alerts, incidents, patrols]);

  const summaries = useMemo<ZoneSummary[]>(() => zones.filter((item) => item !== 'All zones').map((name) => {
    const zoneIncidents = incidents.filter((incident) => incident.location === name);
    const zoneAlerts = alerts.filter((alert) => alert.zone === name && alert.status !== 'Resolved');
    const zonePatrols = patrols.filter((patrol) => patrol.zone === name && patrol.status !== 'cancelled');
    const highIncidents = zoneIncidents.filter((incident) => incident.priority.toLowerCase() === 'high').length;
    return { zone: name, incidents: zoneIncidents.length, highIncidents, alerts: zoneAlerts.length, patrols: zonePatrols.length, score: highIncidents * 3 + zoneAlerts.length * 2 + zoneIncidents.length };
  }).sort((left, right) => right.score - left.score), [alerts, incidents, patrols, zones]);

  const visibleSummaries = zone === 'All zones' ? summaries : summaries.filter((item) => item.zone === zone);
  const priorityZone = visibleSummaries[0];
  const activeAlerts = alerts.filter((alert) => alert.status !== 'Resolved').length;
  const highIncidents = incidents.filter((incident) => incident.priority.toLowerCase() === 'high').length;
  const staffedPatrols = patrols.filter((patrol) => patrol.rangerId || patrol.rangerName).length;
  const coverage = patrols.length ? Math.round((staffedPatrols / patrols.length) * 100) : 0;
  const increasePatrols = priorityZone ? priorityZone.score >= Math.max(3, priorityZone.patrols * 2) : false;
  const reportText = priorityZone
    ? `WildTrail operational report\nPeriod: ${period}\nZone: ${zone}\n\nPriority zone: ${priorityZone.zone}\nDecision: ${increasePatrols ? 'Increase patrol coverage' : 'Maintain current patrol coverage'}\nIncidents: ${priorityZone.incidents} (${priorityZone.highIncidents} high priority)\nActive alerts: ${priorityZone.alerts}\nScheduled patrols: ${priorityZone.patrols}\n\nGenerated: ${new Date().toLocaleString()}`
    : `WildTrail operational report\nPeriod: ${period}\nZone: ${zone}\n\nNo operational data is available for this selection.`;

  const generateReport = () => {
    setGeneratedAt(new Date().toLocaleString());
    if (downloadReport(reportText)) return;
    Alert.alert('Report generated', reportText);
  };

  return (
    <ManagerShell active="reports">
      <View style={styles.titleRow}><View><Text style={managerStyles.pageTitle}>Reports & analytics</Text><Text style={managerStyles.pageSubtitle}>Compare activity across operations and turn signals into patrol decisions.</Text></View><Pressable style={styles.primary} onPress={generateReport}><Ionicons name="download-outline" size={17} color="#FFF" /><Text style={styles.primaryText}>Generate report</Text></Pressable></View>
      <View style={styles.filters}><FilterButton label={period} selected onPress={() => setPeriod(period === periods[0] ? periods[1] : periods[0])} /><FilterButton label={zone} onPress={() => setZone(zone === 'All zones' ? zones[1] || 'All zones' : 'All zones')} /><FilterButton label="Operational view" selected /></View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#2B8263" style={styles.loading} /> : null}
      <View style={styles.stats}><StatCard icon="walk-outline" label="Patrol coverage" value={`${coverage}%`} change={`${staffedPatrols} staffed`} tone="#4D84A8" /><StatCard icon="notifications-outline" label="Active alerts" value={String(activeAlerts)} change="Needs attention" tone="#D35F50" /><StatCard icon="warning-outline" label="High priority incidents" value={String(highIncidents)} change="Review hotspots" tone="#C98A2E" /></View>
      <View style={[managerStyles.card, styles.recommendation]}><View style={styles.recommendationIcon}><Ionicons name="compass-outline" size={22} color="#2B8263" /></View><View style={styles.recommendationCopy}><Text style={managerStyles.cardTitle}>Decision focus</Text><Text style={managerStyles.cardMuted}>{priorityZone ? `${priorityZone.zone} has the strongest combined incident and alert signal.` : 'Select a zone with operational data to see a recommendation.'}</Text></View><StatusPill value={increasePatrols ? 'Increase patrols' : 'Monitor'} /></View>
      <View style={[managerStyles.card, styles.comparisonCard]}><View style={managerStyles.sectionRow}><View><Text style={managerStyles.cardTitle}>Zone comparison</Text><Text style={managerStyles.cardMuted}>Compare risk signals against patrol coverage.</Text></View><Text style={managerStyles.link}>{period}</Text></View><View style={styles.tableHead}><Text style={[styles.head, { flex: 1.5 }]}>Zone</Text><Text style={styles.head}>Incidents</Text><Text style={styles.head}>Alerts</Text><Text style={styles.head}>Patrols</Text><Text style={styles.head}>Decision</Text></View>{visibleSummaries.length === 0 ? <Text style={styles.empty}>No comparison data found.</Text> : visibleSummaries.map((item) => { const needsPatrols = item.score >= Math.max(3, item.patrols * 2); return <View style={[styles.row, needsPatrols && styles.priorityRow]} key={item.zone}><View style={{ flex: 1.5 }}><Text style={styles.zoneName}>{item.zone}</Text><Text style={managerStyles.cardMuted}>Risk score {item.score}</Text></View><Text style={styles.cell}>{item.incidents}{item.highIncidents ? ` · ${item.highIncidents} high` : ''}</Text><Text style={styles.cell}>{item.alerts}</Text><Text style={styles.cell}>{item.patrols}</Text><View style={styles.decision}><StatusPill value={needsPatrols ? 'Increase patrols' : 'Covered'} /></View></View>; })}</View>
      {generatedAt ? <View style={styles.generated}><Ionicons name="checkmark-circle-outline" size={17} color="#2B8263" /><Text style={styles.generatedText}>Report generated {generatedAt}</Text></View> : null}
    </ManagerShell>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, primary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2B8263', borderRadius: 8, paddingHorizontal: 13, height: 38 }, primaryText: { color: '#FFF', fontSize: 12, fontWeight: '700' }, filters: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 }, loading: { marginBottom: 16 }, error: { color: '#B33F32', fontSize: 12, marginBottom: 14 }, recommendation: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, borderColor: '#D8EAE0' }, recommendationIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#E5F2EC', alignItems: 'center', justifyContent: 'center' }, recommendationCopy: { flex: 1 }, comparisonCard: { marginBottom: 18 }, tableHead: { flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E8EFEB', paddingBottom: 11, marginTop: 16 }, head: { flex: 1, color: '#8A9992', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#EFF3F0', paddingVertical: 14 }, priorityRow: { backgroundColor: '#FFF9F7' }, zoneName: { color: '#234138', fontSize: 12, fontWeight: '700' }, cell: { flex: 1, color: '#53655D', fontSize: 12 }, decision: { flex: 1 }, empty: { color: '#71817A', paddingVertical: 24, textAlign: 'center' }, generated: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }, generatedText: { color: '#2B8263', fontSize: 12, fontWeight: '700' },
});