import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useAudioRecorder,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';
import { api } from '../../src/api/client';
import { TransaccionAudioResponse, Transaccion } from '../../src/types';

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState({ total_gastos: 0, total_ingresos: 0, balance: 0 });
  const [lastTransaccion, setLastTransaccion] = useState<Transaccion | null>(null);
  const [lastTexto, setLastTexto] = useState<string>('');

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

      const result: TransaccionAudioResponse = await api.procesarAudio(uri);
      setLastTransaccion(result.transaccion);
      setLastTexto(result.texto);
      await loadBalance();

      Alert.alert(
        `${result.transaccion.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} registrado`,
        `$${result.transaccion.importe} - ${result.transaccion.categoria}\n\n"${result.texto}"`
      );
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
});