export const APP_CONFIG = {
  appName: 'Wildlife Guard Mobile',
  version: '1.0.0',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.wildlifeguard.org/v1',
  mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1...your_mapbox_token_here',
  gpsLocationIntervalMs: 10000, // Update GPS every 10s during patrol
  syncIntervalMinutes: 15,
  mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  defaultCoordinates: {
<<<<<<< HEAD
    latitude: 6.3672,
    longitude: 81.503,
=======
    latitude: 6.852,
    longitude: 80.926,
>>>>>>> origin/feature/park-manager-dashboard
  },
};
