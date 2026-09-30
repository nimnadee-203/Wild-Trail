import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Card, Badge } from '../../components/ui';
import { WildlifeAlert } from '../../types/alert';
import Colors from '../../constants/colors';

const SAMPLE_ALERTS: WildlifeAlert[] = [
  {
    id: '1',
    title: 'Elephant Herd Movement Near Zone C',
    message: 'A herd of 12 elephants spotted approaching North Corridor farmland.',
    level: 'warning',
    affectedZone: 'North Corridor / Sector 4',
    timestamp: '10 mins ago',
    active: true,
  },
  {
    id: '2',
    title: 'Suspected Poaching Vehicle Signal',
    message: 'Unregistered drone detected operating near East Boundary.',
    level: 'danger',
    affectedZone: 'East Boundary Checkpoint',
    timestamp: '35 mins ago',
    active: true,
  },
];

export default function AlertsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Active Risk & Threat Alerts</Text>

        {SAMPLE_ALERTS.map((alert) => (
          <Card key={alert.id} style={styles.alertCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Badge
                label={alert.level.toUpperCase()}
                variant={alert.level === 'danger' ? 'danger' : 'warning'}
              />
            </View>

            <Text style={styles.message}>{alert.message}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Zone: {alert.affectedZone}</Text>
              <Text style={styles.metaText}>{alert.timestamp}</Text>
            </View>
          </Card>
        ))}
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
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  alertCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
});
