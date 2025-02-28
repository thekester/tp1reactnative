import React, { useState, useEffect, useRef } from 'react';
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
  const [trackingActive, setTrackingActive] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  const requestAndWatch = async () => {
    try {
      // Demande de la permission fine (premier plan)
      const fineLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Autorisation de géolocalisation',
          message:
            'Cette application a besoin d’accéder à votre position pour fonctionner correctement.',
          buttonNeutral: 'Demander plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        }
      );

      if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
        setErrorMessage(
          "Permission de géolocalisation refusée. Veuillez autoriser 'Utiliser seulement depuis cette application'."
        );
        return;
      }

      // Demande de la permission d'arrière-plan
      const backgroundLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Autorisation de géolocalisation en arrière-plan',
          message:
            "Cette application a besoin d'accéder à votre position en arrière-plan pour collecter des données en continu.",
          buttonNeutral: 'Demander plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        }
      );

      if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
        setErrorMessage(
          "Permission de géolocalisation en arrière-plan refusée. Veuillez autoriser l'accès en arrière-plan dans les paramètres."
        );
        return;
      }

      // Réinitialiser l'historique et démarrer le suivi
      setLocations([]);
      setErrorMessage(null);
      setTrackingActive(true);
      startWatching();
    } catch (err) {
      console.warn(err);
      setErrorMessage("Erreur lors de la demande de permission.");
    }
  };

  const startWatching = () => {
    // Si un watch est déjà lancé, on l'efface
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = Geolocation.watchPosition(
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

  const stopTracking = () => {
    // Arrête le suivi et supprime l'historique
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocations([]);
    setTrackingActive(false);
    setErrorMessage("Géolocalisation arrêtée et historique supprimé.");
  };

  useEffect(() => {
    // Lancer le tracking dès le montage
    requestAndWatch();
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des positions collectées</Text>
      {trackingActive && (
        <Text style={styles.trackingInfo}>
          Tracking en cours : mise à jour toutes les 5 secondes.
        </Text>
      )}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Réessayer" onPress={requestAndWatch} />
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
      {trackingActive ? (
        <Button
          title="Arrêter la géolocalisation et supprimer l'historique"
          onPress={stopTracking}
        />
      ) : (
        <Button title="Démarrer la géolocalisation" onPress={requestAndWatch} />
      )}
    </View>
  );
};

export default function LocTabScreen() {
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
  trackingInfo: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
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
