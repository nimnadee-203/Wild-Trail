import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function LiaisonDashboardScreen() {
  const router = useRouter();
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleSendCommunitySiren = () => {
    const msg = 'Broadcast SMS warning to 142 registered villagers in Farmland Zone B regarding Elephant E-014 proximity?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        setBroadcastSent(true);
        window.alert('Alert Broadcasted! Warning sirens & SMS dispatched to Zone B residents.');
      }
    } else {
      Alert.alert('Community Early Warning Siren', msg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Broadcast',
          style: 'destructive',
          onPress: () => {
            setBroadcastSent(true);
            Alert.alert('Alert Broadcasted', 'Warning sirens & SMS dispatched to Zone B residents.');
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Community Liaison Portal</Text>
            <Text style={styles.headerSubtitle}>Human-Wildlife Conflict Mitigation</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.bannerCard} onPress={() => router.push('/community-operations')}>
          <Text style={styles.bannerTitle}>Community Reports & Response</Text>
        </TouchableOpacity>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <Ionicons name="people" size={32} color="#0284C7" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Active Sector: Yala Community Buffer B</Text>
            <Text style={styles.bannerSub}>142 Registered Village Residents • 3 Active Siren Towers</Text>
          </View>
        </View>

        {/* Quick Operations */}
        <Text style={styles.sectionTitle}>Liaison Operations</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleSendCommunitySiren} activeOpacity={0.85}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="megaphone" size={24} color="#DC2626" />
            </View>
            <Text style={styles.actionTitle}>{broadcastSent ? 'Siren Dispatched' : 'Dispatch Siren Warning'}</Text>
            <Text style={styles.actionDesc}>Broadcast SMS & siren to Zone B villagers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(ranger)/alerts')} activeOpacity={0.85}>
            <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="warning" size={24} color="#D97706" />
            </View>
            <Text style={styles.actionTitle}>Wildlife Risk Feeds</Text>
            <Text style={styles.actionDesc}>Inspect geofence breaches & animal movement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 30 },
  bannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 12, padding: 16, gap: 14, borderWidth: 1, borderColor: '#BAE6FD', marginBottom: 20 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#0369A1' },
  bannerSub: { fontSize: 12, color: '#0284C7', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  iconWrap: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  actionDesc: { fontSize: 11, color: '#64748B', marginTop: 4 },
});
