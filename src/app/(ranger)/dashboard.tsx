import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

import { AssignedPatrol } from '../../types/patrol';
import { patrolApiService, MOCK_ASSIGNED_PATROLS } from '../../services/api/patrols';

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
  const [assignedPatrols, setAssignedPatrols] = useState<AssignedPatrol[]>(MOCK_ASSIGNED_PATROLS);
  const [showAllPatrols, setShowAllPatrols] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<AssignedPatrol | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPatrols = async () => {
      try {
        const response = await patrolApiService.getRangerAssignedPatrols('R001');
        if (isMounted && response.data && response.data.length > 0) {
          setAssignedPatrols(response.data);
        }
      } catch {
        // Fall back to MOCK_ASSIGNED_PATROLS
      }
    };
    fetchPatrols();
    return () => {
      isMounted = false;
    };
  }, []);

  const visiblePatrols = showAllPatrols ? assignedPatrols : assignedPatrols.slice(0, 1);

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
      <StatusBar backgroundColor="#0F1D17" barStyle="light-content" />

      {/* Top Application Header (Dark WildGuard Header) */}
      <View style={styles.darkHeader}>
        <View style={styles.darkHeaderLeft}>
          <View style={styles.shieldIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color="#4ADE80" />
          </View>
          <View>
            <Text style={styles.darkHeaderTitle}>WILDGUARD</Text>
            <Text style={styles.darkHeaderSubtitle}>Yala NP Anti-Poaching System</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.syncedPillBtn} activeOpacity={0.8}>
          <Ionicons name="sync-outline" size={15} color="#A7F3D0" />
          <Text style={styles.syncedPillText}>Synced</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* On-Duty Ranger Profile Card */}
        <View style={styles.rangerProfileCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
            }}
            style={styles.rangerAvatar}
          />
          <View style={styles.rangerProfileInfo}>
            <Text style={styles.rangerProfileLabel}>ON-DUTY RANGER</Text>
            <Text style={styles.rangerProfileName}>Ranger Nimal</Text>
          </View>
        </View>

        {/* Assigned Patrols List */}
        {visiblePatrols.map((patrol) => (
          <View key={patrol.id} style={styles.assignedPatrolCard}>
            <View style={styles.assignedPatrolHeader}>
              <View style={styles.badgeAndStatusRow}>
                <View style={styles.assignedPatrolBadge}>
                  <Text style={styles.assignedPatrolBadgeText}>{patrol.id}</Text>
                </View>
                <View
                  style={[
                    styles.priorityTag,
                    patrol.priority === 'HIGH'
                      ? styles.priorityTagHigh
                      : patrol.priority === 'MEDIUM'
                      ? styles.priorityTagMedium
                      : styles.priorityTagLow,
                  ]}
                >
                  <Text style={styles.priorityTagText}>{patrol.priority} PRIORITY</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewPatrolBtn}
                onPress={() => setSelectedPatrol(patrol)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={15} color="#4ADE80" />
                <Text style={styles.viewPatrolBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.patrolFieldGroup}>
              <Text style={styles.patrolFieldLabel}>NATIONAL PARK</Text>
              <Text style={styles.patrolFieldValueMain}>{patrol.park}</Text>
            </View>

            <View style={styles.patrolFieldGroup}>
              <Text style={styles.patrolFieldLabel}>ACTIVE SECTOR ROUTE</Text>
              <Text style={styles.patrolFieldValueSub}>{patrol.name}</Text>
            </View>

            <View style={styles.patrolFieldGroup}>
              <Text style={styles.patrolFieldLabel}>SCHEDULE WINDOW</Text>
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                <Text style={styles.scheduleText}>
                  {patrol.startTime} ({patrol.duration} hrs) • {patrol.date}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Show All Assigned Patrols Toggle Button */}
        {assignedPatrols.length > 1 && (
          <TouchableOpacity
            style={styles.showAllPatrolsBtn}
            onPress={() => setShowAllPatrols(!showAllPatrols)}
            activeOpacity={0.8}
          >
            <Text style={styles.showAllPatrolsText}>
              {showAllPatrols
                ? 'Hide Additional Patrols'
                : `Show All Assigned Patrols (${assignedPatrols.length})`}
            </Text>
            <Ionicons
              name={showAllPatrols ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#4ADE80"
            />
          </TouchableOpacity>
        )}

        {/* System Status Grid (GPS & Offline Sync) */}
        <View style={styles.statusGridRow}>
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.greenStatusDot} />
              <Text style={styles.statusCardLabel}>GPS STATUS</Text>
            </View>
            <Text style={styles.statusCardValue}>GPS Ready</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.greenStatusDot} />
              <Text style={styles.statusCardLabel}>OFFLINE SYNC</Text>
            </View>
            <Text style={styles.statusCardValue}>Network OK</Text>
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

      {/* Patrol Details Modal */}
      <Modal
        visible={selectedPatrol !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPatrol(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="shield-checkmark" size={22} color="#4ADE80" />
                <Text style={styles.modalTitle}>Patrol Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPatrol(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedPatrol && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalStatusRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRouteTitle}>{selectedPatrol.name}</Text>
                    <Text style={styles.modalPatrolIdText}>{selectedPatrol.id}</Text>
                  </View>
                  <View
                    style={[
                      styles.priorityTag,
                      selectedPatrol.priority === 'HIGH'
                        ? styles.priorityTagHigh
                        : selectedPatrol.priority === 'MEDIUM'
                        ? styles.priorityTagMedium
                        : styles.priorityTagLow,
                    ]}
                  >
                    <Text style={styles.priorityTagText}>{selectedPatrol.priority} PRIORITY</Text>
                  </View>
                </View>

                <View style={styles.modalDetailGroup}>
                  <Text style={styles.modalDetailLabel}>NATIONAL PARK</Text>
                  <Text style={styles.modalDetailValue}>{selectedPatrol.park}</Text>
                </View>

                <View style={styles.modalDetailGroup}>
                  <Text style={styles.modalDetailLabel}>SCHEDULE & DURATION</Text>
                  <Text style={styles.modalDetailValue}>
                    Date: {selectedPatrol.date} • Start Time: {selectedPatrol.startTime} ({selectedPatrol.duration} hours)
                  </Text>
                </View>

                <View style={styles.modalDetailGroup}>
                  <Text style={styles.modalDetailLabel}>PATROL STATUS</Text>
                  <Text style={styles.modalDetailValue}>{selectedPatrol.status}</Text>
                </View>

                {/* Mapbox Route Preview Card */}
                <View style={styles.mapboxMapContainer}>
                  <View style={styles.mapboxHeaderRow}>
                    <View style={styles.mapboxTag}>
                      <Ionicons name="map-outline" size={13} color="#4ADE80" />
                      <Text style={styles.mapboxTagText}>MAPBOX ASSIGNED ROUTE</Text>
                    </View>
                    <Text style={styles.mapboxDistText}>
                      {selectedPatrol.route.length} Waypoints • Est. ~4.8 km
                    </Text>
                  </View>

                  <View style={styles.mapboxCanvas}>
                    {/* Grid/Terrain Overlay */}
                    <View style={styles.mapTerrainGrid} />

                    {/* Polyline Route Connections */}
                    <View style={styles.routePolylineSegment1} />
                    <View style={styles.routePolylineSegment2} />

                    {/* Start Waypoint Pin */}
                    <View style={[styles.mapMarkerPin, { top: '65%', left: '18%' }]}>
                      <View style={styles.startMarkerCircle}>
                        <Text style={styles.markerText}>START</Text>
                      </View>
                      <Text style={styles.markerCoordSub}>
                        {selectedPatrol.route[0]
                          ? `${selectedPatrol.route[0][1].toFixed(3)}°, ${selectedPatrol.route[0][0].toFixed(3)}°`
                          : ''}
                      </Text>
                    </View>

                    {/* Mid Waypoint Pin */}
                    {selectedPatrol.route.length > 1 && (
                      <View style={[styles.mapMarkerPin, { top: '42%', left: '50%' }]}>
                        <View style={styles.midMarkerCircle}>
                          <Ionicons name="location" size={12} color="#FFFFFF" />
                        </View>
                      </View>
                    )}

                    {/* End Waypoint Pin */}
                    {selectedPatrol.route.length > 2 && (
                      <View style={[styles.mapMarkerPin, { top: '20%', left: '78%' }]}>
                        <View style={styles.endMarkerCircle}>
                          <Text style={styles.markerText}>END</Text>
                        </View>
                        <Text style={styles.markerCoordSub}>
                          {selectedPatrol.route[selectedPatrol.route.length - 1][1].toFixed(3)}°,{' '}
                          {selectedPatrol.route[selectedPatrol.route.length - 1][0].toFixed(3)}°
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.modalDetailGroup}>
                  <Text style={styles.modalDetailLabel}>
                    PLANNED ROUTE WAYPOINTS ({selectedPatrol.route.length})
                  </Text>
                  {selectedPatrol.route.map((coord, idx) => (
                    <Text key={idx} style={styles.modalRouteCoordText}>
                      📍 Waypoint {idx + 1}: {coord[1].toFixed(4)}° N, {coord[0].toFixed(4)}° E
                    </Text>
                  ))}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.startPatrolModalBtn}
                onPress={() => {
                  if (selectedPatrol) {
                    const targetPatrol = selectedPatrol;
                    setSelectedPatrol(null);
                    router.push({
                      pathname: '/patrol',
                      params: {
                        patrolId: targetPatrol.id,
                        patrolName: targetPatrol.name,
                        park: targetPatrol.park,
                        priority: targetPatrol.priority,
                        routeCoords: JSON.stringify(targetPatrol.route),
                      },
                    });
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="footsteps" size={18} color="#FFFFFF" />
                <Text style={styles.startPatrolModalBtnText}>Start Patrol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setSelectedPatrol(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeModalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0C1812',
  },

  // Dark WildGuard Header Bar
  darkHeader: {
    backgroundColor: '#0F1D17',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  darkHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1C3529',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#294B3B',
  },
  darkHeaderTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  darkHeaderSubtitle: {
    fontSize: 12,
    color: '#8EA69A',
    fontWeight: '500',
    marginTop: 1,
  },
  syncedPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3529',
    borderWidth: 1,
    borderColor: '#294B3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  syncedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
  },

  // Scroll Container
  scroll: {
    padding: 16,
    paddingBottom: 28,
  },

  // Ranger Profile Card
  rangerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16271F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#223B2E',
    padding: 14,
    marginBottom: 12,
  },
  rangerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#4ADE80',
    marginRight: 14,
  },
  rangerProfileInfo: {
    justifyContent: 'center',
  },
  rangerProfileLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8EA69A',
  },
  rangerProfileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },

  // Assigned Patrol Card
  assignedPatrolCard: {
    backgroundColor: '#16271F',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#244234',
    padding: 18,
    marginBottom: 12,
  },
  assignedPatrolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignedPatrolBadge: {
    backgroundColor: '#20392C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2B4D3C',
  },
  assignedPatrolBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#A7F3D0',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityTagHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  priorityTagMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  priorityTagLow: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  viewPatrolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20392C',
    borderWidth: 1,
    borderColor: '#2B4D3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  viewPatrolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ADE80',
  },
  showAllPatrolsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16271F',
    borderWidth: 1,
    borderColor: '#223B2E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 6,
  },
  showAllPatrolsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
  },
  patrolFieldGroup: {
    marginTop: 10,
  },
  patrolFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8EA69A',
  },
  patrolFieldValueMain: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
  },
  patrolFieldValueSub: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  scheduleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: '#16271F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#294B3B',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#223B2E',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#20392C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    marginBottom: 16,
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalRouteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalPatrolIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ADE80',
    marginTop: 2,
  },
  modalDetailGroup: {
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8EA69A',
  },
  modalDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  modalNotesValue: {
    fontSize: 14,
    color: '#A7F3D0',
    marginTop: 4,
    lineHeight: 20,
    backgroundColor: '#0F1D17',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#223B2E',
  },
  // Mapbox Route Preview Styles
  mapboxMapContainer: {
    backgroundColor: '#0F1D17',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#294B3B',
    padding: 12,
    marginVertical: 12,
  },
  mapboxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapboxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mapboxTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#4ADE80',
  },
  mapboxDistText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8EA69A',
  },
  mapboxCanvas: {
    height: 150,
    backgroundColor: '#162C21',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#223B2E',
  },
  mapTerrainGrid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
    backgroundColor: '#0F1D17',
  },
  routePolylineSegment1: {
    position: 'absolute',
    top: '55%',
    left: '22%',
    width: '32%',
    height: 3,
    backgroundColor: '#4ADE80',
    transform: [{ rotate: '-25deg' }],
  },
  routePolylineSegment2: {
    position: 'absolute',
    top: '32%',
    left: '52%',
    width: '30%',
    height: 3,
    backgroundColor: '#4ADE80',
    transform: [{ rotate: '-35deg' }],
  },
  mapMarkerPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  startMarkerCircle: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  midMarkerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  endMarkerCircle: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  markerText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  markerCoordSub: {
    fontSize: 9,
    color: '#A7F3D0',
    marginTop: 2,
    fontWeight: '600',
  },
  modalRouteCoordText: {
    fontSize: 13,
    color: '#A7F3D0',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalFooter: {
    gap: 10,
  },
  startPatrolModalBtn: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startPatrolModalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeModalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#223B2E',
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  // System Status Grid
  statusGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#16271F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#223B2E',
    padding: 14,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statusCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8EA69A',
  },
  statusCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
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
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8EA69A',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 13,
    color: '#4ADE80',
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
