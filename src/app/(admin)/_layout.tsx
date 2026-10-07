import React from 'react';
import { Stack } from 'expo-router';
import { useRoleGuard } from '../../hooks/useRoleGuard';

export default function AdminLayout() {
  useRoleGuard(['admin']);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="users/index" />
      <Stack.Screen name="users/create" />
    </Stack>
  );
}
