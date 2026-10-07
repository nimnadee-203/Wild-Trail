import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { APP_CONFIG } from '../../constants/config';
import { createPatrolMapHtml, PatrolRouteMapProps } from './patrolMapHtml';

export function PatrolRouteMap({
  editable = false,
  mode = 'route',
  route,
  checkpoints,
  overlays = [],
  onChange,
}: PatrolRouteMapProps) {
  const webViewRef = useRef<WebView>(null);
  const html = useMemo(
    () => createPatrolMapHtml({
      editable,
      mode: 'route',
      route: [],
      checkpoints: [],
      overlays: [],
    }),
    [editable]
  );

  const syncMap = () => {
    const payload = JSON.stringify({ route, checkpoints, overlays });
    webViewRef.current?.injectJavaScript(
      `window.setPatrolMapData && window.setPatrolMapData(${payload}); true;`
    );
  };

  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.setPatrolMapMode && window.setPatrolMapMode(${JSON.stringify(mode)}); true;`
    );
  }, [mode]);

  useEffect(() => {
    syncMap();
  }, [checkpoints, overlays, route]);

  if (!APP_CONFIG.mapboxAccessToken) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Mapbox token needed</Text>
        <Text style={styles.missingText}>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to draw patrol routes on the map.</Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.map}
        onLoadEnd={syncMap}
        onMessage={(event: any) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              route?: PatrolRouteMapProps['route'];
              checkpoints?: PatrolRouteMapProps['checkpoints'];
            };
            if (payload.type === 'update' && payload.route && payload.checkpoints) {
              onChange?.({ route: payload.route, checkpoints: payload.checkpoints });
            }
          } catch {
            return;
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 280, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#DCE7E1' },
  map: { flex: 1, backgroundColor: '#DDEBE2' },
  missing: { height: 160, borderRadius: 10, borderWidth: 1, borderColor: '#DCE7E1', backgroundColor: '#F9FCFA', padding: 16, justifyContent: 'center' },
  missingTitle: { color: '#17342B', fontWeight: '800', marginBottom: 6 },
  missingText: { color: '#71817A', fontSize: 12, lineHeight: 18 },
});
