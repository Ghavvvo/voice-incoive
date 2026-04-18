import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  useAudioRecorder,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';
import { api } from '../../src/api/client';
import { Transaccion, TransaccionPendiente, TransaccionesPendientesResponse } from '../../src/types';

const CATEGORIAS = ['ropa', 'comida', 'transporte', 'alimentacion', 'entretenimiento', 'salud', 'servicios', 'vivienda', 'educacion', 'otros', 'salary', 'negocio', 'transferencia', 'regalo'];

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState({ total_gastos: 0, total_ingresos: 0, balance: 0 });
  const [lastTransaccion, setLastTransaccion] = useState<Transaccion | null>(null);
  const [lastTexto, setLastTexto] = useState<string>('');
  
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [transaccionesPendientes, setTransaccionesPendientes] = useState<TransaccionPendiente[]>([]);
  const [textoAudio, setTextoAudio] = useState('');
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState('gasto');
  const [editCategoria, setEditCategoria] = useState('');
  const [editImporte, setEditImporte] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [showCategoriaMenu, setShowCategoriaMenu] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    try {
      const reportes = await api.getReportes();
      setBalance(reportes);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }

  async function requestPermissions() {
    const current = await getRecordingPermissionsAsync();
    if (current.granted) {
      return true;
    }

    const response = await requestRecordingPermissionsAsync();
    return response.granted;
  }

  async function startRecording() {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permiso requerido', 'Se necesita permiso para grabar audio');
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  }

  async function stopRecording() {
    if (!isRecording || !recorder.isRecording) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      await recorder.stop();
      const uri = recorder.uri;
      setIsRecording(false);

      if (!uri) {
        throw new Error('No se pudo obtener el audio');
      }

      const result: TransaccionesPendientesResponse = await api.audioPreview(uri);
      setTransaccionesPendientes(result.transacciones);
      setTextoAudio(result.texto);
      setPreviewModalVisible(true);

    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert('Error', 'No se pudo procesar el audio. Verifica que el servidor esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  function abrirEditar(index: number) {
    const t = transaccionesPendientes[index];
    setEditandoIndex(index);
    setEditTipo(t.tipo);
    setEditCategoria(t.categoria);
    setEditImporte(t.importe.toString());
    setEditDescripcion(t.descripcion);
  }

  function guardarEdicion() {
    if (editandoIndex === null) return;
    
    const nuevas = [...transaccionesPendientes];
    nuevas[editandoIndex] = {
      tipo: editTipo as 'gasto' | 'ingreso',
      categoria: editCategoria,
      importe: parseFloat(editImporte) || 0,
      descripcion: editDescripcion,
    };
    setTransaccionesPendientes(nuevas);
    setEditandoIndex(null);
    setShowCategoriaMenu(false);
  }

  function eliminarTransaccion(index: number) {
    const nuevas = transaccionesPendientes.filter((_, i) => i !== index);
    setTransaccionesPendientes(nuevas);
  }

  async function guardarTransacciones() {
    if (transaccionesPendientes.length === 0) {
      setPreviewModalVisible(false);
      return;
    }

    try {
      await api.guardarTransacciones(transaccionesPendientes);
      await loadBalance();
      setPreviewModalVisible(false);
      setTransaccionesPendientes([]);
      Alert.alert('Éxito', `Se guardaron ${transaccionesPendientes.length} transacción(es)`);
    } catch (error) {
      console.error('Error guardando:', error);
      Alert.alert('Error', 'No se pudieron guardar las transacciones');
    }
  }

  function cancelarPreview() {
    setPreviewModalVisible(false);
    setTransaccionesPendientes([]);
    setTextoAudio('');
  }

  const renderTransaccion = ({ item, index }: { item: TransaccionPendiente; index: number }) => (
    <View style={styles.transaccionCard}>
      <View style={styles.transaccionHeader}>
        <View style={[styles.tipoBadge, { backgroundColor: item.tipo === 'gasto' ? '#e74c3c' : '#2ecc71' }]}>
          <Text style={styles.tipoBadgeText}>{item.tipo === 'gasto' ? 'GASTO' : 'INGRESO'}</Text>
        </View>
        <View style={styles.transaccionActions}>
          <TouchableOpacity onPress={() => abrirEditar(index)} style={styles.actionButton}>
            <Text style={styles.actionText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => eliminarTransaccion(index)} style={styles.actionButton}>
            <Text style={styles.actionText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.transaccionBody}>
        <Text style={styles.transaccionImporte}>${item.importe.toFixed(2)}</Text>
        <Text style={styles.transaccionCategoria}>{item.categoria}</Text>
        <Text style={styles.transaccionDescripcion}>{item.descripcion}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos Voz</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={[styles.balanceAmount, { color: balance.balance >= 0 ? '#2ecc71' : '#e74c3c' }]}>
          ${balance.balance.toFixed(2)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Ingresos</Text>
            <Text style={styles.balanceItemValue}>+${balance.total_ingresos.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Gastos</Text>
            <Text style={styles.balanceItemValue}>-${balance.total_gastos.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isLoading && styles.recordButtonDisabled,
        ]}
        onPress={toggleRecording}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
        )}
      </TouchableOpacity>

      <Text style={styles.recordLabel}>
        {isLoading ? 'Procesando...' : isRecording ? 'Grabando... Mantén presionado' : 'Toca para grabar'}
      </Text>

      {lastTransaccion && !isLoading && (
        <View style={styles.lastTransaccion}>
          <Text style={styles.lastTransaccionLabel}>Última transacción</Text>
          <Text style={styles.lastTransaccionTexto}>"{lastTexto}"</Text>
          <Text style={[
            styles.lastTransaccionTipo,
            { color: lastTransaccion.tipo === 'gasto' ? '#e74c3c' : '#2ecc71' }
          ]}>
            {lastTransaccion.tipo === 'gasto' ? 'Gasto' : 'Ingreso'}: ${lastTransaccion.importe} ({lastTransaccion.categoria})
          </Text>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={previewModalVisible}
        onRequestClose={cancelarPreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transacciones Detectadas</Text>
            
            <Text style={styles.textoAudioLabel}>Texto reconocido:</Text>
            <Text style={styles.textoAudio}>"{textoAudio}"</Text>

            {transaccionesPendientes.length > 0 ? (
              <FlatList
                data={transaccionesPendientes}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderTransaccion}
                style={styles.transaccionesList}
              />
            ) : (
              <Text style={styles.noTransacciones}>No se detectaron transacciones</Text>
            )}

            {editandoIndex !== null && (
              <View style={styles.editForm}>
                <Text style={styles.editFormTitle}>Editar Transacción</Text>
                
                <Text style={styles.inputLabel}>Tipo</Text>
                <View style={styles.tipoSelector}>
                  <TouchableOpacity
                    style={[styles.tipoOption, editTipo === 'gasto' && styles.tipoOptionActive]}
                    onPress={() => setEditTipo('gasto')}
                  >
                    <Text style={[styles.tipoOptionText, editTipo === 'gasto' && styles.tipoOptionTextActive]}>Gasto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tipoOption, editTipo === 'ingreso' && styles.tipoOptionActive]}
                    onPress={() => setEditTipo('ingreso')}
                  >
                    <Text style={[styles.tipoOptionText, editTipo === 'ingreso' && styles.tipoOptionTextActive]}>Ingreso</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Categoría</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowCategoriaMenu(!showCategoriaMenu)}
                >
                  <Text>{editCategoria}</Text>
                </TouchableOpacity>
                {showCategoriaMenu && (
                  <View style={styles.categoriaMenu}>
                    {CATEGORIAS.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.categoriaMenuItem}
                        onPress={() => { setEditCategoria(cat); setShowCategoriaMenu(false); }}
                      >
                        <Text>{cat}</Text>
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

                <TouchableOpacity style={styles.saveEditButton} onPress={guardarEdicion}>
                  <Text style={styles.saveEditButtonText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelarPreview}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={guardarTransacciones}
              >
                <Text style={styles.modalButtonText}>Guardar ({transaccionesPendientes.length})</Text>
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
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  balanceItemValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#e74c3c',
  },
  recordButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
  },
  recordButtonInnerActive: {
    backgroundColor: '#c0392b',
  },
  recordLabel: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  lastTransaccion: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
  },
  lastTransaccionLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  lastTransaccionTexto: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  lastTransaccionTipo: {
    fontSize: 16,
    fontWeight: '600',
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
    width: '95%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  textoAudioLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  textoAudio: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  transaccionesList: {
    maxHeight: 250,
  },
  transaccionCard: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  transaccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tipoBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transaccionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 18,
  },
  transaccionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transaccionImporte: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 12,
  },
  transaccionCategoria: {
    fontSize: 14,
    color: '#7f8c8d',
    textTransform: 'capitalize',
    marginRight: 12,
  },
  transaccionDescripcion: {
    fontSize: 12,
    color: '#95a5a6',
    flex: 1,
  },
  noTransacciones: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: 20,
  },
  editForm: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  editFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  tipoSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tipoOptionActive: {
    backgroundColor: '#3498db',
  },
  tipoOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  tipoOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoriaMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
  },
  categoriaMenuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  saveEditButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveEditButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    backgroundColor: '#2ecc71',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});