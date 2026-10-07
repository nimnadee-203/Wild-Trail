import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { managerStyles } from './ManagerShell';

export function StatCard({ icon, label, value, change, tone = '#2B8263' }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; change: string; tone?: string }) {
  return <View style={[managerStyles.card, styles.stat]}><View style={[styles.statIcon, { backgroundColor: `${tone}16` }]}><Ionicons name={icon} size={20} color={tone} /></View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text><Text style={[styles.change, { color: change.startsWith('-') ? '#D35F50' : '#2B8263' }]}>{change} <Text style={styles.changeMuted}>vs last week</Text></Text></View>;
}

export function StatusPill({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const color = lower.includes('high') || lower.includes('active') || lower.includes('unassigned') || lower.includes('assigned') ? '#D35F50' : lower.includes('medium') || lower.includes('investig') || lower.includes('break') || lower.includes('review') ? '#C98A2E' : '#2B8263';
  return <View style={[styles.pill, { backgroundColor: `${color}18` }]}><View style={[styles.pillDot, { backgroundColor: color }]} /><Text style={[styles.pillText, { color }]}>{value}</Text></View>;
}

export function FilterButton({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filter, selected && styles.filterSelected]}><Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text><Ionicons name="chevron-down" size={14} color={selected ? '#FFFFFF' : '#71817A'} /></Pressable>;
}

export const managerUIStyles = StyleSheet.create({
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8EFEB' },
  tableHeaderText: { color: '#8A9992', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
});

const styles = StyleSheet.create({
  stat: { flex: 1, minWidth: 150, padding: 16, margin: 0 }, statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }, statLabel: { color: '#71817A', fontSize: 12 }, statValue: { color: '#17342B', fontSize: 25, fontWeight: '800', marginTop: 4 }, change: { fontSize: 11, fontWeight: '700', marginTop: 7 }, changeMuted: { color: '#9BA8A2', fontWeight: '400' },
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, gap: 5 }, pillDot: { width: 6, height: 6, borderRadius: 3 }, pillText: { fontSize: 11, fontWeight: '700' },
  filter: { borderWidth: 1, borderColor: '#DCE7E1', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 11, height: 36, flexDirection: 'row', alignItems: 'center', gap: 7 }, filterSelected: { backgroundColor: '#2B8263', borderColor: '#2B8263' }, filterText: { color: '#53655D', fontSize: 12, fontWeight: '600' }, filterTextSelected: { color: '#FFFFFF' },
});
