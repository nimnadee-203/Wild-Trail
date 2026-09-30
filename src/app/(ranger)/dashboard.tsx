import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Badge } from '../../components/ui';
import Colors from '../../constants/colors';

export default function RangerDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, Ranger Operations</Text>
          <Badge label="Active Status: Standby" variant="success" />
        </View>

        <Card style={styles.quickCard}>
          <Text style={styles.cardHeader}>Patrol Tracker</Text>
          <Text style={styles.cardBody}>
            Log real-time GPS patrol tracks, monitor coordinates, and record field observation logs.
          </Text>
          <Button
            title="Start Patrol Tracking"
            variant="primary"
            onPress={() => router.push('/(ranger)/patrol')}
          />
        </Card>

        <Card style={styles.quickCard}>
          <Text style={styles.cardHeader}>Wildlife Incident Report</Text>
          <Text style={styles.cardBody}>
            Capture poaching activities, snares, illegal logging, or injured wildlife with photo attachments.
          </Text>
          <Button
            title="Report New Incident"
            variant="secondary"
            onPress={() => router.push('/(ranger)/report-incident')}
          />
        </Card>

        <Card style={styles.quickCard}>
          <Text style={styles.cardHeader}>Risk Alerts & Threats</Text>
          <Text style={styles.cardBody}>
            View broadcasted perimeter threats, predator sightings near human settlements, and high-risk zones.
          </Text>
          <Button
            title="View Active Risk Alerts"
            variant="outline"
            onPress={() => router.push('/(ranger)/alerts')}
          />
        </Card>

        <Button
          title="Return to Main Portal"
          variant="outline"
          onPress={() => router.replace('/')}
          style={styles.homeBtn}
        />
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
  header: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 6,
  },
  quickCard: {
    marginBottom: 12,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 12,
    lineHeight: 20,
  },
  homeBtn: {
    marginTop: 12,
  },
});
