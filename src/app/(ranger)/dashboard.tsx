import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const RECENT_ALERTS = [
  {
    id: '1',
    animalId: 'Elephant E-014',
    location: 'Farmland Zone B',
    level: 'HIGH',
    timestamp: '07:43 PM',
  },
  {
    id: '2',
    animalId: 'Elephant E-011',
    location: 'Waterhole Zone',
    level: 'MEDIUM',
    timestamp: '03:15 PM',
  },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.light.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="paw" size={26} color="#FFFFFF" style={styles.pawIcon} />
          <View>
            <Text style={styles.headerTitle}>Wildlife Monitoring</Text>
            <Text style={styles.headerSubtitle}>Protecting Wildlife Together</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Wildlife Risk Alert Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerHeader}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="warning" size={28} color={Colors.light.danger} />
            </View>
            <View style={styles.alertBannerText}>
              <Text style={styles.alertBannerTitle}>WILDLIFE RISK ALERT</Text>
              <Text style={styles.alertBannerSubtitle}>
                A tracked animal has entered a high-risk zone
              </Text>
            </View>
          </View>

          {/* Animal Info Card */}
          <View style={styles.animalCard}>
            <View style={styles.animalImageWrap}>
              <Ionicons name="image-outline" size={32} color={Colors.light.muted} />
            </View>
            <View style={styles.animalInfo}>
              <Text style={styles.animalName}>Elephant E-014</Text>
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

          {/* Detected time */}
          <View style={styles.detectedRow}>
            <Ionicons name="time-outline" size={14} color={Colors.light.muted} />
            <Text style={styles.detectedText}>Detected: 18 May 2025, 07:43 PM</Text>
          </View>

          {/* View Alert Button */}
          <TouchableOpacity
            style={styles.viewAlertBtn}
            onPress={() => router.push('/(ranger)/alerts' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewAlertBtnText}>View Alert</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Recent Alerts Section */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {RECENT_ALERTS.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.recentAlertItem}
            activeOpacity={0.8}
            onPress={() => router.push('/(ranger)/alerts' as any)}
          >
            <View style={styles.recentAlertImage}>
              <Ionicons name="image-outline" size={22} color={Colors.light.muted} />
            </View>
            <View style={styles.recentAlertInfo}>
              <Text style={styles.recentAlertName}>{alert.animalId}</Text>
              <Text style={styles.recentAlertLocation}>{alert.location}</Text>
              <View style={[styles.levelBadge, alert.level === 'HIGH' ? styles.levelHigh : styles.levelMedium]}>
                <Text style={styles.levelBadgeText}>{alert.level}</Text>
              </View>
            </View>
            <View style={styles.recentAlertRight}>
              <Text style={styles.recentAlertTime}>{alert.timestamp}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.muted} />
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
    backgroundColor: Colors.light.background,
  },

  // Header
  header: {
    backgroundColor: Colors.light.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bellBtn: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
  },

  // Scroll content
  scroll: {
    padding: 16,
    paddingBottom: 24,
  },

  // Alert Banner
  alertBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: 16,
    marginBottom: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  alertBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertBannerText: {
    flex: 1,
  },
  alertBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.light.danger,
    letterSpacing: 0.4,
  },
  alertBannerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },

  // Animal Card
  animalCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  animalImageWrap: {
    width: 80,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  animalName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  animalSpecies: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 3,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Detected Row
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  detectedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 5,
  },

  // View Alert Button
  viewAlertBtn: {
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 6,
  },
  viewAlertBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Recent Alerts
  recentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  recentAlertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  recentAlertImage: {
    width: 54,
    height: 54,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentAlertInfo: {
    flex: 1,
  },
  recentAlertName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  recentAlertLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 5,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  levelHigh: {
    backgroundColor: Colors.light.danger,
  },
  levelMedium: {
    backgroundColor: Colors.light.warning,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  recentAlertRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  recentAlertTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
