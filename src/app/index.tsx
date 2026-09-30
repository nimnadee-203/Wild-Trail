import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Badge } from '../components/ui';
import Colors from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Wildlife Protection & Monitoring System</Text>

          <Text style={styles.subtitle}>
            SE3070 Case Studies in Software Engineering Mobile Application
          </Text>
        </View>

        <Card style={styles.portalCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ranger Portal</Text>
            <Badge label="Ranger Access" variant="success" />
          </View>
          <Text style={styles.cardDescription}>
            GPS patrol tracking, incident reporting (poaching / illegal activity), and wildlife risk alert monitoring.
          </Text>
          <Button
            title="Open Ranger Dashboard"
            variant="primary"
            onPress={() => router.push('/(ranger)/dashboard')}
          />
        </Card>

        <Card style={styles.portalCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Community Reporter Portal</Text>
            <Badge label="Villager Access" variant="warning" />
          </View>
          <Text style={styles.cardDescription}>
            Report human-wildlife conflicts (crop damage, animal intrusions) and view historical report statuses.
          </Text>
          <Button
            title="Open Community Dashboard"
            variant="secondary"
            onPress={() => router.push('/(community)/dashboard')}
          />
        </Card>

        <Card style={styles.portalCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Authentication</Text>
            <Badge label="Account" variant="info" />
          </View>
          <Text style={styles.cardDescription}>
            Sign in with your ranger badge number or community reporter ID.
          </Text>
          <Button
            title="Sign In / Switch Account"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Project initialized with Expo Router, TypeScript, ESLint, Prettier, AsyncStorage, Expo Location, and Expo Camera / ImagePicker.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  portalCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
