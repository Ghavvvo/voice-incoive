export interface Categoria {
  nombre: string;
}

export interface Transaccion {
  id: number;
  tipo: 'gasto' | 'ingreso';
  categoria: string;
  importe: number;
  descripcion?: string;
  fecha: string;
}

export interface TransaccionAudioResponse {
  transaccion: Transaccion;
  texto: string;
}

export interface Reporte {
  total_gastos: number;
  total_ingresos: number;
  balance: number;
  por_categoria: Record<string, number>;
  cantidad_transacciones: number;
}