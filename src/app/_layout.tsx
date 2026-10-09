import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/colors';
import { CommunitySync } from '../components/CommunitySync';
import { RangerIncidentSync } from '../components/RangerIncidentSync';

export default function RootLayout() {
  return (
    <>
      <CommunitySync />
      <RangerIncidentSync />
      <StatusBar style="dark" />
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
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="community-report" options={{ title: 'Community Reporting' }} />
        <Stack.Screen name="community-operations" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(ranger)" options={{ headerShown: false }} />
        <Stack.Screen name="(manager)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(liaison)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
