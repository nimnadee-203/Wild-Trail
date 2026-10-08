import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { communityStyles as s } from '../components/communityStyles';
import {
  getCommunityQueue,
  getReportSyncStatus,
  getSimulatedOffline,
  isCommunityOnline,
  queueCommunityReport,
  setSimulatedOffline,
  subscribeNetworkStatus,
  syncCommunityReports,
  validateCommunityInput,
} from '../services/communityReports';
import {
  COMMUNITY_REPORT_KINDS,
  COMMUNITY_REPORT_TYPES,
  CommunityInput,
  QueuedCommunityReport,
} from '../types/community';
import { VillagePicker } from '../components/community/VillagePicker';
import { BoundaryOption, BoundarySelector } from '../components/community/BoundarySelector';
import { LocationLandmarkPicker } from '../components/community/LocationLandmarkPicker';
import { LocationCoords } from '../components/community/MapPickerModal';
import { DateTimePicker } from '../components/community/DateTimePickerModal';
import { DynamicDescriptionFields } from '../components/community/DynamicDescriptionFields';

export default function CommunityReportScreen() {
  const [kind, setKind] = useState<CommunityInput['kind']>('crop_raiding');
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [urgentAnimal, setUrgentAnimal] = useState('Elephant');
  const [urgentOtherAnimal, setUrgentOtherAnimal] = useState('');
  const [urgentDirection, setUrgentDirection] = useState('');
  const [urgentCoords, setUrgentCoords] = useState<LocationCoords | null>(null);
  const [urgentOccurredAt, setUrgentOccurredAt] = useState('');
  const [urgentLocationBusy, setUrgentLocationBusy] = useState(false);
  const [urgentBusy, setUrgentBusy] = useState(false);

  // 1. Village dropdown
  const [village, setVillage] = useState('');
  const [customVillage, setCustomVillage] = useState('');

  // 2. Boundary section (East Gate, West Gate, North Gate, South Gate, Other)
  const [boundaryOption, setBoundaryOption] = useState<BoundaryOption | ''>('');
  const [customBoundary, setCustomBoundary] = useState('');

  // 3. Location & landmark (Current GPS, Map Selection, Optional Landmark)
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'map' | null>(null);
  const [landmarkText, setLandmarkText] = useState('');

  // 4. Date & Time picker
  const [occurredAt, setTime] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');
  });

  // 5. Dynamic incident description
  const [description, setDescription] = useState('');

  // Contact phone
  const [contactPhone, setPhone] = useState('');

  // Photos & offline queue
  const [photos, setPhotos] = useState<string[]>([]);
  const [queue, setQueue] = useState<QueuedCommunityReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => isCommunityOnline());
  const { takePhotoWithCamera, pickImageFromGallery } = useCameraPermission();

  const getLocalDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');
  };

  const captureUrgentLocation = async () => {
    setUrgentLocationBusy(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for an immediate wildlife alert.');
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUrgentCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to get your current location.');
      setUrgentCoords(null);
    } finally {
      setUrgentLocationBusy(false);
    }
  };

  const openUrgentReport = () => {
    setUrgentOpen(true);
    setUrgentOccurredAt(getLocalDateTime());
    void captureUrgentLocation();
  };

  const submitUrgentReport = async () => {
    const animal = urgentAnimal === 'Other' ? urgentOtherAnimal.trim() : urgentAnimal;
    if (!animal || !urgentDirection || !urgentCoords) {
      setError('Choose the animal and direction, and allow GPS before sending the alert.');
      return;
    }

    setUrgentBusy(true);
    setError('');
    try {
      const urgentKind = urgentAnimal === 'Elephant' ? 'elephant_sighting' : 'other_wildlife_conflict';
      const saved = await queueCommunityReport(
        {
          kind: urgentKind,
          village: 'Immediate GPS alert',
          boundarySection: 'Current location',
          landmark: `GPS: ${urgentCoords.latitude.toFixed(5)}, ${urgentCoords.longitude.toFixed(5)}`,
          description: `${animal} moving ${urgentDirection.toLowerCase()}.`,
          contactPhone: '',
          occurredAt: urgentOccurredAt,
          source: 'community_app',
          urgentAlert: {
            animal,
            direction: urgentDirection,
            latitude: urgentCoords.latitude,
            longitude: urgentCoords.longitude,
          },
        },
        []
      );

      setReceipt(saved.id);
      setUrgentOpen(false);
      setUrgentCoords(null);
      setUrgentDirection('');
      setUrgentOtherAnimal('');
      const updated = await getCommunityQueue();
      setQueue(updated);
      if (isCommunityOnline()) {
        void syncCommunityReports()
          .then(async () => setQueue(await getCommunityQueue()))
          .catch(() => undefined);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to send immediate alert.');
    } finally {
      setUrgentBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getCommunityQueue()
        .then((items) => {
          if (active) setQueue(items);
        })
        .catch(() => {
          if (active) setError('Unable to read saved reports.');
        });
    };
    refresh();
    const timer = setInterval(refresh, 2500);

    const unsubscribe = subscribeNetworkStatus((online) => {
      if (active) {
        setIsOnline(online);
        refresh();
      }
    });

    return () => {
      active = false;
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const selectPhoto = async (camera: boolean) => {
    setBusy(true);
    setError('');
    try {
      const uri = await (camera ? takePhotoWithCamera() : pickImageFromGallery());
      if (uri) setPhotos((current) => [...current, uri]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to select photo.');
    } finally {
      setBusy(false);
    }
  };

  const getEffectiveValues = () => {
    const effectiveVillage = village === 'Other' ? customVillage.trim() : village.trim();
    const effectiveBoundary =
      boundaryOption === 'Other' ? customBoundary.trim() : boundaryOption.trim();

    let effectiveLandmark = landmarkText.trim();
    if (coords) {
      const coordStr = `GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      effectiveLandmark = effectiveLandmark
        ? `${effectiveLandmark} (${coordStr})`
        : coordStr;
    }

    return {
      village: effectiveVillage,
      boundarySection: effectiveBoundary,
      landmark: effectiveLandmark,
      description: description.trim(),
    };
  };

  const handleReview = () => {
    try {
      const { village: v, boundarySection: b, landmark: l, description: d } =
        getEffectiveValues();

      if (!v) {
        throw new Error('Please select or specify your village.');
      }
      if (!b) {
        throw new Error('Please choose a boundary section (East, West, North, South Gate, or Other).');
      }
      if (!l) {
        throw new Error(
          'Please capture your current location, choose on the map, or enter a nearby landmark.'
        );
      }
      if (!d) {
        throw new Error('Please fill in the incident description details.');
      }

      validateCommunityInput({
        kind,
        village: v,
        boundarySection: b,
        landmark: l,
        description: d,
        contactPhone: contactPhone.trim(),
        occurredAt,
        source: 'community_app',
      });
      setError('');
      setReviewing(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Check the report details.');
    }
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const { village: v, boundarySection: b, landmark: l, description: d } =
        getEffectiveValues();

      const saved = await queueCommunityReport(
        {
          kind,
          village: v,
          boundarySection: b,
          landmark: l,
          description: d,
          contactPhone: contactPhone.trim(),
          occurredAt,
          source: 'community_app',
        },
        photos
      );

      setReceipt(saved.id);
      setReviewing(false);
      setPhotos([]);
      setCoords(null);
      setLocationSource(null);
      setLandmarkText('');
      setVillage('');
      setCustomVillage('');
      setBoundaryOption('');
      setCustomBoundary('');

      const updated = await getCommunityQueue();
      setQueue(updated);

      // If online, immediately sync to Firebase. If offline, leave as 'Waiting to sync'
      if (isCommunityOnline()) {
        void syncCommunityReports()
          .then(async () => {
            setQueue(await getCommunityQueue());
          })
          .catch(() => {
            // Keep local report marked as waiting/failed
          });
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save report.');
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async (targetId?: string) => {
    setSyncingId(targetId ?? 'all');
    setError('');
    try {
      await syncCommunityReports(targetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed. Retry when connected.');
    } finally {
      setSyncingId(null);
      setQueue(await getCommunityQueue());
    }
  };

  const effective = getEffectiveValues();

  const pendingReports = queue.filter(
    (e) => getReportSyncStatus(e) === 'waiting'
  );
  const failedReports = queue.filter(
    (e) => getReportSyncStatus(e) === 'failed'
  );

  const isSimulatedOfflineState = getSimulatedOffline();

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 4 }}>
        <Text style={s.heading}>Community Reporting</Text>
        <Text style={s.text}>
          Report wildlife sightings, damage or injuries near the park boundary. A photo and GPS
          are not required.
        </Text>
      </View>

      <View style={urgentStyles.card}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={urgentStyles.title}>🚨 Immediate Wildlife Alert</Text>
          <Text style={urgentStyles.text}>
            For urgent situations such as an elephant moving toward a village.
          </Text>
        </View>
        {!urgentOpen && (
          <Pressable
            style={urgentStyles.button}
            onPress={openUrgentReport}
            accessibilityRole="button"
            accessibilityLabel="Open immediate wildlife alert"
          >
            <Text style={urgentStyles.buttonText}>Send urgent alert</Text>
          </Pressable>
        )}
      </View>

      {urgentOpen && (
        <View style={urgentStyles.panel}>
          <View style={urgentStyles.panelHeader}>
            <Text style={s.title}>Quick report</Text>
            <Pressable onPress={() => setUrgentOpen(false)} accessibilityLabel="Close quick report">
              <Ionicons name="close-circle-outline" size={26} color="#991B1B" />
            </Pressable>
          </View>

          <Text style={s.label}>Animal</Text>
          <View style={s.row}>
            {['Elephant', 'Leopard', 'Wild boar', 'Bear', 'Other'].map((animal) => {
              const selected = urgentAnimal === animal;
              return (
                <Pressable
                  key={animal}
                  style={selected ? urgentStyles.selectedChoice : urgentStyles.choice}
                  onPress={() => setUrgentAnimal(animal)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={selected ? urgentStyles.selectedChoiceText : s.link}>{animal}</Text>
                </Pressable>
              );
            })}
          </View>
          {urgentAnimal === 'Other' && (
            <TextInput
              style={s.input}
              value={urgentOtherAnimal}
              onChangeText={setUrgentOtherAnimal}
              placeholder="Enter animal"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Other animal"
            />
          )}

          <Text style={s.label}>Direction</Text>
          <View style={s.row}>
            {['Toward village', 'Away from village', 'Crossing road', 'Unknown'].map((direction) => {
              const selected = urgentDirection === direction;
              return (
                <Pressable
                  key={direction}
                  style={selected ? urgentStyles.selectedChoice : urgentStyles.choice}
                  onPress={() => setUrgentDirection(direction)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={selected ? urgentStyles.selectedChoiceText : s.link}>{direction}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={urgentStyles.locationRow}>
            <Ionicons name="navigate" size={20} color="#991B1B" />
            <Text style={urgentStyles.text}>
              {urgentLocationBusy
                ? 'Getting your current GPS location…'
                : urgentCoords
                  ? `GPS ready: ${urgentCoords.latitude.toFixed(5)}, ${urgentCoords.longitude.toFixed(5)}`
                  : 'GPS location is required'}
            </Text>
            <Pressable
              onPress={() => void captureUrgentLocation()}
              disabled={urgentLocationBusy}
              accessibilityLabel="Refresh GPS location"
            >
              <Ionicons name="refresh" size={20} color="#991B1B" />
            </Pressable>
          </View>
          <Text style={s.text}>Time: {urgentOccurredAt}</Text>

          <Pressable
            style={[urgentStyles.submit, (urgentBusy || urgentLocationBusy) && s.disabled]}
            onPress={() => void submitUrgentReport()}
            disabled={urgentBusy || urgentLocationBusy}
            accessibilityRole="button"
          >
            {urgentBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={urgentStyles.submitText}>🚨 Send Alert Now</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Incident Type Selectors */}
      <View style={s.row}>
        {COMMUNITY_REPORT_KINDS.map((value) => {
          const isSelected = kind === value;
          return (
            <Pressable
              key={value}
              style={isSelected ? s.button : s.outline}
              onPress={() => setKind(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={isSelected ? s.buttonText : s.link}>
                {COMMUNITY_REPORT_TYPES[value].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 1. Village dropdown ("Select your village") */}
      <VillagePicker
        value={village}
        onChange={setVillage}
        customVillage={customVillage}
        onCustomChange={setCustomVillage}
      />

      {/* 2. Boundary Section (East Gate, West Gate, North Gate, South Gate, Other) */}
      <BoundarySelector
        selectedOption={boundaryOption}
        customBoundary={customBoundary}
        onSelectOption={setBoundaryOption}
        onChangeCustom={setCustomBoundary}
      />

      {/* 3. Nearby landmark / location (Current GPS, Map Selection, Optional Landmark) */}
      <LocationLandmarkPicker
        landmarkText={landmarkText}
        onChangeLandmarkText={setLandmarkText}
        coords={coords}
        onCoordsChange={setCoords}
        locationSource={locationSource}
        onLocationSourceChange={setLocationSource}
      />

      {/* 4. Date & Time picker */}
      <DateTimePicker value={occurredAt} onChange={setTime} />

      {/* 5. Dynamic incident description fields based on selected kind */}
      <DynamicDescriptionFields kind={kind} onDescriptionChange={setDescription} />

      {/* Contact phone (optional) */}
      <View style={{ gap: 4 }}>
        <Text style={s.label}>Contact phone (optional)</Text>
        <TextInput
          style={s.input}
          accessibilityLabel="Contact phone"
          keyboardType="phone-pad"
          placeholder="e.g. 077 123 4567"
          placeholderTextColor="#9CA3AF"
          value={contactPhone}
          onChangeText={setPhone}
        />
      </View>

      {/* Photos */}
      <View style={{ gap: 8 }}>
        <Text style={s.label}>Evidence Photos (optional)</Text>
        <View style={s.row}>
          <Pressable
            disabled={busy}
            style={[s.outline, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
            onPress={() => selectPhoto(true)}
          >
            <Ionicons name="camera-outline" size={18} color="#166534" />
            <Text style={s.link}>Take Photo</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            style={[s.outline, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
            onPress={() => selectPhoto(false)}
          >
            <Ionicons name="images-outline" size={18} color="#166534" />
            <Text style={s.link}>Choose from Gallery</Text>
          </Pressable>
        </View>
      </View>

      {photos.map((uri, index) => (
        <View key={`${uri}-${index}`} style={{ gap: 4 }}>
          <Image source={{ uri }} style={s.photo} resizeMode="contain" />
          <Pressable onPress={() => setPhotos((items) => items.filter((_, i) => i !== index))}>
            <Text style={[s.link, { color: '#DC2626' }]}>Remove photo {index + 1}</Text>
          </Pressable>
        </View>
      ))}

      {/* Confirm & Review Card */}
      {reviewing && (
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="checkmark-done-circle" size={22} color="#166534" />
            <Text style={s.title}>Confirm your report</Text>
          </View>
          <View style={{ gap: 6, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8 }}>
            <Text style={[s.text, { fontWeight: '700', color: '#166534' }]}>
              {COMMUNITY_REPORT_TYPES[kind].label}
            </Text>
            <Text style={s.text}>
              <Text style={{ fontWeight: '600' }}>Location: </Text>
              {effective.village || 'No village'} · {effective.boundarySection || 'No boundary'}
            </Text>
            <Text style={s.text}>
              <Text style={{ fontWeight: '600' }}>Landmark / GPS: </Text>
              {effective.landmark || 'None'}
            </Text>
            <Text style={s.text}>
              <Text style={{ fontWeight: '600' }}>Time: </Text>
              {occurredAt}
            </Text>
            <Text style={s.text}>
              <Text style={{ fontWeight: '600' }}>Description: </Text>
              {effective.description || 'None'}
            </Text>
            {!!contactPhone.trim() && (
              <Text style={s.text}>
                <Text style={{ fontWeight: '600' }}>Contact: </Text>
                {contactPhone.trim()}
              </Text>
            )}
            <Text style={[s.text, { fontStyle: 'italic', color: '#6B7280' }]}>
              {photos.length} photo(s) attached
            </Text>
          </View>

          <Pressable disabled={busy} style={s.button} onPress={submit}>
            <Text style={s.buttonText}>{busy ? 'Saving…' : 'Confirm & Submit Report'}</Text>
          </Pressable>
        </View>
      )}

      {/* Review Report Button */}
      <Pressable
        style={[s.button, busy && s.disabled, { marginTop: 4 }]}
        disabled={busy}
        onPress={handleReview}
      >
        <Text style={s.buttonText}>Review Report</Text>
      </Pressable>

      {!!error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FEE2E2',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons name="alert-circle" size={18} color="#B91C1C" />
          <Text style={s.error}>{error}</Text>
        </View>
      )}

      {!!receipt && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isOnline ? '#DCFCE7' : '#FEF3C7',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={18}
            color={isOnline ? '#166534' : '#B45309'}
          />
          <Text
            style={[
              s.text,
              { color: isOnline ? '#166534' : '#B45309', fontWeight: '600' },
            ]}
          >
            {isOnline
              ? `Report submitted & synced with Operations. Reference: ${receipt}`
              : `Saved locally (Offline) · Marked "Waiting to sync". Reference: ${receipt}`}
          </Text>
        </View>
      )}

      {/* Reports Section with Real Offline Sync Status & Controls */}
      <View style={{ marginTop: 14, gap: 10 }}>
        {/* Section Header with live status and actions */}
        <View style={statusStyles.queueHeader}>
          <View>
            <Text style={s.title}>Reports from this device</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View
                style={[
                  statusStyles.networkDot,
                  isOnline ? statusStyles.dotOnline : statusStyles.dotOffline,
                ]}
              />
              <Text style={statusStyles.networkStatusText}>
                {isOnline ? 'Online · Live Sync Active' : 'Offline · Reports save locally'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Global Sync now for pending reports */}
            {pendingReports.length > 0 && (
              <Pressable
                style={statusStyles.globalSyncBtn}
                onPress={() => handleSync()}
                disabled={!!syncingId}
              >
                {syncingId === 'all' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                )}
                <Text style={statusStyles.globalSyncText}>
                  {syncingId === 'all'
                    ? 'Syncing…'
                    : `Sync now (${pendingReports.length} pending)`}
                </Text>
              </Pressable>
            )}

            {/* Global Retry sync if any failed */}
            {failedReports.length > 0 && pendingReports.length === 0 && (
              <Pressable
                style={statusStyles.globalRetryBtn}
                onPress={() => handleSync()}
                disabled={!!syncingId}
              >
                {syncingId === 'all' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                )}
                <Text style={statusStyles.globalRetryText}>
                  {syncingId === 'all' ? 'Retrying…' : 'Retry sync'}
                </Text>
              </Pressable>
            )}

            {/* Offline simulation toggle for testing */}
            <Pressable
              style={statusStyles.offlineToggleBtn}
              onPress={() => {
                const next = !getSimulatedOffline();
                setSimulatedOffline(next);
                setIsOnline(!next);
              }}
            >
              <Ionicons
                name={isSimulatedOfflineState ? 'wifi' : 'airplane'}
                size={14}
                color="#374151"
              />
              <Text style={statusStyles.offlineToggleText}>
                {isSimulatedOfflineState ? 'Restore Internet' : 'Simulate Offline'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Queued Reports List */}
        {queue.map((entry) => {
          const status = getReportSyncStatus(entry);
          return (
            <View style={s.card} key={entry.id}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text style={s.title}>
                    {COMMUNITY_REPORT_TYPES[entry.input.kind]?.label || entry.input.kind}
                  </Text>
                  <Text style={s.text}>
                    {entry.input.village} · {entry.input.boundarySection}
                  </Text>
                </View>

                {/* Status Badges */}
                {status === 'synced' && (
                  <View style={statusStyles.badgeSynced}>
                    <Ionicons name="cloud-done" size={15} color="#166534" />
                    <Text style={statusStyles.badgeSyncedText}>Synced with Operations</Text>
                  </View>
                )}
                {status === 'waiting' && (
                  <View style={statusStyles.badgeWaiting}>
                    <Ionicons name="time-outline" size={15} color="#B45309" />
                    <Text style={statusStyles.badgeWaitingText}>Waiting to sync</Text>
                  </View>
                )}
                {status === 'failed' && (
                  <View style={statusStyles.badgeFailed}>
                    <Ionicons name="alert-circle" size={15} color="#B91C1C" />
                    <Text style={statusStyles.badgeFailedText}>Sync failed</Text>
                  </View>
                )}
                {status === 'syncing' && (
                  <View style={statusStyles.badgeSyncing}>
                    <ActivityIndicator size="small" color="#1D4ED8" />
                    <Text style={statusStyles.badgeSyncingText}>Syncing to Operations…</Text>
                  </View>
                )}
              </View>

              <Text style={[s.text, { fontSize: 13, color: '#4B5563' }]}>
                {entry.input.description}
              </Text>

              {/* Error Detail message */}
              {status === 'failed' && (
                <View style={statusStyles.errorDetailBox}>
                  <Ionicons name="warning-outline" size={14} color="#B91C1C" />
                  <Text style={statusStyles.errorDetailText}>
                    {entry.error || 'Connection failed during upload.'}
                  </Text>
                </View>
              )}

              {/* Footer row with Reference ID and Actions */}
              <View style={statusStyles.cardFooter}>
                <Text style={[s.text, { fontSize: 12, color: '#9CA3AF' }]}>
                  Reference: {entry.id}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {status === 'waiting' && (
                    <Pressable
                      style={statusStyles.syncNowBtn}
                      onPress={() => handleSync(entry.id)}
                      disabled={syncingId === entry.id}
                    >
                      {syncingId === entry.id ? (
                        <ActivityIndicator size="small" color="#166534" />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={15} color="#166534" />
                      )}
                      <Text style={statusStyles.syncNowText}>
                        {syncingId === entry.id ? 'Syncing…' : 'Sync now'}
                      </Text>
                    </Pressable>
                  )}

                  {status === 'failed' && (
                    <Pressable
                      style={statusStyles.retrySyncBtn}
                      onPress={() => handleSync(entry.id)}
                      disabled={syncingId === entry.id}
                    >
                      {syncingId === entry.id ? (
                        <ActivityIndicator size="small" color="#B91C1C" />
                      ) : (
                        <Ionicons name="refresh" size={15} color="#B91C1C" />
                      )}
                      <Text style={statusStyles.retrySyncText}>
                        {syncingId === entry.id ? 'Retrying…' : 'Retry sync'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {!queue.length && <Text style={s.text}>No reports saved on this device yet.</Text>}
      </View>
    </ScrollView>
  );
}

const statusStyles = StyleSheet.create({
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#16A34A',
  },
  dotOffline: {
    backgroundColor: '#EA580C',
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  globalSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#166534',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  globalSyncText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  globalRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  globalRetryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  offlineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  offlineToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  badgeSynced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeSyncedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  badgeWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeWaitingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeFailed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeFailedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  badgeSyncing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeSyncingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  errorDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  errorDetailText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  retrySyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retrySyncText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});

const urgentStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  title: { color: '#991B1B', fontSize: 17, fontWeight: '800' },
  text: { color: '#7C2D12', fontSize: 14, lineHeight: 20 },
  button: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  panel: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choice: {
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 8,
    padding: 10,
    minHeight: 42,
  },
  selectedChoice: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    padding: 10,
    minHeight: 42,
  },
  selectedChoiceText: { color: '#FFFFFF', fontWeight: '700' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
  },
  submit: {
    backgroundColor: '#991B1B',
    borderRadius: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
