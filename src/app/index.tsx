import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Badge, Button, Card } from '../components/ui';
import Colors from '../constants/colors';
import { storageService } from '../storage/asyncStorage';
import { STORAGE_KEYS } from '../storage/keys';
import { StaffUser } from '../types/user';

export default function HomeScreen() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const userProfile = await storageService.getItem<StaffUser>(STORAGE_KEYS.USER_PROFILE);

      if (!userProfile || userProfile.accountStatus === 'DISABLED') {
        setIsCheckingAuth(false);
        router.replace('/(auth)/login');
        return;
      }

      // Auto-route logged in staff user to their role-specific dashboard
      switch (userProfile.role) {
        case 'admin':
          router.replace('/(admin)/users' as any);
          break;
        case 'manager':
          router.replace('/(manager)/overview' as any);
          break;
        case 'liaison':
          router.replace('/(liaison)/dashboard' as any);
          break;
        case 'ranger':
        default:
          router.replace('/(ranger)/dashboard' as any);
          break;
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={{ marginTop: 12, fontSize: 14, color: Colors.light.muted }}>
          Verifying Authentication Status...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Wildlife Protection & Monitoring System
          </Text>
          <Text style={styles.subtitle}>
            SE3070 Case Studies in Software Engineering Mobile Application
          </Text>
        </View>

        <Card style={styles.portalCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Community Reporter Portal</Text>
            <Badge label="Villager Access" variant="warning" />
          </View>

          <Text style={styles.cardDescription}>
            Report human-wildlife conflicts (crop damage, animal intrusions)
            and view historical report statuses.
          </Text>

          <Button
            title="Community Dashboard Unavailable"
            variant="secondary"
            disabled
          />
        </Card>

        <Card style={styles.portalCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Park Manager Dashboard</Text>
            <Badge label="Manager Access" variant="info" />
          </View>

          <Text style={styles.cardDescription}>
            Monitor park activity, coordinate patrols, respond to alerts,
            and generate operational reports.
          </Text>

          <Button
            title="Open Manager Dashboard"
            variant="primary"
            onPress={() => router.push('/(manager)/overview' as any)}
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
            Project initialized with Expo Router, TypeScript, ESLint,
            Prettier, AsyncStorage, Expo Location, and Expo Camera / ImagePicker.
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
