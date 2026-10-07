import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import Colors from '../../constants/colors';

export default function ManagerLayout() {
  const { isChecking, isAuthorized } = useRoleGuard(['manager', 'admin']);

  if (isChecking || !isAuthorized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
