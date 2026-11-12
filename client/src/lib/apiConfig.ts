/**
 * Helper centralizado para obtener la URL base de la API.
 * Prioridad:
 * 1. process.env.NEXT_PUBLIC_API_URL (e.g. 'https://aninexo.onrender.com/api')
 * 2. Si se ejecuta en producción (fuera de localhost), fallback a la API de Render
 * 3. En desarrollo local, fallback a 'http://localhost:3001/api'
 */
export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local');

    if (!isLocalhost) {
      // Producción: nunca llamar a localhost para evitar el aviso de permisos de red local
      return 'https://aninexo.onrender.com/api';
    }
  }

  return 'http://localhost:3001/api';
};

/**
 * Helper centralizado para obtener la URL base del servidor Socket.IO.
 * Prioridad:
 * 1. process.env.NEXT_PUBLIC_SOCKET_URL (e.g. 'https://aninexo.onrender.com')
 * 2. Derivado de process.env.NEXT_PUBLIC_API_URL sin el segmento /api
 * 3. Si se ejecuta en producción (fuera de localhost), fallback a Render
 * 4. En desarrollo local, fallback a 'http://localhost:3001'
 */
export const getSocketUrl = (): string => {
  const socketEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketEnv && socketEnv.trim()) {
    return socketEnv.trim().replace(/\/+$/, '');
  }

  const apiEnv = process.env.NEXT_PUBLIC_API_URL;
  if (apiEnv && apiEnv.trim()) {
    return apiEnv.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local');

    if (!isLocalhost) {
      return 'https://aninexo.onrender.com';
    }
  }

  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();
