import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { FilterButton, StatusPill } from '../../components/manager/ManagerUI';
import { getFirebaseIncidents } from '../../services/api/incidents';

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Incidents() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All incidents');
  const [incidentData, setIncidentData] = useState<
    { id: string; type: string; location: string; reporter: string; priority: string; status: string; date: string }[]
  >([]);

  useEffect(() => {
    getFirebaseIncidents()
      .then((reports) =>
        setIncidentData(
          reports.map((report) => ({
            id: report.id,
            type: report.title,
            location:
              report.location.address ??
              (typeof report.location.latitude === 'number' && typeof report.location.longitude === 'number'
                ? `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}` : 'Location not provided'),
            reporter: report.reporterName ?? report.reporterId,
            priority: report.severity,
            status: formatStatus(report.status),
            date: new Date(report.createdAt).toLocaleDateString(),
          }))
        )
      )
      .catch((error) => {
        Alert.alert('Unable to load incidents', error instanceof Error ? error.message : 'Please try again.');
      });
  }, []);

  const filtered = useMemo(
    () =>
      incidentData.filter(
        (i) =>
          (filter === 'All incidents' || i.status === filter) &&
          `${i.type} ${i.location} ${i.id}`.toLowerCase().includes(query.toLowerCase())
      ),
    [filter, incidentData, query]
  );
  return <ManagerShell active="incidents"><Text style={managerStyles.pageTitle}>Incidents & community</Text><Text style={managerStyles.pageSubtitle}>Manage reported incidents and follow up with community members.</Text><View style={styles.toolbar}><View style={styles.search}><Ionicons name="search-outline" size={17} color="#8A9992" /><TextInput value={query} onChangeText={setQuery} placeholder="Search incidents..." placeholderTextColor="#9BA8A2" style={styles.input} /></View><View style={styles.filters}><FilterButton label="All incidents" selected={filter === 'All incidents'} onPress={() => setFilter('All incidents')} /><FilterButton label="Investigating" selected={filter === 'Investigating'} onPress={() => setFilter('Investigating')} /><FilterButton label="Resolved" selected={filter === 'Resolved'} onPress={() => setFilter('Resolved')} /></View></View><View style={managerStyles.card}><View style={styles.tableHead}><Text style={[styles.head, { flex: 1.6 }]}>Incident</Text><Text style={styles.head}>Reporter</Text><Text style={styles.head}>Location</Text><Text style={styles.head}>Priority</Text><Text style={styles.head}>Status</Text><Text style={styles.head}> </Text></View>{filtered.map((item) => <Pressable key={item.id} style={styles.row} onPress={() => Alert.alert(item.id, `${item.type}\n${item.location}\nReported by ${item.reporter}`)}><View style={{ flex: 1.6 }}><Text style={styles.title}>{item.type}</Text><Text style={managerStyles.cardMuted}>{item.id} · {item.date}</Text></View><Text style={styles.cell}>{item.reporter}</Text><Text style={styles.cell}>{item.location}</Text><View style={{ flex: 1 }}><StatusPill value={item.priority} /></View><View style={{ flex: 1 }}><StatusPill value={item.status} /></View><Ionicons name="chevron-forward" size={17} color="#8A9992" /></Pressable>)}</View></ManagerShell>;
}
const styles = StyleSheet.create({ toolbar: { gap: 12, marginBottom: 18 }, search: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 8, height: 38, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, maxWidth: 340 }, input: { flex: 1, marginLeft: 8, color: '#234138', fontSize: 12 }, filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, tableHead: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E8EFEB', paddingBottom: 11 }, head: { flex: 1, color: '#8A9992', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#EFF3F0', paddingVertical: 15 }, title: { color: '#234138', fontSize: 12, fontWeight: '700', marginBottom: 3 }, cell: { flex: 1, color: '#53655D', fontSize: 12 } });
