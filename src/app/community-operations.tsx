import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { communityStyles as s } from '../components/communityStyles';
import { acceptCommunityOperation, parseCommunitySms, queueCommunityReport, respondToCommunityReport, syncCommunityReports, watchCommunityReports } from '../services/communityReports';
import { COMMUNITY_REPORT_TYPES, COMMUNITY_SMS_KEYWORDS, CommunityReport } from '../types/community';
import { IncidentStatus } from '../types/incident';
import { useRoleGuard } from '../hooks/useRoleGuard';

const RESPONDER_ROLES = ['ranger', 'liaison', 'manager', 'admin'] as const;

export default function CommunityOperationsScreen() {
  useRoleGuard([...RESPONDER_ROLES]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [sms, setSms] = useState('ELEPHANT | Village name | East boundary | Near the gate | 3 elephants');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [simulating, setSimulating] = useState(false);
  useFocusEffect(useCallback(() => {
    setError('');
    return watchCommunityReports((items) => { setReports(items); setLoaded(true); }, (failure) => { setError(failure.message); setLoaded(true); });
  }, []));
  const patterns = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of reports.filter((entry) => entry.source !== 'sms_simulated')) {
      const key = `${report.village} · ${report.boundarySection} · ${report.occurredAt.slice(0, 7)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [reports]);
  const simulate = async () => {
    if (simulating) return;
    setSimulating(true); setError('');
    try {
      const entry = await queueCommunityReport(parseCommunitySms(sms, phone), []);
      setNotice(`Simulated SMS saved: ${entry.id}. No SMS was sent or received.`);
      void syncCommunityReports().catch((failure) => setError(String(failure)));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Invalid simulated SMS.'); }
    finally { setSimulating(false); }
  };
  return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.heading}>Community Operations</Text>
    <Text style={s.text}>Incoming community wildlife reports. Accept an operation and record follow-up.</Text>
    <Text style={s.text}>Demo ranger and liaison accounts can accept reports and save responses on this device. Real staff accounts update shared operations.</Text>
    <Pressable style={s.outline} onPress={() => router.back()}><Text style={s.link}>Back to dashboard</Text></Pressable>
    {!!error && <Text style={s.error}>{error}</Text>}
    {!loaded && <Text style={s.text}>Loading reports…</Text>}
    {loaded && !reports.length && !error && <Text style={s.text}>No community reports received yet.</Text>}
    {reports.map((report) => <ResponseCard key={report.id} report={report} />)}
    <Text style={s.title}>Boundary conflict patterns</Text>
    <Text style={s.text}>Reports per boundary section and month. Simulated SMS reports are excluded.</Text>
    {patterns.map(([key, count]) => <Text key={key} style={s.text}>{key}: {count}</Text>)}
    <View style={s.card}>
      <Text style={s.title}>SMS simulator · prototype only</Text>
      <Text style={s.text}>No live SMS service is connected. Format: keyword | village | boundary section | landmark | description. Keywords: {COMMUNITY_SMS_KEYWORDS}</Text>
      <TextInput style={s.input} accessibilityLabel="Simulated sender phone" placeholder="Sender phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={s.input} accessibilityLabel="Simulated SMS message" multiline value={sms} onChangeText={setSms} />
      <Pressable disabled={simulating} style={s.button} onPress={simulate}><Text style={s.buttonText}>{simulating ? 'Saving…' : 'Simulate Incoming SMS'}</Text></Pressable>
      {!!notice && <Text style={s.text}>{notice}</Text>}
    </View>
  </ScrollView>;
}

function ResponseCard({ report }: { report: CommunityReport }) {
  const [status, setStatus] = useState<IncidentStatus>(report.status);
  const [notes, setNotes] = useState(report.responseNotes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true); setError('');
    try { await respondToCommunityReport(report.id, status, notes); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save response.'); }
    finally { setBusy(false); }
  };
  const accept = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await acceptCommunityOperation(report.id); setStatus('investigating'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to accept operation.'); }
    finally { setBusy(false); }
  };
  return <View style={s.card}>
    <Text style={s.title}>{COMMUNITY_REPORT_TYPES[report.kind]?.label || report.kind} · {report.status}</Text>
    <Text style={s.text}>{report.source === 'sms_simulated' ? 'SIMULATED SMS' : 'Community app'} · {report.village} · {report.boundarySection}</Text>
    <Text style={s.text}>{report.landmark} · Event: {new Date(report.occurredAt).toLocaleString()}</Text>
    <Text style={s.text}>{report.description}</Text>
    {!!report.contactPhone && <Text style={s.text}>Contact: {report.contactPhone}</Text>}
    <Text style={s.text}>Reference: {report.id} · Received: {report.receivedAt ? new Date(report.receivedAt).toLocaleString() : 'Awaiting server confirmation'}</Text>
    {report.photoUris?.map((uri) => <Image key={uri} source={{ uri }} style={s.photo} resizeMode="contain" />)}
    <View style={s.row}>{(['pending', 'investigating', 'resolved', 'dismissed'] as const).map((value) => <Pressable key={value} style={status === value ? s.button : s.outline} onPress={() => setStatus(value)}><Text style={status === value ? s.buttonText : s.link}>{value}</Text></Pressable>)}</View>
    {report.assignedTo
      ? <Text style={s.text}>Accepted by: {report.assignedName || report.assignedTo}</Text>
      : report.status === 'pending' && <Pressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={accept}><Text style={s.buttonText}>{busy ? 'Please wait…' : 'Accept Operation'}</Text></Pressable>}
    {report.demoAcceptance && <Text style={s.text}>Demo acceptance: saved on this device only. Shared operations assignment is unchanged.</Text>}
    <TextInput style={s.input} accessibilityLabel="Response notes" placeholder="Response / follow-up notes" multiline value={notes} onChangeText={setNotes} />
    <Pressable disabled={busy} style={[s.button, busy && s.disabled]} onPress={save}><Text style={s.buttonText}>{busy ? 'Saving…' : 'Save Response'}</Text></Pressable>
    {!!error && <Text style={s.error}>{error}</Text>}
  </View>;
}
