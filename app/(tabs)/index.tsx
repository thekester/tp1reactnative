import React from 'react';
import { Image, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';

interface Task {
  id: string;
  title: string;
  time?: string;
  due?: string;
}

const recentTasks: Task[] = [
  { id: '1', title: 'Réunion de suivi', time: '10:00 AM' },
  { id: '2', title: 'Rédaction de rapport', time: '11:30 AM' },
  { id: '3', title: 'Appel client', time: '1:00 PM' },
];

const upcomingTasks: Task[] = [
  { id: '4', title: 'Planification de projet', due: 'Demain' },
  { id: '5', title: 'Revue de code', due: 'Vendredi' },
  { id: '6', title: 'Mise à jour du site', due: 'Lundi prochain' },
];

interface TaskItemProps {
  title: string;
  subtitle: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ title, subtitle }) => (
  <ThemedView style={styles.taskItem}>
    <ThemedText style={styles.taskTitle}>{title}</ThemedText>
    <ThemedText style={styles.taskSubtitle}>{subtitle}</ThemedText>
  </ThemedView>
);

export default function HomeScreen() {
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
          <FlatList
            data={recentTasks}
            renderItem={({ item }) => (
              <TaskItem title={item.title} subtitle={item.time || ''} />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.taskList}
          />
        </ThemedView>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">Tâches à venir</ThemedText>
          <FlatList
            data={upcomingTasks}
            renderItem={({ item }) => (
              <TaskItem title={item.title} subtitle={item.due || ''} />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.taskList}
          />
        </ThemedView>
      </ParallaxScrollView>

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
