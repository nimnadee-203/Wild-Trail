import React from 'react';
import { Stack } from 'expo-router';
import { useRoleGuard } from '../../hooks/useRoleGuard';

export default function ManagerLayout() {
  useRoleGuard(['manager', 'admin']);

  return <Stack screenOptions={{ headerShown: false }} />;
}
