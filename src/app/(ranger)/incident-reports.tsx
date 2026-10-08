import { WildTrailBrand } from '../../components/WildTrailBrand';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getRangerIncidents } from '../../services/api/incidents';
import { IncidentReport, IncidentStatus } from '../../types/incident';

const STATUS: Record<IncidentStatus, { label: string; color: string; background: string }> = {
  pending: { label: 'Pending', color: '#92400E', background: '#FEF3C7' },
  investigating: { label: 'Investigating', color: '#075985', background: '#E0F2FE' },
  resolved: { label: 'Resolved', color: '#166534', background: '#DCFCE7' },
  dismissed: { label: 'Dismissed', color: '#4B5563', background: '#F3F4F6' },
};

export default function IncidentReportsScreen() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(undefined);
    try {
      const data = await getRangerIncidents();
      if (id === requestId.current) setReports(data);
    } catch (failure) {
      if (id === requestId.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to load your reports.');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current++; };
  }, [load]));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(ranger)/dashboard')} accessibilityLabel="Back to dashboard" hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primaryDark} />
        </Pressable>
        <WildTrailBrand title="My Incident Reports" />
      </View>
      <Text style={styles.subtitle}>{reports.length} reports · Pull down to refresh statuses</Text>
      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} accessibilityRole="button"><Text style={styles.link}>Try again</Text></Pressable>
        </View>
      )}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={Colors.light.primary} style={styles.empty} />
        ) : !error ? (
          <View style={styles.empty}>
            <Ionicons name="documents-outline" size={44} color={Colors.light.muted} />
            <Text style={styles.title}>No incident reports yet</Text>
            <Text style={styles.subtitle}>Your submitted incidents will appear here.</Text>
            <Pressable style={styles.button} onPress={() => router.push('/(ranger)/report-incident')}>
              <Text style={styles.buttonText}>Report an Incident</Text>
            </Pressable>
          </View>
        ) : null}
        renderItem={({ item }) => {
          const status = STATUS[item.status] ?? STATUS.pending;
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={[styles.title, styles.grow]}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: status.background }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.meta}>
                {item.location.address || `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
              </Text>
              <Text style={styles.meta}>Priority: {item.severity} · Updated {new Date(item.updatedAt).toLocaleString()}</Text>
              {item.photoUris?.map((uri, index) => (
                <Image key={uri} source={{ uri }} style={styles.photo} resizeMode="contain" accessibilityLabel={`Report photo ${index + 1}`} />
              ))}
              <Text style={styles.id}>Report ID: {item.id}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  heading: { fontSize: 21, fontWeight: '700', color: Colors.light.text, flex: 1 },
  subtitle: { color: Colors.light.muted, fontSize: 13, marginHorizontal: 20, marginBottom: 16 },
  list: { padding: 20, paddingTop: 0, flexGrow: 1 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.light.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  grow: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  meta: { fontSize: 12, color: Colors.light.muted, lineHeight: 18, marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 21, color: Colors.light.text, marginVertical: 8 },
  photo: { height: 180, width: '100%', borderRadius: 8, marginTop: 8 },
  id: { fontSize: 11, color: Colors.light.muted, marginTop: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  button: { backgroundColor: Colors.light.primary, borderRadius: 8, padding: 14 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  error: { marginHorizontal: 20, marginBottom: 16, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 8, gap: 10 },
  errorText: { color: Colors.light.danger },
  link: { color: Colors.light.primaryDark, fontWeight: '700', paddingVertical: 8 },
});
