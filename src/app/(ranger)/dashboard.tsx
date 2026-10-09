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
import { StaffUser } from '../../types/user';
import { patrolApiService, MOCK_ASSIGNED_PATROLS } from '../../services/api/patrols';
import { offlineSyncService } from '../../services/api/offlineSync';
import { storageService } from '../../storage/asyncStorage';
import { STORAGE_KEYS } from '../../storage/keys';

export default function DashboardScreen() {
  const router = useRouter();
  const identity = useRangerIdentity();
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [assignedPatrols, setAssignedPatrols] = useState<AssignedPatrol[]>(MOCK_ASSIGNED_PATROLS);
  const [showAllPatrols, setShowAllPatrols] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<AssignedPatrol | null>(null);
  const [rangerStatus, setRangerStatus] = useState<RangerStatus>('AVAILABLE');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [userProfile, setUserProfile] = useState<StaffUser | null>(null);

  const fetchPatrols = async () => {
    try {
      const status = await patrolApiService.getRangerStatus();
      setRangerStatus(status);

      const profile = await storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE);
      if (profile) {
        setUserProfile(profile);
      }

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
          <View style={styles.avatarWrapper}>
            <RangerAvatar name={identity.name} uri={identity.photo} size={54} />
          </View>
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

        {/* Quick Operations & Incident Cards */}
        <TouchableOpacity
          style={styles.reportIncidentBtn}
          onPress={() => router.push('/community-operations')}
          activeOpacity={0.85}
        >
          <View style={styles.reportIncidentIcon}>
            <Ionicons name="people-outline" size={22} color={Colors.light.primaryDark} />
          </View>
          <View style={styles.reportIncidentText}>
            <Text style={styles.reportIncidentTitle}>Community Reports & Response</Text>
            <Text style={styles.reportIncidentSubtitle}>Manage community alerts and field operations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.primaryDark} />
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
            <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="footsteps" size={24} color="#047857" />
            </View>
            <Text style={styles.actionTitle}>Start GPS Patrol</Text>
            <Text style={styles.actionDesc}>Record track points & ranger route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(ranger)/report-incident')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="camera" size={24} color="#047857" />
            </View>
            <Text style={styles.actionTitle}>Report Incident</Text>
            <Text style={styles.actionDesc}>Poaching, snares & crop damage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/map')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="map" size={24} color="#0284C7" />
            </View>
            <Text style={styles.actionTitle}>Live Animal Map</Text>
            <Text style={styles.actionDesc}>GPS collars & geofence zones</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleBroadcastAlert}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="megaphone" size={24} color="#DC2626" />
            </View>
            <Text style={styles.actionTitle}>
              {broadcastSent ? 'Broadcast Sent' : 'Community Siren'}
            </Text>
            <Text style={styles.actionDesc}>Instant warning SMS to villagers</Text>
          </TouchableOpacity>
        </View>



        {/* Ranger Shift & Equipment Status */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Ionicons name="person-circle-outline" size={24} color={Colors.light.primaryDark} />
            <Text style={styles.shiftTitle}>Duty Officer: {identity.badge} ({identity.name})</Text>
          </View>
          <Text style={styles.shiftText}>
            Assigned: {userProfile?.parkId ? userProfile.parkId.toUpperCase() : 'YALA'} NP {userProfile?.zoneId ? userProfile.zoneId.toUpperCase() : 'BLOCK 01'} • Base Radio VHF Channel 12 • SOS Emergency Active
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
    backgroundColor: '#F3F6F3',
  },

  // Dark WildGuard Header Bar (Deep Emerald Operations Theme)
  darkHeader: {
    backgroundColor: '#11382B',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1B4D3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  darkHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncedPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  syncedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E6F4EA',
    letterSpacing: 0.3,
  },

  // Scroll Container
  scroll: {
    padding: 18,
    paddingBottom: 36,
    alignSelf: 'center',
    maxWidth: 760,
    width: '100%',
  },

  // Ranger Profile Card
  rangerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2EDF0',
    padding: 18,
    marginBottom: 18,
    gap: 16,
    shadowColor: '#11382B',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  rangerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: '#059669',
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#059669',
  },
  rangerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  rangerStatusAvailable: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  rangerStatusOnPatrol: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  rangerStatusResponding: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  rangerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rangerDotAvailable: {
    backgroundColor: '#10B981',
  },
  rangerDotOnPatrol: {
    backgroundColor: '#F59E0B',
  },
  rangerDotResponding: {
    backgroundColor: '#EF4444',
  },
  rangerStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.4,
  },
  rangerProfileName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 5,
    letterSpacing: -0.4,
  },

  // Assigned Patrol Card
  assignedPatrolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2EDF0',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#11382B',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
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
    gap: 7,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  assignedPatrolBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  assignedPatrolBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#166534',
  },
  priorityTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  priorityTagHigh: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  priorityTagMedium: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priorityTagLow: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  statusTagCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  statusTagInProgress: {
    backgroundColor: '#F0F9FF',
    borderColor: '#7DD3FC',
  },
  statusTagAssigned: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTagTextCompleted: {
    color: '#047857',
  },
  statusTagTextInProgress: {
    color: '#0369A1',
  },
  statusTagTextAssigned: {
    color: '#B45309',
  },
  cardProgressContainer: {
    marginTop: 18,
    backgroundColor: '#F4F8F6',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2EDF0',
  },
  cardProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
    flexWrap: 'wrap',
    gap: 6,
  },
  cardProgressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  cardProgressPctText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardProgressBarTrack: {
    height: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cardProgressSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  completedPatrolModalBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
    borderWidth: 1,
  },
  viewPatrolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  viewPatrolBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  showAllPatrolsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  showAllPatrolsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  patrolFieldGroup: {
    marginTop: 14,
  },
  patrolFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#64748B',
  },
  patrolFieldValueMain: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  patrolFieldValueSub: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
    lineHeight: 23,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flexShrink: 1,
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '84%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
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
    color: '#111827',
  },
  modalPatrolIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  modalDetailGroup: {
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  modalDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  modalNotesValue: {
    fontSize: 14,
    color: '#334155',
    marginTop: 4,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapboxMapContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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
    color: '#059669',
  },
  mapboxDistText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  mapboxMapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalRouteCoordText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  modalFooter: {
    gap: 10,
  },
  startPatrolModalBtn: {
    backgroundColor: '#059669',
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
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },

  // System Status Grid
  statusGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2EDF0',
    padding: 16,
    shadowColor: '#11382B',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#64748B',
  },
  statusCardValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 14,
    gap: 6,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // Incident & Operations Button Cards
  reportIncidentBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2EDF0',
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    shadowColor: '#11382B',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  reportIncidentIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  reportIncidentText: {
    flex: 1,
  },
  reportIncidentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
  },
  reportIncidentSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
    fontWeight: '500',
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
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2EDF0',
    shadowColor: '#11382B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 21,
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Shift info card
  shiftCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 18,
    marginTop: 6,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    lineHeight: 20,
    flex: 1,
  },
  shiftText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 20,
    fontWeight: '500',
  },
});
