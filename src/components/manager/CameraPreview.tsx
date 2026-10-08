import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useEvent } from 'expo';
import { useFocusEffect } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import { useVideoPlayer, VideoView } from 'expo-video';


export function CameraPreview({ playing, source, channel }: { playing: boolean; source: string; channel: string }) {
  const [focused, setFocused] = useState(false);
  const player = useVideoPlayer(source, (instance: any) => {
    instance.loop = true;
    instance.muted = true;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => { setFocused(false); player.pause(); };
  }, [player]));
  useEffect(() => {
    if (playing && focused) player.play();
    else player.pause();
  }, [playing, focused, player]);
  return <View style={styles.container}>
    <Image source={require('../../../assets/images/wildlife/elephant.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
    {status !== 'error' && <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" />}
    <View style={styles.label}><Text style={styles.labelText}>{channel}</Text></View>
    <View style={styles.state}><Text style={styles.labelText}>{status === 'error' ? 'Preview unavailable' : playing ? 'PLAYBACK' : 'PAUSED'}</Text></View>
    {status === 'loading' && <ActivityIndicator style={styles.loading} color="#FFFFFF" />}
  </View>;
}
const styles = StyleSheet.create({
  container: { aspectRatio: 16 / 9, borderRadius: 4, overflow: 'hidden', backgroundColor: '#173D2D' },
  label: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(10,30,20,0.8)', padding: 4, borderRadius: 3 },
  state: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(10,30,20,0.8)', padding: 4, borderRadius: 3 },
  labelText: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
  loading: { ...StyleSheet.absoluteFill },
});
