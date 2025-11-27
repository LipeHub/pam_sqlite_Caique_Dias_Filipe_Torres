import React, { useState, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Animated, 
  Dimensions, Platform, SafeAreaView, Alert 
} from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { initDB } from './src/database/db-service';
import TaskListScreen from './src/screens/TaskListScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

// Componente Interno que tem acesso ao Banco de Dados
const MainLayout = () => {
  const db = useSQLiteContext(); // Hook do banco
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Gatilho para recarregar a lista
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = (open: boolean) => {
    setIsMenuOpen(open);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: open ? 0 : -DRAWER_WIDTH, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: open ? 0.5 : 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  // Função para Apagar Tudo
  const handleDeleteAll = () => {
    Alert.alert(
      "Apagar Tudo",
      "Tem certeza que deseja remover TODAS as tarefas? Isso não pode ser desfeito.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, apagar tudo", 
          style: "destructive", 
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM tasks'); // Limpa a tabela
              setRefreshKey(prev => prev + 1); // Força a lista a recarregar
              toggleMenu(false); // Fecha o menu
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, label, isActive }: { icon: any, label: string, isActive?: boolean }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isActive && styles.activeItem]} 
      onPress={() => toggleMenu(false)}
    >
      <Ionicons name={icon} size={24} color={isActive ? "#0078D7" : "#555"} />
      <Text style={[styles.menuText, isActive && styles.activeMenuText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      
      {/* TELA DA LISTA */}
      <View style={{ flex: 1 }}>
          {/* Passamos o refreshKey. Se ele mudar, a lista recarrega. */}
          <TaskListScreen 
              refreshTrigger={refreshKey}
              onOpenMenu={() => toggleMenu(true)}
          />
      </View>

      {/* OVERLAY ESCURO */}
      {isMenuOpen && (
        <TouchableOpacity style={styles.overlayContainer} activeOpacity={1} onPress={() => toggleMenu(false)}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableOpacity>
      )}

      {/* MENU LATERAL */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
          
          <View style={{ padding: 20 }}>
              {/* FRASE ADICIONADA AQUI */}
              <Text style={styles.copyrightText}>
                ©2025 à 2025 - Caique Dias e Filipe Torres
              </Text>

              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>Menu</Text>
          </View>

          {/* Único Item de Menu agora */}
          <MenuItem icon="sunny-outline" label="Meu Dia" isActive={true} />

          {/* Botão de Apagar Tudo no Rodapé */}
          <View style={{ flex: 1 }} /> 
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.deleteAllBtn} onPress={handleDeleteAll}>
             <Ionicons name="trash-bin-outline" size={24} color="#FF5252" />
             <Text style={styles.deleteText}>Apagar todas as tarefas</Text>
          </TouchableOpacity>

        </SafeAreaView>
      </Animated.View>

    </View>
  );
};

// App Principal
export default function App() {
  return (
    <SQLiteProvider databaseName="mstodo_simple_v1.db" onInit={initDB}>
      <StatusBar style="dark" backgroundColor="white" />
      <MainLayout />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  overlay: { flex: 1, backgroundColor: 'black' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH, zIndex: 2, backgroundColor: 'white',
    shadowColor: "#000", shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 20
  },
  
  // Estilo novo para a frase de copyright
  copyrightText: {
    fontSize: 10,
    color: '#888',
    marginBottom: 5, // Espaço entre a frase e a palavra "Menu"
  },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 10, borderRadius: 5 },
  activeItem: { backgroundColor: '#eef7ff' },
  menuText: { marginLeft: 15, fontSize: 16, color: '#000' },
  activeMenuText: { color: '#0078D7', fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  deleteAllBtn: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, 
    marginBottom: 20
  },
  deleteText: { marginLeft: 15, color: '#FF5252', fontWeight: 'bold' }
});