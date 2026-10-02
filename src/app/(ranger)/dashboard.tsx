import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const RECENT_ALERTS = [
  {
    id: '1',
    animalId: 'Elephant E-014',
    zone: 'Farmland Zone B',
    level: 'HIGH',
    timestamp: '07:43 PM',
    image: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg' },
  },
  {
    id: '2',
    animalId: 'Elephant E-011',
    zone: 'Waterhole Zone',
    level: 'MEDIUM',
    timestamp: '03:15 PM',
    image: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Elephant_near_ndutu.jpg/320px-Elephant_near_ndutu.jpg' },
  },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="paw" size={28} color="#FFFFFF" style={styles.pawIcon} />
          <View>
            <Text style={styles.headerTitle}>Wildlife Monitoring</Text>
            <Text style={styles.headerSubtitle}>Protecting Wildlife Together</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellContainer}>
          <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Wildlife Risk Alert Card */}
        <View style={styles.riskCard}>
          {/* Red Alert Banner */}
          <View style={styles.riskBanner}>
            <Ionicons name="warning" size={22} color="#DC2626" />
            <View style={styles.riskBannerText}>
              <Text style={styles.riskBannerTitle}>WILDLIFE RISK ALERT</Text>
              <Text style={styles.riskBannerSubtitle}>A tracked animal has entered a{'\n'}high-risk zone</Text>
            </View>
          </View>

          {/* Animal Info */}
          <View style={styles.animalRow}>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg' }}
              style={styles.animalImage}
            />
            <View style={styles.animalInfo}>
              <Text style={styles.animalId}>Elephant E-014</Text>
              <Text style={styles.animalSpecies}>Asian Elephant</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color={Colors.light.muted} />
                <Text style={styles.locationText}>Farmland Zone B</Text>
              </View>
              <View style={styles.riskBadge}>
                <Text style={styles.riskBadgeText}>HIGH RISK</Text>
              </View>
            </View>
          </View>

          {/* Timestamp */}
          <View style={styles.timestampRow}>
            <Ionicons name="time-outline" size={14} color={Colors.light.muted} />
            <Text style={styles.timestampText}>Detected: 18 May 2025, 07:43 PM</Text>
          </View>

          {/* View Alert Button */}
          <TouchableOpacity
            style={styles.viewAlertButton}
            onPress={() => router.push('/(ranger)/alerts')}
          >
            <Text style={styles.viewAlertText}>View Alert</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Recent Alerts Section */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/(ranger)/alerts')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {RECENT_ALERTS.map((alert) => (
          <TouchableOpacity key={alert.id} style={styles.recentItem} onPress={() => {}}>
            <Image source={alert.image} style={styles.recentImage} />
            <View style={styles.recentDetails}>
              <Text style={styles.recentAnimalId}>{alert.animalId}</Text>
              <Text style={styles.recentZone}>{alert.zone}</Text>
              <View style={[
                styles.recentLevelBadge,
                alert.level === 'HIGH' ? styles.highBadge : styles.mediumBadge,
              ]}>
                <Text style={[
                  styles.recentLevelText,
                  alert.level === 'HIGH' ? styles.highText : styles.mediumText,
                ]}>
                  {alert.level}
                </Text>
              </View>
            </View>
            <View style={styles.recentRight}>
              <Text style={styles.recentTime}>{alert.timestamp}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.muted} />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  // ─── Header ────────────────────────────────────────────
  header: {
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  bellContainer: {
    position: 'relative',
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
  },
  // ─── Scroll ───────────────────────────────────────────
  scroll: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    paddingBottom: 32,
  },
  // ─── Risk Card ─────────────────────────────────────────
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  riskBanner: {
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    gap: 10,
  },
  riskBannerText: {
    flex: 1,
  },
  riskBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  riskBannerSubtitle: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 17,
  },
  animalRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
    alignItems: 'flex-start',
  },
  animalImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 4,
  },
  animalId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  animalSpecies: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  riskBadge: {
    marginTop: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  viewAlertButton: {
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
    margin: 14,
    marginTop: 4,
    borderRadius: 8,
  },
  viewAlertText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ─── Recent Alerts ─────────────────────────────────────
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recentImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  recentDetails: {
    flex: 1,
    gap: 2,
  },
  recentAnimalId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recentZone: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  recentLevelBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  highBadge: {
    backgroundColor: '#FEE2E2',
  },
  mediumBadge: {
    backgroundColor: '#FEF3C7',
  },
  recentLevelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  highText: {
    color: '#DC2626',
  },
  mediumText: {
    color: '#D97706',
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentTime: {
    fontSize: 12,
    color: Colors.light.muted,
  },
});
