import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export function CameraPreview({ playing, source, channel }: { playing: boolean; source: string; channel: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState('LOADING');
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => { setFocused(false); videoRef.current?.pause(); };
  }, []));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let visible = true;
    let pending = false;
    const shouldPlay = () => playing && focused && visible && document.visibilityState === 'visible';
    const syncPlayback = () => {
      if (!shouldPlay()) {
        video.pause();
        if (!disposed) setState('PAUSED');
        return;
      }
      if (pending || !video.paused) return;
      pending = true;
      video.play().catch((error: unknown) => {
        if (disposed) return;
        const name = error instanceof DOMException ? error.name : '';
        if (name === 'AbortError' || name === 'NotAllowedError') setState('PAUSED');
        else setState('UNAVAILABLE');
      }).finally(() => { pending = false; });
    };
    const onPlaying = () => { if (!disposed) setState('PLAYBACK'); };
    const onPause = () => { if (!disposed) setState('PAUSED'); };
    const onWaiting = () => { if (!disposed) setState('BUFFERING'); };
    const onError = () => { if (!disposed) setState('UNAVAILABLE'); };
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? true;
          syncPlayback();
        }, { threshold: 0.05 }) : null;
    observer?.observe(video);
    document.addEventListener('visibilitychange', syncPlayback);
    window.addEventListener('focus', syncPlayback);
    video.addEventListener('canplay', syncPlayback);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    syncPlayback();
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      window.removeEventListener('focus', syncPlayback);
      video.removeEventListener('canplay', syncPlayback);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.pause();
    };
  }, [playing, focused, source]);

  return <View style={styles.container}>
    <video ref={videoRef} src={source} muted loop playsInline preload="metadata"
      aria-label={channel + ' camera footage'}
      style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
    <View style={styles.label}><Text style={styles.text}>{channel}</Text></View>
    <View style={styles.state}><Text style={styles.text}>{state}</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  container: { aspectRatio: 16 / 9, borderRadius: 4, overflow: 'hidden', backgroundColor: '#173D2D' },
  label: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(10,30,20,0.8)', padding: 4, borderRadius: 3 },
  state: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(10,30,20,0.8)', padding: 4, borderRadius: 3 },
  text: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
});
