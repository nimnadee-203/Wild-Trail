import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Direct root URL http://localhost:8081/ straight to the Login screen
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.text}>Redirecting to Login Portal...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.muted,
  },
});
