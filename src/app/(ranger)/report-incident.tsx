import { WildTrailBrand } from '../../components/WildTrailBrand';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';
import { useCameraPermission } from '../../hooks/useCameraPermission';
import { useLocation } from '../../hooks/useLocation';
import { formatCoordinates } from '../../utils/formatting';
import { createIncident } from '../../services/api/incidents';
import { IncidentCategory } from '../../types/incident';

type IncidentType = 'Snare' | 'Carcass' | 'Illegal Campsite' | 'Wildlife Sighting' | 'Other';

const INCIDENT_TYPES: { label: IncidentType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Snare', icon: 'search-outline' },
  { label: 'Carcass', icon: 'git-branch-outline' },
  { label: 'Illegal Campsite', icon: 'bonfire-outline' },
  { label: 'Wildlife Sighting', icon: 'binoculars-outline' },
  { label: 'Other', icon: 'ellipsis-horizontal' },
];

const formatDate = () =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(',', '');

export default function ReportIncidentScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { photos, takePhotoWithCamera, pickImageFromGallery, addPhoto, removePhoto } = useCameraPermission();
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [isChoosingPhoto, setIsChoosingPhoto] = useState(false);
  const [step, setStep] = useState(1);
  const [incidentType, setIncidentType] = useState<IncidentType>('Snare');
  const [customIncidentType, setCustomIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime] = useState(formatDate);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoWarning, setPhotoWarning] = useState<string>();

  const coordinates = useMemo(
    () => manualLocation.trim() || formatCoordinates(location?.latitude, location?.longitude),
    [location, manualLocation]
  );
  const displayedIncidentType =
    incidentType === 'Other' ? customIncidentType.trim() || 'Other' : incidentType;
  const patrolId = 'PAT-1222-3255';

  const choosePhoto = async (source: 'camera' | 'gallery') => {
    setIsChoosingPhoto(true);
    try {
      const uri = await (source === 'camera' ? takePhotoWithCamera() : pickImageFromGallery());
      if (uri) setPendingPhoto(uri);
    } catch (error) {
      Alert.alert('Unable to select photo', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsChoosingPhoto(false);
    }
  };

  const attachPhoto = () => {
    if (pendingPhoto) {
      addPhoto(pendingPhoto);
      setPendingPhoto(null);
    }
  };

  const goBack = () => {
    if (step === 4) {
      router.back();
      return;
    }
    if (step > 1) {
      setStep((current) => current - 1);
    } else {
      router.back();
    }
  };

  const submit = async () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Please add a short description before submitting.');
      return;
    }
    if (!location) {
      Alert.alert('Location unavailable', 'Allow location access and try again before submitting.');
      return;
    }

    const categoryByType: Record<IncidentType, IncidentCategory> = {
      Snare: 'snare_detected',
      Carcass: 'other',
      'Illegal Campsite': 'other',
      'Wildlife Sighting': 'wildlife_sighting',
      Other: 'other',
    };

    setIsSubmitting(true);
    try {
      const result = await createIncident({
        category: categoryByType[incidentType],
        title: displayedIncidentType,
        description,
        location: manualLocation.trim() ? { ...location, address: manualLocation.trim() } : location,
        photoUris: photos,
      });
      setPhotoWarning(result.photoWarning);
      setStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the incident.';
      Alert.alert('Submission failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <WildTrailBrand light title="Report Incident" />
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progress}>
            {['Type', 'Details', 'Review', 'Confirmation'].map((label, index) => <View key={label} style={styles.progressStep}>
              <View style={[styles.progressCircle, step >= index + 1 && styles.progressActive]}>
                {step > index + 1 ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : <Text style={[styles.progressNumber, step === index + 1 && styles.progressNumberActive]}>{index + 1}</Text>}
              </View>
              <Text style={[styles.progressLabel, step === index + 1 && styles.progressLabelActive]}>{label}</Text>
            </View>)}
          </View>
          {step === 1 && (
            <View>
              <Text style={styles.stepHeading}>Select the type of incident</Text>
              <Text style={styles.introText}>Choose the category that best describes what you found.</Text>
              <View style={styles.typeList}>
                {INCIDENT_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.typeOption, incidentType === item.label && styles.typeOptionSelected]}
                    onPress={() => {
                      setIncidentType(item.label);
                      if (item.label !== 'Other') {
                        setStep(2);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon}
                      size={27}
                      color={incidentType === item.label ? Colors.light.primaryDark : Colors.light.text}
                    />
                    <Text style={styles.typeLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#748078" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ))}
              </View>
              {incidentType === 'Other' && (
                <View style={styles.otherTypePanel}>
                  <Text style={styles.formLabel}>Type of incident</Text>
                  <TextInput
                    style={styles.otherTypeInput}
                    value={customIncidentType}
                    onChangeText={setCustomIncidentType}
                    placeholder="Enter the incident type"
                    placeholderTextColor="#8DA392"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.primaryButton, !customIncidentType.trim() && styles.disabledButton]}
                    disabled={!customIncidentType.trim()}
                    onPress={() => setStep(2)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.photoHelp}>Your report helps the team coordinate a response and protect the park.</Text>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepHeading}>Incident details</Text>
              <Text style={styles.introText}>Add the location, your observations and any supporting photos.</Text>
              <Text style={styles.formLabel}>Location (auto-filled)</Text>
              <View style={styles.readonlyField}>
                <Ionicons name="location-outline" size={17} color={Colors.light.primaryDark} />
                <Text style={[styles.fieldText, styles.locationValue]}>{coordinates}</Text>
                <Ionicons name="checkmark-circle" size={17} color={Colors.light.primaryDark} />
              </View>
              <TouchableOpacity
                style={styles.manualLocationToggle}
                onPress={() => setIsEditingLocation((editing) => !editing)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isEditingLocation ? 'close-circle-outline' : 'create-outline'}
                  size={16}
                  color={Colors.light.primaryDark}
                />
                <Text style={styles.manualLocationText}>
                  {isEditingLocation ? 'Use auto-filled location' : 'Update location manually'}
                </Text>
              </TouchableOpacity>
              {isEditingLocation && (
                <TextInput
                  style={styles.manualLocationInput}
                  value={manualLocation}
                  onChangeText={setManualLocation}
                  placeholder="Enter coordinates or a location"
                  placeholderTextColor="#8DA392"
                  autoFocus
                />
              )}
              <MapPreview />

              <Text style={styles.formLabel}>Incident Type</Text>
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setIsTypeMenuOpen((open) => !open)}
                activeOpacity={0.8}
              >
                <Text style={styles.fieldText}>{displayedIncidentType}</Text>
                <Ionicons name={isTypeMenuOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.light.text} />
              </TouchableOpacity>
              {isTypeMenuOpen && (
                <View style={styles.dropdown}>
                  {INCIDENT_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setIncidentType(item.label);
                        setIsTypeMenuOpen(false);
                      }}
                    >
                      <Text style={styles.fieldText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {incidentType === 'Other' && (
                <TextInput
                  style={styles.otherTypeInput}
                  value={customIncidentType}
                  onChangeText={setCustomIncidentType}
                  placeholder="Enter the incident type"
                  placeholderTextColor="#8DA392"
                />
              )}

              <Text style={styles.formLabel}>Date &amp; Time</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.fieldText}>{dateTime}</Text>
                <Ionicons name="calendar-outline" size={18} color={Colors.light.text} />
              </View>

              <Text style={styles.formLabel}>Description · Required</Text>
              <TextInput
                style={styles.description}
                placeholder="Describe what you found, nearby landmarks and any immediate risks…"
                placeholderTextColor="#A7AFA9"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.formLabel}>Supporting photos · Optional</Text>
              <TouchableOpacity style={styles.photoButton} onPress={() => choosePhoto('camera')} disabled={isChoosingPhoto} activeOpacity={0.8}>
                <Ionicons name="camera" size={19} color={Colors.light.primaryDark} />
                <Text style={styles.outlineButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={() => choosePhoto('gallery')} disabled={isChoosingPhoto} activeOpacity={0.8}>
                <Ionicons name="images-outline" size={19} color={Colors.light.primaryDark} />
                <Text style={styles.outlineButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              {pendingPhoto && (
                <View>
                  <Image source={{ uri: pendingPhoto }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.primaryButton} onPress={attachPhoto} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Attach Photo</Text>
                  </TouchableOpacity>
                  <Text style={styles.photoHelp}>Adds this photo to your report. Photos are uploaded when you submit.</Text>
                  <TouchableOpacity style={styles.photoButton} onPress={() => setPendingPhoto(null)}>
                    <Text style={styles.outlineButtonText}>Discard Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {photos.map((uri, index) => (
                <View key={`${uri}-${index}`}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.photoButton} onPress={() => removePhoto(index)} accessibilityLabel={`Remove photo ${index + 1}`}>
                    <Text style={styles.outlineButtonText}>Remove Photo {index + 1}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length === 0 && !pendingPhoto && (
                <View style={styles.photoEmpty}>
                  <Ionicons name="image-outline" size={56} color="#C4CDC7" />
                  <Text style={styles.photoHelp}>No photos attached yet</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.primaryButton, (isChoosingPhoto || !!pendingPhoto) && styles.disabledButton]} disabled={isChoosingPhoto || !!pendingPhoto} onPress={() => setStep(3)} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Review Report</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.stepHeading}>Review your report</Text>
              <Text style={styles.introText}>Check the details before sending. Use the back arrow to make changes.</Text>
              <View style={styles.summaryCard}>
                <SummaryRow label="Patrol ID:" value={patrolId} />
                <SummaryRow label="Location:" value={coordinates} />
                <SummaryRow label="Incident Type:" value={displayedIncidentType} />
                <SummaryRow label="Date & Time:" value={dateTime} />
                <SummaryRow label="Short Description:" value={description || 'No description added'} />
                {photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.confirmationPhoto} resizeMode="contain" accessibilityLabel={`Incident photo ${index + 1}`} />)}
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                onPress={submit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>{isSubmitting ? 'Submitting report…' : 'Submit Report'}</Text>
              </TouchableOpacity>
              <View style={styles.offlineCard}>
                <Ionicons name="information-circle-outline" size={24} color="#61716A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.offlineTitle}>Ready to send</Text>
                  <Text style={styles.offlineText}>An internet connection is needed to submit this report.</Text>
                </View>
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.stepHeading}>Report submitted</Text>
              <Text style={styles.introText}>Your incident has been saved. Review the attachment status below.</Text>
              <View style={styles.summaryCard}>
                <SummaryRow label="Patrol ID:" value={patrolId} />
                <SummaryRow label="Location:" value={coordinates} />
                <SummaryRow label="Incident Type:" value={displayedIncidentType} />
                <SummaryRow label="Date & Time:" value={dateTime} />
                <SummaryRow label="Short Description:" value={description || 'No description added'} />
                {photos.map((uri, index) => (
                  <Image
                    key={`${uri}-${index}`}
                    source={{ uri }}
                    style={styles.confirmationPhoto}
                    resizeMode="contain"
                    accessibilityLabel={`Incident photo ${index + 1}`}
                  />
                ))}
              </View>
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={31} color={Colors.light.primaryDark} />
                </View>
                <View>
                  <Text style={styles.successTitle}>Saved Successfully</Text>
                  <Text style={styles.successTitle}>{photoWarning ? 'Photos incomplete' : 'Synced'}</Text>
                  <Text style={styles.successMeta}>Date &amp; Time: {dateTime}</Text>
                </View>
              </View>
              {photoWarning && <Text style={styles.photoWarning}>{photoWarning}</Text>}
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(ranger)/dashboard')}><Text style={styles.primaryButtonText}>Back to Dashboard</Text></TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MapPreview() {
  return (
    <View style={styles.mapPreview} accessibilityLabel="Map preview of the incident location">
      <View style={styles.mapRoadHorizontal} />
      <View style={styles.mapRoadDiagonal} />
      <View style={styles.mapRiver} />
      <View style={styles.mapPark}>
        <Ionicons name="leaf" size={18} color="#8DBA91" />
        <Ionicons name="leaf" size={13} color="#A8CAA7" />
      </View>
      <View style={styles.mapPin}>
        <Ionicons name="location" size={30} color={Colors.light.primaryDark} />
      </View>
      <View style={styles.mapLabel}>
        <Text style={styles.mapLabelText}>Incident location</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8DF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, marginBottom: 24 },
  progressStep: { flex: 1, alignItems: 'center', gap: 7 },
  progressCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EEF1E9', alignItems: 'center', justifyContent: 'center' },
  progressActive: { backgroundColor: '#245747' },
  progressNumber: { fontSize: 12, fontWeight: '700', color: '#748078' },
  progressNumberActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 12, color: '#748078' },
  progressLabelActive: { color: '#245747', fontWeight: '700' },
  introText: { color: '#748078', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  safeArea: { flex: 1, backgroundColor: '#F5F6F0' },
  container: { flex: 1 },
  header: {
    height: 58,
    backgroundColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  content: { padding: 20, paddingBottom: 36, width: '100%', maxWidth: 600, alignSelf: 'center' },
  stepHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'left',
    marginBottom: 12,
  },
  typeList: { gap: 8 },
  typeOption: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: Colors.light.primaryDark,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 22,
  },
  typeOptionSelected: { backgroundColor: '#EAF5EC', borderWidth: 2 },
  typeLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  landscapePlaceholder: {
    height: 140,
    marginTop: 12,
    backgroundColor: '#F1F7F1',
    borderTopLeftRadius: 72,
    borderTopRightRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 20,
  },
  otherTypePanel: {
    borderWidth: 1,
    borderColor: '#B9D6BD',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: '#F4FAF5',
  },
  formLabel: { fontSize: 12, fontWeight: '600', color: Colors.light.text, marginTop: 9, marginBottom: 4 },
  readonlyField: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#F4F6F4',
    borderWidth: 1,
    borderColor: '#E2E7E2',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationValue: { flex: 1, marginHorizontal: 8 },
  manualLocationToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
  },
  manualLocationText: { color: Colors.light.primaryDark, fontSize: 12, fontWeight: '700' },
  manualLocationInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primaryDark,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  mapPreview: {
    height: 128,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E6F0E4',
    borderWidth: 1,
    borderColor: '#B9D6BD',
    position: 'relative',
  },
  mapRoadHorizontal: {
    position: 'absolute',
    left: -10,
    right: -10,
    top: 72,
    height: 13,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-8deg' }],
  },
  mapRoadDiagonal: {
    position: 'absolute',
    width: 190,
    height: 10,
    left: 22,
    top: 24,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '34deg' }],
  },
  mapRiver: {
    position: 'absolute',
    width: 16,
    height: 180,
    left: 58,
    top: -25,
    backgroundColor: '#B5DDE2',
    transform: [{ rotate: '28deg' }],
  },
  mapPark: {
    position: 'absolute',
    right: 25,
    top: 23,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#CDE3C8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  mapPin: { position: 'absolute', left: '48%', top: '38%' },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  mapLabelText: { fontSize: 9, color: Colors.light.primaryDark, fontWeight: '700' },
  selectField: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#F4F6F4',
    borderWidth: 1,
    borderColor: '#DDE3DE',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { fontSize: 14, color: Colors.light.text },
  dropdown: { borderWidth: 1, borderColor: '#DDE3DE', backgroundColor: '#FFFFFF', borderRadius: 12 },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#EEF1EE' },
  description: {
    height: 128,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE3DE',
    padding: 10,
    fontSize: 14,
    color: Colors.light.text,
  },
  photoButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  outlineButtonText: { color: Colors.light.primaryDark, fontSize: 14, fontWeight: '700' },
  photoEmpty: {
    height: 90,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5CD',
    borderStyle: 'dashed',
    backgroundColor: '#FAFCFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  photoPreview: { height: 220, borderRadius: 7, marginTop: 8 },
  photoHelp: { fontSize: 12, lineHeight: 18, color: Colors.light.text, marginTop: 8 },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disabledButton: { backgroundColor: '#AAB9AE' },
  otherTypeInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9D6BD',
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: '#FFFFFF',
  },
  summaryCard: { borderWidth: 1, borderColor: '#DDE3DE', borderRadius: 18, padding: 20, backgroundColor: '#FFFFFF' },
  summaryRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDF0E9' },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: '#748078' },
  summaryValue: { fontSize: 14, color: '#245747', marginTop: 5, lineHeight: 22 },
  summaryPhoto: { height: 92, borderRadius: 7, marginTop: 2 },
  confirmationPhoto: { width: '100%', height: 200, borderRadius: 7, marginTop: 10 },
  offlineCard: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#DDE3DE',
    borderRadius: 8,
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  offlineTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  offlineText: { fontSize: 12, color: Colors.light.muted, marginTop: 3 },
  successCard: {
    marginTop: 22,
    minHeight: 82,
    borderWidth: 1,
    borderColor: '#DDE3DE',
    borderRadius: 8,
    backgroundColor: '#F7FAF7',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWarning: { fontSize: 13, lineHeight: 20, color: '#9A5B18', marginTop: 12 },
  successTitle: { fontSize: 12, fontWeight: '700', color: Colors.light.text },
  successMeta: { fontSize: 12, color: Colors.light.text, marginTop: 5 },
});
