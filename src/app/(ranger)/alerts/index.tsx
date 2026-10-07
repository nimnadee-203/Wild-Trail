import { WildTrailBrand } from '../../../components/WildTrailBrand';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/colors';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';

const ELEPHANT_E014_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg';
const ELEPHANT_E011_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Elephant_near_ndutu.jpg/320px-Elephant_near_ndutu.jpg';
const LEOPARD_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Leopard_africa.jpg/320px-Leopard_africa.jpg';

interface AlertData {
  id: string;
  animalId: string;
  species: string;
  location: string;
  distance: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESPONDED';
  image: string;
  description: string;
}

export default function AlertsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    const alertsRef = collection(db, 'alerts');
    const unsubscribe = onSnapshot(alertsRef, (snapshot) => {
      const fetchedAlerts: AlertData[] = [];
      snapshot.forEach((docSnapshot) => {
        fetchedAlerts.push({ id: docSnapshot.id, ...docSnapshot.data() } as AlertData);
      });
      setAlerts(fetchedAlerts);
    });

    return () => unsubscribe();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.level === filter;
  });

  const handleAcknowledge = async (id: string, animalId: string) => {
    try {
      const alertRef = doc(db, 'alerts', id);
      await updateDoc(alertRef, { status: 'ACKNOWLEDGED' });
      if (Platform.OS === 'web') {
        window.alert(`Officer response logged for ${animalId}. Sector rangers notified.`);
      } else {
        Alert.alert('Alert Acknowledged', `Officer response logged for ${animalId}. Sector rangers notified.`);
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert('Failed to acknowledge alert.');
      } else {
        Alert.alert('Error', 'Failed to acknowledge alert.');
      }
    }
  };

  const handleDispatch = (id: string, animalId: string, location: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Dispatch nearest field ranger unit to ${location} for ${animalId}?`);
      if (confirmed) {
        const dispatchAction = async () => {
          try {
            const alertRef = doc(db, 'alerts', id);
            await updateDoc(alertRef, { status: 'RESPONDED' });
            window.alert(`Unit 4 dispatched to ${location}. Estimated arrival: 8 mins.`);
          } catch (error) {
            console.error(error);
            window.alert('Failed to dispatch team.');
          }
        };
        dispatchAction();
      }
    } else {
      Alert.alert(
        'Dispatch Rapid Response Team',
        `Dispatch nearest field ranger unit to ${location} for ${animalId}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Dispatch',
            style: 'default',
            onPress: async () => {
              try {
                const alertRef = doc(db, 'alerts', id);
                await updateDoc(alertRef, { status: 'RESPONDED' });
                Alert.alert('Patrol Dispatched', `Unit 4 dispatched to ${location}. Estimated arrival: 8 mins.`);
              } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to dispatch team.');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Bar */}
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
            <WildTrailBrand light title="Wildlife Risk Alerts" />
          </View>
        </View>

        <View style={styles.alertCountBadge}>
          <Text style={styles.alertCountText}>{alerts.length} Active</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.filterChip, filter === lvl && styles.filterChipActive]}
            onPress={() => setFilter(lvl)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === lvl && styles.filterChipTextActive,
              ]}
            >
              {lvl === 'ALL' ? 'All Alerts' : `${lvl}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertCard,
              alert.level === 'HIGH' && styles.alertCardHigh,
            ]}
            onPress={() => router.push({ pathname: '/alerts/[id]', params: { id: alert.id } })}
            activeOpacity={0.9}
          >
            {/* Header of Alert Card */}
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
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
                  <Text style={styles.levelBadgeText}>{alert.level} RISK</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    alert.status === 'PENDING'
                      ? styles.statusPending
                      : styles.statusActive,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{alert.status}</Text>
                </View>
              </View>

              <Text style={styles.timestampText}>{alert.timestamp}</Text>
            </View>

            {/* Animal Info */}
            <View style={styles.animalRow}>
              <Image source={{ uri: alert.image }} style={styles.animalImage} />
              <View style={styles.animalInfo}>
                <Text style={styles.animalId}>{alert.animalId}</Text>
                <Text style={styles.speciesText}>{alert.species}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={Colors.light.danger} />
                  <Text style={styles.locationText}>{alert.location}</Text>
                </View>
                <Text style={styles.distanceText}>📍 Proximity: {alert.distance}</Text>
              </View>
            </View>

            <Text style={styles.descriptionText}>{alert.description}</Text>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.acknowledgeBtn,
                  alert.status !== 'PENDING' && styles.btnDisabled,
                ]}
                onPress={() => handleAcknowledge(alert.id, alert.animalId)}
                disabled={alert.status !== 'PENDING'}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={alert.status === 'PENDING' ? 'checkmark-circle-outline' : 'checkmark-done'}
                  size={16}
                  color={alert.status === 'PENDING' ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.acknowledgeBtnText,
                    alert.status !== 'PENDING' && styles.btnDisabledText,
                  ]}
                >
                  {alert.status === 'PENDING' ? 'Acknowledge' : 'Acknowledged'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dispatchBtn}
                onPress={() => handleDispatch(alert.id, alert.animalId, alert.location)}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-outline" size={16} color={Colors.light.primaryDark} />
                <Text style={styles.dispatchBtnText}>Dispatch Team</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapPinBtn}
                onPress={() => router.push('/map')}
                activeOpacity={0.8}
                accessibilityLabel="View on map"
              >
                <Ionicons name="map-outline" size={18} color={Colors.light.primaryDark} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filteredAlerts.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-checkmark-outline" size={54} color="#059669" />
            <Text style={styles.emptyTitle}>No Alerts in this Category</Text>
            <Text style={styles.emptySubtitle}>All collared animals are currently within safe zones.</Text>
          </View>
        )}
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
  alertCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  alertCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Filter Bar
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: Colors.light.primaryDark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scroll: {
    padding: 16,
    paddingBottom: 30,
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCardHigh: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderColor: '#FECACA',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusPending: {
    backgroundColor: '#FEE2E2',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  timestampText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  animalRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  animalImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  animalId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  speciesText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  distanceText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },

  descriptionText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  acknowledgeBtn: {
    flex: 1,
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acknowledgeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  btnDisabledText: {
    color: '#9CA3AF',
  },
  dispatchBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  dispatchBtnText: {
    color: Colors.light.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  mapPinBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
