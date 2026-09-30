import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Button, Card, Badge } from '../../components/ui';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import Colors from '../../constants/colors';

export default function PatrolScreen() {
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Patrol Session</Text>
            <Badge
              label={isPatrolling ? 'Patrol Active' : 'Standby'}
              variant={isPatrolling ? 'success' : 'info'}
            />
          </View>

          <Text style={styles.statLabel}>Recorded GPS Points: {pointCount}</Text>

          <Button
            title={isPatrolling ? 'Stop Patrol' : 'Start GPS Patrol'}
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
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: 16,
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
