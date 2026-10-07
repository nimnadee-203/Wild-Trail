import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Badge } from '../../components/ui';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import Colors from '../../constants/colors';
import { patrolApiService } from '../../services/api/patrols';
import { ActualPathPoint } from '../../types/patrol';

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
      if (activeSession && activeSession.actualPath && activeSession.actualPath.length > 0) {
        setActualPath(activeSession.actualPath);
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
  }, [isPatrolling, location]);

  const togglePatrol = async () => {
    if (isPatrolling) {
      if (patrolId) {
        await patrolApiService.endPatrolSession(patrolId);
      }
      setIsPatrolling(false);
      Alert.alert(
        'Patrol Session Ended',
        `Recorded total ${actualPath.length} GPS breadcrumbs (${calculatePathDistance(actualPath)} km).\nPatrol status updated to COMPLETED and Ranger status returned to AVAILABLE.`,
        [
          { text: 'Return to Dashboard', onPress: () => router.push('/dashboard') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } else {
      setIsPatrolling(true);
    }
  };

  const currentDistanceKm = calculatePathDistance(actualPath);

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerTitle}>{patrolId ? `Patrol: ${patrolId}` : 'GPS Patrol Tracking'}</Text>
            <Text style={styles.headerSubtitle}>{park} • Active Field GPS</Text>
          </View>
        </View>

        <Badge
          label={isPatrolling ? 'Patrol Active' : 'Standby'}
          variant={isPatrolling ? 'success' : 'info'}
        />
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
              <Text style={styles.statValueText}>{currentDistanceKm} km</Text>
              <Text style={styles.statLabelText}>Travelled Path</Text>
            </View>
          </View>

          <Button
            title={isPatrolling ? 'Stop Patrol Session' : 'Start GPS Patrol'}
            variant={isPatrolling ? 'danger' : 'primary'}
            onPress={togglePatrol}
            style={styles.patrolBtn}
          />
        </Card>

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
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValueText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.primaryDark,
  },
  statLabelText: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 2,
  },
  patrolBtn: {
    marginTop: 4,
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
});
