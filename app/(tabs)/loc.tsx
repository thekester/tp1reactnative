import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  PermissionsAndroid,
  Button,
  Linking,
  Platform,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// ----------------------------------------------------------------------------
// CONFIGURATION DES NOTIFICATIONS LOCALES
// ----------------------------------------------------------------------------

// Définition du gestionnaire de notifications pour afficher immédiatement
// les notifications (sans son ni badge).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Vérifie et demande la permission d'envoyer des notifications.
 */
async function checkAndRequestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Fonction pour enregistrer l'appareil aux notifications et créer un canal par défaut sur Android.
 */
async function registerForNotificationsAsync() {
  const permissionGranted = await checkAndRequestNotificationPermission();
  if (!permissionGranted) {
    console.log("Les notifications ne sont pas autorisées.");
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

// ----------------------------------------------------------------------------
// INTERFACES POUR LES DONNÉES DE GÉOLOCALISATION
// ----------------------------------------------------------------------------

/**
 * Interface définissant la structure des coordonnées de géolocalisation.
 */
interface MyGeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

/**
 * Interface pour représenter une position complète avec ses coordonnées et un timestamp.
 */
interface MyGeolocationPosition {
  coords: MyGeoCoordinates;
  timestamp: number;
}

// ----------------------------------------------------------------------------
// COMPOSANT DE SUIVI DE GÉOLOCALISATION
// ----------------------------------------------------------------------------

const LocationList: React.FC = () => {
  // Liste des positions collectées
  const [locations, setLocations] = useState<MyGeoCoordinates[]>([]);
  // Message d'erreur éventuel
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Indique si le tracking est actif
  const [trackingActive, setTrackingActive] = useState<boolean>(true);
  // Référence pour l'identifiant du watch de géolocalisation
  const watchIdRef = useRef<number | null>(null);
  // Référence pour mémoriser l'heure de démarrage du tracking
  const trackingStartRef = useRef<number | null>(null);
  // Référence pour l'intervalle qui envoie les notifications toutes les minutes
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------------------------------
  // GESTION DES NOTIFICATIONS LOCALES
  // ----------------------------------------------------------------------------

  /**
   * Envoie une notification immédiate indiquant que le tracking est démarré.
   */
  const sendTrackingStartedNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Tracking commencé",
        body: "Le suivi de votre position est lancé.",
      },
      trigger: null, // Notification immédiate
    });
    console.log("Notification de démarrage envoyée sur l'appareil");
  };

  /**
   * Programme une notification locale toutes les minutes qui affiche
   * la durée écoulée du tracking et la dernière position connue.
   */
  const scheduleMinuteNotification = async () => {
    if (!trackingStartRef.current) return;
    // Calcul de la durée écoulée (en minutes)
    const elapsedMs = Date.now() - trackingStartRef.current;
    const minutesElapsed = Math.floor(elapsedMs / 60000) || 0;
    
    // Récupération de la dernière position connue
    const latestPosition = locations[locations.length - 1];
    const positionText = latestPosition
      ? `Position : Lat ${latestPosition.latitude.toFixed(5)}, Lon ${latestPosition.longitude.toFixed(5)}`
      : 'Position non disponible';

    // Envoi immédiat de la notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          minutesElapsed === 0
            ? "Tracking démarré"
            : `Tracking actif depuis ${minutesElapsed} minute${minutesElapsed > 1 ? 's' : ''}`,
        body: positionText,
        data: { minutesElapsed, latestPosition },
      },
      trigger: null,
    });
    console.log("Notification programmée pour", minutesElapsed, "minute(s) envoyée sur l'appareil");
  };

  // ----------------------------------------------------------------------------
  // PERMISSIONS & DÉMARRAGE DU SUIVI
  // ----------------------------------------------------------------------------

  /**
   * Demande les permissions nécessaires et démarre le suivi de la géolocalisation.
   */
  const requestAndWatch = async () => {
    try {
      // Demande de la permission de localisation en premier plan (fine)
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

      // Demande de la permission de localisation en arrière-plan
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

      // Réinitialiser les états et démarrer le tracking
      setLocations([]);
      setErrorMessage(null);
      setTrackingActive(true);
      // Enregistrer l'heure de démarrage du tracking
      trackingStartRef.current = Date.now();
      // Envoyer la notification de démarrage du tracking
      sendTrackingStartedNotification();
      // Envoi immédiat d'une notification (optionnellement redondant)
      scheduleMinuteNotification();
      // Démarrer l'intervalle pour envoyer les notifications toutes les minutes
      notificationIntervalRef.current = setInterval(scheduleMinuteNotification, 60000);
      // Démarrer la surveillance de la position
      startWatching();
    } catch (err) {
      console.warn(err);
      setErrorMessage("Erreur lors de la demande de permission.");
    }
  };

  /**
   * Démarre le suivi de la position en temps réel.
   * À chaque mise à jour, la nouvelle position est ajoutée à l'état.
   */
  const startWatching = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = Geolocation.watchPosition(
      (position: MyGeolocationPosition) => {
        const newCoords = position.coords;
        setLocations(prev => [...prev, newCoords]);
        setErrorMessage(null);
        // On se repose sur la notification programmée toutes les minutes.
      },
      (error) => {
        console.log(error.code, error.message);
        setErrorMessage(error.message);
      },
      {
        enableHighAccuracy: true,    // Demande une haute précision
        distanceFilter: 0,           // Mise à jour même pour un petit déplacement
        interval: 5000,              // Mise à jour toutes les 5 secondes
        fastestInterval: 2000,       // Intervalle minimum de 2 secondes
      }
    );
  };

  /**
   * Arrête le suivi de la position, vide l'historique et arrête l'intervalle de notification.
   */
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (notificationIntervalRef.current !== null) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }
    setLocations([]);
    setTrackingActive(false);
    setErrorMessage("Géolocalisation arrêtée et historique supprimé.");
  };

  // ----------------------------------------------------------------------------
  // EFFECTS & NETTOYAGE
  // ----------------------------------------------------------------------------

  useEffect(() => {
    // Enregistrement aux notifications et demande de permissions au montage du composant
    registerForNotificationsAsync();
    requestAndWatch();

    // Nettoyage lors du démontage pour éviter les fuites de mémoire
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      if (notificationIntervalRef.current !== null) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  /**
   * Ouvre les paramètres du téléphone pour permettre à l'utilisateur de modifier les permissions.
   */
  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  // ----------------------------------------------------------------------------
  // RENDERING DU COMPOSANT
  // ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// COMPOSANT PARENT
// ----------------------------------------------------------------------------

/**
 * Composant parent encapsulant le suivi de position.
 */
export default function LocTabScreen() {
  return (
    <View style={styles.screenContainer}>
      <LocationList />
    </View>
  );
}

// ----------------------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------------------

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
