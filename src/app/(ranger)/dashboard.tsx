import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const ELEPHANT_E014_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg';
const ELEPHANT_E011_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Elephant_near_ndutu.jpg/320px-Elephant_near_ndutu.jpg';
const LEOPARD_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Leopard_africa.jpg/320px-Leopard_africa.jpg';

interface AlertItem {
  id: string;
  animalId: string;
  species: string;
  location: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  image: string;
  notes: string;
}

const RECENT_ALERTS: AlertItem[] = [
  {
    id: '1',
    animalId: 'Elephant E-014',
    species: 'Asian Elephant (Bull)',
    location: 'Farmland Zone B',
    level: 'HIGH',
    timestamp: '07:43 PM',
    image: ELEPHANT_E014_IMG,
    notes: 'Approaching human settlement (350m buffer breach)',
  },
  {
    id: '2',
    animalId: 'Elephant E-011',
    species: 'Asian Elephant (Cow)',
    location: 'Waterhole Zone C',
    level: 'MEDIUM',
    timestamp: '05:20 PM',
    image: ELEPHANT_E011_IMG,
    notes: 'Moving towards agricultural corridor',
  },
  {
    id: '3',
    animalId: 'Leopard L-003',
    species: 'Indian Leopard',
    location: 'Northern Buffer Boundary',
    level: 'LOW',
    timestamp: '02:15 PM',
    image: LEOPARD_IMG,
    notes: 'Resting within dense canopy safe zone',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleBroadcastAlert = () => {
    Alert.alert(
      'Community Early Warning',
      'Broadcast SMS warning to 142 registered villagers in Farmland Zone B regarding Elephant E-014 proximity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Broadcast',
          style: 'destructive',
          onPress: () => {
            setBroadcastSent(true);
            Alert.alert('Alert Broadcasted', 'Warning sirens & SMS dispatched to Zone B residents.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.light.primaryDark} barStyle="light-content" />

      {/* Top Application Header / Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.pawIconWrap}>
            <Ionicons name="paw" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Wildlife Monitoring</Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSubtitle}>Field Ranger Portal • Sector 4</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.8}
            accessibilityLabel="Alert notifications"
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileAvatarBtn}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
            accessibilityLabel="Ranger Profile"
          >
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Live System Metrics Overview */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <View style={styles.metricHeader}>
              <Ionicons name="hardware-chip-outline" size={18} color={Colors.light.primaryDark} />
              <Text style={styles.metricLabel}>Tracked</Text>
            </View>
            <Text style={styles.metricValue}>14</Text>
            <Text style={styles.metricSub}>Active Collars</Text>
          </View>

          <TouchableOpacity
            style={[styles.metricCard, styles.metricCardDanger]}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.85}
          >
            <View style={styles.metricHeader}>
              <Ionicons name="warning-outline" size={18} color={Colors.light.danger} />
              <Text style={[styles.metricLabel, { color: Colors.light.danger }]}>High Risk</Text>
            </View>
            <Text style={[styles.metricValue, { color: Colors.light.danger }]}>2</Text>
            <Text style={styles.metricSub}>Immediate Action</Text>
          </TouchableOpacity>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#059669" />
              <Text style={styles.metricLabel}>Patrol</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#059669' }]}>Active</Text>
            <Text style={styles.metricSub}>GPS Track On</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="radio-outline" size={18} color="#0284C7" />
              <Text style={styles.metricLabel}>Signal</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#0284C7' }]}>98%</Text>
            <Text style={styles.metricSub}>LoRa / VHF Grid</Text>
          </View>
        </View>

        {/* High-Risk Wildlife Alert Hero Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerTop}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="warning" size={26} color={Colors.light.danger} />
            </View>
            <View style={styles.alertBannerText}>
              <View style={styles.urgentBadgeRow}>
                <Text style={styles.alertBannerTitle}>CRITICAL RISK ALERT</Text>
                <View style={styles.pulsingBadge}>
                  <Text style={styles.pulsingBadgeText}>LIVE BREACH</Text>
                </View>
              </View>
              <Text style={styles.alertBannerSubtitle}>
                Elephant E-014 crossed buffer geofence towards agricultural land.
              </Text>
            </View>
          </View>

          {/* Animal Card */}
          <View style={styles.animalCard}>
            <Image source={{ uri: ELEPHANT_E014_IMG }} style={styles.animalImage} />
            <View style={styles.animalInfo}>
              <View style={styles.animalTitleRow}>
                <Text style={styles.animalName}>Elephant E-014</Text>
                <View style={styles.riskBadge}>
                  <Text style={styles.riskBadgeText}>HIGH RISK</Text>
                </View>
              </View>
              <Text style={styles.animalSpecies}>Asian Elephant • Adult Bull (~28 yrs)</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={15} color={Colors.light.danger} />
                <Text style={styles.locationText}>Farmland Zone B (350m to houses)</Text>
              </View>
              <View style={styles.speedRow}>
                <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
                <Text style={styles.speedText}>Speed: 4.2 km/h • Heading South-West</Text>
              </View>
            </View>
          </View>

          {/* Time detected */}
          <View style={styles.detectedRow}>
            <Ionicons name="time-outline" size={15} color="#6B7280" />
            <Text style={styles.detectedText}>Detected: Today, 07:43 PM (Auto Geofence Alert)</Text>
          </View>

          {/* Action Buttons for Critical Alert */}
          <View style={styles.alertActionButtons}>
            <TouchableOpacity
              style={styles.viewAlertBtn}
              onPress={() => router.push('/alerts')}
              activeOpacity={0.85}
            >
              <Text style={styles.viewAlertBtnText}>Respond & View Details</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewMapBtn}
              onPress={() => router.push('/map')}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={18} color={Colors.light.primaryDark} />
              <Text style={styles.viewMapBtnText}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Operations</Text>
          <Text style={styles.sectionSubtitle}>Standard Field Tools</Text>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/patrol')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="footsteps" size={24} color="#15803D" />
            </View>
            <Text style={styles.actionTitle}>Start GPS Patrol</Text>
            <Text style={styles.actionDesc}>Record track points & ranger route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/report-incident')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="camera" size={24} color="#B45309" />
            </View>
            <Text style={styles.actionTitle}>Report Incident</Text>
            <Text style={styles.actionDesc}>Poaching, snares & crop damage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/map')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="map" size={24} color="#0369A1" />
            </View>
            <Text style={styles.actionTitle}>Live Animal Map</Text>
            <Text style={styles.actionDesc}>GPS collars & geofence zones</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleBroadcastAlert}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="megaphone" size={24} color="#DC2626" />
            </View>
            <Text style={styles.actionTitle}>
              {broadcastSent ? 'Broadcast Sent' : 'Community Siren'}
            </Text>
            <Text style={styles.actionDesc}>Instant warning SMS to villagers</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.reportIncidentBtn}
          onPress={() => router.push('/report-incident' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.reportIncidentIcon}>
            <Ionicons name="add" size={22} color={Colors.light.primaryDark} />
          </View>
          <View style={styles.reportIncidentText}>
            <Text style={styles.reportIncidentTitle}>Report an Incident</Text>
            <Text style={styles.reportIncidentSubtitle}>
              Record a site observation or wildlife incident
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.primaryDark} />
        </TouchableOpacity>

        {/* Recent Alerts Feed */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Wildlife Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/alerts')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>View All ({RECENT_ALERTS.length})</Text>
          </TouchableOpacity>
        </View>

        {RECENT_ALERTS.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.recentAlertItem}
            activeOpacity={0.85}
            onPress={() => router.push('/alerts')}
          >
            <Image source={{ uri: alert.image }} style={styles.recentAlertImage} />
            <View style={styles.recentAlertInfo}>
              <View style={styles.recentTitleRow}>
                <Text style={styles.recentAlertName}>{alert.animalId}</Text>
                <View
                  style={[
                    styles.levelBadge,
                    alert.level === 'HIGH'
                      ? styles.levelHigh
                      : alert.level === 'MEDIUM'
                      ? styles.levelMedium
                      : styles.levelLow,
                  ]}
                >
                  <Text style={styles.levelBadgeText}>{alert.level}</Text>
                </View>
              </View>

              <Text style={styles.recentAlertSpecies}>{alert.species}</Text>

              <View style={styles.recentMetaRow}>
                <Ionicons name="location-outline" size={13} color="#6B7280" />
                <Text style={styles.recentAlertLocation}>{alert.location}</Text>
                <Text style={styles.metaDivider}>•</Text>
                <Ionicons name="time-outline" size={13} color="#6B7280" />
                <Text style={styles.recentAlertTime}>{alert.timestamp}</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Ranger Shift & Equipment Status */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Ionicons name="person-circle-outline" size={24} color={Colors.light.primaryDark} />
            <Text style={styles.shiftTitle}>Duty Officer: RANGER-409 (Meranga)</Text>
          </View>
          <Text style={styles.shiftText}>
            Assigned: Sector 4 Southern Boundary • Base Radio VHF Channel 12 • SOS Emergency Active
          </Text>
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

  // Header App Bar
  header: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
  },
  profileAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll Container
  scroll: {
    padding: 16,
    paddingBottom: 28,
  },

  // Live Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricCardPrimary: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  metricCardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  metricSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Alert Banner
  alertBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F87171',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  alertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertBannerText: {
    flex: 1,
  },
  urgentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  alertBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  pulsingBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pulsingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertBannerSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 18,
  },

  // Animal Card inside Banner
  animalCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  animalImage: {
    width: 82,
    height: 82,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  animalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  riskBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  animalSpecies: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    marginLeft: 3,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  speedText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 3,
  },

  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 4,
  },
  detectedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  alertActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewAlertBtn: {
    flex: 1,
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 9,
    gap: 6,
  },
  viewAlertBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
    backgroundColor: '#FFFFFF',
    gap: 5,
  },
  viewMapBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 12,
  },
  // Incident reporting entry point
  reportIncidentBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIncidentIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reportIncidentText: {
    flex: 1,
  },
  reportIncidentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  reportIncidentSubtitle: {
    fontSize: 11,
    color: Colors.light.muted,
    marginTop: 3,
  },
  // Recent Alerts
  recentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '700',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actionDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },

  // Recent Alerts List
  recentAlertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recentAlertImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  recentAlertInfo: {
    flex: 1,
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  recentAlertName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  recentAlertSpecies: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  recentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recentAlertLocation: {
    fontSize: 11,
    color: '#4B5563',
    marginLeft: 3,
  },
  metaDivider: {
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 5,
  },
  recentAlertTime: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 3,
  },

  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelHigh: {
    backgroundColor: '#DC2626',
  },
  levelMedium: {
    backgroundColor: '#D97706',
  },
  levelLow: {
    backgroundColor: '#059669',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Shift info card
  shiftCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginTop: 10,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  shiftTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  shiftText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
  },
});
