import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Badge } from '../../components/ui';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import Colors from '../../constants/colors';
import { patrolApiService } from '../../services/api/patrols';

export default function PatrolScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const patrolId = typeof params.patrolId === 'string' ? params.patrolId : null;
  const patrolName = typeof params.patrolName === 'string' ? params.patrolName : 'Standard Patrol Route';
  const park = typeof params.park === 'string' ? params.park : 'Yala National Park';
  const priority = typeof params.priority === 'string' ? params.priority : 'NORMAL';

  let parsedCoords: [number, number][] = [];
  if (typeof params.routeCoords === 'string') {
    try {
      parsedCoords = JSON.parse(params.routeCoords);
    } catch {
      parsedCoords = [];
    }
  }

  const { location, errorMsg, isLoading, refreshLocation } = useLocation();
  const [isPatrolling, setIsPatrolling] = useState(!!patrolId);
  const [pointCount, setPointCount] = useState(patrolId ? 1 : 0);

  useEffect(() => {
    if (isPatrolling) {
      const interval = setInterval(() => {
        setPointCount((prev) => prev + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPatrolling]);

  const togglePatrol = async () => {
    if (isPatrolling) {
      if (patrolId) {
        await patrolApiService.endPatrolSession(patrolId);
      }
      setIsPatrolling(false);
      Alert.alert(
        'Patrol Session Ended',
        'Patrol status updated to COMPLETED and Ranger status returned to AVAILABLE.',
        [
          { text: 'Return to Dashboard', onPress: () => router.push('/dashboard') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } else {
      setIsPatrolling(true);
      setPointCount(1);
    }
  };

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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Active Assigned Patrol Banner Card */}
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

            {/* Mapbox Route Waypoint Summary */}
            <View style={styles.routeBoxSummary}>
              <View style={styles.routeBoxHeader}>
                <Ionicons name="navigate-outline" size={16} color="#059669" />
                <Text style={styles.routeBoxHeaderText}>
                  Mapbox Route ({parsedCoords.length > 0 ? parsedCoords.length : 3} Waypoints Active)
                </Text>
              </View>

              {parsedCoords.map((coord, idx) => (
                <Text key={idx} style={styles.waypointText}>
                  📍 Waypoint {idx + 1}: {coord[1].toFixed(4)}° N, {coord[0].toFixed(4)}° E
                </Text>
              ))}
            </View>
          </Card>
        )}

        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Patrol Session</Text>
            <Ionicons
              name={isPatrolling ? 'walk' : 'pause-circle-outline'}
              size={24}
              color={isPatrolling ? '#15803D' : '#6B7280'}
            />
          </View>

          <Text style={styles.statLabel}>Recorded GPS Breadcrumb Points: {pointCount}</Text>

          <Button
            title={isPatrolling ? 'Stop Patrol Session' : 'Start GPS Patrol'}
            variant={isPatrolling ? 'danger' : 'primary'}
            onPress={togglePatrol}
            style={styles.patrolBtn}
          />
        </Card>

        <Card style={styles.locationCard}>
          <Text style={styles.sectionTitle}>Current Live GPS Coordinates</Text>

          {isLoading ? (
            <Text style={styles.infoText}>Acquiring GPS Signal...</Text>
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
  statusCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 12,
  },
  patrolBtn: {
    marginTop: 8,
  },
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
  assignedBannerCard: {
    marginBottom: 16,
    backgroundColor: '#0F1D17',
    borderColor: '#294B3B',
    borderWidth: 1,
    padding: 14,
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
  routeBoxSummary: {
    marginTop: 12,
    backgroundColor: '#162C21',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#223B2E',
  },
  routeBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  routeBoxHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ADE80',
  },
  waypointText: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  refreshBtn: {
    marginTop: 4,
  },
});
