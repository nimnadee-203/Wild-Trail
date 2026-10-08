import React from 'react';
import { useStaffProfile } from '../../hooks/useStaffProfile';
import { WildTrailBrand } from '../../components/WildTrailBrand';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { StatCard, StatusPill } from '../../components/manager/ManagerUI';
import { alerts, patrols } from '../../components/manager/data';
import { router } from 'expo-router';

export default function ManagerOverview() {
  const profile = useStaffProfile();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const parkName = profile?.parkId ? profile.parkId.replace(/[-_]/g, ' ') : 'Park operations';
  return <ManagerShell active="overview"><View style={styles.hero}>
      <Image source={require('../../../assets/images/wildlife/elephant.jpg')} style={styles.heroImage} accessibilityLabel="Elephant in its natural habitat" />
      <View style={styles.heroShade} />
      <View style={styles.heroContent}>
        <WildTrailBrand light title="DEPARTMENT OF WILDLIFE CONSERVATION" />
        <Text style={styles.heroEyebrow}>PARK MANAGER WORKSPACE</Text>
        <Text style={styles.heroTitle}>Welcome, {profile?.name || 'Park Manager'}</Text>
        <Text style={styles.heroDescription}>Protecting wildlife. Supporting your field teams.</Text>
        <View style={styles.heroMeta}><Ionicons name="location-outline" size={16} color="#E2ECE1" /><Text style={styles.heroMetaText}>{parkName}</Text></View>
        <Text style={styles.heroDate}>{today}</Text>
      </View>
    </View>
    <View style={styles.sectionHeading}><View style={{ flex: 1 }}><Text style={managerStyles.pageTitle}>Park overview</Text><Text style={styles.sectionSubtitle}>Your teams, alerts and field operations at a glance.</Text></View><View style={styles.overviewIcon}><Ionicons name="shield-checkmark-outline" size={24} color="#245747" /></View></View>

    <View style={styles.stats}><StatCard icon="people-outline" label="Rangers on duty" value="24 / 32" change="+8.2%" /><StatCard icon="notifications-outline" label="Active alerts" value="03" change="-12.5%" tone="#D35F50" /><StatCard icon="walk-outline" label="Patrol coverage" value="78%" change="+5.4%" tone="#4D84A8" /><StatCard icon="shield-checkmark-outline" label="Incidents this month" value="18" change="-6.1%" tone="#C98A2E" /></View>
    <View style={styles.grid}><View style={[managerStyles.card, styles.wide, compact && styles.fullWidth]}><View style={managerStyles.sectionRow}><View><Text style={managerStyles.cardTitle}>Park activity</Text><Text style={managerStyles.cardMuted}>Patrol coverage and alerts over the last 7 days</Text></View><Pressable style={styles.week}><Text style={styles.weekText}>This week</Text><Ionicons name="chevron-down" size={13} color="#71817A" /></Pressable></View><View style={styles.chartLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2D8060' }]} /><Text style={styles.legendText}>Patrol coverage</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#D79B81' }]} /><Text style={styles.legendText}>Alerts</Text></View></View><View style={styles.chart}><View style={styles.yAxis}><Text style={styles.yAxisText}>100%</Text><Text style={styles.yAxisText}>75%</Text><Text style={styles.yAxisText}>50%</Text><Text style={styles.yAxisText}>25%</Text><Text style={styles.yAxisText}>0%</Text></View><View style={styles.chartBody}><View style={styles.gridLines}>{[0, 1, 2, 3].map((i) => <View key={i} style={styles.gridLine} />)}</View><View style={styles.bars}>{[58, 73, 54, 80, 68, 87, 76].map((height, i) => <View key={i} style={styles.barGroup}><View style={[styles.bar, { height: `${height}%` }]} /><View style={[styles.alertBar, { height: `${Math.max(12, height - 45)}%` }]} /><Text style={styles.day}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</Text></View>)}</View></View></View></View></View>
    <View style={styles.grid}><View style={[managerStyles.card, styles.half, compact && styles.fullWidth]}><View style={managerStyles.sectionRow}><Text style={managerStyles.cardTitle}>Priority alerts</Text><Pressable onPress={() => router.push('/(manager)/alerts' as never)}><Text style={managerStyles.link}>View all</Text></Pressable></View>{alerts.slice(0, 3).map((alert) => <Pressable style={styles.listRow} key={alert.id} onPress={() => router.push({ pathname: '/(manager)/alerts', params: { alertId: alert.firestoreId } } as never)} accessibilityRole="button" accessibilityLabel={`View details for ${alert.title}`}><View style={styles.alertIcon}><Ionicons name="warning-outline" size={16} color="#D35F50" /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{alert.title}</Text><Text style={managerStyles.cardMuted}>{alert.zone} · {alert.time}</Text></View><StatusPill value={alert.severity} /><Ionicons name="chevron-forward" size={16} color="#8A9992" /></Pressable>)}</View><View style={[managerStyles.card, styles.half, compact && styles.fullWidth]}><View style={managerStyles.sectionRow}><Text style={managerStyles.cardTitle}>Patrol teams</Text><Pressable onPress={() => router.push('/(manager)/patrols' as never)}><Text style={managerStyles.link}>Manage</Text></Pressable></View>{patrols.slice(0, 3).map((patrol) => <View style={styles.listRow} key={patrol.name}><View style={styles.teamAvatar}><Text style={styles.teamInitial}>{patrol.name[0]}</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{patrol.name}</Text><Text style={managerStyles.cardMuted}>{patrol.ranger} · {patrol.zone}</Text></View><StatusPill value={patrol.status} /></View>)}</View></View>
  </ManagerShell>;
}
const styles = StyleSheet.create({
  hero: { backgroundColor: '#173D2D', borderRadius: 24, overflow: 'hidden', marginBottom: 26 },
  heroImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 38, 27, 0.76)' },
  heroContent: { padding: 24, gap: 10 },
  heroEyebrow: { color: '#D9CE9B', fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginTop: 16 },
  heroTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', lineHeight: 36 },
  heroDescription: { color: '#E2ECE1', fontSize: 14, lineHeight: 22 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  heroMetaText: { color: '#FFFFFF', fontSize: 13, textTransform: 'capitalize', fontWeight: '600' },
  heroDate: { color: '#D0DED3', fontSize: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionSubtitle: { color: '#52675A', fontSize: 13, lineHeight: 20 },
  overviewIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DDEBDD', alignItems: 'center', justifyContent: 'center' },
  communityCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: '#E6EFE3', borderWidth: 1, borderColor: '#C8DBC9', borderRadius: 18, marginBottom: 20 },
  communityIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#245747', alignItems: 'center', justifyContent: 'center' },
  communityTitle: { color: '#173D2D', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  communityDescription: { color: '#4E6556', fontSize: 12, lineHeight: 19, marginTop: 4 },
  fullWidth: { minWidth: 0, flexBasis: '100%' },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#52675A', fontSize: 11 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 18 }, wide: { flex: 1, minWidth: 480 }, half: { flex: 1, minWidth: 320 }, week: { borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 7, height: 32, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8 }, weekText: { fontSize: 11, color: '#53655D' }, chart: { height: 190, flexDirection: 'row', marginTop: 12 }, yAxis: { justifyContent: 'space-between', paddingBottom: 22, width: 35 }, yAxisText: { fontSize: 9, color: '#63796B' }, chartBody: { flex: 1, position: 'relative' }, gridLines: { ...StyleSheet.absoluteFill, justifyContent: 'space-around', paddingBottom: 22 }, gridLine: { borderTopWidth: 1, borderColor: '#EDF2EF' }, bars: { height: '100%', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: 4 }, barGroup: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', gap: 2 }, bar: { width: 9, maxHeight: '80%', backgroundColor: '#2D8060', borderRadius: 4 }, alertBar: { width: 9, maxHeight: '45%', backgroundColor: '#D79B81', borderRadius: 4 }, day: { position: 'absolute', bottom: 0, fontSize: 9, color: '#63796B' }, listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EFF3F0' }, alertIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FCEDEA', alignItems: 'center', justifyContent: 'center' }, rowTitle: { color: '#234138', fontSize: 14, fontWeight: '700', marginBottom: 4 }, teamAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#DDECE5', alignItems: 'center', justifyContent: 'center' }, teamInitial: { color: '#2B8263', fontWeight: '800' } });
