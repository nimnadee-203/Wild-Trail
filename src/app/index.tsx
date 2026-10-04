import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root entry point. Automatically redirects to the Ranger Wildlife Monitoring
 * home dashboard with the persistent bottom navigation bar.
 */
export default function Index() {
  return <Redirect href="/dashboard" />;
}
