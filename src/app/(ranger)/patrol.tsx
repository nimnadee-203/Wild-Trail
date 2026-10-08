import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, Card } from '../../components/ui';
import { WildTrailBrand } from '../../components/WildTrailBrand';
import Colors from '../../constants/colors';
import { useLocation } from '../../hooks/useLocation';
import { offlineSyncService, SyncItemStatus } from '../../services/api/offlineSync';
import { patrolApiService } from '../../services/api/patrols';
import {
  ActualPathPoint,
  CompletedPatrolSummary,
  MarkedWaypoint,
  ObservationType,
  PatrolObservation,
  WaypointType,
} from '../../types/patrol';
import { formatCoordinates } from '../../utils/formatting';

const WAYPOINT_TYPES: { type: WaypointType; label: string; icon: string; color: string }[] = [
  { type: 'OBSERVATION', label: 'Observation', icon: 'eye-outline', color: '#0284C7' },
  { type: 'SIGHTING', label: 'Animal Sighting', icon: 'paw-outline', color: '#059669' },
  { type: 'WATER_POINT', label: 'Water Point', icon: 'water-outline', color: '#3B82F6' },
  { type: 'PERIMETER_CHECK', label: 'Perimeter Check', icon: 'shield-checkmark-outline', color: '#16A34A' },
  { type: 'POACHING_TRAIL', label: 'Poaching Trail', icon: 'footsteps-outline', color: '#D97706' },
  { type: 'FENCE_BREACH', label: 'Fence Breach', icon: 'warning-outline', color: '#DC2626' },
  { type: 'GENERAL', label: 'General Marker', icon: 'location-outline', color: '#6B7280' },
];

const OBSERVATION_TYPES: { type: ObservationType; icon: string }[] = [
  { type: 'Wildlife Sighting', icon: 'paw-outline' },
  { type: 'Illegal Activity', icon: 'warning-outline' },
  { type: 'Habitat Condition', icon: 'leaf-outline' },
  { type: 'Fence Damage', icon: 'construct-outline' },
  { type: 'Water Source', icon: 'water-outline' },
  { type: 'Other', icon: 'clipboard-outline' },
];

function calculatePathDistance(path: ActualPathPoint[]): number {
  if (path.length < 2) return 0;
  let totalKm = 0;
  for (let i = 1; i < path.length; i++) {
    const lat1 = path[i - 1].latitude;
    const lon1 = path[i - 1].longitude;
    const lat2 = path[i].latitude;
    const lon2 = path[i].longitude;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }
  return parseFloat(totalKm.toFixed(3));
}

export default function PatrolScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const patrolId = typeof params.patrolId === 'string' ? params.patrolId : null;
  const patrolName = typeof params.patrolName === 'string' ? params.patrolName : 'Northern Boundary Patrol';
  const park = typeof params.park === 'string' ? params.park : 'Yala National Park';
  const priority = typeof params.priority === 'string' ? params.priority : 'HIGH';

  let parsedRouteCoords: [number, number][] = [
    [81.503, 6.3672],
    [81.5044, 6.3681],
    [81.5057, 6.3695],
  ];

  if (typeof params.routeCoords === 'string') {
    try {
      const parsed = JSON.parse(params.routeCoords);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedRouteCoords = parsed;
      }
    } catch {
      // Keep default fallback
    }
  }

  const { location, errorMsg, isLoading, refreshLocation } = useLocation();
  const [isPatrolling, setIsPatrolling] = useState(!!patrolId);
  const [showJsonData, setShowJsonData] = useState(false);

  // Marked Waypoint State & Modal Controls
  const [markedWaypoints, setMarkedWaypoints] = useState<MarkedWaypoint[]>([]);
  const [waypointModalVisible, setWaypointModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WaypointType>('OBSERVATION');
  const [waypointNotes, setWaypointNotes] = useState('');

  // Add Observation State & Modal Controls
  const [observations, setObservations] = useState<PatrolObservation[]>([]);
  const [obsModalVisible, setObsModalVisible] = useState(false);
  const [selectedObsType, setSelectedObsType] = useState<ObservationType>('Wildlife Sighting');
  const [obsDescription, setObsDescription] = useState('');
  const [obsDropdownOpen, setObsDropdownOpen] = useState(false);

  // Patrol Summary Modal State
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<CompletedPatrolSummary | null>(null);

  // Offline & Network Sync State
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const refreshSyncQueue = async () => {
    const queue = await offlineSyncService.getQueue();
    const pending = queue.filter((item) => item.status === 'PENDING_SYNC').length;
    setPendingSyncCount(pending);
  };

  useEffect(() => {
    async function initNetworkState() {
      const online = await offlineSyncService.isOnline();
      setIsOnlineState(online);
      await refreshSyncQueue();
    }
    initNetworkState();
  }, []);

  const handleToggleNetwork = async () => {
    const nextState = !isOnlineState;
    setIsOnlineState(nextState);
    await offlineSyncService.setOnlineStatus(nextState);

    if (nextState) {
      // Internet returns -> Upload data -> SUBMITTED
      const { syncedCount } = await offlineSyncService.syncPendingItems();
      setMarkedWaypoints((prev) =>
        prev.map((wp) => ({ ...wp, syncStatus: 'SUBMITTED' as const }))
      );
      setObservations((prev) =>
        prev.map((obs) => ({ ...obs, syncStatus: 'SUBMITTED' as const }))
      );
      await refreshSyncQueue();

      if (Platform.OS === 'web') {
        window.alert(`Internet Connection Restored! Uploaded ${syncedCount} offline record(s) to remote server (Status: SUBMITTED).`);
      } else {
        Alert.alert('Internet Restored', `Uploaded ${syncedCount} offline record(s) to remote server (Status: SUBMITTED).`);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Internet Connection Lost! GPS tracking continues uninterrupted. All new waypoints & observations will save locally with status PENDING_SYNC.');
      } else {
        Alert.alert('Internet Lost', 'GPS tracking continues uninterrupted. Data will be saved locally with status PENDING_SYNC.');
      }
    }
  };

  // Initialize actualPath with default starting coordinate point
  const [actualPath, setActualPath] = useState<ActualPathPoint[]>([
    {
      latitude: parsedRouteCoords[0][1],
      longitude: parsedRouteCoords[0][0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Load active session from storage on mount
  useEffect(() => {
    async function loadActiveSession() {
      const activeSession = await patrolApiService.getActivePatrolSession();
      if (activeSession) {
        if (activeSession.actualPath && activeSession.actualPath.length > 0) {
          setActualPath(activeSession.actualPath);
        }
        if (activeSession.markedWaypoints && activeSession.markedWaypoints.length > 0) {
          setMarkedWaypoints(activeSession.markedWaypoints);
        }
        if (activeSession.observations && activeSession.observations.length > 0) {
          setObservations(activeSession.observations);
        }
      }
    }
    loadActiveSession();
  }, []);

  // Continuous GPS tracking loop: appends new path point every 5 seconds when patrol is active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isPatrolling) {
      interval = setInterval(async () => {
        const now = new Date();
        const timestampStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setActualPath((prevPath) => {
          const lastPoint = prevPath[prevPath.length - 1];

          // Calculate small step forward from real device GPS or simulated movement along vector
          const baseLat = location?.latitude ?? lastPoint?.latitude ?? 6.3672;
          const baseLng = location?.longitude ?? lastPoint?.longitude ?? 81.503;

          const stepOffsetLat = (Math.random() * 0.0004 + 0.0002) * (prevPath.length % 2 === 0 ? 1 : 1.1);
          const stepOffsetLng = (Math.random() * 0.0005 + 0.0003) * (prevPath.length % 2 === 0 ? 1.1 : 1);

          const newPoint: ActualPathPoint = {
            latitude: parseFloat((baseLat + stepOffsetLat).toFixed(4)),
            longitude: parseFloat((baseLng + stepOffsetLng).toFixed(4)),
            timestamp: timestampStr,
            syncStatus: isOnlineState ? 'SUBMITTED' : 'PENDING_SYNC',
          };

          // Save point asynchronously to persistent session storage
          patrolApiService.addActualPathPoint(newPoint);

          return [...prevPath, newPoint];
        });
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPatrolling, location, isOnlineState]);

  const togglePatrol = async () => {
    if (isPatrolling) {
      // 1. Stop GPS continuous tracking
      setIsPatrolling(false);

      // 2. Record end time
      const endTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const startTimeStr = typeof params.startTime === 'string' ? params.startTime : actualPath[0]?.timestamp || '08:00 AM';
      const distanceKm = calculatePathDistance(actualPath);
      const plannedDistanceKm = calculatePathDistance(
        parsedRouteCoords.map(([lng, lat]) => ({ latitude: lat, longitude: lng, timestamp: '' }))
      ) || 4.8;

      // 3. Save actual path, waypoints, observations; set Patrol = COMPLETED & Ranger = AVAILABLE
      const summary = await patrolApiService.completePatrolSession(
        patrolId || 'PAT-0156',
        {
          patrolName,
          park,
          priority,
          startTime: startTimeStr,
          endTime: endTimeStr,
          distanceKm,
          plannedDistanceKm,
          actualPath,
          markedWaypoints,
          observations,
        }
      );

      if (!isOnlineState) {
        await offlineSyncService.queueItem('PATROL_SUMMARY', summary);
        await refreshSyncQueue();
      }

      setCompletedSummary(summary);
      setSummaryModalVisible(true);
    } else {
      setIsPatrolling(true);
    }
  };

  // Mark Waypoint Handlers
  const handleOpenMarkWaypoint = () => {
    refreshLocation();
    setSelectedCategory('OBSERVATION');
    setWaypointNotes('');
    setWaypointModalVisible(true);
  };

  const handleSaveWaypoint = async () => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const currentLat = location?.latitude ?? actualPath[actualPath.length - 1]?.latitude ?? 6.3672;
    const currentLng = location?.longitude ?? actualPath[actualPath.length - 1]?.longitude ?? 81.503;

    const syncStatus: SyncItemStatus = isOnlineState ? 'SUBMITTED' : 'PENDING_SYNC';

    const newWaypoint: MarkedWaypoint = {
      id: `WP-${Date.now()}`,
      latitude: parseFloat(currentLat.toFixed(4)),
      longitude: parseFloat(currentLng.toFixed(4)),
      timestamp: formattedTime,
      timestampMs: now.getTime(),
      type: selectedCategory,
      notes: waypointNotes.trim() || undefined,
      syncStatus,
    };

    await patrolApiService.addMarkedWaypoint(newWaypoint);
    if (!isOnlineState) {
      await offlineSyncService.queueItem('WAYPOINT', newWaypoint);
      await refreshSyncQueue();
    }

    setMarkedWaypoints((prev) => [...prev, newWaypoint]);
    setWaypointModalVisible(false);

    Alert.alert(
      'Waypoint Recorded',
      `Marked ${selectedCategory.replace('_', ' ')} at (${newWaypoint.latitude}°, ${newWaypoint.longitude}°) [Status: ${syncStatus}].`
    );
  };

  // Add Observation Handlers
  const handleOpenAddObservation = () => {
    refreshLocation();
    setSelectedObsType('Wildlife Sighting');
    setObsDescription('Fresh elephant footprints');
    setObsDropdownOpen(false);
    setObsModalVisible(true);
  };

  const handleSaveObservation = async () => {
    if (!obsDescription.trim()) {
      Alert.alert('Description Required', 'Please enter a description for this observation.');
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const currentLat = location?.latitude ?? actualPath[actualPath.length - 1]?.latitude ?? 6.3672;
    const currentLng = location?.longitude ?? actualPath[actualPath.length - 1]?.longitude ?? 81.503;

    const syncStatus: SyncItemStatus = isOnlineState ? 'SUBMITTED' : 'PENDING_SYNC';

    const newObservation: PatrolObservation = {
      id: `OBS-${Date.now()}`,
      patrolId: patrolId || 'PAT-0156',
      patrolName: patrolName,
      park: park,
      latitude: parseFloat(currentLat.toFixed(4)),
      longitude: parseFloat(currentLng.toFixed(4)),
      timestamp: formattedTime,
      type: selectedObsType,
      description: obsDescription.trim(),
      syncStatus,
    };

    await patrolApiService.addPatrolObservation(newObservation);
    if (!isOnlineState) {
      await offlineSyncService.queueItem('OBSERVATION', newObservation);
      await refreshSyncQueue();
    }

    setObservations((prev) => [...prev, newObservation]);
    setObsModalVisible(false);

    Alert.alert(
      'Observation Saved',
      `Observation "${newObservation.type}" recorded at current location [Status: ${syncStatus}].`
    );
  };

  const currentDistanceKm = calculatePathDistance(actualPath);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header Navigation Bar */}
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
            <WildTrailBrand light title={patrolId ? `Patrol: ${patrolId}` : 'GPS Patrol Tracking'} />
            <Text style={styles.headerSubtitle}>{park} • Active Field GPS</Text>
          </View>
        </View>

        <Badge
          label={isPatrolling ? 'Patrol Active' : 'Standby'}
          variant={isPatrolling ? 'success' : 'info'}
        />
      </View>

      {/* Network Connectivity & Offline Sync Status Banner */}
      <View style={[styles.netBanner, isOnlineState ? styles.netBannerOnline : styles.netBannerOffline]}>
        <View style={styles.netBannerLeft}>
          <Ionicons
            name={isOnlineState ? 'wifi' : 'wifi-outline'}
            size={18}
            color={isOnlineState ? '#059669' : '#DC2626'}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.netBannerTitle, { color: isOnlineState ? '#059669' : '#DC2626' }]}>
              {isOnlineState ? 'ONLINE • NETWORK CONNECTED' : 'INTERNET LOST • GPS CONTINUES'}
            </Text>
            <Text style={styles.netBannerSub}>
              {isOnlineState
                ? 'All breadcrumbs & records uploading live (SUBMITTED)'
                : `GPS tracking active • Data saved locally (${pendingSyncCount} PENDING_SYNC)`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.netToggleBtn, isOnlineState ? styles.netBtnOffline : styles.netBtnOnline]}
          onPress={handleToggleNetwork}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isOnlineState ? 'cloud-offline' : 'cloud-upload'}
            size={13}
            color="#FFFFFF"
          />
          <Text style={styles.netToggleBtnText}>
            {isOnlineState ? 'Simulate Offline' : 'Restore Internet'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Active Assigned Patrol Card */}
        {patrolId && (
          <Card style={styles.assignedBannerCard}>
            <View style={styles.assignedBannerHeader}>
              <View style={styles.assignedBadgePill}>
                <Ionicons name="shield-checkmark" size={14} color="#4ADE80" />
                <Text style={styles.assignedBadgeText}>ACTIVE ASSIGNED PATROL</Text>
              </View>
              <View style={styles.priorityPill}>
                <Text style={styles.priorityPillText}>{priority}</Text>
              </View>
            </View>

            <Text style={styles.assignedPatrolNameTitle}>{patrolName}</Text>
            <Text style={styles.assignedParkSub}>{park}</Text>

            {/* Manager Planned Route vs Ranger Travelled GPS Path visualizer */}
            <View style={styles.routeComparisonCard}>
              <View style={styles.comparisonHeader}>
                <Ionicons name="git-compare-outline" size={16} color="#4ADE80" />
                <Text style={styles.comparisonHeaderText}>ROUTE & GPS PATH VISUALIZER</Text>
              </View>

              <View style={styles.legendRow}>
                <Text style={styles.legendLabel}>Manager/mock route:</Text>
                <Text style={styles.managerRouteLine}>──────────── 🚩</Text>
              </View>

              <View style={styles.legendRow}>
                <Text style={styles.legendLabel}>{"Ranger's GPS path:"}</Text>
                <Text style={styles.rangerGpsLine}>━━━━━━🔵</Text>
              </View>

              {/* Marked Waypoints overlay map pins summary */}
              {markedWaypoints.length > 0 && (
                <View style={styles.markedPinsSummaryBox}>
                  <Text style={styles.markedPinsTitle}>Marked Waypoint Pins on Mapbox ({markedWaypoints.length}):</Text>
                  {markedWaypoints.map((wp, idx) => (
                    <Text key={wp.id} style={styles.markedPinText}>
                      🏷️ WP-{idx + 1} [{wp.type}]: {wp.latitude}° N, {wp.longitude}° E ({wp.timestamp})
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.waypointsBox}>
                <Text style={styles.waypointBoxTitle}>Assigned Reference Waypoints:</Text>
                {parsedRouteCoords.map((coord, idx) => (
                  <Text key={idx} style={styles.waypointText}>
                    📍 WP-{idx + 1}: {coord[1].toFixed(4)}° N, {coord[0].toFixed(4)}° E
                  </Text>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Patrol Session Control Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusTitleGroup}>
              <Ionicons
                name={isPatrolling ? 'walk' : 'pause-circle-outline'}
                size={24}
                color={isPatrolling ? '#15803D' : '#6B7280'}
              />
              <Text style={styles.sectionTitle}>Patrol Session Controls</Text>
            </View>
            <View style={styles.livePulseTag}>
              <View style={[styles.liveDot, isPatrolling && styles.liveDotActive]} />
              <Text style={styles.livePulseText}>{isPatrolling ? 'RECORDING' : 'PAUSED'}</Text>
            </View>
          </View>

          <View style={styles.statsSummaryGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValueText}>{actualPath.length}</Text>
              <Text style={styles.statLabelText}>GPS Points</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValueText}>{markedWaypoints.length}</Text>
              <Text style={styles.statLabelText}>Waypoints</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValueText}>{observations.length}</Text>
              <Text style={styles.statLabelText}>Observations</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValueText}>{currentDistanceKm} km</Text>
              <Text style={styles.statLabelText}>Distance</Text>
            </View>
          </View>

          {/* Action Buttons Row: Mark Waypoint & Add Observation */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.markWaypointActionBtn}
              onPress={handleOpenMarkWaypoint}
              activeOpacity={0.85}
            >
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Mark Waypoint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addObservationActionBtn}
              onPress={handleOpenAddObservation}
              activeOpacity={0.85}
            >
              <Ionicons name="eye" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Add Observation</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={isPatrolling ? 'Stop Patrol Session' : 'Start GPS Patrol'}
            variant={isPatrolling ? 'danger' : 'primary'}
            onPress={togglePatrol}
            style={styles.patrolBtn}
          />
        </Card>

        {/* Recorded Patrol Observations List Card */}
        {observations.length > 0 && (
          <Card style={styles.waypointListCard}>
            <View style={styles.pathHeaderRow}>
              <View style={styles.pathHeaderTitleGroup}>
                <Ionicons name="eye" size={20} color="#0284C7" />
                <Text style={styles.sectionTitle}>Patrol Observations ({observations.length})</Text>
              </View>
            </View>

            <View style={styles.pathListContainer}>
              {observations.map((obs) => (
                <View key={obs.id} style={styles.observationRowCard}>
                  <View style={styles.obsIconWrap}>
                    <Ionicons name="paw" size={16} color="#0284C7" />
                  </View>
                  <View style={styles.waypointRowBody}>
                    <View style={styles.waypointTitleRow}>
                      <Text style={styles.waypointTypeTitle}>{obs.type}</Text>
                      <View style={styles.syncBadgeRow}>
                        <Text style={styles.waypointTimeText}>{obs.timestamp}</Text>
                        <View style={[styles.syncBadgePill, (obs.syncStatus || (isOnlineState ? 'SUBMITTED' : 'PENDING_SYNC')) === 'PENDING_SYNC' ? styles.syncBadgePending : styles.syncBadgeSubmitted]}>
                          <Text style={styles.syncBadgePillText}>
                            {obs.syncStatus || (isOnlineState ? 'SUBMITTED' : 'PENDING_SYNC')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.waypointCoordsSub}>
                      📍 {obs.latitude}° N, {obs.longitude}° E • Patrol: {obs.patrolId || 'Active'}
                    </Text>
                    <Text style={styles.waypointNotesText}>{`"${obs.description}"`}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Recorded Marked Waypoints List Card */}
        {markedWaypoints.length > 0 && (
          <Card style={styles.waypointListCard}>
            <View style={styles.pathHeaderRow}>
              <View style={styles.pathHeaderTitleGroup}>
                <Ionicons name="bookmark" size={20} color="#D97706" />
                <Text style={styles.sectionTitle}>Marked Waypoints ({markedWaypoints.length})</Text>
              </View>
            </View>

            <View style={styles.pathListContainer}>
              {markedWaypoints.map((wp) => {
                const config = WAYPOINT_TYPES.find((item) => item.type === wp.type) || WAYPOINT_TYPES[6];
                const currentSync = wp.syncStatus || (isOnlineState ? 'SUBMITTED' : 'PENDING_SYNC');
                return (
                  <View key={wp.id} style={styles.waypointRowCard}>
                    <View style={[styles.waypointBadgeIcon, { backgroundColor: config.color }]}>
                      <Ionicons name={config.icon as any} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.waypointRowBody}>
                      <View style={styles.waypointTitleRow}>
                        <Text style={styles.waypointTypeTitle}>{config.label}</Text>
                        <View style={styles.syncBadgeRow}>
                          <Text style={styles.waypointTimeText}>{wp.timestamp}</Text>
                          <View style={[styles.syncBadgePill, currentSync === 'PENDING_SYNC' ? styles.syncBadgePending : styles.syncBadgeSubmitted]}>
                            <Text style={styles.syncBadgePillText}>{currentSync}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.waypointCoordsSub}>
                        📍 {wp.latitude}° N, {wp.longitude}° E
                      </Text>
                      {wp.notes && <Text style={styles.waypointNotesText}>{`"${wp.notes}"`}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Ranger Travelled GPS Path (actualPath) Data Store Card */}
        <Card style={styles.pathCard}>
          <View style={styles.pathHeaderRow}>
            <View style={styles.pathHeaderTitleGroup}>
              <Ionicons name="location-outline" size={20} color="#059669" />
              <Text style={styles.sectionTitle}>Recorded actualPath Data</Text>
            </View>

            <TouchableOpacity
              style={styles.toggleJsonBtn}
              onPress={() => setShowJsonData(!showJsonData)}
              activeOpacity={0.8}
            >
              <Ionicons name="code-slash" size={14} color="#4ADE80" />
              <Text style={styles.toggleJsonBtnText}>
                {showJsonData ? 'Hide JSON' : 'View JSON'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pathDescText}>
            Continuously storing Ranger position updates into <Text style={styles.codeHighlight}>actualPath</Text> array:
          </Text>

          {showJsonData ? (
            <View style={styles.jsonBox}>
              <Text style={styles.jsonTitle}>actualPath = [</Text>
              {actualPath.map((item, index) => (
                <Text key={index} style={styles.jsonItemText}>
                  {`  {\n    latitude: ${item.latitude},\n    longitude: ${item.longitude},\n    timestamp: "${item.timestamp}"\n  }${index < actualPath.length - 1 ? ',' : ''}`}
                </Text>
              ))}
              <Text style={styles.jsonTitle}>];</Text>
            </View>
          ) : (
            <View style={styles.pathListContainer}>
              {actualPath.slice(-5).map((point, idx) => (
                <View key={idx} style={styles.pathPointRow}>
                  <View style={styles.pathPointDot} />
                  <View style={styles.pathPointContent}>
                    <Text style={styles.pathCoordText}>
                      {point.latitude.toFixed(4)}° N, {point.longitude.toFixed(4)}° E
                    </Text>
                    <Text style={styles.pathTimeText}>Recorded at {point.timestamp}</Text>
                  </View>
                </View>
              ))}
              {actualPath.length > 5 && (
                <Text style={styles.morePointsText}>
                  + {actualPath.length - 5} earlier GPS track points recorded in patrol path
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Current Live GPS Hardware Coordinates */}
        <Card style={styles.locationCard}>
          <Text style={styles.sectionTitle}>Current Device Hardware GPS</Text>

          {isLoading ? (
            <Text style={styles.infoText}>Acquiring High Accuracy GPS Signal...</Text>
          ) : errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <View style={styles.coordBox}>
              <Text style={styles.coordText}>
                {formatCoordinates(location?.latitude, location?.longitude)}
              </Text>
              {location?.altitude && (
                <Text style={styles.metaText}>
                  Altitude: {location.altitude.toFixed(1)} m | Accuracy: ±
                  {location.accuracy?.toFixed(1)} m
                </Text>
              )}
            </View>
          )}

          <Button
            title="Refresh GPS Signal"
            variant="outline"
            onPress={refreshLocation}
            isLoading={isLoading}
            style={styles.refreshBtn}
          />
        </Card>
      </ScrollView>

      {/* Mark Waypoint Modal */}
      <Modal
        visible={waypointModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWaypointModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="location" size={22} color="#059669" />
                <Text style={styles.modalTitleText}>Mark GPS Waypoint</Text>
              </View>
              <TouchableOpacity onPress={() => setWaypointModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Captured GPS Reading Card */}
              <View style={styles.gpsReadingCard}>
                <Text style={styles.gpsReadingTitle}>CAPTURED GPS POSITION</Text>
                <Text style={styles.gpsReadingCoords}>
                  {formatCoordinates(
                    location?.latitude ?? actualPath[actualPath.length - 1]?.latitude ?? 6.3672,
                    location?.longitude ?? actualPath[actualPath.length - 1]?.longitude ?? 81.503
                  )}
                </Text>
                <Text style={styles.gpsReadingTime}>
                  Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              </View>

              {/* Waypoint Type / Category Selector */}
              <Text style={styles.fieldLabelText}>SELECT WAYPOINT CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {WAYPOINT_TYPES.map((cat) => {
                  const isSelected = selectedCategory === cat.type;
                  return (
                    <TouchableOpacity
                      key={cat.type}
                      style={[
                        styles.categoryPill,
                        isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                      ]}
                      onPress={() => setSelectedCategory(cat.type)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? '#FFFFFF' : cat.color}
                      />
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && styles.categoryPillTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Waypoint Notes Input */}
              <Text style={styles.fieldLabelText}>WAYPOINT NOTES & OBSERVATIONS (OPTIONAL)</Text>
              <TextInput
                style={styles.notesTextInput}
                placeholder="e.g., Fresh animal tracks heading east, waterhole level checked, snare cleared..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={waypointNotes}
                onChangeText={setWaypointNotes}
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.saveWaypointModalBtn}
                onPress={handleSaveWaypoint}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveWaypointModalBtnText}>Save Waypoint</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setWaypointModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Observation Modal */}
      <Modal
        visible={obsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setObsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="eye" size={22} color="#0284C7" />
                <Text style={styles.modalTitleText}>Add Observation</Text>
              </View>
              <TouchableOpacity onPress={() => setObsModalVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Dropdown Picker */}
              <Text style={styles.fieldLabelText}>TYPE</Text>
              <TouchableOpacity
                style={styles.dropdownSelectorBtn}
                onPress={() => setObsDropdownOpen(!obsDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelectorValueText}>[ {selectedObsType} ]</Text>
                <Ionicons
                  name={obsDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#0284C7"
                />
              </TouchableOpacity>

              {obsDropdownOpen && (
                <View style={styles.dropdownListContainer}>
                  {OBSERVATION_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.dropdownItemRow,
                        selectedObsType === item.type && styles.dropdownItemRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedObsType(item.type);
                        setObsDropdownOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={selectedObsType === item.type ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedObsType === item.type && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item.type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Description Input */}
              <Text style={[styles.fieldLabelText, { marginTop: 14 }]}>DESCRIPTION</Text>
              <TextInput
                style={styles.notesTextInput}
                placeholder="[ Fresh elephant footprints ]"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={obsDescription}
                onChangeText={setObsDescription}
              />

              {/* Location Captured Display */}
              <Text style={styles.fieldLabelText}>LOCATION</Text>
              <View style={styles.locationCapturedBox}>
                <View style={styles.locationCapturedHeader}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.locationCapturedTitle}>✓ Automatically captured</Text>
                </View>
                <Text style={styles.locationCapturedCoords}>
                  📍 Lat: {(location?.latitude ?? actualPath[actualPath.length - 1]?.latitude ?? 6.3672).toFixed(4)}° N, Lng: {(location?.longitude ?? actualPath[actualPath.length - 1]?.longitude ?? 81.503).toFixed(4)}° E
                </Text>
                <Text style={styles.locationCapturedSub}>
                  Associated with Patrol: {patrolId || 'PAT-0156'} ({patrolName})
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.saveWaypointModalBtn, { backgroundColor: '#0284C7' }]}
                onPress={handleSaveObservation}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveWaypointModalBtnText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setObsModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Patrol Summary Modal */}
      <Modal
        visible={summaryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.summaryModalHeader}>
                <View style={styles.summaryCheckIconWrap}>
                  <Ionicons name="checkmark-circle" size={56} color="#059669" />
                </View>
                <Text style={styles.summaryModalTitle}>Patrol Completed</Text>
                <Text style={styles.summaryModalSubtitle}>
                  GPS track, waypoints, and observations successfully recorded and saved.
                </Text>
              </View>

              {/* Status Indicator Badges */}
              <View style={styles.summaryStatusBadgeRow}>
                <View style={styles.summaryCompletedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text style={styles.summaryBadgeTextCompleted}>Patrol = COMPLETED</Text>
                </View>

                <View style={styles.summaryAvailableBadge}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#0284C7" />
                  <Text style={styles.summaryBadgeTextAvailable}>Ranger = AVAILABLE</Text>
                </View>
              </View>

              {/* Overview Details Box */}
              <View style={styles.summaryInfoCard}>
                <View style={styles.summaryInfoRow}>
                  <Ionicons name="compass-outline" size={18} color="#4B5563" />
                  <Text style={styles.summaryInfoLabel}>Patrol ID</Text>
                  <Text style={styles.summaryInfoVal}>{completedSummary?.patrolId || patrolId || 'PAT-0156'}</Text>
                </View>

                <View style={styles.summaryInfoRow}>
                  <Ionicons name="map-outline" size={18} color="#4B5563" />
                  <Text style={styles.summaryInfoLabel}>Sector / Park</Text>
                  <Text style={styles.summaryInfoVal}>{completedSummary?.park || park}</Text>
                </View>

                <View style={styles.summaryInfoRow}>
                  <Ionicons name="time-outline" size={18} color="#4B5563" />
                  <Text style={styles.summaryInfoLabel}>Time Window</Text>
                  <Text style={styles.summaryInfoVal}>
                    {completedSummary?.startTime} ➔ {completedSummary?.endTime}
                  </Text>
                </View>

                {/* Progress Bar Component */}
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>
                      ROUTE COVERAGE PROGRESS
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: (completedSummary?.completionPercentage ?? 100) < 95 ? '#D97706' : '#059669' }}>
                      {completedSummary?.completionPercentage ?? 100}% COMPLETED
                    </Text>
                  </View>
                  <View style={{ height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, completedSummary?.completionPercentage ?? 100)}%`,
                        backgroundColor: (completedSummary?.completionPercentage ?? 100) < 95 ? '#F59E0B' : '#10B981',
                        borderRadius: 5,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'right' }}>
                    {completedSummary?.distanceKm ?? currentDistanceKm} km completed of {completedSummary?.plannedDistanceKm ?? 4.8} km planned
                  </Text>
                </View>
              </View>

              {/* Saved Metrics Grid */}
              <Text style={styles.summarySectionTitle}>SAVED PATROL METRICS</Text>
              <View style={styles.summaryMetricsGrid}>
                <View style={styles.summaryMetricBox}>
                  <Ionicons name="walk" size={20} color="#059669" />
                  <Text style={styles.summaryMetricVal}>{completedSummary?.distanceKm ?? currentDistanceKm} km</Text>
                  <Text style={styles.summaryMetricLabel}>Total Distance</Text>
                </View>

                <View style={styles.summaryMetricBox}>
                  <Ionicons name="location" size={20} color="#0284C7" />
                  <Text style={styles.summaryMetricVal}>{completedSummary?.actualPath.length ?? actualPath.length}</Text>
                  <Text style={styles.summaryMetricLabel}>GPS Points</Text>
                </View>

                <View style={styles.summaryMetricBox}>
                  <Ionicons name="bookmark" size={20} color="#D97706" />
                  <Text style={styles.summaryMetricVal}>{completedSummary?.markedWaypoints.length ?? markedWaypoints.length}</Text>
                  <Text style={styles.summaryMetricLabel}>Waypoints</Text>
                </View>

                <View style={styles.summaryMetricBox}>
                  <Ionicons name="eye" size={20} color="#7C3AED" />
                  <Text style={styles.summaryMetricVal}>{completedSummary?.observations.length ?? observations.length}</Text>
                  <Text style={styles.summaryMetricLabel}>Observations</Text>
                </View>
              </View>

              {/* Saved Observations Summary */}
              {(completedSummary?.observations.length ?? observations.length) > 0 && (
                <View style={styles.summarySectionBlock}>
                  <Text style={styles.summarySectionTitle}>SAVED OBSERVATIONS</Text>
                  {(completedSummary?.observations || observations).map((obs) => (
                    <View key={obs.id} style={styles.summaryObsItem}>
                      <Ionicons name="paw" size={14} color="#0284C7" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryObsType}>{obs.type} ({obs.timestamp})</Text>
                        <Text style={styles.summaryObsDesc}>{`"${obs.description}"`}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Saved Waypoints Summary */}
              {(completedSummary?.markedWaypoints.length ?? markedWaypoints.length) > 0 && (
                <View style={styles.summarySectionBlock}>
                  <Text style={styles.summarySectionTitle}>SAVED WAYPOINTS</Text>
                  {(completedSummary?.markedWaypoints || markedWaypoints).map((wp) => (
                    <View key={wp.id} style={styles.summaryObsItem}>
                      <Ionicons name="location" size={14} color="#D97706" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryObsType}>{wp.type.replace(/_/g, ' ')} ({wp.timestamp})</Text>
                        <Text style={styles.summaryObsDesc}>📍 {wp.latitude}° N, {wp.longitude}° E</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <TouchableOpacity
                style={styles.summaryReturnBtn}
                onPress={() => {
                  setSummaryModalVisible(false);
                  router.push('/dashboard');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="home" size={18} color="#FFFFFF" />
                <Text style={styles.summaryReturnBtnText}>Done & Return to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },

  // Assigned Banner Card
  assignedBannerCard: {
    marginBottom: 16,
    backgroundColor: '#0F1D17',
    borderColor: '#294B3B',
    borderWidth: 1,
    padding: 16,
  },
  assignedBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3529',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#294B3B',
    gap: 4,
  },
  assignedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 0.5,
  },
  priorityPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  assignedPatrolNameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  assignedParkSub: {
    fontSize: 12,
    color: '#8EA69A',
    marginTop: 2,
  },

  // Route Comparison Card
  routeComparisonCard: {
    marginTop: 14,
    backgroundColor: '#162C21',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#223B2E',
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  comparisonHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 0.6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  managerRouteLine: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  rangerGpsLine: {
    fontSize: 13,
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
  },
  markedPinsSummaryBox: {
    marginTop: 8,
    backgroundColor: '#11221A',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1E382B',
  },
  markedPinsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 4,
  },
  markedPinText: {
    fontSize: 11,
    color: '#FDE68A',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  waypointsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  waypointBoxTitle: {
    fontSize: 11,
    color: '#8EA69A',
    fontWeight: '700',
    marginBottom: 4,
  },
  waypointText: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Session Control Card
  statusCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  livePulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  liveDotActive: {
    backgroundColor: '#22C55E',
  },
  livePulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  statsSummaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statValueText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.primaryDark,
  },
  statLabelText: {
    fontSize: 11,
    color: Colors.light.muted,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  markWaypointActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 11,
    gap: 6,
  },
  addObservationActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 11,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  patrolBtn: {
    marginTop: 4,
  },

  // Waypoint & Observation List Card
  waypointListCard: {
    marginBottom: 16,
  },
  observationRowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  obsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  waypointRowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  waypointBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  waypointRowBody: {
    flex: 1,
  },
  waypointTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waypointTypeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  waypointTimeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  waypointCoordsSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  waypointNotesText: {
    fontSize: 12,
    color: '#1E293B',
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  // actualPath Card
  pathCard: {
    marginBottom: 16,
  },
  pathHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleJsonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1D17',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  toggleJsonBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
  },
  pathDescText: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 12,
  },
  codeHighlight: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  jsonBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  jsonTitle: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#38BDF8',
    fontWeight: '700',
  },
  jsonItemText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#E2E8F0',
    marginVertical: 2,
  },
  pathListContainer: {
    gap: 8,
  },
  pathPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pathPointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  pathPointContent: {
    flex: 1,
  },
  pathCoordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pathTimeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  morePointsText: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Location Card
  locationCard: {
    marginBottom: 16,
  },
  coordBox: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginVertical: 12,
  },
  coordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primaryDark,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.muted,
    marginVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.danger,
    marginVertical: 12,
  },
  refreshBtn: {
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  gpsReadingCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  gpsReadingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  gpsReadingCoords: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gpsReadingTime: {
    fontSize: 11,
    color: '#047857',
  },
  fieldLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 5,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  notesTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 16,
  },
  dropdownSelectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dropdownSelectorValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dropdownListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 14,
    overflow: 'hidden',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemRowSelected: {
    backgroundColor: '#E0F2FE',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownItemTextSelected: {
    fontWeight: '800',
    color: '#0284C7',
  },
  locationCapturedBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  locationCapturedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationCapturedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  locationCapturedCoords: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationCapturedSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveWaypointModalBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  saveWaypointModalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  // End Patrol Summary Modal Styles
  summaryModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryCheckIconWrap: {
    marginBottom: 8,
  },
  summaryModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  summaryModalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  summaryStatusBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  summaryBadgeTextCompleted: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  summaryAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  summaryBadgeTextAvailable: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  summaryInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    marginBottom: 16,
  },
  summaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryInfoLabel: {
    width: 100,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryInfoVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  summarySectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  summaryMetricBox: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryMetricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  summaryMetricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  summarySectionBlock: {
    marginBottom: 14,
  },
  summaryObsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    marginBottom: 6,
  },
  summaryObsType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  summaryObsDesc: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  summaryReturnBtn: {
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryReturnBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Network Connectivity Banner Styles
  netBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  netBannerOnline: {
    backgroundColor: '#ECFDF5',
    borderBottomColor: '#A7F3D0',
  },
  netBannerOffline: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FCA5A5',
  },
  netBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  netBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  netBannerSub: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  netToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  netBtnOffline: {
    backgroundColor: '#DC2626',
  },
  netBtnOnline: {
    backgroundColor: '#059669',
  },
  netToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sync Badge Pills
  syncBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  syncBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  syncBadgeSubmitted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  syncBadgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#111827',
  },
});
