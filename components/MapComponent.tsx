import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN';

const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Mapbox GL JS in React Native</title>
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"></script>
    <link
      href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css"
      rel="stylesheet"
    />
    <style>
      body { margin:0; padding:0; }
      #map { position:absolute; top:0; bottom:0; width:100%; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      // Example: send a message to React Native when the map is clicked
      map.on('click', (e) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat
        }));
      });
    </script>
  </body>
</html>
`;

const MapboxGLJSWebView = () => {
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={(event) => {
          // This receives messages sent from the HTML page
          console.log('Message from map:', event.nativeEvent.data);
          // You can parse the JSON and use the coordinates as needed.
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});

export default MapboxGLJSWebView;
