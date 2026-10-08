import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { LocationData } from '../types/incident';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestAndFetchLocation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          // On web browser dev environment, if browser location permission is blocked or denied,
          // supply simulated Yala NP GPS coordinates so rangers can continue testing.
          const fallbackLoc: LocationData = {
            latitude: 6.3725,
            longitude: 81.5165,
            altitude: 12.5,
            accuracy: 5.0,
          };
          setLocation(fallbackLoc);
          setErrorMsg('Browser location denied. Using simulated Park GPS (6.3725° N, 81.5165° E)');
          setIsLoading(false);
          return fallbackLoc;
        }
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        altitude: currentLocation.coords.altitude,
        accuracy: currentLocation.coords.accuracy,
      };

      setLocation(locData);
      setIsLoading(false);
      return locData;
    } catch (e: any) {
      if (Platform.OS === 'web') {
        const fallbackLoc: LocationData = {
          latitude: 6.3725,
          longitude: 81.5165,
          altitude: 12.5,
          accuracy: 5.0,
        };
        setLocation(fallbackLoc);
        setErrorMsg('Browser location error. Using simulated Park GPS (6.3725° N, 81.5165° E)');
        setIsLoading(false);
        return fallbackLoc;
      }
      setErrorMsg(e.message || 'Failed to get current location');
      setIsLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      requestAndFetchLocation();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    location,
    errorMsg,
    isLoading,
    refreshLocation: requestAndFetchLocation,
  };
}
