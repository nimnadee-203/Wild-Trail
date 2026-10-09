import { useCommunityLanguage } from './CommunityLanguage';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { APP_CONFIG } from '../../constants/config';
import type { LocationCoords } from './MapPickerModal';

interface Props {
  coords: LocationCoords;
  onChange: (coords: LocationCoords) => void;
}

export function CommunityLocationMap({ coords, onChange }: Props) {
  const { t } = useCommunityLanguage();
  const webView = useRef<WebView>(null);
  const [error, setError] = useState('');
  // Keep the document stable while the user moves the pin.
  const [html] = useState(() => {
    const token = JSON.stringify(APP_CONFIG.mapboxAccessToken).replace(/</g, '\\u003c');
    return `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet">
      <style>html,body,#map{margin:0;width:100%;height:100%;}body{background:#E5E7EB;}</style>
      </head><body><div id="map"></div>
      <script>
      function send(data){window.ReactNativeWebView.postMessage(JSON.stringify(data));}
      function loadMap(){
        try {
          mapboxgl.accessToken=${token};
          var map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/outdoors-v12',
            center:[${coords.longitude},${coords.latitude}],zoom:12});
          var marker=new mapboxgl.Marker({color:'#166534',draggable:true})
            .setLngLat([${coords.longitude},${coords.latitude}]).addTo(map);
          map.addControl(new mapboxgl.NavigationControl(),'top-right');
          function select(point){
            marker.setLngLat(point);
            send({type:'select',latitude:point.lat,longitude:point.lng});
          }
          map.on('click',function(event){select(event.lngLat);});
          marker.on('dragend',function(){select(marker.getLngLat());});
          map.on('error',function(){send({type:'error'});});
          map.on('idle',function(){send({type:'ready'});});
          window.setCommunityPin=function(point){
            marker.setLngLat([point.longitude,point.latitude]);
            map.easeTo({center:[point.longitude,point.latitude]});
          };
          send({type:'initialized'});
        } catch(error){send({type:'error'});}
      }
      </script>
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"
        onload="loadMap()" onerror="send({type:'error'})"></script>
      </body></html>`;
  });

  const syncPin = () => {
    webView.current?.injectJavaScript(
      `window.setCommunityPin && window.setCommunityPin(${JSON.stringify(coords)}); true;`
    );
  };

  useEffect(() => {
    webView.current?.injectJavaScript(
      `window.setCommunityPin && window.setCommunityPin(${JSON.stringify(coords)}); true;`
    );
  }, [coords]);

  if (!APP_CONFIG.mapboxAccessToken) {
    return <View style={styles.notice}><Text>{t("Add your Mapbox token to .env.local, then restart Expo to load the map.")}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webView}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.container}
        scrollEnabled={false}
        onError={() => setError('Unable to load the map. Check your internet connection.')}
        onMessage={({ nativeEvent }) => {
          try {
            const data = JSON.parse(nativeEvent.data);
            if (data.type === 'initialized') syncPin();
            if (data.type === 'ready') setError('');
            if (data.type === 'error') setError('Map unavailable. Check your connection and Mapbox token. You can still choose a gate above.');
            if (data.type === 'select' && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)
              && Math.abs(data.latitude) <= 90 && Math.abs(data.longitude) <= 180) {
              onChange({ latitude: data.latitude, longitude: data.longitude });
            }
          } catch {
            // Ignore malformed messages from the embedded page.
          }
        }}
      />
      {!!error && <View style={styles.error}><Text style={styles.errorText}>{t(error)}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB' },
  notice: { flex: 1, justifyContent: 'center', padding: 20 },
  error: { position: 'absolute', bottom: 8, left: 8, right: 8, padding: 10, borderRadius: 8, backgroundColor: '#FFF7ED' },
  errorText: { color: '#9A3412', fontSize: 12 },
});
