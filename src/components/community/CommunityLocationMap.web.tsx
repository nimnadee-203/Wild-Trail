// The modal uses Mapbox GL directly on web; keep native WebView out of its bundle.
export function CommunityLocationMap(_props: {
  coords: { latitude: number; longitude: number };
  onChange: (coords: { latitude: number; longitude: number }) => void;
}) {
  return null;
}
