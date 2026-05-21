import { MetadataRoute } from 'next';
import { getPopularAnimes } from '../lib/anilist';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aninexo.com';

  // Rutas estáticas
  const staticRoutes = [
    '',
    '/rankings',
    '/dashboard',
    '/dashboard/community',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Rutas dinámicas de Anime
  let animeRoutes: any[] = [];
  try {
    const popularAnimes = await getPopularAnimes(1, 50);
    animeRoutes = popularAnimes.map((anime: any) => ({
      url: `${baseUrl}/dashboard/anime/${anime.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error generating anime routes for sitemap:', error);
  }

  return [...staticRoutes, ...animeRoutes];
}
