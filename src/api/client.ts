const API_URL = 'http://192.168.1.113:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getTransacciones: (params?: {
    tipo?: string;
    categoria?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    const query = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
          .join('&')
      : '';
    return fetchAPI<any[]>(`/transacciones${query}`);
  },

  getReportes: (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    const query = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
          .join('&')
      : '';
    return fetchAPI<any>(`/reportes${query}`);
  },

  getCategorias: () => fetchAPI<any[]>('/categorias'),

  procesarAudio: async (audioUri: string) => {
    const response = await fetch(`${API_URL}/audio/procesar`, {
      method: 'POST',
      body: await createAudioFormData(audioUri),
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  audioPreview: async (audioUri: string) => {
    const response = await fetch(`${API_URL}/audio/preview`, {
      method: 'POST',
      body: await createAudioFormData(audioUri),
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  guardarTransacciones: async (transacciones: any[]) => {
    const response = await fetch(`${API_URL}/transacciones/guardar`, {
      method: 'POST',
      body: JSON.stringify(transacciones),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  actualizarTransaccion: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/transacciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  eliminarTransaccion: async (id: number) => {
    const response = await fetch(`${API_URL}/transacciones/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
};

async function createAudioFormData(uri: string): Promise<FormData> {
  const formData = new FormData();

  const response = await fetch(uri);
  const blob = await response.blob();

  formData.append('audio', {
    uri,
    name: 'audio.m4a',
    type: blob.type || 'audio/m4a',
  } as any);

  return formData;
}