import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api/client';
import { Transaccion } from '../../src/types';

const TIPOS = ['todos', 'gasto', 'ingreso'];
const CATEGORIAS = ['todos', 'ropa', 'comida', 'transporte', 'alimentacion', 'entretenimiento', 'salud', 'servicios', 'vivienda', 'educacion', 'otros', 'salary', 'negocio', 'transferencia', 'regalo'];

export default function HistorialScreen() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [showTipoMenu, setShowTipoMenu] = useState(false);
  const [showCategoriaMenu, setShowCategoriaMenu] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState<Transaccion | null>(null);
  const [editTipo, setEditTipo] = useState('gasto');
  const [editCategoria, setEditCategoria] = useState('');
  const [editImporte, setEditImporte] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [showEditTipoMenu, setShowEditTipoMenu] = useState(false);
  const [showEditCategoriaMenu, setShowEditCategoriaMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTransacciones();
    }, [])
  );

  useEffect(() => {
    loadTransacciones();
  }, [filtroTipo, filtroCategoria]);

  async function loadTransacciones() {
    setLoading(true);
    try {
      const params: any = {};
      if (filtroTipo !== 'todos') params.tipo = filtroTipo;
      if (filtroCategoria !== 'todos') params.categoria = filtroCategoria;
      
      const data = await api.getTransacciones(params);
      setTransacciones(data);
    } catch (error) {
      console.error('Error loading transacciones:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatFecha(fecha: string) {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function abrirEditar(transaccion: Transaccion) {
    setTransaccionEditando(transaccion);
    setEditTipo(transaccion.tipo);
    setEditCategoria(transaccion.categoria);
    setEditImporte(transaccion.importe.toString());
    setEditDescripcion(transaccion.descripcion || '');
    setModalVisible(true);
  }

  async function guardarEdicion() {
    if (!transaccionEditando) return;
    
    try {
      await api.actualizarTransaccion(transaccionEditando.id, {
        tipo: editTipo,
        categoria: editCategoria,
        importe: parseFloat(editImporte),
        descripcion: editDescripcion,
      });
      setModalVisible(false);
      loadTransacciones();
      Alert.alert('Éxito', 'Transacción actualizada');
    } catch (error) {
      console.error('Error actualizando:', error);
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    }
  }

  function confirmarEliminar(transaccion: Transaccion) {
    Alert.alert(
      'Eliminar Transacción',
      '¿Estás seguro de que quieres eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarTransaccion(transaccion.id) },
      ]
    );
  }

  async function eliminarTransaccion(id: number) {
    try {
      await api.eliminarTransaccion(id);
      loadTransacciones();
      Alert.alert('Éxito', 'Transacción eliminada');
    } catch (error) {
      console.error('Error eliminando:', error);
      Alert.alert('Error', 'No se pudo eliminar la transacción');
    }
  }

  const renderItem = ({ item }: { item: Transaccion }) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemCategoria}>{item.categoria}</Text>
        <Text style={styles.itemDescripcion}>{item.descripcion}</Text>
        <Text style={styles.itemFecha}>{formatFecha(item.fecha)}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemImporte, { color: item.tipo === 'gasto' ? '#e74c3c' : '#2ecc71' }]}>
          {item.tipo === 'gasto' ? '-' : '+'}${item.importe.toFixed(2)}
        </Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => abrirEditar(item)} style={styles.actionButton}>
            <Text style={styles.actionText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmarEliminar(item)} style={styles.actionButton}>
            <Text style={styles.actionText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial</Text>

      <View style={styles.filtros}>
        <TouchableOpacity
          style={styles.filtroButton}
          onPress={() => setShowTipoMenu(!showTipoMenu)}
        >
          <Text style={styles.filtroButtonText}>
            Tipo: {filtroTipo === 'todos' ? 'Todos' : filtroTipo}
          </Text>
        </TouchableOpacity>

        {showTipoMenu && (
          <View style={styles.menu}>
            {TIPOS.map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={styles.menuItem}
                onPress={() => {
                  setFiltroTipo(tipo);
                  setShowTipoMenu(false);
                }}
              >
                <Text style={styles.menuItemText}>
                  {tipo === 'todos' ? 'Todos' : tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.filtroButton}
          onPress={() => setShowCategoriaMenu(!showCategoriaMenu)}
        >
          <Text style={styles.filtroButtonText}>
            Categoría: {filtroCategoria === 'todos' ? 'Todas' : filtroCategoria}
          </Text>
        </TouchableOpacity>

        {showCategoriaMenu && (
          <View style={[styles.menu, { left: 140 }]}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.menuItem}
                onPress={() => {
                  setFiltroCategoria(cat);
                  setShowCategoriaMenu(false);
                }}
              >
                <Text style={styles.menuItemText}>
                  {cat === 'todos' ? 'Todas' : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={transacciones}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransacciones} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hay transacciones</Text>
        }
        contentContainerStyle={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Transacción</Text>
            
            <Text style={styles.inputLabel}>Tipo</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowEditTipoMenu(!showEditTipoMenu)}
            >
              <Text>{editTipo === 'gasto' ? 'Gasto' : 'Ingreso'}</Text>
            </TouchableOpacity>
            {showEditTipoMenu && (
              <View style={styles.menu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => { setEditTipo('gasto'); setShowEditTipoMenu(false); }}
                >
                  <Text style={styles.menuItemText}>Gasto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => { setEditTipo('ingreso'); setShowEditTipoMenu(false); }}
                >
                  <Text style={styles.menuItemText}>Ingreso</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.inputLabel}>Categoría</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowEditCategoriaMenu(!showEditCategoriaMenu)}
            >
              <Text>{editCategoria}</Text>
            </TouchableOpacity>
            {showEditCategoriaMenu && (
              <View style={styles.menu}>
                {CATEGORIAS.filter(c => c !== 'todos').map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.menuItem}
                    onPress={() => { setEditCategoria(cat); setShowEditCategoriaMenu(false); }}
                  >
                    <Text style={styles.menuItemText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.inputLabel}>Importe</Text>
            <TextInput
              style={styles.input}
              value={editImporte}
              onChangeText={setEditImporte}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={guardarEdicion}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 20,
    marginBottom: 20,
  },
  filtros: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
    position: 'relative',
  },
  filtroButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filtroButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  menu: {
    position: 'absolute',
    top: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
    maxHeight: 200,
    overflow: 'scroll',
    left: 0,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  list: {
    paddingHorizontal: 20,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
  },
  itemCategoria: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  itemDescripcion: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  itemFecha: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemImporte: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 18,
  },
  empty: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    position: 'relative',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});