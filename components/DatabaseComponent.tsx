import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

// Étape 2 : Importer et désactiver les Promesses pour SQLite
SQLite.enablePromise(false);

/*
  Étape 3 : Création de la variable représentant la base de données.
  Le type DatabaseParams ne reconnaît pas les propriétés "version", "displayName" et "size".
  Pour respecter la consigne et éviter l'erreur TS(2353), nous effectuons un cast en "any".
  https://stackoverflow.com/questions/69249926/error-ts7006-parameter-req-implicitly-has-an-any-type
*/
const db = SQLite.openDatabase(
  {
    name: 'myDatabase.db',
    version: '1.0',            // Version de la base de données
    displayName: 'MyDatabase', // Nom affiché de la base de données
    size: 200000,              // Taille maximale (en octets)
    location: 'default',
  } as any, // Cast pour inclure les propriétés supplémentaires
  () => { console.log('DB opened'); },
  error => { console.log('DB error:', error); }
);

/*
  Étape 4 :
  Définir une fonction pour exécuter des requêtes SQL.
  Pour l'insertion et la création de table, nous utilisons des Promesses.
  https://stackoverflow.com/questions/68593847/promise-logic-with-sql-in-nodejs-when-making-calls-to-database
*/
const interactionSQL = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (tx, results) => resolve(results),
        (tx, error) => reject(error)
      );
    });
  });
};

/*
  Composant bouton stylisé.
  https://stackoverflow.com/questions/52321539/react-passing-props-with-styled-components
*/
interface StyledButtonProps {
  onPress: () => void;
  title: string;
}

const StyledButton: React.FC<StyledButtonProps> = ({ onPress, title }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

/*
  Composant principal : Gestion de la base de données locale
  - Étape 5 : Bouton pour créer la table si elle n'existe pas.
  - Étape 6 : Champ textuel et bouton pour enregistrer les données saisies.
  - Étape 7 : Bouton pour récupérer le contenu de la base de données, ici avec des callbacks (pas de Promesse).
  - Nouveau : Bouton en rouge avec poubelle pour vider la base de données et réinitialiser les IDs.
  - Amélioration : Affichage des données enregistrées et feedback indiquant que la valeur a été enregistrée,
    invitant à cliquer sur "Récupérer" pour mettre à jour l'affichage.
  
  Voir également cet exemple sur StackOverflow pour la gestion de SQLite dans React Native :
  https://stackoverflow.com/questions/63462480/how-to-create-database-in-sqlite3-in-react-native
*/
const DatabaseComponent: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Création de la table "items"
  const createTable = async () => {
    const query = `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
    );`;
    try {
      await interactionSQL(query);
      console.log('Table created successfully');
      setFeedbackMessage('La table a bien été créée.');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } catch (error) {
      console.log('Error creating table:', error);
    }
  };

  // Enregistrement des données saisies dans la table "items"
  const saveData = async () => {
    const query = `INSERT INTO items (content) VALUES (?);`;
    try {
      await interactionSQL(query, [inputText]);
      console.log('Data saved successfully');
      // Feedback pour indiquer que la valeur est enregistrée et qu'il faut cliquer sur "Récupérer"
      setFeedbackMessage("La valeur a bien été enregistrée. Cliquez sur 'Récupérer' pour mettre à jour l'affichage.");
      setInputText('');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  // Récupération des données de la table "items" sans utiliser de Promesse (via callbacks)
  const getData = () => {
    const query = `SELECT * FROM items;`;
    db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (tx, results) => {
          const rows = results.rows;
          let items: any[] = [];
          for (let i = 0; i < rows.length; i++) {
            items.push(rows.item(i));
          }
          setData(items);
        },
        (tx, error) => {
          console.log('Error retrieving data:', error);
        }
      );
    });
  };

  // Vider la base de données et réinitialiser les IDs
  const clearDatabase = () => {
    db.transaction(tx => {
      // Supprimer toutes les entrées de la table "items"
      tx.executeSql(
        "DELETE FROM items;",
        [],
        (tx, results) => {
          console.log('Data deleted successfully');
          // Réinitialiser l'auto-incrément en supprimant l'entrée correspondante dans sqlite_sequence
          tx.executeSql(
            "DELETE FROM sqlite_sequence WHERE name='items';",
            [],
            (tx, results) => {
              console.log('Auto-increment reset successfully');
              setData([]); // On vide aussi l'état local
              setFeedbackMessage('La base de données a été vidée et les IDs réinitialisés.');
              setTimeout(() => setFeedbackMessage(''), 2000);
            },
            (tx, error) => {
              console.log('Error resetting auto-increment:', error);
            }
          );
        },
        (tx, error) => {
          console.log('Error clearing database:', error);
        }
      );
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Gestion de la Base de Données</Text>
      {feedbackMessage !== '' && (
        <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
      )}
      <View style={styles.buttonRow}>
        <StyledButton onPress={createTable} title="Créer la table" />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Entrez du texte"
        value={inputText}
        onChangeText={setInputText}
        placeholderTextColor="#888"
      />
      <View style={styles.buttonRow}>
        <StyledButton onPress={saveData} title="Enregistrer" />
        <StyledButton onPress={getData} title="Récupérer" />
      </View>
      {/* Bouton en rouge pour vider la base de données et réinitialiser les IDs */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.deleteButton} onPress={clearDatabase}>
          <Text style={styles.deleteButtonText}>🗑️ Vider la DB</Text>
        </TouchableOpacity>
      </View>
      {data.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataHeader}>Données enregistrées :</Text>
          {data.map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>ID : {item.id}</Text>
              <Text style={styles.cardContent}>{item.content}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
    alignItems: 'center'
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  feedbackMessage: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 10
  },
  input: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336', // Couleur rouge
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  dataContainer: {
    width: '100%',
    marginTop: 10,
  },
  dataHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555'
  },
  cardContent: {
    fontSize: 16,
    color: '#333',
    marginTop: 5
  }
});

export default DatabaseComponent;
