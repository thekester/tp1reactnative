import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SectionList,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import SQLite from 'react-native-sqlite-storage';

interface Task {
  id: string | number;
  task: string;
  date: string;
  location?: string;
  distance?: string;
  category: string;
}

let db: any = null;
if (Platform.OS !== 'web') {
  db = SQLite.openDatabase({ name: 'tasks.db', location: 'default' });
}

const TaskManagerScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [category, setCategory] = useState('Travail');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Créer ou vérifier la table tasks sans la supprimer
  useEffect(() => {
    if (Platform.OS !== 'web') {
      db.transaction(
        (tx: any) => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT, date TEXT, location TEXT, distance TEXT, category TEXT);',
            [],
            () => console.log('Table tasks vérifiée/créée avec succès.'),
            (err: any) => console.log('Erreur lors de la création de la table tasks:', err)
          );
        },
        (error: any) => console.log('Erreur de transaction lors de la création de la table:', error),
        () => {
          loadTasks();
        }
      );
    } else {
      loadTasks();
    }
  }, []);

  // Fonction pour charger les tâches depuis SQLite ou AsyncStorage
  const loadTasks = async () => {
    if (Platform.OS !== 'web') {
      db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM tasks;',
          [],
          async (tx: any, results: any) => {
            const loadedTasks: Task[] = [];
            for (let i = 0; i < results.rows.length; i++) {
              loadedTasks.push(results.rows.item(i));
            }
            setTasks(loadedTasks);
            try {
              await AsyncStorage.setItem('tasks', JSON.stringify(loadedTasks));
              console.log('AsyncStorage synchronisé avec SQLite');
            } catch (e) {
              console.error('Erreur lors de la synchronisation avec AsyncStorage', e);
            }
          },
          (error: any) => {
            console.log('Erreur lors du chargement des tâches depuis SQLite:', error);
          }
        );
      });
    } else {
      AsyncStorage.getItem('tasks')
        .then((storedTasks) => {
          if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
          }
        })
        .catch((error) =>
          console.log('Erreur lors du chargement des tâches depuis AsyncStorage:', error)
        );
    }
  };

  const saveTasksToAsyncStorage = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      console.log('AsyncStorage mis à jour.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans AsyncStorage:', error);
    }
  };

  // Ajout ou mise à jour d'une tâche
  const handleSaveTask = () => {
    if (!taskInput || !date) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le titre et la date.');
      return;
    }

    if (editingTaskId) {
      // Mise à jour d'une tâche existante
      if (Platform.OS !== 'web') {
        db.transaction((tx: any) => {
          tx.executeSql(
            'UPDATE tasks SET task=?, date=?, location=?, distance=?, category=? WHERE id=?;',
            [taskInput, date, location, distance, category, editingTaskId],
            () => {
              loadTasks();
            },
            (error: any) => {
              console.log('Erreur lors de la mise à jour de la tâche dans SQLite:', error);
            }
          );
        });
      } else {
        const updatedTasks = tasks.map((t) =>
          t.id === editingTaskId ? { ...t, task: taskInput, date, location, distance, category } : t
        );
        setTasks(updatedTasks);
        saveTasksToAsyncStorage(updatedTasks);
      }
      setEditingTaskId(null);
    } else {
      // Insertion d'une nouvelle tâche
      if (Platform.OS !== 'web') {
        db.transaction((tx: any) => {
          tx.executeSql(
            'INSERT INTO tasks (task, date, location, distance, category) VALUES (?,?,?,?,?);',
            [taskInput, date, location, distance, category],
            () => {
              loadTasks();
            },
            (error: any) => {
              console.log('Erreur lors de l\'insertion de la tâche dans SQLite:', error);
            }
          );
        });
      } else {
        const newTask: Task = {
          id: Math.random().toString(),
          task: taskInput,
          date,
          location,
          distance,
          category,
        };
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        saveTasksToAsyncStorage(updatedTasks);
      }
    }

    // Réinitialisation des champs et fermeture de la modale
    setTaskInput('');
    setDate('');
    setLocation('');
    setDistance('');
    setCategory('Travail');
    setModalVisible(false);
  };

  // Suppression d'une tâche
  const handleDeleteTask = (id: string | number) => {
    if (Platform.OS !== 'web') {
      db.transaction((tx: any) => {
        tx.executeSql(
          'DELETE FROM tasks WHERE id=?;',
          [id],
          () => {
            loadTasks();
          },
          (error: any) => {
            console.log('Erreur lors de la suppression de la tâche dans SQLite:', error);
          }
        );
      });
    } else {
      const updatedTasks = tasks.filter((t) => t.id !== id);
      setTasks(updatedTasks);
      saveTasksToAsyncStorage(updatedTasks);
    }
  };

  // Préparation d'une tâche pour l'édition
  const handleEditTask = (id: string | number) => {
    const taskToEdit = tasks.find((t) => t.id === id);
    if (taskToEdit) {
      setTaskInput(taskToEdit.task);
      setDate(taskToEdit.date);
      setLocation(taskToEdit.location || '');
      setDistance(taskToEdit.distance || '');
      setCategory(taskToEdit.category || 'Travail');
      setEditingTaskId(id.toString());
      setModalVisible(true);
    }
  };

  // Tri des tâches par catégorie pour l'affichage dans SectionList
  const sortTasksByCategory = () => {
    const sorted: { [key: string]: Task[] } = {};
    tasks.forEach((t) => {
      const cat = t.category || 'Sans catégorie';
      if (!sorted[cat]) {
        sorted[cat] = [];
      }
      sorted[cat].push(t);
    });
    return Object.keys(sorted).map((cat) => ({
      title: cat,
      data: sorted[cat],
    }));
  };

  // Rendu d'un élément tâche avec boutons Modifier et Supprimer
  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskText}>Tâche: {item.task}</Text>
      <Text style={styles.taskText}>Date: {item.date}</Text>
      {item.location ? <Text style={styles.taskText}>Lieu: {item.location}</Text> : null}
      {item.distance ? <Text style={styles.taskText}>Distance: {item.distance}m</Text> : null}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditTask(item.id)}>
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(item.id)}>
          <Text style={styles.deleteButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gestion des Tâches</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setModalVisible(true);
          setEditingTaskId(null);
          setTaskInput('');
          setDate('');
          setLocation('');
          setDistance('');
          setCategory('Travail');
        }}
      >
        <Text style={styles.addButtonText}>+ Create a new Task</Text>
      </TouchableOpacity>

      <SectionList
        sections={sortTasksByCategory()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTaskItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingTaskId ? 'Modifier la tâche' : 'Nouvelle Tâche'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Titre de la tâche"
              value={taskInput}
              onChangeText={setTaskInput}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Date (ex: 2025-03-05)"
              value={date}
              onChangeText={setDate}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Emplacement (optionnel)"
              value={location}
              onChangeText={setLocation}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Distance (optionnel)"
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
            />
            <Picker
              selectedValue={category}
              style={styles.picker}
              onValueChange={(itemValue: string) => setCategory(itemValue)}
            >
              <Picker.Item label="Travail" value="Travail" />
              <Picker.Item label="Famille" value="Famille" />
              <Picker.Item label="Divers" value="Divers" />
            </Picker>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveTask}>
                <Text style={styles.modalButtonText}>
                  {editingTaskId ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#eee',
    padding: 5,
    marginTop: 15,
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    flex: 0.48,
    padding: 10,
    backgroundColor: 'orange',
    borderRadius: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteButton: {
    flex: 0.48,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#f9f9f9',
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TaskManagerScreen;
