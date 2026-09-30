import React from 'react';
import { Stack } from 'expo-router';
import Colors from '../../constants/colors';

export default function RangerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Ranger Dashboard' }} />
      <Stack.Screen name="patrol" options={{ title: 'GPS Patrol Tracking' }} />
      <Stack.Screen name="report-incident" options={{ title: 'Report Incident / Poaching' }} />
      <Stack.Screen name="alerts" options={{ title: 'Wildlife Risk Alerts' }} />
    </Stack>
  );
}
