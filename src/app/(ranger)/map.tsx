import { WildTrailBrand } from '../../components/WildTrailBrand';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

interface AnimalPin {
  id: string;
  name: string;
  species: string;
  zone: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  lat: number;
  lng: number;
  battery: string;
  speed: string;
  lastPing: string;
}

const TRACKED_PINS: AnimalPin[] = [
  {
    id: '1',
    name: 'Elephant E-014',
    species: 'Asian Elephant (Bull)',
    zone: 'Farmland Zone B',
    risk: 'HIGH',
    lat: 6.8421,
    lng: 80.9125,
    battery: '84%',
    speed: '4.2 km/h (SW)',
    lastPing: '2 mins ago',
  },
  {
    id: '2',
    name: 'Elephant E-011',
    species: 'Asian Elephant (Cow)',
    zone: 'Waterhole Zone C',
    risk: 'MEDIUM',
    lat: 6.8612,
    lng: 80.9351,
    battery: '91%',
    speed: '1.8 km/h (S)',
    lastPing: '6 mins ago',
  },
  {
    id: '3',
    name: 'Leopard L-003',
    species: 'Indian Leopard',
    zone: 'Northern Ridge Sanctuary',
    risk: 'LOW',
    lat: 6.8854,
    lng: 80.9412,
    battery: '76%',
    speed: '0.4 km/h (Stationary)',
    lastPing: '14 mins ago',
  },
];

export default function MapScreen() {
  const router = useRouter();
  const { respondingAlertId } = useLocalSearchParams();
  const isResponding = !!respondingAlertId;

  const [selectedAnimal, setSelectedAnimal] = useState<AnimalPin>(TRACKED_PINS[0]);
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'GEOFENCE' | 'HABITATION'>('ALL');

  const handleDispatch = () => {
    Alert.alert(
      'Patrol Dispatch',
      `Dispatching Patrol Unit 4 to ${selectedAnimal.name} at coordinates (${selectedAnimal.lat.toFixed(4)}, ${selectedAnimal.lng.toFixed(4)}).`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => isResponding ? router.back() : router.push('/dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <WildTrailBrand light title={isResponding ? 'Responding to Alert' : 'Live Wildlife Map'} />
            <Text style={styles.headerSubtitle}>{isResponding ? '' : 'Sector 4 GPS Radar • 14 Collars'}</Text>
          </View>
        </View>

        {!isResponding && (
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => Alert.alert('GPS Calibrated', 'Collared telemetry refreshed via LoRa Gateway #4.')}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Toolbar or Responding Card */}
      {isResponding ? (
        <View style={styles.respondingToolbar}>
          <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asian_elephant_-_melbourne_zoo.jpg/320px-Asian_elephant_-_melbourne_zoo.jpg'}} style={styles.respondAnimalImg} />
          <View style={styles.respondAnimalInfo}>
            <Text style={styles.respondAnimalId}>Elephant E-014</Text>
            <Text style={styles.respondSpecies}>Asian Elephant</Text>
          </View>
          <View style={styles.respondStatusBadge}>
            <Text style={styles.respondStatusLabel}>Status</Text>
            <Text style={styles.respondStatusText}>ACKNOWLEDGED</Text>
          </View>
        </View>
      ) : (
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.toolChip, activeLayer === 'ALL' && styles.toolChipActive]}
            onPress={() => setActiveLayer('ALL')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="layers-outline"
              size={14}
              color={activeLayer === 'ALL' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.toolChipText,
                activeLayer === 'ALL' && styles.toolChipTextActive,
              ]}
            >
              All Animals ({TRACKED_PINS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, activeLayer === 'GEOFENCE' && styles.toolChipActive]}
            onPress={() => setActiveLayer('GEOFENCE')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={activeLayer === 'GEOFENCE' ? '#FFFFFF' : '#DC2626'}
            />
            <Text
              style={[
                styles.toolChipText,
                activeLayer === 'GEOFENCE' && styles.toolChipTextActive,
              ]}
            >
              Geofence Risk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, activeLayer === 'HABITATION' && styles.toolChipActive]}
            onPress={() => setActiveLayer('HABITATION')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="home-outline"
              size={14}
              color={activeLayer === 'HABITATION' ? '#FFFFFF' : '#D97706'}
            />
            <Text
              style={[
                styles.toolChipText,
                activeLayer === 'HABITATION' && styles.toolChipTextActive,
              ]}
            >
              Habitations
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Interactive Map Visual Simulation Canvas */}
      <View style={styles.mapCanvas}>
        {/* Background Grid Pattern */}
        <View style={styles.gridOverlay}>
          {/* Geofence Zone B (Danger/Red) */}
          <View style={styles.geofenceDangerZone}>
            <View style={styles.zoneTagDanger}>
              <Text style={styles.zoneTagText}>ZONE B: FARMLAND BUFFER (BREACH)</Text>
            </View>
          </View>

          {/* Core Forest Sanctuary Zone (Green) */}
          {!isResponding && (
            <View style={styles.sanctuaryZone}>
              <Text style={styles.sanctuaryZoneText}>SECTOR 4 FOREST RESERVE</Text>
            </View>
          )}

          {/* Interactive Map Animal Pins */}
          {TRACKED_PINS.map((pin, index) => {
            if (isResponding && pin.id !== '1') return null; // Only show E-014 if responding

            const isSelected = selectedAnimal.id === pin.id;
            // Preset relative positions on visual map
            const positions: { top: '24%' | '48%' | '68%'; left: '26%' | '62%' | '38%' }[] = [
              { top: '24%', left: '26%' },
              { top: '48%', left: '62%' },
              { top: '68%', left: '38%' },
            ];
            
            // Adjust position for responding view
            const pos = isResponding ? { top: '35%' as const, left: '50%' as const } : (positions[index] || { top: '50%' as const, left: '50%' as const });

            return (
              <View key={pin.id} style={[styles.animalPinWrap, pos, { zIndex: 20 }]}>
                {isResponding && (
                  <View style={styles.respondingTooltip}>
                    <Text style={styles.tooltipTitle}>{pin.name}</Text>
                    <Text style={styles.tooltipTime}>07:47 PM</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.pinBubble,
                    pin.risk === 'HIGH'
                      ? styles.pinHigh
                      : pin.risk === 'MEDIUM'
                      ? styles.pinMed
                      : styles.pinLow,
                    !isResponding && isSelected && styles.pinSelected,
                  ]}
                  onPress={() => setSelectedAnimal(pin)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="paw" size={14} color="#FFFFFF" />
                  {!isResponding && (
                    <Text style={styles.pinName}>{pin.name.replace('Elephant ', 'E-').replace('Leopard ', 'L-')}</Text>
                  )}
                </TouchableOpacity>
                {!isResponding && isSelected && <View style={styles.pinPulseRing} />}
              </View>
            );
          })}

          {/* Ranger Patrol Unit Pin */}
          <View style={[styles.animalPinWrap, isResponding ? { top: '65%', left: '35%', zIndex: 10 } : { top: '35%', left: '72%', zIndex: 10 }]}>
            {isResponding && (
              <View style={styles.respondingTooltip}>
                <Text style={styles.tooltipTitle}>You</Text>
                <Text style={styles.tooltipTime}>En route</Text>
              </View>
            )}
            <View style={isResponding ? styles.rangerPinBubbleResponding : styles.rangerPinBubble}>
              {isResponding ? (
                <View style={styles.rangerDot} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
                  <Text style={styles.pinName}>Patrol 4</Text>
                </>
              )}
            </View>
          </View>

          {/* Simulated Route Line */}
          {isResponding && (
            <View style={styles.simulatedRoute}>
              {/* This represents a visual dashed line connecting the Ranger to the Elephant */}
              <View style={styles.dashLineWrap}>
                <View style={styles.dashLine} />
              </View>
            </View>
          )}

        </View>

        {/* Map Legend */}
        {!isResponding && (
          <View style={styles.legendCard}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.legendText}>High Risk Breach</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.legendText}>Buffer Zone</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
              <Text style={styles.legendText}>Ranger Patrol</Text>
            </View>
          </View>
        )}
        
        {/* Responding Legend */}
        {isResponding && (
          <View style={styles.respondingLegend}>
            <View style={styles.respondingLegendCol}>
              <View style={styles.legendItem}>
                <Ionicons name="paw" size={14} color="#DC2626" />
                <Text style={styles.legendText}>Elephant Location</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendDashedBox} />
                <Text style={styles.legendText}>Risk Zone Boundary</Text>
              </View>
            </View>
            <View style={styles.respondingLegendCol}>
              <View style={styles.legendItem}>
                <View style={styles.rangerLegendDot} />
                <Text style={styles.legendText}>Ranger Location (You)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.routeLegendDash} />
                <Text style={styles.legendText}>Suggested Route</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Panel */}
      {isResponding ? (
        <View style={styles.trackingPanel}>
          <View style={styles.trackingMetricsRow}>
            <View style={styles.trackingMetric}>
              <View style={styles.trackingIconWrap}>
                <Ionicons name="time-outline" size={20} color="#4B5563" />
              </View>
              <View>
                <Text style={styles.trackingLabel}>Last Animal Update</Text>
                <Text style={styles.trackingVal}>18 May 2025, 07:47 PM</Text>
              </View>
            </View>
            <View style={styles.trackingMetric}>
              <View style={styles.trackingIconWrap}>
                <Ionicons name="location-outline" size={20} color="#1F2937" />
              </View>
              <View>
                <Text style={styles.trackingLabel}>Distance to Animal</Text>
                <Text style={styles.trackingVal}>1.8 km</Text>
              </View>
            </View>
          </View>
          <View style={styles.liveTrackingBanner}>
            <Ionicons name="wifi" size={24} color="#166534" />
            <View>
              <Text style={styles.liveTrackingTitle}>Live tracking active</Text>
              <Text style={styles.liveTrackingSub}>Receiving location updates...</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailTitle}>{selectedAnimal.name}</Text>
                <View
                  style={[
                    styles.riskBadge,
                    selectedAnimal.risk === 'HIGH'
                      ? styles.riskBadgeHigh
                      : selectedAnimal.risk === 'MEDIUM'
                      ? styles.riskBadgeMed
                      : styles.riskBadgeLow,
                  ]}
                >
                  <Text style={styles.riskBadgeText}>{selectedAnimal.risk} RISK</Text>
                </View>
              </View>
              <Text style={styles.detailSpecies}>{selectedAnimal.species} • {selectedAnimal.zone}</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Speed & Heading</Text>
              <Text style={styles.metricItemVal}>{selectedAnimal.speed}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Collar Battery</Text>
              <Text style={styles.metricItemVal}>{selectedAnimal.battery}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Last Uplink</Text>
              <Text style={styles.metricItemVal}>{selectedAnimal.lastPing}</Text>
            </View>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleDispatch}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Dispatch Rapid Response</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push('/alerts')}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle-outline" size={16} color={Colors.light.primaryDark} />
              <Text style={styles.secondaryActionText}>Alert Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  toolChipActive: {
    backgroundColor: Colors.light.primaryDark,
  },
  toolChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  toolChipTextActive: {
    color: '#FFFFFF',
  },

  // Responding Toolbar
  respondingToolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  respondAnimalImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  respondAnimalInfo: {
    flex: 1,
  },
  respondAnimalId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  respondSpecies: {
    fontSize: 12,
    color: '#4B5563',
  },
  respondStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  respondStatusLabel: {
    fontSize: 10,
    color: '#059669',
    marginBottom: 2,
  },
  respondStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },

  // Map Canvas
  mapCanvas: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#869F67', // slightly darker green for responding
  },
  geofenceDangerZone: {
    position: 'absolute',
    top: '12%',
    left: '10%',
    width: '60%',
    height: '45%',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    padding: 8,
    transform: [{ rotate: '-5deg' }],
  },
  zoneTagDanger: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  zoneTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sanctuaryZone: {
    position: 'absolute',
    bottom: '8%',
    right: '8%',
    width: '54%',
    height: '42%',
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'flex-end',
  },
  sanctuaryZoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },

  animalPinWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinHigh: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinMed: {
    backgroundColor: '#D97706',
  },
  pinLow: {
    backgroundColor: '#059669',
  },
  pinSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  pinName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pinPulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DC2626',
    opacity: 0.6,
  },
  rangerPinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  rangerPinBubbleResponding: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rangerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  respondingTooltip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  tooltipTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  tooltipTime: {
    fontSize: 9,
    color: '#6B7280',
  },
  simulatedRoute: {
    position: 'absolute',
    top: '38%',
    left: '37%',
    width: '13%',
    height: '27%',
  },
  dashLineWrap: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderStyle: 'dashed',
    transform: [{ rotate: '30deg' }],
  },
  dashLine: {
    position: 'absolute',
  },
  
  legendCard: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  respondingLegend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  respondingLegendCol: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  legendDashedBox: {
    width: 14,
    height: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  rangerLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  routeLegendDash: {
    width: 14,
    borderTopWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },

  // Detail Card
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailHeader: {
    marginBottom: 12,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  detailSpecies: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  riskBadgeHigh: {
    backgroundColor: '#DC2626',
  },
  riskBadgeMed: {
    backgroundColor: '#D97706',
  },
  riskBadgeLow: {
    backgroundColor: '#059669',
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricItem: {
    flex: 1,
  },
  metricItemLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },

  detailActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    borderWidth: 1.5,
    borderColor: Colors.light.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  secondaryActionText: {
    color: Colors.light.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },

  // Tracking Panel (Responding)
  trackingPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  trackingMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  trackingMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trackingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  trackingVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  liveTrackingBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveTrackingTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '700',
  },
  liveTrackingSub: {
    color: '#047857',
    fontSize: 12,
    marginTop: 2,
  },
});
