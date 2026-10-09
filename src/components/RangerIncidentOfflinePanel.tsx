import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRangerIncidentQueue } from '../hooks/useRangerIncidentQueue';
import { setRangerSimulatedOffline, syncRangerIncidents } from '../services/rangerIncidentQueue';

const STATUS = { waiting: 'Saved on device · Waiting to sync', syncing: 'Syncing…', synced: 'Synced with Operations', failed: 'Saved on device · Sync failed' };

export function RangerIncidentOfflinePanel() {
  const { queue, online, simulatedOffline, error: readError } = useRangerIncidentQueue();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const waiting = queue.filter(entry => entry.syncStatus !== 'synced');
  const action = async (toggle: boolean) => {
    setBusy(true); setError('');
    try {
      if (toggle) await setRangerSimulatedOffline(!simulatedOffline);
      else await syncRangerIncidents();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to sync. Your saved reports are still on this device.');
    } finally { setBusy(false); }
  };
  return <View style={s.panel}>
    <View style={s.row}>
      <Ionicons name={online ? 'cloud-done-outline' : 'cloud-offline-outline'} size={22} color={online ? '#245747' : '#9A6000'} />
      <Text style={s.title}>{simulatedOffline ? 'Offline simulation active' : online ? 'Online · Auto-sync enabled' : 'Offline · Saving on this device'}</Text>
    </View>
    <Text style={s.text}>{simulatedOffline
      ? 'New reports and photos stay on this device. Restore Internet to upload them automatically.'
      : 'Reports are saved on this device first and synced when connectivity is available.'}</Text>
    <View style={s.actions}>
      <Pressable style={s.button} onPress={() => void action(true)} disabled={busy}
        accessibilityRole="button" accessibilityState={{ disabled: busy }}>
        <Text style={s.buttonText}>{simulatedOffline ? 'Restore Internet' : 'Simulate Offline'}</Text>
      </Pressable>
      {waiting.length > 0 && <Pressable style={s.outline} onPress={() => void action(false)} disabled={busy || !online}
        accessibilityRole="button" accessibilityState={{ disabled: busy || !online }}>
        <Text style={s.link}>{busy ? 'Syncing…' : `Sync now (${waiting.length})`}</Text>
      </Pressable>}
      {busy && <ActivityIndicator color="#245747" />}
    </View>
    {!!(readError || error) && <Text style={s.error}>{readError || error}</Text>}
    {!!queue.length && <Text style={s.title}>{waiting.length} waiting · {queue.length - waiting.length} synced</Text>}
    {!!queue.length && <Pressable onPress={() => setShowReports(value => !value)} style={s.detailsButton}
      accessibilityRole="button" accessibilityState={{ expanded: showReports }}>
      <Text style={s.link}>{showReports ? 'Hide saved reports' : 'View saved reports'}</Text>
    </Pressable>}
    {showReports && queue.slice(-5).reverse().map(entry => <View key={entry.id} style={s.report}>
      <Text style={s.title}>{entry.input.title}</Text>
      <Text style={[s.text, { color: entry.syncStatus === 'synced' ? '#245747' : '#9A6000' }]}>{STATUS[entry.syncStatus]}</Text>
      <Text style={s.meta}>Reference: {entry.id}</Text>
      <Text style={s.meta}>{entry.localPhotos.length} photos saved on device</Text>
      {!!entry.error && <Text style={s.error}>{entry.error}</Text>}
    </View>)}
  </View>;
}

const s = StyleSheet.create({
  panel: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD8CA', borderRadius: 14, padding: 16, gap: 12, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#245747', flexShrink: 1 },
  text: { fontSize: 13, lineHeight: 21, color: '#52675A' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  button: { minHeight: 48, justifyContent: 'center', backgroundColor: '#245747', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  outline: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#245747', borderRadius: 10, paddingHorizontal: 14 },
  link: { color: '#245747', fontWeight: '700', fontSize: 13 },
  detailsButton: { minHeight: 44, justifyContent: 'center' },
  report: { borderTopWidth: 1, borderColor: '#E7EDE4', paddingTop: 12, gap: 5 },
  meta: { fontSize: 12, color: '#52675A' },
  error: { fontSize: 12, lineHeight: 18, color: '#B42332' },
});
