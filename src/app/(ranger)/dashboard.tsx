import { useRangerIdentity } from '../../hooks/useRangerIdentity';
import { RangerAvatar } from '../../components/RangerAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WildTrailBrand } from '../../components/WildTrailBrand';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { PatrolRouteMap } from '../../components/manager/PatrolRouteMap';

import { AssignedPatrol, RangerStatus } from '../../types/patrol';
import { patrolApiService, MOCK_ASSIGNED_PATROLS } from '../../services/api/patrols';
import { offlineSyncService } from '../../services/api/offlineSync';

export default function DashboardScreen() {
  const router = useRouter();
  const identity = useRangerIdentity();
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [assignedPatrols, setAssignedPatrols] = useState<AssignedPatrol[]>(MOCK_ASSIGNED_PATROLS);
  const [showAllPatrols, setShowAllPatrols] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<AssignedPatrol | null>(null);
  const [rangerStatus, setRangerStatus] = useState<RangerStatus>('AVAILABLE');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const fetchPatrols = async () => {
    try {
      const status = await patrolApiService.getRangerStatus();
      setRangerStatus(status);

      const queue = await offlineSyncService.getQueue();
      const pending = queue.filter((item) => item.status === 'PENDING_SYNC').length;
      setPendingSyncCount(pending);

      const response = await patrolApiService.getRangerAssignedPatrols('R001');
      if (response.data && response.data.length > 0) {
        setAssignedPatrols(response.data);
      }
    } catch {
      // Fall back to MOCK_ASSIGNED_PATROLS
    }
  };

  const handleSyncNow = async () => {
    const { syncedCount } = await offlineSyncService.syncPendingItems();
    await fetchPatrols();
    if (Platform.OS === 'web') {
      window.alert(`Sync completed! ${syncedCount} item(s) uploaded (Status: SUBMITTED).`);
    } else {
      Alert.alert('Sync Complete', `Uploaded ${syncedCount} item(s) to remote server (Status: SUBMITTED).`);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPatrols();
    }, [])
  );

  const visiblePatrols = showAllPatrols ? assignedPatrols : assignedPatrols.slice(0, 1);

  const handleStartPatrol = async (patrol: AssignedPatrol) => {
    const session = await patrolApiService.startPatrolSession(patrol);
    setRangerStatus('ON_PATROL');
    setSelectedPatrol(null);

    router.push({
      pathname: '/patrol',
      params: {
        sessionId: session.sessionId,
        patrolId: session.patrolId,
        patrolName: session.patrolName,
        park: session.park,
        priority: session.priority,
        startTime: session.startTime,
        routeCoords: JSON.stringify(session.routeCoords),
      },
    });
  };

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#FAFBF7" barStyle="dark-content" />

      {/* Top Application Header (Dark WildGuard Header) */}
      <View style={styles.darkHeader}>
        <View style={styles.darkHeaderLeft}>
          <WildTrailBrand light title="Ranger Operations" />
        </View>

        <TouchableOpacity style={styles.syncedPillBtn} activeOpacity={0.8}>
          <Ionicons name="sync-outline" size={15} color="#FFFFFF" />
          <Text style={styles.syncedPillText}>Synced</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* On-Duty Ranger Profile Card */}
        <View style={styles.rangerProfileCard}>
          <RangerAvatar name={identity.name} uri={identity.photo} />
          <View style={styles.rangerProfileInfo}>
            <View style={styles.rangerLabelRow}>
              <Text style={styles.rangerProfileLabel}>ON-DUTY RANGER</Text>
              <View
                style={[
                  styles.rangerStatusPill,
                  rangerStatus === 'ON_PATROL'
                    ? styles.rangerStatusOnPatrol
                    : rangerStatus === 'RESPONDING_TO_ALERT'
                      ? styles.rangerStatusResponding
                      : styles.rangerStatusAvailable,
                ]}
              >
                <View
                  style={[
                    styles.rangerStatusDot,
                    rangerStatus === 'ON_PATROL'
                      ? styles.rangerDotOnPatrol
                      : rangerStatus === 'RESPONDING_TO_ALERT'
                        ? styles.rangerDotResponding
                        : styles.rangerDotAvailable,
                  ]}
                />
                <Text style={styles.rangerStatusText}>{rangerStatus.replace(/_/g, ' ')}</Text>
              </View>
            </View>
            <Text style={styles.rangerProfileName}>{identity.name}</Text>
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
                <View
                  style={[
                    styles.statusTag,
                    patrol.status === 'COMPLETED'
                      ? styles.statusTagCompleted
                      : patrol.status === 'IN_PROGRESS'
                        ? styles.statusTagInProgress
                        : styles.statusTagAssigned,
                  ]}
                >
                  <Ionicons
                    name={
                      patrol.status === 'COMPLETED'
                        ? 'checkmark-circle'
                        : patrol.status === 'IN_PROGRESS'
                          ? 'radio-button-on'
                          : 'time-outline'
                    }
                    size={11}
                    color={
                      patrol.status === 'COMPLETED'
                        ? '#3B7563'
                        : patrol.status === 'IN_PROGRESS'
                          ? '#286487'
                          : '#94611B'
                    }
                  />
                  <Text
                    style={[
                      styles.statusTagText,
                      patrol.status === 'COMPLETED'
                        ? styles.statusTagTextCompleted
                        : patrol.status === 'IN_PROGRESS'
                          ? styles.statusTagTextInProgress
                          : styles.statusTagTextAssigned,
                    ]}
                  >
                    {patrol.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewPatrolBtn}
                onPress={() => setSelectedPatrol(patrol)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={15} color="#3B7563" />
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
                <Ionicons name="time-outline" size={18} color="#304C3D" />
                <Text style={styles.scheduleText}>
                  {patrol.startTime} ({patrol.duration} hrs) • {patrol.date}
                </Text>
              </View>
            </View>

            {/* Progress Bar Container */}
            <View style={styles.cardProgressContainer}>
              <View style={styles.cardProgressHeader}>
                <Text style={styles.cardProgressLabel}>ROUTE COVERAGE PROGRESS</Text>
                <Text
                  style={[
                    styles.cardProgressPctText,
                    (patrol.completionPercentage ?? 0) > 0 && (patrol.completionPercentage ?? 0) < 95
                      ? { color: '#A16B24' }
                      : (patrol.completionPercentage ?? 0) >= 95
                        ? { color: '#3B7563' }
                        : { color: '#839087' },
                  ]}
                >
                  {patrol.status === 'COMPLETED'
                    ? `${patrol.completionPercentage ?? 100}% COMPLETED`
                    : patrol.status === 'IN_PROGRESS'
                      ? 'IN PROGRESS'
                      : 'PLANNED (0%)'}
                </Text>
              </View>
              <View style={styles.cardProgressBarTrack}>
                <View
                  style={[
                    styles.cardProgressBarFill,
                    {
                      width: `${patrol.status === 'COMPLETED'
                          ? Math.min(100, patrol.completionPercentage ?? 100)
                          : patrol.status === 'IN_PROGRESS'
                            ? 45
                            : 0
                        }%`,
                      backgroundColor:
                        (patrol.completionPercentage ?? 0) > 0 && (patrol.completionPercentage ?? 0) < 95
                          ? '#A16B24'
                          : '#3B7563',
                    },
                  ]}
                />
              </View>
              <Text style={styles.cardProgressSubtext}>
                {patrol.status === 'COMPLETED'
                  ? `${patrol.completedDistanceKm ?? 0} km covered of ${patrol.plannedDistanceKm ?? 4.8} km route`
                  : `Planned total route: ~${patrol.plannedDistanceKm ?? 4.8} km`}
              </Text>
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
              color="#3B7563"
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

          <TouchableOpacity
            style={styles.statusCard}
            onPress={handleSyncNow}
            activeOpacity={0.85}
          >
            <View style={styles.statusCardHeader}>
              <View
                style={[
                  styles.greenStatusDot,
                  pendingSyncCount > 0 && { backgroundColor: '#A16B24' },
                ]}
              />
              <Text style={styles.statusCardLabel}>OFFLINE SYNC</Text>
            </View>
            <Text
              style={[
                styles.statusCardValue,
                pendingSyncCount > 0 && { color: '#A16B24' },
              ]}
            >
              {pendingSyncCount > 0 ? `${pendingSyncCount} PENDING_SYNC` : 'SUBMITTED / OK'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <TouchableOpacity style={styles.reportIncidentBtn} onPress={() => router.push('/community-operations')}>
          <Text style={styles.reportIncidentTitle}>Community Reports & Response</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportIncidentBtn}
          onPress={() => router.push('/(ranger)/incident-reports')}
          activeOpacity={0.85}
        >
          <View style={styles.reportIncidentIcon}>
            <Ionicons name="documents-outline" size={22} color={Colors.light.primaryDark} />
          </View>
          <View style={styles.reportIncidentText}>
            <Text style={styles.reportIncidentTitle}>My Incident Reports</Text>
            <Text style={styles.reportIncidentSubtitle}>View your reports and track their status</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.primaryDark} />
        </TouchableOpacity>
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
            onPress={() => router.push('/(ranger)/report-incident')}
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
          onPress={() => router.push('/(ranger)/report-incident')}
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



        {/* Ranger Shift & Equipment Status */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Ionicons name="person-circle-outline" size={24} color={Colors.light.primaryDark} />
            <Text style={styles.shiftTitle}>Duty Officer: {identity.badge} ({identity.name})</Text>
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
                <Ionicons name="shield-checkmark" size={22} color="#3B7563" />
                <Text style={styles.modalTitle}>Patrol Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPatrol(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#839087" />
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
                  <Text style={styles.modalDetailLabel}>PATROL STATUS & ROUTE COVERAGE</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedPatrol.status === 'COMPLETED'
                      ? `COMPLETED (${selectedPatrol.completionPercentage ?? 100}% of planned route)`
                      : selectedPatrol.status}
                  </Text>
                </View>

                {/* Progress Bar inside Modal */}
                <View style={[styles.cardProgressContainer, { backgroundColor: '#F0F4EB', marginBottom: 16 }]}>
                  <View style={styles.cardProgressHeader}>
                    <Text style={styles.cardProgressLabel}>COMPLETION METRIC</Text>
                    <Text
                      style={[
                        styles.cardProgressPctText,
                        (selectedPatrol.completionPercentage ?? 0) > 0 && (selectedPatrol.completionPercentage ?? 0) < 95
                          ? { color: '#A16B24' }
                          : { color: '#3B7563' },
                      ]}
                    >
                      {selectedPatrol.status === 'COMPLETED'
                        ? `${selectedPatrol.completionPercentage ?? 100}% COVERED`
                        : '0% STARTED'}
                    </Text>
                  </View>
                  <View style={styles.cardProgressBarTrack}>
                    <View
                      style={[
                        styles.cardProgressBarFill,
                        {
                          width: `${selectedPatrol.status === 'COMPLETED'
                              ? Math.min(100, selectedPatrol.completionPercentage ?? 100)
                              : 0
                            }%`,
                          backgroundColor:
                            (selectedPatrol.completionPercentage ?? 0) > 0 && (selectedPatrol.completionPercentage ?? 0) < 95
                              ? '#A16B24'
                              : '#3B7563',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.cardProgressSubtext}>
                    {selectedPatrol.status === 'COMPLETED'
                      ? `${selectedPatrol.completedDistanceKm ?? 0} km covered of ${selectedPatrol.plannedDistanceKm ?? 4.8} km route`
                      : `Planned sector distance: ~${selectedPatrol.plannedDistanceKm ?? 4.8} km`}
                  </Text>
                </View>

                {/* Mapbox Route Preview Card */}
                <View style={styles.mapboxMapContainer}>
                  <View style={styles.mapboxHeaderRow}>
                    <View style={styles.mapboxTag}>
                      <Ionicons name="map-outline" size={13} color="#3B7563" />
                      <Text style={styles.mapboxTagText}>MAPBOX ASSIGNED ROUTE</Text>
                    </View>
                    <Text style={styles.mapboxDistText}>
                      {selectedPatrol.route.length} Waypoints • Est. ~4.8 km
                    </Text>
                  </View>

                  <View style={styles.mapboxMapWrapper}>
                    <PatrolRouteMap
                      editable={false}
                      route={selectedPatrol.route.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))}
                      checkpoints={selectedPatrol.route.map(([lng, lat], idx) => ({
                        id: `cp-${idx}`,
                        label: idx === 0 ? 'START' : idx === selectedPatrol.route.length - 1 ? 'END' : `WP-${idx + 1}`,
                        latitude: lat,
                        longitude: lng,
                      }))}
                    />
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
              {selectedPatrol?.status === 'COMPLETED' ? (
                <View style={[styles.startPatrolModalBtn, styles.completedPatrolModalBtn]}>
                  <Ionicons name="checkmark-circle" size={18} color="#3B7563" />
                  <Text style={[styles.startPatrolModalBtnText, { color: '#3B7563' }]}>
                    Patrol Completed
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startPatrolModalBtn}
                  onPress={() => {
                    if (selectedPatrol) {
                      handleStartPatrol(selectedPatrol);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="footsteps" size={18} color="#FFFFFF" />
                  <Text style={styles.startPatrolModalBtnText}>Start Patrol</Text>
                </TouchableOpacity>
              )}

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
    backgroundColor: '#F5F6F0',
  },

  // Dark WildGuard Header Bar
  darkHeader: {
    backgroundColor: '#245747',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3B6A58',
  },
  darkHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF3ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDE5D9',
  },
  darkHeaderTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#304C3D',
    letterSpacing: 0.5,
  },
  darkHeaderSubtitle: {
    fontSize: 12,
    color: '#748078',
    fontWeight: '500',
    marginTop: 1,
  },
  syncedPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B6A58',
    borderWidth: 1,
    borderColor: '#527F69',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  syncedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scroll Container
  scroll: {
    padding: 20,
    paddingBottom: 32,
    alignSelf: 'center',
    maxWidth: 760,
    width: '100%',
  },

  // Ranger Profile Card
  rangerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF3E8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEE7D6',
    padding: 18,
    marginBottom: 18,
  },
  rangerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#3B7563',
    marginRight: 14,
  },
  rangerProfileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  rangerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  rangerProfileLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: '#748078',
  },
  rangerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  rangerStatusAvailable: {
    backgroundColor: '#EBF3ED',
    borderColor: '#3B7563',
  },
  rangerStatusOnPatrol: {
    backgroundColor: '#FBF0DC',
    borderColor: '#A16B24',
  },
  rangerStatusResponding: {
    backgroundColor: '#FCECE7',
    borderColor: '#EF4444',
  },
  rangerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rangerDotAvailable: {
    backgroundColor: '#3B7563',
  },
  rangerDotOnPatrol: {
    backgroundColor: '#A16B24',
  },
  rangerDotResponding: {
    backgroundColor: '#EF4444',
  },
  rangerStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#304C3D',
    letterSpacing: 0.5,
  },
  rangerProfileName: {
    fontSize: 23,
    fontWeight: '700',
    color: '#304C3D',
    marginTop: 7,
    letterSpacing: -0.4,
  },

  // Assigned Patrol Card
  assignedPatrolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#193D30',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
  },
  assignedPatrolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  assignedPatrolBadge: {
    backgroundColor: '#EBF3ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE5D9',
  },
  assignedPatrolBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#245747',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityTagHigh: {
    backgroundColor: '#FCECE7',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  priorityTagMedium: {
    backgroundColor: '#FBF0DC',
    borderWidth: 1,
    borderColor: '#A16B24',
  },
  priorityTagLow: {
    backgroundColor: '#EBF3ED',
    borderWidth: 1,
    borderColor: '#3B7563',
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#304C3D',
    letterSpacing: 0.5,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  statusTagCompleted: {
    backgroundColor: '#EBF3ED',
    borderColor: '#3B7563',
  },
  statusTagInProgress: {
    backgroundColor: '#E8F2F8',
    borderColor: '#286487',
  },
  statusTagAssigned: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#94611B',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTagTextCompleted: {
    color: '#3B7563',
  },
  statusTagTextInProgress: {
    color: '#286487',
  },
  statusTagTextAssigned: {
    color: '#94611B',
  },
  cardProgressContainer: {
    marginTop: 18,
    backgroundColor: '#F5F7F1',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8DE',
  },
  cardProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  cardProgressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#748078',
    letterSpacing: 0.8,
  },
  cardProgressPctText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardProgressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8DE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardProgressSubtext: {
    fontSize: 11,
    color: '#748078',
    marginTop: 5,
  },
  completedPatrolModalBtn: {
    backgroundColor: '#EBF3ED',
    borderColor: '#3B7563',
    borderWidth: 1,
  },
  viewPatrolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3ED',
    borderWidth: 1,
    borderColor: '#DDE5D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  viewPatrolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B7563',
  },
  showAllPatrolsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8DE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 6,
  },
  showAllPatrolsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B7563',
  },
  patrolFieldGroup: {
    marginTop: 14,
  },
  patrolFieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#748078',
  },
  patrolFieldValueMain: {
    fontSize: 21,
    fontWeight: '700',
    color: '#304C3D',
    marginTop: 5,
  },
  patrolFieldValueSub: {
    fontSize: 16,
    fontWeight: '600',
    color: '#304C3D',
    marginTop: 5,
    lineHeight: 23,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#304C3D',
    fontFamily: 'System',
    flexShrink: 1,
    lineHeight: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE5D9',
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
    borderBottomColor: '#E2E8DE',
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
    color: '#304C3D',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF3ED',
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
    color: '#304C3D',
  },
  modalPatrolIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B7563',
    marginTop: 2,
  },
  modalDetailGroup: {
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#748078',
  },
  modalDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#304C3D',
    marginTop: 2,
  },
  modalNotesValue: {
    fontSize: 14,
    color: '#245747',
    marginTop: 4,
    lineHeight: 20,
    backgroundColor: '#FAFBF7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8DE',
  },
  // Mapbox Route Preview Styles
  mapboxMapContainer: {
    backgroundColor: '#FAFBF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE5D9',
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
    color: '#3B7563',
  },
  mapboxDistText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#748078',
  },
  mapboxMapWrapper: {
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  mapboxCanvas: {
    height: 150,
    backgroundColor: '#F0F4EB',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8DE',
  },
  mapTerrainGrid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
    backgroundColor: '#FAFBF7',
  },
  routePolylineSegment1: {
    position: 'absolute',
    top: '55%',
    left: '22%',
    width: '32%',
    height: 3,
    backgroundColor: '#3B7563',
    transform: [{ rotate: '-25deg' }],
  },
  routePolylineSegment2: {
    position: 'absolute',
    top: '32%',
    left: '52%',
    width: '30%',
    height: 3,
    backgroundColor: '#3B7563',
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
    color: '#304C3D',
  },
  markerCoordSub: {
    fontSize: 9,
    color: '#245747',
    marginTop: 2,
    fontWeight: '600',
  },
  modalRouteCoordText: {
    fontSize: 13,
    color: '#245747',
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
    borderColor: '#E2E8DE',
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#839087',
  },

  // System Status Grid
  statusGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    padding: 16,
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
    backgroundColor: '#3B7563',
  },
  statusCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#748078',
  },
  statusCardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#304C3D',
    marginTop: 10,
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
    color: '#304C3D',
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
    marginTop: 14,
    marginBottom: 16,
    gap: 6,
    flexWrap: 'wrap',
  },
  // Incident reporting entry point
  reportIncidentBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DEE6D8',
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
  },
  reportIncidentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportIncidentText: {
    flex: 1,
  },
  reportIncidentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#304C3D',
    lineHeight: 21,
  },
  reportIncidentSubtitle: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 4,
    lineHeight: 19,
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
    fontSize: 19,
    fontWeight: '700',
    color: '#304C3D',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#748078',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 13,
    color: '#3B7563',
    fontWeight: '700',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    shadowColor: '#193D30',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 0,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#304C3D',
    lineHeight: 21,
  },
  actionDesc: {
    fontSize: 12,
    color: '#748078',
    marginTop: 6,
    lineHeight: 19,
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
    color: '#304C3D',
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
    color: '#839087',
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
    color: '#304C3D',
  },

  // Shift info card
  shiftCard: {
    backgroundColor: '#EDF3E8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DEE7D6',
    padding: 18,
    marginTop: 8,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primaryDark,
    lineHeight: 20,
    flex: 1,
  },
  shiftText: {
    fontSize: 12,
    color: '#687B70',
    lineHeight: 20,
  },
});
