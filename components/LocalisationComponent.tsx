import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  PermissionsAndroid,
  Button,
  Linking,
} from 'react-native';
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

const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<MyGeoCoordinates[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number | null = null;

    const requestPermission = async (): Promise<boolean> => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Autorisation de géolocalisation',
            message:
              'Cette application a besoin d’accéder à votre position en continu. Merci de l’autoriser dans les paramètres.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    };

    const startWatching = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setErrorMessage(
          "Permission de géolocalisation refusée. Veuillez modifier les droits dans les paramètres."
        );
        return;
      }
      watchId = Geolocation.watchPosition(
        (position: MyGeolocationPosition) => {
          setLocations(prev => [...prev, position.coords]);
          setErrorMessage(null);
        },
        (error) => {
          console.log(error.code, error.message);
          setErrorMessage(error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 5000, // toutes les 5 secondes
          fastestInterval: 2000,
        }
      );
    };

    startWatching();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des positions collectées</Text>
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Ouvrir les paramètres" onPress={handleOpenSettings} />
        </View>
      )}
      <FlatList
        nestedScrollEnabled
        data={locations}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.item}>
            #{index + 1} : Lat {item.latitude.toFixed(5)} | Lon {item.longitude.toFixed(5)}
          </Text>
        )}
      />
    </View>
  );
};

export default function LocalisationComponent() {
  return (
    <View style={styles.screenContainer}>
      <LocationList />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F2F2F2',
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEDED',
    padding: 12,
    marginVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFAAAA',
    alignItems: 'center',
  },
  errorText: {
    color: '#D8000C',
    marginBottom: 8,
    textAlign: 'center',
  },
  item: {
    fontSize: 16,
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD',
  },
});
