import React, { useState } from 'react';
import { View, Text, Button, PermissionsAndroid, StyleSheet } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

interface MyGeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

interface MyGeolocationPosition {
  coords: MyGeoCoordinates;
  timestamp: number;
}

const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use Geolocation');
      return true;
    } else {
      console.log('Geolocation permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const LocalisationComponent: React.FC = () => {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  const getCurrentPosition = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        (pos: MyGeolocationPosition) => {
          console.log(pos);
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (error: { code: number; message: string }) => {
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Retrouver la position" onPress={getCurrentPosition} />
      {position && (
        <Text style={styles.positionText}>
          Latitude : {position.latitude} | Longitude : {position.longitude}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  positionText: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default LocalisationComponent;
