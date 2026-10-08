import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { communityStyles as s } from '../components/communityStyles';
import { getCommunityQueue, queueCommunityReport, syncCommunityReports, validateCommunityInput } from '../services/communityReports';
import { COMMUNITY_REPORT_KINDS, COMMUNITY_REPORT_TYPES, CommunityInput, QueuedCommunityReport } from '../types/community';

export default function CommunityReportScreen() {
  const [kind, setKind] = useState<CommunityInput['kind']>('elephant_sighting');
  const [village, setVillage] = useState('');
  const [boundarySection, setBoundary] = useState('');
  const [landmark, setLandmark] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setPhone] = useState('');
  const [occurredAt, setTime] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace('T', ' ');
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [queue, setQueue] = useState<QueuedCommunityReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const { takePhotoWithCamera, pickImageFromGallery } = useCameraPermission();

  useEffect(() => {
    let active = true;
    const refresh = () => { void getCommunityQueue().then((items) => { if (active) setQueue(items); }).catch(() => { if (active) setError('Unable to read saved reports.'); }); };
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const selectPhoto = async (camera: boolean) => {
    setBusy(true); setError('');
    try {
      const uri = await (camera ? takePhotoWithCamera() : pickImageFromGallery());
      if (uri) setPhotos((current) => [...current, uri]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to select photo.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const saved = await queueCommunityReport({ kind, village: village.trim(), boundarySection: boundarySection.trim(), landmark: landmark.trim(), description: description.trim(), contactPhone: contactPhone.trim(), occurredAt, source: 'community_app' }, photos);
      setReceipt(saved.id);
      setReviewing(false);
      setPhotos([]); setDescription('');
      setQueue(await getCommunityQueue());
      void syncCommunityReports().catch(() => setError('Saved locally. Delivery will retry when connected.'));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save report.'); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>Community Reporting</Text>
      <Text style={s.text}>Report wildlife sightings, damage or injuries near the park boundary. A photo and GPS are not required.</Text>
      <View style={s.row}>
        {COMMUNITY_REPORT_KINDS.map((value) => (
          <Pressable key={value} style={kind === value ? s.button : s.outline} onPress={() => setKind(value)}>
            <Text style={kind === value ? s.buttonText : s.link}>{COMMUNITY_REPORT_TYPES[value].label}</Text>
          </Pressable>
        ))}
      </View>
      {[
        { label: 'Village', value: village, change: setVillage },
        { label: 'Boundary section (e.g. East gate)', value: boundarySection, change: setBoundary },
        { label: 'Nearby landmark / location', value: landmark, change: setLandmark },
        { label: 'Event date and time (YYYY-MM-DD HH:mm)', value: occurredAt, change: setTime },
        { label: 'Description (animals involved / damage / injuries)', value: description, change: setDescription },
      ].map((field) => <View key={field.label}><Text style={s.label}>{field.label}</Text><TextInput accessibilityLabel={field.label} style={s.input} value={field.value} onChangeText={field.change} multiline={field.change === setDescription} /></View>)}
      <Text style={s.label}>Contact phone (optional)</Text>
      <TextInput style={s.input} accessibilityLabel="Contact phone" keyboardType="phone-pad" value={contactPhone} onChangeText={setPhone} />
      <View style={s.row}>
        <Pressable disabled={busy} style={s.outline} onPress={() => selectPhoto(true)}><Text style={s.link}>Take Photo</Text></Pressable>
        <Pressable disabled={busy} style={s.outline} onPress={() => selectPhoto(false)}><Text style={s.link}>Choose from Gallery</Text></Pressable>
      </View>
      {photos.map((uri, index) => <View key={`${uri}-${index}`}><Image source={{ uri }} style={s.photo} resizeMode="contain" /><Pressable onPress={() => setPhotos((items) => items.filter((_, i) => i !== index))}><Text style={s.link}>Remove photo {index + 1}</Text></Pressable></View>)}
      {reviewing && <View style={s.card}>
        <Text style={s.title}>Confirm your report</Text>
        <Text style={s.text}>{COMMUNITY_REPORT_TYPES[kind].label}</Text>
        <Text style={s.text}>{village} / {boundarySection} / {landmark}</Text>
        <Text style={s.text}>{description}</Text>
        <Text style={s.text}>{new Date(occurredAt).toLocaleString()} · {photos.length} photo(s)</Text>
        <Pressable disabled={busy} style={s.button} onPress={submit}><Text style={s.buttonText}>{busy ? 'Saving…' : 'Confirm & Submit'}</Text></Pressable>
      </View>}
      <Pressable style={[s.outline, busy && s.disabled]} disabled={busy} onPress={() => {
        try {
          validateCommunityInput({ kind, village, boundarySection, landmark, description, contactPhone, occurredAt, source: 'community_app' });
          setError(''); setReviewing(true);
        } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the report details.'); }
      }}><Text style={s.link}>Review Report</Text></Pressable>
      {!!error && <Text style={s.error}>{error}</Text>}
      {!!receipt && <Text style={s.text}>Saved on this device. Reference: {receipt}. Check delivery below.</Text>}
      <Text style={s.title}>Reports from this device</Text>
      <Pressable style={s.outline} onPress={() => { void syncCommunityReports().catch(() => setError('Unable to connect. Reports remain saved on this device.')); }}><Text style={s.link}>Retry delivery</Text></Pressable>
      {queue.map((entry) => <View style={s.card} key={entry.id}>
        <Text style={s.title}>{COMMUNITY_REPORT_TYPES[entry.input.kind]?.label || entry.input.kind}</Text>
        <Text style={s.text}>{entry.input.village} · {entry.input.boundarySection}</Text>
        <Text style={s.text}>{entry.complete ? 'Received by operations' : entry.received ? 'Report received · photos waiting to upload' : 'Saved on device · waiting for delivery'}</Text>
        <Text style={s.text}>Reference: {entry.id}</Text>
        {!!entry.error && <Text style={s.error}>{entry.error}</Text>}
      </View>)}
      {!queue.length && <Text style={s.text}>No reports saved on this device yet.</Text>}
    </ScrollView>
  );
}
