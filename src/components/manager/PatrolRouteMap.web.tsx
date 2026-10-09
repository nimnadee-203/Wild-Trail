import mapboxgl, { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl';
import type * as GeoJSON from 'geojson';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_CONFIG } from '../../constants/config';
import { PatrolCheckpoint, PatrolMapPoint } from '../../types/patrol';
import { PatrolMapOverlay, PatrolRouteMapProps } from './patrolMapHtml';

function ensureMapboxCss() {
  if (typeof document === 'undefined' || document.getElementById('mapbox-gl-css')) return;
  const link = document.createElement('link');
  link.id = 'mapbox-gl-css';
  link.rel = 'stylesheet';
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css';
  document.head.appendChild(link);
}

function toLine(points: PatrolMapPoint[]): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.longitude, point.latitude]),
    },
  };
}

function toPoints(points: Array<PatrolMapPoint & { label?: string }>): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point, index) => ({
      type: 'Feature',
      properties: { label: point.label || String(index + 1) },
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
    })),
  };
}

function emptyLine(): GeoJSON.Feature {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } };
}

function setSourceData(map: MapboxMap, id: string, data: GeoJSON.GeoJSON) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource(id, { type: 'geojson', data });
}

function renderMap(
  map: MapboxMap,
  route: PatrolMapPoint[],
  checkpoints: PatrolCheckpoint[],
  overlays: PatrolMapOverlay[]
) {
  if (!map.getStyle()) return;
  setSourceData(map, 'draft-route', route.length > 1 ? toLine(route) : emptyLine());
  setSourceData(map, 'draft-vertices', toPoints(route.map((point, index) => ({ ...point, label: String(index + 1) }))));
  setSourceData(map, 'draft-checkpoints', toPoints(checkpoints));
  overlays.forEach((overlay, index) => {
    setSourceData(map, `overlay-route-${index}`, overlay.route.length > 1 ? toLine(overlay.route) : emptyLine());
    setSourceData(map, `overlay-checkpoints-${index}`, toPoints(overlay.checkpoints));
  });
}

function addLayers(map: MapboxMap, overlays: PatrolMapOverlay[]) {
  if (!map.getLayer('draft-route-line')) {
    map.addLayer({ id: 'draft-route-line', type: 'line', source: 'draft-route', paint: { 'line-color': '#2B8263', 'line-width': 4 } });
    map.addLayer({
      id: 'draft-vertices-circle',
      type: 'circle',
      source: 'draft-vertices',
      paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-width': 2, 'circle-stroke-color': '#2B8263' },
    });
    map.addLayer({
      id: 'draft-checkpoints-circle',
      type: 'circle',
      source: 'draft-checkpoints',
      paint: { 'circle-radius': 8, 'circle-color': '#C98A2E', 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' },
    });
    map.addLayer({
      id: 'draft-checkpoints-label',
      type: 'symbol',
      source: 'draft-checkpoints',
      layout: { 'text-field': ['get', 'label'], 'text-size': 10, 'text-offset': [0, 1.2] },
      paint: { 'text-color': '#17342B' },
    });
  }
  overlays.forEach((overlay, index) => {
    const routeId = `overlay-route-line-${index}`;
    if (map.getLayer(routeId)) return;
    map.addLayer({
      id: routeId,
      type: 'line',
      source: `overlay-route-${index}`,
      paint: { 'line-color': overlay.color || '#4D84A8', 'line-width': 3, 'line-opacity': 0.75 },
    });
    map.addLayer({
      id: `overlay-checkpoints-circle-${index}`,
      type: 'circle',
      source: `overlay-checkpoints-${index}`,
      paint: { 'circle-radius': 6, 'circle-color': overlay.color || '#4D84A8', 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' },
    });
  });
}

export function PatrolRouteMap({
  editable = false,
  mode = 'route',
  route,
  checkpoints,
  overlays = [],
  onChange,
}: PatrolRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const modeRef = useRef(mode);
  const onChangeRef = useRef(onChange);
  const routeRef = useRef(route);
  const checkpointsRef = useRef(checkpoints);
  useEffect(() => {
    modeRef.current = mode;
    onChangeRef.current = onChange;
    routeRef.current = route;
    checkpointsRef.current = checkpoints;
  }, [mode, onChange, route, checkpoints]);

  useEffect(() => {
    ensureMapboxCss();
    if (!APP_CONFIG.mapboxAccessToken || !containerRef.current) return;

    mapboxgl.accessToken = APP_CONFIG.mapboxAccessToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [APP_CONFIG.defaultCoordinates.longitude, APP_CONFIG.defaultCoordinates.latitude],
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      if (!editable) return;
      const point = { latitude: event.lngLat.lat, longitude: event.lngLat.lng };
      if (modeRef.current === 'route') {
        onChangeRef.current?.({
          route: [...routeRef.current, point],
          checkpoints: checkpointsRef.current,
        });
        return;
      }
      onChangeRef.current?.({
        route: routeRef.current,
        checkpoints: [
          ...checkpointsRef.current,
          {
            id: `cp-${Date.now()}`,
            label: `Checkpoint ${checkpointsRef.current.length + 1}`,
            ...point,
          },
        ],
      });
    };

    map.on('load', () => {
      renderMap(map, routeRef.current, checkpointsRef.current, overlays);
      addLayers(map, overlays);
      if (routeRef.current.length > 0) {
        map.setCenter([routeRef.current[0].longitude, routeRef.current[0].latitude]);
      } else if (checkpointsRef.current.length > 0) {
        map.setCenter([checkpointsRef.current[0].longitude, checkpointsRef.current[0].latitude]);
      }
    });
    map.on('click', handleClick);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [editable]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;
    renderMap(map, route, checkpoints, overlays);
    addLayers(map, overlays);
    if (route.length > 0) {
      map.setCenter([route[0].longitude, route[0].latitude]);
    } else if (checkpoints.length > 0) {
      map.setCenter([checkpoints[0].longitude, checkpoints[0].latitude]);
    }
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
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 280, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#DCE7E1', backgroundColor: '#DDEBE2' },
  missing: { height: 160, borderRadius: 10, borderWidth: 1, borderColor: '#DCE7E1', backgroundColor: '#F9FCFA', padding: 16, justifyContent: 'center' },
  missingTitle: { color: '#17342B', fontWeight: '800', marginBottom: 6 },
  missingText: { color: '#71817A', fontSize: 12, lineHeight: 18 },
});
