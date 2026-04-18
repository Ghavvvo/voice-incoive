import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
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

  const renderItem = ({ item }: { item: Transaccion }) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemCategoria}>{item.categoria}</Text>
        <Text style={styles.itemDescripcion}>{item.descripcion}</Text>
        <Text style={styles.itemFecha}>{formatFecha(item.fecha)}</Text>
      </View>
      <Text style={[styles.itemImporte, { color: item.tipo === 'gasto' ? '#e74c3c' : '#2ecc71' }]}>
        {item.tipo === 'gasto' ? '-' : '+'}${item.importe.toFixed(2)}
      </Text>
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
          <View style={styles.menu}>
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
  itemImporte: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 40,
  },
});