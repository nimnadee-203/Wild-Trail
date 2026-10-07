import React from 'react';
import { Stack } from 'expo-router';
import { useRoleGuard } from '../../hooks/useRoleGuard';

export default function LiaisonLayout() {
  useRoleGuard(['liaison', 'admin']);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
