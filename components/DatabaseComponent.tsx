import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const isWeb = Platform.OS === 'web';

let db: any = null;
if (!isWeb) {
  // Pour les plateformes mobiles, on utilise SQLite
  SQLite.enablePromise(false);
  db = SQLite.openDatabase(
    {
      name: 'myDatabase.db',
      version: '1.0',            // Version de la base de données
      displayName: 'MyDatabase', // Nom affiché de la base de données
      size: 200000,              // Taille maximale (en octets)
      location: 'default',
    } as any, // Cast pour inclure les propriétés supplémentaires
    () => {
      console.log('DB opened');
    },
    error => {
      console.log('DB error:', error);
    }
  );
}

// Fonction générique pour exécuter une requête SQL sur mobile via SQLite
const interactionSQL = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        query,
        params,
        (tx: any, results: any) => resolve(results),
        (tx: any, error: any) => reject(error)
      );
    });
  });
};

interface StyledButtonProps {
  onPress: () => void;
  title: string;
}

const StyledButton: React.FC<StyledButtonProps> = ({ onPress, title }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const DatabaseComponent: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Création de la "table" (initialisation du stockage)
  const createTable = async () => {
    if (isWeb) {
      if (!localStorage.getItem('items')) {
        localStorage.setItem('items', JSON.stringify([]));
        localStorage.setItem('itemsCounter', '1');
      }
      setFeedbackMessage('La table a bien été créée.');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } else {
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
    }
  };

  // Enregistrement des données
  const saveData = async () => {
    if (isWeb) {
      let items = JSON.parse(localStorage.getItem('items') || '[]');
      let counter = parseInt(localStorage.getItem('itemsCounter') || '1', 10);
      const newItem = { id: counter, content: inputText };
      items.push(newItem);
      localStorage.setItem('items', JSON.stringify(items));
      localStorage.setItem('itemsCounter', (counter + 1).toString());
      console.log('Data saved successfully (web)');
      setFeedbackMessage("La valeur a bien été enregistrée. Cliquez sur 'Récupérer' pour mettre à jour l'affichage.");
      setInputText('');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } else {
      const query = `INSERT INTO items (content) VALUES (?);`;
      try {
        await interactionSQL(query, [inputText]);
        console.log('Data saved successfully');
        setFeedbackMessage("La valeur a bien été enregistrée. Cliquez sur 'Récupérer' pour mettre à jour l'affichage.");
        setInputText('');
        setTimeout(() => setFeedbackMessage(''), 2000);
      } catch (error) {
        console.log('Error saving data:', error);
      }
    }
  };

  // Récupération des données
  const getData = () => {
    if (isWeb) {
      const items = JSON.parse(localStorage.getItem('items') || '[]');
      setData(items);
    } else {
      const query = `SELECT * FROM items;`;
      db.transaction((tx: any) => {
        tx.executeSql(
          query,
          [],
          (tx: any, results: any) => {
            const rows = results.rows;
            let items: any[] = [];
            for (let i = 0; i < rows.length; i++) {
              items.push(rows.item(i));
            }
            setData(items);
          },
          (tx: any, error: any) => {
            console.log('Error retrieving data:', error);
          }
        );
      });
    }
  };

  // Vider la "base" et réinitialiser les IDs
  const clearDatabase = () => {
    if (isWeb) {
      localStorage.removeItem('items');
      localStorage.removeItem('itemsCounter');
      setData([]);
      setFeedbackMessage('La base de données a été vidée et les IDs réinitialisés.');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } else {
      db.transaction((tx: any) => {
        tx.executeSql(
          "DELETE FROM items;",
          [],
          (tx: any, results: any) => {
            console.log('Data deleted successfully');
            tx.executeSql(
              "DELETE FROM sqlite_sequence WHERE name='items';",
              [],
              (tx: any, results: any) => {
                console.log('Auto-increment reset successfully');
                setData([]);
                setFeedbackMessage('La base de données a été vidée et les IDs réinitialisés.');
                setTimeout(() => setFeedbackMessage(''), 2000);
              },
              (tx: any, error: any) => {
                console.log('Error resetting auto-increment:', error);
              }
            );
          },
          (tx: any, error: any) => {
            console.log('Error clearing database:', error);
          }
        );
      });
    }
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
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.deleteButton} onPress={clearDatabase}>
          <Text style={styles.deleteButtonText}>🗑️ Vider la DB</Text>
        </TouchableOpacity>
      </View>
      {data.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataHeader}>Données enregistrées :</Text>
          {data.map((item: any) => (
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
    backgroundColor: '#f44336',
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
