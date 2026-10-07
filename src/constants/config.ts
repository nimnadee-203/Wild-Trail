export const APP_CONFIG = {
  appName: 'Wildlife Guard Mobile',
  version: '1.0.0',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.wildlifeguard.org/v1',
  gpsLocationIntervalMs: 10000, // Update GPS every 10s during patrol
  syncIntervalMinutes: 15,
  mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  defaultCoordinates: {
    latitude: 6.852,
    longitude: 80.926,
  },
};
