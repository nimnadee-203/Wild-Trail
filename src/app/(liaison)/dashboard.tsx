import React, { useCallback, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { watchCommunityReports } from '../../services/communityReports';
import { COMMUNITY_REPORT_TYPES, CommunityReport } from '../../types/community';
import { StaffUser } from '../../types/user';
import { storageService } from '../../storage/asyncStorage';
import { STORAGE_KEYS } from '../../storage/keys';

export default function LiaisonDashboardScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StaffUser | null>(null);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoaded(false); setError('');
    void storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE).then((value) => { if (active) setProfile(value); });
    const unsubscribe = watchCommunityReports((items) => { if (active) { setReports(items); setLoaded(true); } }, () => {
      if (active) { setReports([]); setLoaded(true); setError('Community reports could not be loaded. Check your connection and account access.'); }
    });
    return () => { active = false; unsubscribe(); };
  }, []));

  const logout = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await signOut(auth);
      const cleared = await storageService.removeItem(STORAGE_KEYS.USER_PROFILE);
      if (!cleared) throw new Error('Unable to clear the staff session. Please try again.');
      await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      router.replace('/(auth)/login');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to sign out.'); }
    finally { setLeaving(false); }
  };
  const simulateWarning = () => {
    const message = 'Simulate a community warning? No SMS or siren will be sent.';
    if (Platform.OS === 'web') { if (window.confirm(message)) setBroadcastSent(true); }
    else Alert.alert('Demo community warning', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Run simulation', onPress: () => setBroadcastSent(true) }]);
  };
  const pending = reports.filter((report) => report.status === 'pending').length;
  const responding = reports.filter((report) => report.status === 'investigating').length;
  const resolved = reports.filter((report) => report.status === 'resolved').length;
  const count = (value: number) => !loaded || error ? '—' : String(value).padStart(2, '0');
  const openOperations = () => router.push('/community-operations');

  return <SafeAreaView style={s.screen}>
    <View style={s.topbar}>
      <View style={s.brand}><Image source={require('../../../assets/images/WildTrailLogo.jpg')} style={s.logo} resizeMode="contain" accessibilityLabel="WildTrail logo" /><View><Text style={s.brandName}>WildTrail</Text><Text style={s.brandCaption}>COMMUNITY LIAISON</Text></View></View>
      <Pressable disabled={leaving} accessibilityRole="button" accessibilityLabel="Sign out" onPress={logout} style={s.logout}><Ionicons name="log-out-outline" size={22} color="#245747" /></Pressable>
    </View>
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        <View style={s.intro}><Text style={s.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text><Text style={s.heading}>Hello, {profile?.name.split(' ')[0] || 'Liaison Officer'}</Text><Text style={s.subtitle}>Keep communities informed and coordinate wildlife conflict response.</Text></View>
        <View style={s.sector}><View style={s.sectorIcon}><Ionicons name="location-outline" size={22} color="#DCE9CA" /></View><View style={{ flex: 1 }}><Text style={s.sectorLabel}>YOUR RESPONSE AREA</Text><Text style={s.sectorTitle}>{profile?.parkId ? profile.parkId.replace(/-/g, ' ').toUpperCase() : 'Community boundary area'}</Text><Text style={s.sectorSubtitle}>{profile?.zoneId?.replace(/-/g, ' ') || 'Community liaison operations'}</Text></View><Ionicons name="people-outline" size={30} color="#A9C5B3" /></View>
        <View style={s.stats}>{[{ label: 'Awaiting response', value: pending, color: '#A16B24' }, { label: 'In progress', value: responding, color: '#3B7563' }, { label: 'Resolved', value: resolved, color: '#5D7663' }].map((stat) => <Pressable accessibilityRole="button" key={stat.label} onPress={openOperations} style={s.stat}><Text style={[s.statValue, { color: stat.color }]}>{count(stat.value)}</Text><Text style={s.statLabel}>{stat.label}</Text></Pressable>)}</View>
        {!!error && <View style={s.error}><Ionicons name="information-circle-outline" size={20} color="#9A6025" /><Text style={s.errorText}>{error}</Text></View>}
        <Pressable accessibilityRole="button" onPress={openOperations} style={({ pressed }) => [s.primaryCard, pressed && s.pressed]}>
          <View style={s.primaryIcon}><Ionicons name="chatbubbles-outline" size={26} color="#245747" /></View><View style={{ flex: 1 }}><Text style={s.actionTitle}>Community reports & response</Text><Text style={s.body}>Review incoming reports, accept an operation and record follow-up.</Text></View><Ionicons name="arrow-forward" size={22} color="#245747" />
        </Pressable>
        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Recent community reports</Text><Pressable accessibilityRole="button" onPress={openOperations} style={s.viewAll}><Text style={s.link}>View all</Text></Pressable></View>
        <View style={s.card}>
          {!loaded && <Text style={s.body}>Loading community reports…</Text>}
          {loaded && !reports.length && <Text style={s.body}>{error ? 'Reports are currently unavailable.' : 'No community reports yet. New reports will appear here.'}</Text>}
          {reports.slice(0, 4).map((report, index) => <Pressable accessibilityRole="button" onPress={openOperations} key={report.id} style={[s.report, index > 0 && s.reportBorder]}>
            <View style={s.reportIcon}><Ionicons name={report.kind === 'elephant_sighting' ? 'leaf-outline' : 'warning-outline'} size={21} color="#52735F" /></View>
            <View style={{ flex: 1, gap: 5 }}><Text style={s.reportTitle}>{COMMUNITY_REPORT_TYPES[report.kind]?.label || report.kind}</Text><Text style={s.reportLocation}>{report.village} · {report.boundarySection}</Text><Text style={s.reportMeta}>{report.demoAcceptance ? 'Demo acceptance · This device' : report.source === 'sms_simulated' ? 'Simulated SMS' : 'Community app'}</Text></View>
            <View style={[s.status, report.status === 'pending' && s.pending]}><Text style={[s.statusText, report.status === 'pending' && s.pendingText]}>{report.status === 'investigating' ? 'In progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}</Text></View>
          </Pressable>)}
        </View>
        <Text style={s.sectionTitle}>Community tools</Text>
        <View style={s.tools}>
          <Pressable accessibilityRole="button" style={s.tool} onPress={() => router.push('/community-report')}><View style={s.toolIcon}><Ionicons name="create-outline" size={24} color="#245747" /></View><Text style={s.actionTitle}>Record an incident</Text><Text style={s.body}>Help a resident submit a wildlife report.</Text><Text style={s.toolLink}>Open reporting →</Text></Pressable>
          <Pressable accessibilityRole="button" style={s.tool} onPress={simulateWarning}><View style={[s.toolIcon, { backgroundColor: '#F7EFE0' }]}><Ionicons name="megaphone-outline" size={24} color="#A16B24" /></View><Text style={s.actionTitle}>Early warning demo</Text><Text style={s.body}>{broadcastSent ? 'Simulation completed. No message or siren was sent.' : 'Preview the community warning workflow.'}</Text><Text style={s.toolLink}>{broadcastSent ? 'Run again →' : 'Run simulation →'}</Text></Pressable>
        </View>
        <Text style={s.footer}>WildTrail · Protecting wildlife and neighbouring communities</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F0' },
  topbar: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E6EBE1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 44, height: 48, borderRadius: 7 }, brandName: { color: '#193D30', fontWeight: '800', fontSize: 20 }, brandCaption: { color: '#748078', fontSize: 9, letterSpacing: 1.5, marginTop: 3 },
  logout: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F1F5EE' },
  scroll: { padding: 20, paddingBottom: 36 }, content: { width: '100%', maxWidth: 900, alignSelf: 'center', gap: 18 }, intro: { gap: 8, marginTop: 4 }, date: { color: '#748078', fontSize: 12 }, heading: { color: '#193D30', fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }, subtitle: { color: '#748078', fontSize: 14, lineHeight: 22 },
  sector: { backgroundColor: '#245747', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }, sectorIcon: { width: 44, height: 44, backgroundColor: '#386857', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, sectorLabel: { color: '#B9CFBF', fontSize: 9, letterSpacing: 1.4, fontWeight: '700' }, sectorTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '700', marginTop: 6 }, sectorSubtitle: { color: '#D0DFD4', fontSize: 12, marginTop: 5, textTransform: 'capitalize' },
  stats: { flexDirection: 'row', gap: 10 }, stat: { flex: 1, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#E2E8DF', borderRadius: 16, gap: 7 }, statValue: { fontSize: 28, fontWeight: '700' }, statLabel: { color: '#748078', fontSize: 11, lineHeight: 16 },
  primaryCard: { borderWidth: 1, borderColor: '#C9DBBE', backgroundColor: '#EAF1E2', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, primaryIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, actionTitle: { fontSize: 15, fontWeight: '700', color: '#245747', marginBottom: 5 }, body: { color: '#748078', fontSize: 12, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, sectionTitle: { color: '#193D30', fontSize: 17, fontWeight: '700' }, viewAll: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, link: { color: '#245747', fontSize: 12, fontWeight: '600' }, card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8DF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 }, report: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingVertical: 16 }, reportBorder: { borderTopWidth: 1, borderColor: '#EDF0E9' }, reportIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5EE', alignItems: 'center', justifyContent: 'center' }, reportTitle: { color: '#304C3D', fontSize: 13, fontWeight: '700' }, reportLocation: { color: '#748078', fontSize: 12 }, reportMeta: { color: '#8A958C', fontSize: 10 }, status: { backgroundColor: '#EBF3ED', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 }, statusText: { color: '#3B7563', fontSize: 10, fontWeight: '600' }, pending: { backgroundColor: '#FBF0DC' }, pendingText: { color: '#A16B24' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tool: { flex: 1, minWidth: 145, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8DF', padding: 18 }, toolIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EDF3EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, toolLink: { color: '#245747', fontSize: 12, fontWeight: '600', marginTop: 14 }, footer: { textAlign: 'center', color: '#879087', fontSize: 11, lineHeight: 18, marginTop: 8 }, error: { backgroundColor: '#FBF0DC', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, errorText: { color: '#9A6025', fontSize: 12, lineHeight: 19, flex: 1 }, pressed: { opacity: 0.75 },
});
