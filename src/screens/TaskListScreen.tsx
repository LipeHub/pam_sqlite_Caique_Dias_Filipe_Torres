import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface Props {
  onOpenMenu: () => void;
  refreshTrigger: number;
}

export default function TaskListScreen({ onOpenMenu, refreshTrigger }: Props) {
  const db = useSQLiteContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  const loadTasks = async () => {
    try {
      const result = await db.getAllAsync<Task>('SELECT * FROM tasks ORDER BY id DESC');
      setTasks(result);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadTasks(); }, [refreshTrigger]);

  const handleInputSubmit = async () => {
    if (!inputValue.trim()) return;

    if (editingId) {
      await db.runAsync('UPDATE tasks SET title = ? WHERE id = ?', inputValue, editingId);
      setEditingId(null);
    } else {
      await db.runAsync(
        'INSERT INTO tasks (title, isImportant, category) VALUES (?, ?, ?)', 
        inputValue, false, 'MyDay'
      );
    }
    setInputValue('');
    loadTasks();
  };

  const startEditing = (task: Task) => {
    setInputValue(task.title);
    setEditingId(task.id);
  };

  const cancelEditing = () => {
    setInputValue('');
    setEditingId(null);
  }

  const toggleComplete = async (id: number, current: boolean) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', !current, id);
    loadTasks();
  };

  const deleteTask = async (id: number) => {
    Alert.alert("Excluir", "Deseja excluir esta tarefa?", [
        { text: "Não", style: "cancel" },
        { text: "Sim", style: "destructive", onPress: async () => {
            await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
            if (editingId === id) cancelEditing();
            loadTasks();
        }}
    ]);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)}>
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={item.completed ? "#0078D7" : "#666"} 
        />
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1, marginHorizontal: 10 }} onPress={() => startEditing(item)}>
        <Text style={[styles.taskText, item.completed && styles.completedText]}>
          {item.title}
        </Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => startEditing(item)} style={{ marginRight: 15 }}>
            <Ionicons name="pencil-outline" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteTask(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu}>
            <Ionicons name="menu" size={30} color="#0078D7" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.title}>Meu Dia</Text>
            <Text style={styles.date}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
        </View>
      </View>

      <FlatList
        data={activeTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTaskItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListFooterComponent={
            completedTasks.length > 0 ? (
                <View style={{ marginTop: 20 }}>
                    <TouchableOpacity 
                        style={styles.completedHeader} 
                        onPress={() => setShowCompleted(!showCompleted)}
                    >
                        <Ionicons name={showCompleted ? "chevron-down" : "chevron-forward"} size={18} color="#666" />
                        <Text style={styles.completedTitle}>Concluídas ({completedTasks.length})</Text>
                    </TouchableOpacity>
                    
                    {showCompleted && completedTasks.map(t => (
                        <View key={t.id}>{renderTaskItem({ item: t })}</View>
                    ))}
                </View>
            ) : null
        }
      />

      {/* CORREÇÃO: Adicionado keyboardVerticalOffset para levantar o input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={styles.inputContainer}>
          {editingId ? (
              <TouchableOpacity onPress={cancelEditing}>
                <Ionicons name="close" size={24} color="#FF5252" />
              </TouchableOpacity>
          ) : (
              <Ionicons name="add" size={24} color="#0078D7" />
          )}
          
          <TextInput 
            style={styles.input} 
            placeholder={editingId ? "Editando tarefa..." : "Adicionar uma tarefa"} 
            placeholderTextColor="#888"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleInputSubmit}
          />

          {inputValue.length > 0 && (
            <TouchableOpacity onPress={handleInputSubmit}>
              <Ionicons name="arrow-up-circle" size={32} color="#0078D7" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    padding: 20, paddingTop: Platform.OS === 'android' ? 50 : 20, 
    flexDirection: 'row', alignItems: 'center' 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0078D7' },
  date: { fontSize: 14, textTransform: 'capitalize', marginTop: 2, color: '#666' },
  
  card: {
    padding: 15, marginHorizontal: 15, 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  taskText: { fontSize: 16, color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  
  completedHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 10, marginHorizontal: 15, 
    backgroundColor: '#f9f9f9', borderRadius: 5, marginBottom: 5
  },
  completedTitle: { marginLeft: 10, fontWeight: 'bold', color: '#666' },
  
  // CORREÇÃO: MarginBottom maior para desgrudar do fundo (especialmente iOS)
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', 
    padding: 15, 
    marginHorizontal: 15,
    marginBottom: Platform.OS === 'ios' ? 40 : 20, // Levantado do chão
    marginTop: 10,
    backgroundColor: '#f5f5f5', borderRadius: 10,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000' }
});