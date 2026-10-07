import { WildTrailBrand } from '../../../components/WildTrailBrand';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/colors';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebaseConfig';
import { patrolApiService } from '../../../services/api/patrols';

export default function AlertDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [alert, setAlert] = useState<any>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      if (!id) return;
      const docRef = doc(db, 'alerts', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAlert({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchAlert();
  }, [id]);

  if (!alert) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading alert details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <WildTrailBrand light title="Risk Alert Details" />
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Animal Overview Card */}
        <View style={styles.card}>
          <View style={styles.animalHeader}>
            <Image source={{ uri: alert.image }} style={styles.animalImg} />
            <View style={styles.animalInfo}>
              <Text style={styles.animalId}>{alert.animalId}</Text>
              <Text style={styles.speciesName}>{alert.species}</Text>
              <View style={[styles.riskBadge, alert.level === 'HIGH' ? styles.riskHigh : styles.riskMed]}>
                <Ionicons name="warning" size={14} color="#DC2626" />
                <Text style={styles.riskBadgeText}>{alert.level} RISK</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Ionicons name="paw" size={18} color="#4B5563" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Species</Text>
              <Text style={styles.detailValue}>{alert.species}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={18} color="#4B5563" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Risk Zone</Text>
              <Text style={styles.detailValue}>{alert.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color="#4B5563" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Last Detected</Text>
              <Text style={styles.detailValue}>{alert.timestamp}</Text>
            </View>
          </View>

          {/* Map Snippet */}
          <View style={styles.mapSnippet}>
            {/* Simulated Satellite Map BG */}
            <View style={styles.simulatedMapBg}>
              {/* Geofence polygon overlay */}
              <View style={styles.geofencePolygon}>
                <Text style={styles.zoneText}>{alert.location}</Text>
                <Text style={styles.zoneRisk}>({alert.level === 'HIGH' ? 'High Risk' : 'Medium Risk'})</Text>
              </View>
              {/* Animal Pin */}
              <View style={styles.animalPin}>
                <Ionicons name="paw" size={18} color="#FFFFFF" />
              </View>
              
              <View style={styles.compass}>
                <Text style={styles.compassText}>N</Text>
                <Ionicons name="navigate" size={14} color="#111827" />
              </View>
              
              <View style={styles.scaleBar}>
                <Text style={styles.scaleText}>0      1      2 km</Text>
                <View style={styles.scaleLine} />
              </View>
            </View>

            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <Ionicons name="paw" size={14} color="#DC2626" />
                <Text style={styles.legendLabel}>Elephant Location</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendDashedBox} />
                <Text style={styles.legendLabel}>Risk Zone Boundary</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Coordinates Card */}
        <View style={styles.coordCard}>
          <View style={styles.coordLeft}>
            <Ionicons name="location" size={24} color="#1F2937" />
            <View>
              <Text style={styles.coordTitle}>Location Coordinates</Text>
              <Text style={styles.coordVal}>Latitude: {alert.latitude}</Text>
              <Text style={styles.coordVal}>Longitude: {alert.longitude}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.copyBtn}>
            <Ionicons name="copy-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={async () => {
            try {
              const docRef = doc(db, 'alerts', alert.id);
              await updateDoc(docRef, { status: 'RESPONDED' });
            } catch (error) {
              console.error(error);
            }
            // Transition Ranger Status to RESPONDING_TO_ALERT
            await patrolApiService.setRangerStatus('RESPONDING_TO_ALERT');
            router.push({ pathname: '/alerts/confirm', params: { id: alert.id } });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>Acknowledge & Respond</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  animalImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  animalInfo: {
    flex: 1,
  },
  animalId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  speciesName: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  riskHigh: {
    backgroundColor: '#FEE2E2',
  },
  riskMed: {
    backgroundColor: '#FEF3C7',
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  detailList: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 28,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: '#4B5563',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  mapSnippet: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simulatedMapBg: {
    height: 180,
    backgroundColor: '#5A6C41', // Simulating forest green color
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  geofencePolygon: {
    position: 'absolute',
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    padding: 20,
    transform: [{ rotate: '10deg' }],
    width: '60%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  zoneRisk: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  animalPin: {
    position: 'absolute',
    backgroundColor: '#000000',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    left: '25%',
    top: '40%',
  },
  compass: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scaleBar: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  scaleText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginBottom: 2,
  },
  scaleLine: {
    height: 2,
    backgroundColor: '#FFFFFF',
    width: 80,
  },
  mapLegend: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  legendDashedBox: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  coordCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  coordVal: {
    fontSize: 12,
    color: '#4B5563',
  },
  copyBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtn: {
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
