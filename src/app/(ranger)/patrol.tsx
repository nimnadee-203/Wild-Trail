import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Badge } from '../../components/ui';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import Colors from '../../constants/colors';

export default function PatrolScreen() {
  const router = useRouter();
  const { location, errorMsg, isLoading, refreshLocation } = useLocation();
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  const togglePatrol = () => {
    setIsPatrolling((prev) => !prev);
    if (!isPatrolling) {
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
            <Text style={styles.headerTitle}>GPS Patrol Tracking</Text>
            <Text style={styles.headerSubtitle}>Field Ranger Path & Breadcrumbs</Text>
          </View>
        </View>

        <Badge
          label={isPatrolling ? 'Patrol Active' : 'Standby'}
          variant={isPatrolling ? 'success' : 'info'}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Patrol Session</Text>
            <Ionicons
              name={isPatrolling ? 'walk' : 'pause-circle-outline'}
              size={24}
              color={isPatrolling ? '#15803D' : '#6B7280'}
            />
          </View>

          <Text style={styles.statLabel}>Recorded GPS Points: {pointCount}</Text>

          <Button
            title={isPatrolling ? 'Stop Patrol Session' : 'Start GPS Patrol'}
            variant={isPatrolling ? 'danger' : 'primary'}
            onPress={togglePatrol}
            style={styles.patrolBtn}
          />
        </Card>

        <Card style={styles.locationCard}>
          <Text style={styles.sectionTitle}>Current GPS Coordinates</Text>

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
  refreshBtn: {
    marginTop: 4,
  },
});
