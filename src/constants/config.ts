export const APP_CONFIG = {
  appName: 'Wildlife Guard Mobile',
  version: '1.0.0',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.wildlifeguard.org/v1',
  gpsLocationIntervalMs: 10000, // Update GPS every 10s during patrol
  syncIntervalMinutes: 15,
  defaultCoordinates: {
    latitude: -1.286389,
    longitude: 36.817223,
  },
};
