import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';


interface Task {
  id: number;
  title: string;
  completed: boolean;
  isImportant: boolean;
}

interface Props {
  category: string;
  title: string;
  themeColor: string[];
  onOpenMenu: () => void; // <--- NOVA PROP PARA ABRIR O MENU
}

export default function TaskListScreen({ category, title, themeColor, onOpenMenu }: Props) {
  const db = useSQLiteContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  const loadTasks = async () => {
    let query = 'SELECT * FROM tasks';
    if (category === 'Important') query += ' WHERE isImportant = 1';
    else if (category === 'MyDay') query += " WHERE category = 'MyDay'";
    else if (category === 'Planned') query += ' WHERE isPlanned = 1';
    query += ' ORDER BY id DESC';

    try {
      const result = await db.getAllAsync<Task>(query);
      setTasks(result);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadTasks(); }, [category]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const isImp = category === 'Important' ? true : false;
    const cat = category === 'MyDay' ? 'MyDay' : 'Tasks';
    await db.runAsync('INSERT INTO tasks (title, isImportant, category) VALUES (?, ?, ?)', newTask, isImp, cat);
    setNewTask('');
    loadTasks();
  };

  const toggleComplete = async (id: number, current: boolean) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', !current, id);
    loadTasks();
  };

  return (
    <LinearGradient colors={themeColor as unknown as readonly [string, string, ...string[]]} style={styles.container}>
      {/* Header atualizado com botão de menu */}
      <View style={styles.header}>
        <View style={styles.topRow}>
            <TouchableOpacity onPress={onOpenMenu} style={styles.menuBtn}>
                <Ionicons name="menu" size={30} color="white" />
            </TouchableOpacity>
            <View style={{flex: 1}} />
            <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)}>
              <Ionicons 
                name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={item.completed ? themeColor[0] : "#555"} 
              />
            </TouchableOpacity>
            <Text style={[styles.taskText, item.completed && styles.completedText]}>
              {item.title}
            </Text>
            {item.isImportant && <Ionicons name="star" size={20} color="#FF5252" />}
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <Ionicons name="add" size={24} color={themeColor[0]} />
          <TextInput 
            style={styles.input} 
            placeholder="Adicionar tarefa" 
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={addTask}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  menuBtn: { marginRight: 15 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 5, textTransform: 'capitalize' },
  card: { backgroundColor: 'white', padding: 15, marginHorizontal: 15, marginBottom: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  taskText: { flex: 1, marginLeft: 10, fontSize: 16 },
  completedText: { textDecorationLine: 'line-through', color: '#888' },
  inputContainer: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 15, margin: 15, borderRadius: 8 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 }
});