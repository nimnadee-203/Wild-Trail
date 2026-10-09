import { PatrolRouteMap } from '../../components/manager/PatrolRouteMap';
import type { PatrolCheckpoint, PatrolMapPoint } from '../../types/patrol';
import { CameraPreview } from '../../components/manager/CameraPreview';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagerShell, managerStyles } from '../../components/manager/ManagerShell';
import { FilterButton, StatusPill } from '../../components/manager/ManagerUI';

const cameras = [
  { name: 'North Ridge', channel: 'CAM 04', video: 'https://assets.mixkit.co/videos/3661/3661-720.mp4' },
  { name: 'River Gate', channel: 'CAM 02', video: 'https://assets.mixkit.co/videos/3683/3683-720.mp4' },
  { name: 'East Boundary', channel: 'CAM 08', video: 'https://assets.mixkit.co/videos/3659/3659-720.mp4' },
  { name: 'South Camp', channel: 'CAM 01', video: 'https://assets.mixkit.co/videos/3667/3667-720.mp4' },
];
const DEMO_POSITIONS: PatrolCheckpoint[] = [
  { id: 'ranger-1', label: 'Team Alpha', latitude: 6.420, longitude: 81.420 },
  { id: 'ranger-2', label: 'Team Bravo', latitude: 6.390, longitude: 81.455 },
  { id: 'ranger-3', label: 'Team Charlie', latitude: 6.445, longitude: 81.465 },
];
const NO_ROUTE: PatrolMapPoint[] = [];

export default function LiveMonitoring() {
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState(0);
  const [live, setLive] = useState(true);
  return <ManagerShell active="monitoring"><View style={styles.titleRow}><View><Text style={managerStyles.pageTitle}>Live monitoring</Text><Text style={managerStyles.pageSubtitle}>Monitor cameras, ranger locations, and activity in real time.</Text></View><View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>{live ? 'PREVIEW' : 'PAUSED'}</Text><Pressable onPress={() => setLive(!live)} accessibilityRole="button" accessibilityLabel={live ? 'Pause preview' : 'Play preview'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={live ? 'pause' : 'play'} size={15} color="#2B8263" /></Pressable></View></View>
    <View style={styles.filters}><FilterButton label="All zones" selected /><FilterButton label="Camera status" /><FilterButton label="Last 24 hours" /></View>
    <View style={styles.cameraGrid}>{cameras.map((camera, index) => <Pressable key={camera.channel} onPress={() => setSelected(index)} style={[managerStyles.card, styles.camera, width >= 1100 && { flexBasis: '22%' }, selected === index && styles.cameraSelected]}><CameraPreview playing={live} source={camera.video} channel={camera.channel} /><View style={styles.cameraFooter}><View style={{ flex: 1 }}><Text style={styles.cameraName}>{camera.name}</Text></View><Ionicons name="volume-mute-outline" size={13} color="#B6C9BD" /></View></Pressable>)}</View>
    <View style={[managerStyles.card, styles.mapCard]}>
      <View style={[managerStyles.sectionRow, { flexWrap: 'wrap', gap: 12 }]}>
        <View><Text style={managerStyles.cardTitle}>Ranger locations</Text><Text style={styles.mapSubtitle}>Yala National Park ? Field team overview</Text></View>
        <StatusPill value="Demo positions" />
      </View>
      <PatrolRouteMap route={NO_ROUTE} checkpoints={DEMO_POSITIONS} />
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}><View style={styles.legendDot} /><Text style={styles.legendText}>3 field teams</Text></View>
        <View style={styles.legendItem}><Ionicons name="move-outline" size={16} color="#245747" /><Text style={styles.legendText}>Pan and zoom to explore</Text></View>
      </View>
      <Text style={styles.mapNote}>Illustrative team positions. Live ranger GPS tracking is not connected to this map yet.</Text>
    </View>
  </ManagerShell>;
}
const styles = StyleSheet.create({
  mapSubtitle: { color: '#52675A', fontSize: 12, marginTop: 6 },
  mapLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2EBE3' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#C98A2E' },
  legendText: { color: '#304F3C', fontSize: 12, fontWeight: '600' },
  mapNote: { color: '#63796B', fontSize: 11, lineHeight: 18, marginTop: 10 }, demoNote: { color: '#52675A', fontSize: 12, lineHeight: 19, marginBottom: 16 }, titleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }, live: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 44, backgroundColor: '#E6F3ED', borderRadius: 18 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D35F50' }, liveText: { color: '#2B8263', fontSize: 10, fontWeight: '800' }, filters: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }, cameraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, backgroundColor: '#10251C', borderRadius: 12, padding: 8 }, camera: { flex: 1, flexBasis: '45%', minWidth: 0, padding: 4, margin: 0, backgroundColor: '#192F25', borderColor: '#344E3E', borderRadius: 7 }, cameraSelected: { borderColor: '#2B8263', borderWidth: 2 }, cameraImage: { height: 150, borderRadius: 9, backgroundColor: '#29443A', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }, scanLine: { position: 'absolute', left: 0, right: 0, top: '45%', borderTopWidth: 1, borderTopColor: '#77BCA0', opacity: .35 }, imageText: { color: '#B6D3C5', fontSize: 9, letterSpacing: 1.5, marginTop: 7 }, timestamp: { position: 'absolute', right: 8, top: 8, backgroundColor: '#17342B', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }, timestampText: { fontSize: 9, color: '#FFFFFF' }, cameraFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingHorizontal: 4, paddingBottom: 4 }, cameraName: { color: '#E4EDE5', fontSize: 11, fontWeight: '700', marginBottom: 3 }, mapCard: { marginBottom: 20 }, map: { height: 230, borderRadius: 10, backgroundColor: '#DDEBE2', overflow: 'hidden', position: 'relative' }, mapRoadOne: { position: 'absolute', height: 25, width: '130%', backgroundColor: '#C9DED0', transform: [{ rotate: '-22deg' }], top: '45%', left: '-10%' }, mapRoadTwo: { position: 'absolute', height: 14, width: '110%', backgroundColor: '#C9DED0', transform: [{ rotate: '35deg' }], top: '24%', left: '5%' }, marker: { position: 'absolute' }, mapLabel: { position: 'absolute', left: '12%', top: '18%', color: '#719183', fontSize: 10, fontWeight: '800', letterSpacing: 1 } });
