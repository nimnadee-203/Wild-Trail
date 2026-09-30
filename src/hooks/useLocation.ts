import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { LocationData } from '../types/incident';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestAndFetchLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
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
      setErrorMsg(e.message || 'Failed to get current location');
      setIsLoading(false);
      return null;
    }
  };

  useEffect(() => {
    requestAndFetchLocation();
  }, []);

  return {
    location,
    errorMsg,
    isLoading,
    refreshLocation: requestAndFetchLocation,
  };
}
