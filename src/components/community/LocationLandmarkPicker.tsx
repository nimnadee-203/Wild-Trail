import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LocationCoords, MapPickerModal } from './MapPickerModal';

interface LocationLandmarkPickerProps {
  landmarkText: string;
  onChangeLandmarkText: (text: string) => void;
  coords: LocationCoords | null;
  onCoordsChange: (coords: LocationCoords | null) => void;
  locationSource: 'gps' | 'map' | null;
  onLocationSourceChange: (source: 'gps' | 'map' | null) => void;
}

export function LocationLandmarkPicker({
  landmarkText,
  onChangeLandmarkText,
  coords,
  onCoordsChange,
  locationSource,
  onLocationSourceChange,
}: LocationLandmarkPickerProps) {
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const handleUseCurrentLocation = async () => {
    setFetchingGps(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Location permission is required to fetch current GPS coordinates.';
        setGpsError(msg);
        Alert.alert('Permission Denied', msg);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords: LocationCoords = {
        latitude: Number(position.coords.latitude.toFixed(5)),
        longitude: Number(position.coords.longitude.toFixed(5)),
        accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined,
      };

      onCoordsChange(nextCoords);
      onLocationSourceChange('gps');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to acquire current location.';
      setGpsError(msg);
      Alert.alert('Location Error', msg);
    } finally {
      setFetchingGps(false);
    }
  };

  const handleMapConfirm = (selected: LocationCoords) => {
    onCoordsChange(selected);
    onLocationSourceChange('map');
    setGpsError(null);
  };

  const handleClearCoords = () => {
    onCoordsChange(null);
    onLocationSourceChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Nearby landmark / location</Text>
      <Text style={styles.sectionHint}>
        Pinpoint the incident area with your GPS, pick a spot on the map, and add an optional landmark.
      </Text>

      {/* Action Buttons: Current Location or Map */}
      <View style={styles.actionsRow}>
        <Pressable
          style={[
            styles.actionButton,
            locationSource === 'gps' && styles.actionButtonActive,
            fetchingGps && styles.actionButtonDisabled,
          ]}
          onPress={handleUseCurrentLocation}
          disabled={fetchingGps}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
        >
          {fetchingGps ? (
            <ActivityIndicator size="small" color="#166534" />
          ) : (
            <Ionicons
              name="navigate-outline"
              size={18}
              color={locationSource === 'gps' ? '#FFFFFF' : '#166534'}
            />
          )}
          <Text
            style={[
              styles.actionButtonText,
              locationSource === 'gps' && styles.actionButtonTextActive,
            ]}
          >
            {fetchingGps ? 'Locating…' : 'Use my current location'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            locationSource === 'map' && styles.actionButtonActive,
          ]}
          onPress={() => setMapModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select location on map"
        >
          <Ionicons
            name="map-outline"
            size={18}
            color={locationSource === 'map' ? '#FFFFFF' : '#166534'}
          />
          <Text
            style={[
              styles.actionButtonText,
              locationSource === 'map' && styles.actionButtonTextActive,
            ]}
          >
            Select location on map
          </Text>
        </Pressable>
      </View>

      {/* Error message */}
      {!!gpsError && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
          <Text style={styles.errorText}>{gpsError}</Text>
        </View>
      )}

      {/* Selected Location Pill */}
      {coords && (
        <View style={styles.coordsCard}>
          <View style={styles.coordsLeft}>
            <Ionicons
              name={locationSource === 'gps' ? 'navigate' : 'pin'}
              size={18}
              color="#166534"
            />
            <View>
              <Text style={styles.coordsTitle}>
                {locationSource === 'gps'
                  ? 'Current Device GPS Captured'
                  : 'Location Pinned on Map'}
              </Text>
              <Text style={styles.coordsSub}>
                {coords.latitude.toFixed(5)}° N, {coords.longitude.toFixed(5)}° E
                {coords.accuracy ? ` (±${coords.accuracy}m)` : ''}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleClearCoords}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityLabel="Remove selected coordinates"
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </Pressable>
        </View>
      )}

      {/* Optionally: Nearby Landmark */}
      <View style={styles.landmarkField}>
        <Text style={styles.landmarkLabel}>
          Nearby landmark <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={landmarkText}
          onChangeText={onChangeLandmarkText}
          placeholder="e.g. Near big banyan tree, Behind water tank, Culvert #4"
          placeholderTextColor="#9CA3AF"
          accessibilityLabel="Nearby landmark optional"
        />
      </View>

      {/* Map Picker Modal */}
      <MapPickerModal
        visible={mapModalOpen}
        initialCoords={coords}
        onConfirm={handleMapConfirm}
        onClose={() => setMapModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionHint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  actionButtonActive: {
    backgroundColor: '#166534',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    flex: 1,
  },
  coordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  coordsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  coordsSub: {
    fontSize: 12,
    color: '#374151',
  },
  clearBtn: {
    padding: 4,
  },
  landmarkField: {
    gap: 4,
    marginTop: 4,
  },
  landmarkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  optional: {
    fontWeight: '400',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5CD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    color: '#1F2937',
    fontSize: 14,
  },
});
