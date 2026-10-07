import { WildTrailBrand } from '../../../components/WildTrailBrand';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/colors';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';
import { patrolApiService } from '../../../services/api/patrols';
import { RangerStatus } from '../../../types/patrol';

export default function ResponseConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [alertData, setAlertData] = useState<any>(null);
  const [rangerStatus, setRangerStatus] = useState<RangerStatus>('RESPONDING_TO_ALERT');

  useEffect(() => {
    const fetchAlert = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'alerts', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAlertData({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAlert();
  }, [id]);

  useEffect(() => {
    const fetchStatus = async () => {
      const currentStatus = await patrolApiService.getRangerStatus();
      setRangerStatus(currentStatus);
    };
    fetchStatus();
  }, []);

  const handleCompleteResponse = async () => {
    try {
      if (id) {
        const alertRef = doc(db, 'alerts', id as string);
        await updateDoc(alertRef, { status: 'RESOLVED' });
      }
    } catch (error) {
      console.error(error);
    }

    await patrolApiService.setRangerStatus('AVAILABLE');
    setRangerStatus('AVAILABLE');

    if (Platform.OS === 'web') {
      window.alert('Response completed! Ranger status updated to AVAILABLE.');
    } else {
      Alert.alert('Response Completed', 'Alert response completed! Ranger status updated to AVAILABLE.');
    }

    router.push('/dashboard');
  };

  if (!alertData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#4B5563', fontSize: 16 }}>Confirming response details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <WildTrailBrand light title="Response Navigation" />
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Alert Accepted</Text>
          <Text style={styles.successSubtitle}>Active Dispatch & Wildlife Conflict Response</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="shield" size={18} color="#EF4444" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Ranger Status</Text>
            <View style={styles.statusBadgeWrap}>
              <Text style={styles.statusBadgeTextVal}>
                {rangerStatus.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="paw" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Animal Target</Text>
            <Text style={styles.detailValue}>{alertData.animalId || 'Elephant E-014'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Risk Sector</Text>
            <Text style={styles.detailValue}>{alertData.location || 'Farmland Zone B'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="warning" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Risk Level</Text>
            <Text style={[styles.detailValue, alertData.level === 'HIGH' ? styles.riskHighText : styles.riskMedText]}>
              {alertData.level || 'HIGH'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Timestamp</Text>
            <Text style={styles.detailValue}>{alertData.timestamp || '07:43 PM'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color="#4B5563" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Assigned Actor</Text>
            <Text style={styles.detailValue}>Ranger Nimal (Group 027)</Text>
          </View>
        </View>

        <View style={styles.instructionBanner}>
          <Ionicons name="radio" size={32} color={Colors.light.primaryDark} />
          <View style={styles.instructionTextWrap}>
            <Text style={styles.instructionText}>
              Status set to <Text style={{ fontWeight: '800' }}>RESPONDING_TO_ALERT</Text>. Proceed to site safely and tap Complete when conflict resolution is finished.
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => router.push({ pathname: '/map', params: { respondingAlertId: alertData.id } })}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={20} color="#FFFFFF" />
            <Text style={styles.mapBtnText}>View Location on Map</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleCompleteResponse}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-circle" size={22} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>Complete Response (Set Available)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backAlertsBtn}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
            <Text style={styles.backAlertsBtnText}>Back to Alerts Feed</Text>
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
  statusBadgeWrap: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeTextVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  completeBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
