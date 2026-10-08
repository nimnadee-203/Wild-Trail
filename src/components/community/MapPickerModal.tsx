import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { CommunityLocationMap } from './CommunityLocationMap';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface MapPickerModalProps {
  visible: boolean;
  initialCoords?: LocationCoords | null;
  onConfirm: (coords: LocationCoords) => void;
  onClose: () => void;
}

const GATE_PRESETS = [
  { name: 'East Gate', lat: 6.375, lng: 81.53 },
  { name: 'West Gate', lat: 6.358, lng: 81.472 },
  { name: 'North Gate', lat: 6.398, lng: 81.505 },
  { name: 'South Gate', lat: 6.335, lng: 81.501 },
  {
    name: 'Park Center',
    lat: APP_CONFIG.defaultCoordinates.latitude,
    lng: APP_CONFIG.defaultCoordinates.longitude,
  },
];

function MapPickerModalContent({
  initialCoords,
  onConfirm,
  onClose,
}: {
  initialCoords?: LocationCoords | null;
  onConfirm: (coords: LocationCoords) => void;
  onClose: () => void;
}) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 600 || windowHeight < 700;
  const [selectedPin, setSelectedPin] = useState<LocationCoords>(() => ({
    latitude: initialCoords?.latitude ?? APP_CONFIG.defaultCoordinates.latitude,
    longitude: initialCoords?.longitude ?? APP_CONFIG.defaultCoordinates.longitude,
  }));

  const containerRef = useRef<any>(null);
  const mapboxInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Web Mapbox initialization
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let mapboxgl: any;
    let cancelled = false;

    const setupMap = async () => {
      try {
        mapboxgl = (await import('mapbox-gl')).default;
        if (cancelled || !containerRef.current) return;

        // Ensure stylesheet
        if (
          typeof document !== 'undefined' &&
          !document.getElementById('mapbox-gl-css')
        ) {
          const link = document.createElement('link');
          link.id = 'mapbox-gl-css';
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css';
          document.head.appendChild(link);
        }

        const token = APP_CONFIG.mapboxAccessToken;
        if (token) {
          mapboxgl.accessToken = token;
        }

        const initialLat =
          initialCoords?.latitude ?? APP_CONFIG.defaultCoordinates.latitude;
        const initialLng =
          initialCoords?.longitude ?? APP_CONFIG.defaultCoordinates.longitude;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [initialLng, initialLat],
          zoom: 12,
        });

        const nav = new mapboxgl.NavigationControl({ showCompass: true });
        map.addControl(nav, 'top-right');

        // Add draggable marker
        const marker = new mapboxgl.Marker({
          color: '#166534',
          draggable: true,
        })
          .setLngLat([initialLng, initialLat])
          .addTo(map);

        markerRef.current = marker;

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setSelectedPin({
            latitude: Number(lngLat.lat.toFixed(5)),
            longitude: Number(lngLat.lng.toFixed(5)),
          });
        });

        map.on('click', (e: any) => {
          const coords = {
            latitude: Number(e.lngLat.lat.toFixed(5)),
            longitude: Number(e.lngLat.lng.toFixed(5)),
          };
          setSelectedPin(coords);
          marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        });

        mapboxInstanceRef.current = map;
      } catch (err) {
        console.warn('Mapbox web load fallback:', err);
      }
    };

    const timer = setTimeout(setupMap, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapboxInstanceRef.current) {
        try {
          mapboxInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapboxInstanceRef.current = null;
      }
    };
  }, [initialCoords]);

  const handleSelectPreset = (preset: (typeof GATE_PRESETS)[number]) => {
    const next = { latitude: preset.lat, longitude: preset.lng };
    setSelectedPin(next);
    if (mapboxInstanceRef.current) {
      mapboxInstanceRef.current.flyTo({
        center: [preset.lng, preset.lat],
        zoom: 13,
      });
    }
    if (markerRef.current) {
      markerRef.current.setLngLat([preset.lng, preset.lat]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedPin);
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <ScrollView
        style={[
          styles.modalContent,
          isCompact && styles.compactModalContent,
          { maxHeight: windowHeight - 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="map" size={20} color="#166534" />
            <Text style={styles.headerTitle}>Select Location on Map</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#4B5563" />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Tap the map, drag the pin, or choose a preset gate to mark the incident location.
        </Text>

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          <Text style={styles.presetsLabel}>Presets:</Text>
          {GATE_PRESETS.map((p) => {
            const active =
              Math.abs(selectedPin.latitude - p.lat) < 0.001 &&
              Math.abs(selectedPin.longitude - p.lng) < 0.001;
            return (
              <Pressable
                key={p.name}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => handleSelectPreset(p)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    active && styles.presetChipTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Map Container */}
        <View style={[styles.mapWrapper, isCompact && styles.compactMapWrapper]}>
          {Platform.OS === 'web' ? (
            <div
              ref={containerRef}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            />
          ) : (
            <CommunityLocationMap coords={selectedPin} onChange={setSelectedPin} />
          )}
        </View>

        {/* Coordinates Bar */}
        <View style={styles.coordsCard}>
          <View style={styles.coordsRow}>
            <Ionicons name="location-sharp" size={18} color="#166534" />
            <Text style={styles.coordsText}>
              Coordinates: {selectedPin.latitude.toFixed(5)}° N,{' '}
              {selectedPin.longitude.toFixed(5)}° E
            </Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export function MapPickerModal({
  visible,
  initialCoords,
  onConfirm,
  onClose,
}: MapPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <MapPickerModalContent
          initialCoords={initialCoords}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  compactModalContent: {
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginRight: 2,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
  },
  presetChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: '#166534',
    fontWeight: '700',
  },
  mapWrapper: {
    height: 340,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  compactMapWrapper: {
    height: 240,
  },
  mobileFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
    backgroundColor: '#F0FDF4',
  },
  mobileFallbackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  mobileFallbackSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  coordsCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordsText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#166534',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
