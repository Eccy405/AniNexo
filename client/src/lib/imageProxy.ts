const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api');

/**
 * Envuelve URLs de CDNs que bloquean hotlinking en navegador (ej. MangaDex)
 * usando el proxy de imágenes del backend.
 */
export function proxyImageUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https:\/\/(uploads\.mangadex\.org|[a-z0-9-]+\.mangadex\.network)\//i.test(url)) {
    return `${API_BASE}/proxy/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
