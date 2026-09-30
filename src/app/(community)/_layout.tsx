import React from 'react';
import { Stack } from 'expo-router';
import Colors from '../../constants/colors';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.secondary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Community Portal' }} />
      <Stack.Screen name="report-conflict" options={{ title: 'Report Conflict' }} />
      <Stack.Screen name="report-history" options={{ title: 'My Report History' }} />
    </Stack>
  );
}
