import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { api } from '../../src/api/client';
import { Reporte } from '../../src/types';

const screenWidth = Dimensions.get('window').width;

const COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#34495e',
  '#e67e22',
  '#2c3e50',
  '#7f8c8d',
];

export default function ReportesScreen() {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadReportes();
    }, [])
  );

  async function loadReportes() {
    setLoading(true);
    try {
      const data = await api.getReportes();
      setReporte(data);
    } catch (error) {
      console.error('Error loading reportes:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!reporte) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reportes</Text>
        <Text style={styles.loading}>Cargando...</Text>
      </View>
    );
  }

  const chartDataGastos = Object.entries(reporte.por_categoria)
    .filter(([, valor]) => valor > 0)
    .map(([nombre, valor], index) => ({
      name: nombre,
      population: valor,
      color: COLORS[index % COLORS.length],
      legendFontColor: '#7f8c8d',
      legendFontSize: 12,
    }));

  const barData = {
    labels: Object.keys(reporte.por_categoria).slice(0, 6),
    datasets: [
      {
        data: Object.values(reporte.por_categoria)
          .map((v) => v)
          .slice(0, 6),
      },
    ],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reportes</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Gastos</Text>
          <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>
            ${reporte.total_gastos.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Ingresos</Text>
          <Text style={[styles.summaryValue, { color: '#2ecc71' }]}>
            ${reporte.total_ingresos.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: reporte.balance >= 0 ? '#2ecc71' : '#e74c3c' },
            ]}
          >
            ${reporte.balance.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transacciones</Text>
          <Text style={[styles.summaryValue, { color: '#3498db' }]}>
            {reporte.cantidad_transacciones}
          </Text>
        </View>
      </View>

      {chartDataGastos.length > 0 && (
        <>
          <Text style={styles.chartTitle}>Gastos por Categoría</Text>
          <View style={styles.chartCard}>
            <PieChart
              data={chartDataGastos}
              width={screenWidth - 40}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>

          <Text style={styles.chartTitle}>Distribución de Gastos</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={barData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.6,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        </>
      )}

      {chartDataGastos.length === 0 && (
        <Text style={styles.empty}>No hay datos suficientes para mostrar gráficos</Text>
      )}

      <RefreshControl refreshing={loading} onRefresh={loadReportes} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  loading: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 40,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 40,
  },
});