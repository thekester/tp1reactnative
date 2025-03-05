import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import SQLite from 'react-native-sqlite-storage';

interface Task {
  id: number;
  task: string;
  date: string; // La date programmée ou de création
  location?: string;
  distance?: string;
  category?: string;
}

let db: any = null;
if (Platform.OS !== 'web') {
  db = SQLite.openDatabase({ name: 'tasks.db', location: 'default' });
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Création ou vérification de la table avec le même schéma que TaskManagerScreen
  useEffect(() => {
    if (Platform.OS !== 'web') {
      db.transaction((tx: any) => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT, date TEXT, location TEXT, distance TEXT, category TEXT);',
          [],
          () => {
            loadTasks();
          },
          (error: any) => {
            console.log('Erreur lors de la création de la table :', error);
          }
        );
      });
    } else {
      // Pour le web, on charge depuis localStorage
      const tasksStr = localStorage.getItem('tasks');
      if (tasksStr) {
        setTasks(JSON.parse(tasksStr));
      }
    }
  }, []);

  // Fonction de chargement des tâches
  const loadTasks = () => {
    if (Platform.OS !== 'web') {
      db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM tasks;',
          [],
          (_: any, results: any) => {
            const loadedTasks: Task[] = [];
            for (let i = 0; i < results.rows.length; i++) {
              loadedTasks.push(results.rows.item(i));
            }
            setTasks(loadedTasks);
          },
          (error: any) => {
            console.log('Erreur lors du chargement des tâches :', error);
          }
        );
      });
    } else {
      const tasksStr = localStorage.getItem('tasks');
      if (tasksStr) {
        setTasks(JSON.parse(tasksStr));
      }
    }
  };

  // Séparation des tâches en fonction de la date par rapport à aujourd'hui
  const now = new Date();
  const recentTasks = tasks
    .filter(task => new Date(task.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const upcomingTasks = tasks
    .filter(task => new Date(task.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Composant d'affichage d'une tâche
  const TaskItem: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <ThemedView style={styles.taskItem}>
      <ThemedText style={styles.taskTitle}>{title}</ThemedText>
      <ThemedText style={styles.taskSubtitle}>{subtitle}</ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }
      >
        <LinearGradient colors={['#FF7E5F', '#FEB47B']} style={styles.headerGradient}>
          <ThemedText type="title" style={styles.headerTitle}>
            Task Manager
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Gérez vos tâches avec style
          </ThemedText>
        </LinearGradient>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">Mes tâches récentes</ThemedText>
          {recentTasks.length === 0 ? (
            <ThemedText style={styles.emptyText}>Aucune tâche encore ajoutée</ThemedText>
          ) : (
            <FlatList
              data={recentTasks}
              renderItem={({ item }) => (
                <TaskItem title={item.task} subtitle={item.date} />
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.taskList}
            />
          )}
        </ThemedView>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">Tâches à venir</ThemedText>
          {upcomingTasks.length === 0 ? (
            <ThemedText style={styles.emptyText}>Aucune tâche programmée</ThemedText>
          ) : (
            <FlatList
              data={upcomingTasks}
              renderItem={({ item }) => (
                <TaskItem title={item.task} subtitle={item.date} />
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.taskList}
            />
          )}
        </ThemedView>
      </ParallaxScrollView>

      {/* Bouton flottant pour ajouter une nouvelle tâche */}
      <TouchableOpacity style={styles.floatingButton}>
        <ThemedText style={styles.floatingButtonText}>+</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 10,
    margin: 16,
    marginTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  sectionContainer: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  taskList: {
    paddingVertical: 10,
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 20,
    marginRight: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    minWidth: 200,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  taskSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#FF7E5F',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floatingButtonText: {
    fontSize: 30,
    color: '#fff',
  },
});
