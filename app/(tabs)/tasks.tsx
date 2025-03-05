import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Définition du composant principal de l'application
const App = () => {
  const navigation = useNavigation();
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');

  const handleAddTask = () => {
    if (!task || !date) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    const newTask = {
      id: Math.random().toString(),
      task,
      date,
      location,
      distance,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setTask('');
    setDate('');
    setLocation('');
    setDistance('');
  };

  const handleDeleteTask = (id: string) => {
    const filteredTasks = tasks.filter(task => task.id !== id);
    setTasks(filteredTasks);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion des Tâches</Text>

      {/* Champ de saisie pour la tâche */}
      <TextInput
        style={styles.input}
        placeholder="Ajouter une tâche"
        value={task}
        onChangeText={setTask}
      />

      {/* Champ de saisie pour la date */}
      <TextInput
        style={styles.input}
        placeholder="Date (ex : 2025-03-05)"
        value={date}
        onChangeText={setDate}
      />

      {/* Champ de saisie pour la localisation */}
      <TextInput
        style={styles.input}
        placeholder="Emplacement (optionnel)"
        value={location}
        onChangeText={setLocation}
      />

      {/* Champ de saisie pour la distance */}
      <TextInput
        style={styles.input}
        placeholder="Distance (optionnel)"
        value={distance}
        onChangeText={setDistance}
        keyboardType="numeric"
      />

      {/* Bouton pour ajouter une tâche */}
      <Button title="Ajouter la tâche" onPress={handleAddTask} />

      {/* Liste des tâches */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskText}>{item.task}</Text>
            <Text style={styles.taskText}>{item.date}</Text>
            <Text style={styles.taskText}>{item.location ? `Lieu: ${item.location}` : ''}</Text>
            <Text style={styles.taskText}>{item.distance ? `Distance: ${item.distance}m` : ''}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTask(item.id)}
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

// Styles de l'application
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
  },
  deleteButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default App;
