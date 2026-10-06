import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/colors';

const ALERT_DB: Record<string, any> = {
  '1': {
    id: '1',
    animalId: 'E-014',
    location: 'Farmland Zone B',
    level: 'HIGH',
    timestamp: '18 May 2025, 07:44 PM',
  },
  '2': {
    id: '2',
    animalId: 'E-011',
    location: 'Waterhole Zone C',
    level: 'MEDIUM',
    timestamp: 'Today, 05:21 PM',
  }
};

export default function ResponseConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const alert = ALERT_DB[id as string] || ALERT_DB['1'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Response Confirmation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Alert Acknowledged</Text>
          <Text style={styles.successSubtitle}>You have been assigned to respond</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="paw" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Elephant ID</Text>
            <Text style={styles.detailValue}>{alert.animalId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{alert.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="warning" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Risk Level</Text>
            <Text style={[styles.detailValue, alert.level === 'HIGH' ? styles.riskHighText : styles.riskMedText]}>
              {alert.level}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Acknowledged At</Text>
            <Text style={styles.detailValue}>{alert.timestamp}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Assigned To</Text>
            <Text style={styles.detailValue}>Ranger S. Perera</Text>
          </View>
        </View>

        <View style={styles.instructionBanner}>
          <Ionicons name="radio" size={32} color={Colors.light.primaryDark} />
          <View style={styles.instructionTextWrap}>
            <Text style={styles.instructionText}>
              You are now the responding Ranger. Proceed to the location safely.
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => router.push({ pathname: '/map', params: { respondingAlertId: alert.id } })}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={20} color="#FFFFFF" />
            <Text style={styles.mapBtnText}>View Location on Map</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backAlertsBtn}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
            <Text style={styles.backAlertsBtnText}>Back to Alerts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.primaryDark,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 32,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#4B5563',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  riskHighText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  riskMedText: {
    color: '#D97706',
    fontWeight: '800',
  },
  instructionBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  instructionTextWrap: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.primaryDark,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  mapBtn: {
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backAlertsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backAlertsBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});
