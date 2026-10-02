import React from 'react';
import { Tabs } from 'expo-router';
import Colors from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function RangerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: Colors.light.primary,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Ionicons name="notifications-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
      
      {/* Hide the other screens from the tab bar but keep them in the routing */}
      <Tabs.Screen
        name="patrol"
        options={{
          href: null,
          title: 'GPS Patrol Tracking',
        }}
      />
      <Tabs.Screen
        name="report-incident"
        options={{
          href: null,
          title: 'Report Incident',
        }}
      />
    </Tabs>
  );
}
