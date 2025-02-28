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

// Définition de l'interface pour les coordonnées de géolocalisation personnalisées
interface MyGeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

// Interface pour représenter la position complète avec un timestamp
interface MyGeolocationPosition {
  coords: MyGeoCoordinates;
  timestamp: number;
}

// Composant principal qui gère la collecte et l'affichage des positions
const LocationList: React.FC = () => {
  // State pour stocker la liste des positions collectées
  const [locations, setLocations] = useState<MyGeoCoordinates[]>([]);
  // State pour gérer les messages d'erreur
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // State pour savoir si le tracking est actif
  const [trackingActive, setTrackingActive] = useState<boolean>(true);
  // Référence pour stocker l'identifiant du watch afin de pouvoir l'annuler plus tard
  const watchIdRef = useRef<number | null>(null);

  // Fonction asynchrone pour demander les permissions et lancer la géolocalisation
  const requestAndWatch = async () => {
    try {
      // Demande de la permission de localisation fine (précision élevée, en premier plan)
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

      // Vérification de la permission fine
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

      // Vérification de la permission d'arrière-plan
      if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
        setErrorMessage(
          "Permission de géolocalisation en arrière-plan refusée. Veuillez autoriser l'accès en arrière-plan dans les paramètres."
        );
        return;
      }

      // Réinitialisation des données et lancement du tracking
      setLocations([]);
      setErrorMessage(null);
      setTrackingActive(true);
      startWatching();
    } catch (err) {
      // Capture et affichage des erreurs potentielles lors de la demande de permissions
      console.warn(err);
      setErrorMessage("Erreur lors de la demande de permission.");
    }
  };

  // Fonction pour démarrer le suivi de la position
  const startWatching = () => {
    // Si un suivi est déjà actif, on l'annule pour éviter des doublons
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }
    // Démarrer le suivi avec watchPosition et stocker l'identifiant
    watchIdRef.current = Geolocation.watchPosition(
      (position: MyGeolocationPosition) => {
        // Ajout de la nouvelle position à l'historique
        setLocations(prev => [...prev, position.coords]);
        setErrorMessage(null);
      },
      (error) => {
        // Gestion des erreurs retournées par le service de géolocalisation
        console.log(error.code, error.message);
        setErrorMessage(error.message);
      },
      {
        enableHighAccuracy: true,    // Demander une précision élevée
        distanceFilter: 0,           // Mise à jour même si le déplacement est minime
        interval: 5000,              // Mise à jour toutes les 5 secondes
        fastestInterval: 2000,       // Intervalle minimum entre deux mises à jour
      }
    );
  };

  // Fonction pour arrêter le suivi et effacer l'historique
  const stopTracking = () => {
    // Si un suivi est en cours, on l'arrête
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Réinitialisation de l'historique et mise à jour du status de tracking
    setLocations([]);
    setTrackingActive(false);
    setErrorMessage("Géolocalisation arrêtée et historique supprimé.");
  };

  // Utilisation de useEffect pour démarrer le tracking au montage du composant
  useEffect(() => {
    requestAndWatch();
    // Nettoyage lors du démontage pour éviter les fuites de mémoire
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fonction pour ouvrir les paramètres du téléphone
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
          {/* Bouton pour réessayer de demander les permissions */}
          <Button title="Réessayer" onPress={requestAndWatch} />
          {/* Bouton pour ouvrir directement les paramètres du téléphone */}
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
      {/* Bouton conditionnel pour démarrer ou arrêter le tracking */}
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

// Composant parent encapsulant le composant LocationList
export default function LocTabScreen() {
  return (
    <View style={styles.screenContainer}>
      <LocationList />
    </View>
  );
}

// Styles définis pour le composant
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
