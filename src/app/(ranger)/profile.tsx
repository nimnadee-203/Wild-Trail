import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [criticalPushAlerts, setCriticalPushAlerts] = useState(true);
  const [offlineMapCache, setOfflineMapCache] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your patrol shift and log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => router.replace('/login'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Ranger Profile</Text>
            <Text style={styles.headerSubtitle}>Field Officer Credentials & Settings</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Settings', 'App version: v1.0.0 (Expo SDK 57)')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Officer Credentials Card */}
        <View style={styles.officerCard}>
          <View style={styles.officerTop}>
            <View style={styles.avatarWrap}>
              <Ionicons name="person" size={36} color="#FFFFFF" />
            </View>
            <View style={styles.officerInfo}>
              <View style={styles.officerNameRow}>
                <Text style={styles.officerName}>Officer Meranga</Text>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.officerRole}>Senior Field Ranger • Sector 4 Lead</Text>
              <Text style={styles.badgeNum}>Badge: RANGER-409</Text>
            </View>
          </View>

          <View style={styles.stationRow}>
            <Ionicons name="business-outline" size={15} color="#4B5563" />
            <Text style={styles.stationText}>Southern Wildlife Conservation Post, Sector 4</Text>
          </View>
        </View>

        {/* Ranger Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>164</Text>
            <Text style={styles.statLabel}>Patrol Hours</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>28</Text>
            <Text style={styles.statLabel}>Alerts Solved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>14</Text>
            <Text style={styles.statLabel}>Tracked Wildlife</Text>
          </View>
        </View>

        {/* Quick Operations Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Field Capabilities</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/patrol')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="footsteps" size={20} color="#15803D" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>GPS Patrol Tracker</Text>
              <Text style={styles.menuSub}>View current session & log breadcrumbs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/report-incident')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="camera" size={20} color="#B45309" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>File Incident Report</Text>
              <Text style={styles.menuSub}>Document poaching, traps or crop damage</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Operational Hardware & Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Device & Telemetry Preferences</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>High-Accuracy GPS</Text>
              <Text style={styles.toggleDesc}>Sub-meter satellite tracking for patrol route</Text>
            </View>
            <Switch
              value={highAccuracyGps}
              onValueChange={setHighAccuracyGps}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Critical Geofence Push Alarms</Text>
              <Text style={styles.toggleDesc}>Audible sirens for high-risk animal incursions</Text>
            </View>
            <Switch
              value={criticalPushAlerts}
              onValueChange={setCriticalPushAlerts}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Offline Map Topography Cache</Text>
              <Text style={styles.toggleDesc}>Downloaded Sector 4 offline GIS tiles</Text>
            </View>
            <Switch
              value={offlineMapCache}
              onValueChange={setOfflineMapCache}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Account & Shift Management</Text>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => router.push('/login')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={18} color={Colors.light.primaryDark} />
            <Text style={styles.actionBtnOutlineText}>Switch Role / Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDanger}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.actionBtnDangerText}>End Shift & Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    padding: 16,
    paddingBottom: 32,
  },

  // Officer Card
  officerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  officerTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  officerInfo: {
    flex: 1,
  },
  officerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  officerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  badgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  officerRole: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  badgeNum: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primaryDark,
    marginTop: 3,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  stationText: {
    fontSize: 12,
    color: '#4B5563',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.primaryDark,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '600',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  menuSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleText: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 6,
  },
  actionBtnOutlineText: {
    color: Colors.light.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  actionBtnDangerText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
