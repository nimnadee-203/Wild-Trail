import { APP_CONFIG } from '../../constants/config';
import { PatrolCheckpoint, PatrolMapPoint } from '../../types/patrol';

export type PatrolMapMode = 'route' | 'checkpoint';

export type PatrolMapOverlay = {
  id: string;
  color: string;
  route: PatrolMapPoint[];
  checkpoints: PatrolCheckpoint[];
};

export type PatrolRouteMapProps = {
  editable?: boolean;
  mode?: PatrolMapMode;
  route: PatrolMapPoint[];
  checkpoints: PatrolCheckpoint[];
  overlays?: PatrolMapOverlay[];
  onChange?: (next: { route: PatrolMapPoint[]; checkpoints: PatrolCheckpoint[] }) => void;
};

type PatrolMapHtmlOptions = {
  editable: boolean;
  mode: PatrolMapMode;
  route: PatrolMapPoint[];
  checkpoints: PatrolCheckpoint[];
  overlays: PatrolMapOverlay[];
};

function jsonForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function createPatrolMapHtml({
  editable,
  mode,
  route,
  checkpoints,
  overlays,
}: PatrolMapHtmlOptions) {
  const token = APP_CONFIG.mapboxAccessToken;
  const center = APP_CONFIG.defaultCoordinates;
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"></script>
    <style>
      html, body, #map { margin: 0; height: 100%; width: 100%; background: #DDEBE2; }
      #missing { padding: 18px; font-family: sans-serif; color: #53655D; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const TOKEN = ${jsonForScript(token)};
      const CENTER = ${jsonForScript([center.longitude, center.latitude])};
      const EDITABLE = ${jsonForScript(editable)};
      let mode = ${jsonForScript(mode)};
      let route = ${jsonForScript(route)};
      let checkpoints = ${jsonForScript(checkpoints)};
      let overlays = ${jsonForScript(overlays)};
      const ROUTE_COLOR = '#2B8263';
      let map;

      function post(payload) {
        const message = JSON.stringify(payload);
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
        else if (window.parent) window.parent.postMessage(message, '*');
      }

      function toLine(points) {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: points.map((point) => [point.longitude, point.latitude]),
          },
        };
      }

      function toPoints(points) {
        return {
          type: 'FeatureCollection',
          features: points.map((point, index) => ({
            type: 'Feature',
            properties: { label: point.label || String(index + 1) },
            geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
          })),
        };
      }

      function emptyLine() {
        return { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } };
      }

      function ensureSource(id, data) {
        const source = map.getSource(id);
        if (source) source.setData(data);
        else map.addSource(id, { type: 'geojson', data });
      }

      function render() {
        if (!map || !map.getStyle()) return;
        ensureSource('draft-route', route.length > 1 ? toLine(route) : emptyLine());
        ensureSource('draft-vertices', toPoints(route.map((point, index) => ({ ...point, label: String(index + 1) }))));
        ensureSource('draft-checkpoints', toPoints(checkpoints));
        overlays.forEach((overlay, index) => {
          ensureSource('overlay-route-' + index, overlay.route.length > 1 ? toLine(overlay.route) : emptyLine());
          ensureSource('overlay-checkpoints-' + index, toPoints(overlay.checkpoints || []));
        });
      }

      function addLayers() {
        if (!map.getLayer('draft-route-line')) {
          map.addLayer({ id: 'draft-route-line', type: 'line', source: 'draft-route', paint: { 'line-color': ROUTE_COLOR, 'line-width': 4 } });
          map.addLayer({
            id: 'draft-vertices-circle',
            type: 'circle',
            source: 'draft-vertices',
            paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-width': 2, 'circle-stroke-color': ROUTE_COLOR },
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
          const routeId = 'overlay-route-line-' + index;
          const checkpointId = 'overlay-checkpoints-circle-' + index;
          if (!map.getLayer(routeId)) {
            map.addLayer({ id: routeId, type: 'line', source: 'overlay-route-' + index, paint: { 'line-color': overlay.color || '#4D84A8', 'line-width': 3, 'line-opacity': 0.75 } });
            map.addLayer({
              id: checkpointId,
              type: 'circle',
              source: 'overlay-checkpoints-' + index,
              paint: { 'circle-radius': 6, 'circle-color': overlay.color || '#4D84A8', 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' },
            });
          }
        });
        render();
      }

      window.setPatrolMapMode = function(nextMode) { mode = nextMode; };
      window.setPatrolMapData = function(next) {
        route = next.route || [];
        checkpoints = next.checkpoints || [];
        overlays = next.overlays || overlays;
        render();
      };

      if (!TOKEN) {
        document.getElementById('map').innerHTML = '<div id="missing">Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to load the Mapbox patrol map.</div>';
      } else {
        mapboxgl.accessToken = TOKEN;
        map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: CENTER,
          zoom: 12,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        map.on('load', addLayers);
        map.on('click', function(event) {
          if (!EDITABLE) return;
          const point = { latitude: event.lngLat.lat, longitude: event.lngLat.lng };
          if (mode === 'route') {
            route = route.concat(point);
          } else {
            checkpoints = checkpoints.concat({
              id: 'cp-' + Date.now(),
              label: 'Checkpoint ' + (checkpoints.length + 1),
              latitude: point.latitude,
              longitude: point.longitude,
            });
          }
          render();
          post({ type: 'update', route: route, checkpoints: checkpoints });
        });
      }
    </script>
  </body>
</html>`;
}
