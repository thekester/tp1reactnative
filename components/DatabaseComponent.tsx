import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

// Désactivation de l'utilisation des Promises
SQLite.enablePromise(false);

// Ouverture de la base de données avec les paramètres supportés
const db = SQLite.openDatabase(
  {
    name: 'myDatabase.db',
    location: 'default',
  },
  () => {
    console.log('DB opened');
  },
  error => {
    console.log('DB error:', error);
  }
);

// Fonction générique pour exécuter une requête SQL
const interactionSQL = (query: string, params: any[] = []) => {
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

const DatabaseComponent: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [data, setData] = useState<any[]>([]);

  // Création de la table si elle n'existe pas
  const createTable = async () => {
    const query = `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
    );`;
    try {
      await interactionSQL(query);
      console.log('Table created successfully');
    } catch (error) {
      console.log('Error creating table:', error);
    }
  };

  // Enregistrement du contenu du champ textuel
  const saveData = async () => {
    const query = `INSERT INTO items (content) VALUES (?);`;
    try {
      await interactionSQL(query, [inputText]);
      console.log('Data saved successfully');
      setInputText('');
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  // Récupération des données enregistrées
  const getData = async () => {
    const query = `SELECT * FROM items;`;
    try {
      const results: any = await interactionSQL(query);
      const rows = results.rows;
      let items: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        items.push(rows.item(i));
      }
      setData(items);
    } catch (error) {
      console.log('Error retrieving data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Créer la table" onPress={createTable} />
      <TextInput
        style={styles.input}
        placeholder="Entrez du texte"
        value={inputText}
        onChangeText={setInputText}
      />
      <Button title="Enregistrer" onPress={saveData} />
      <Button title="Récupérer les données" onPress={getData} />
      {data.length > 0 && (
        <View style={styles.dataContainer}>
          {data.map(item => (
            <Text key={item.id} style={styles.itemText}>
              {item.id}: {item.content}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    borderColor: '#999',
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  dataContainer: {
    marginTop: 20,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default DatabaseComponent;
