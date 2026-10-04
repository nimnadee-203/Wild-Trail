import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Badge, Button } from '../../components/ui';
import { WildlifeAlert } from '../../types/alert';
import Colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const RECENT_ALERTS = [
  {
    id: '1',
    title: 'Elephant E-014',
    location: 'Farmland Zone B',
    level: 'HIGH',
    timestamp: '07:43 PM',
  },
  {
    id: '2',
    title: 'Elephant E-011',
    location: 'Waterhole Zone',
    level: 'MEDIUM',
    timestamp: '05:20 PM',
  },
];

export default function AlertsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* High Risk Alert Banner */}
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={32} color={Colors.light.danger} style={styles.alertIcon} />
            <Text style={styles.alertHeading}>WILDLIFE{'\n'}RISK ALERT</Text>
          </View>
          
          <View style={styles.animalInfoRow}>
            {/* Placeholder for Animal Image */}
            <View style={styles.animalImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={Colors.light.muted} />
            </View>
            <View style={styles.animalDetails}>
              <Text style={styles.animalId}>Elephant E-014</Text>
              <Text style={styles.animalZone}>Farmland Zone B</Text>
              <Text style={styles.riskLevelText}>Risk Level: <Text style={styles.riskLevelHigh}>HIGH</Text></Text>
            </View>
          </View>
          
          <Text style={styles.detectedTime}>Detected: 18 May 2025, 07:43 PM</Text>
          
          <Button 
            title="VIEW ALERT" 
            variant="primary" 
            onPress={() => router.push('/(ranger)/alerts/e014' as any)} 
            style={styles.viewAlertBtn}
          />
        </Card>

        {/* Recent Alerts List */}
        <View style={styles.recentSection}>
          <Text style={styles.recentHeading}>Recent Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {RECENT_ALERTS.map((alert) => (
          <TouchableOpacity key={alert.id} style={styles.recentAlertItem} onPress={() => {}}>
            <View style={styles.recentAlertImagePlaceholder}>
              <Ionicons name="image-outline" size={16} color={Colors.light.muted} />
            </View>
            <View style={styles.recentAlertDetails}>
              <Text style={styles.recentAlertId}>{alert.title}</Text>
              <Text style={styles.recentAlertZone}>{alert.location}</Text>
              <Text style={[styles.recentAlertLevel, alert.level === 'HIGH' ? styles.levelHigh : styles.levelMedium]}>
                {alert.level}
              </Text>
            </View>
            <View style={styles.recentAlertTime}>
              <Text style={styles.timeText}>{alert.timestamp}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.muted} />
            </View>
          </TouchableOpacity>
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
  alertCard: {
    borderWidth: 2,
    borderColor: Colors.light.danger,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.danger,
    textAlign: 'left',
  },
  animalInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  animalImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  animalDetails: {
    justifyContent: 'center',
  },
  animalId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  animalZone: {
    fontSize: 14,
    color: Colors.light.text,
    marginVertical: 4,
  },
  riskLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  riskLevelHigh: {
    color: Colors.light.danger,
  },
  detectedTime: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  viewAlertBtn: {
    backgroundColor: Colors.light.primaryDark,
  },
  recentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  recentAlertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  recentAlertImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentAlertDetails: {
    flex: 1,
  },
  recentAlertId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  recentAlertZone: {
    fontSize: 12,
    color: Colors.light.muted,
    marginVertical: 2,
  },
  recentAlertLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelHigh: {
    color: Colors.light.danger,
  },
  levelMedium: {
    color: Colors.light.warning,
  },
  recentAlertTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.muted,
    marginRight: 4,
  },
});

