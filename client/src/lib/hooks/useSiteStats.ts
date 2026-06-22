import { useState, useEffect } from 'react';

export interface SiteStats {
  users: number;
  animes: number;
  upcoming: Array<{ feature: string; eta: string }>;
}

export const useSiteStats = () => {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch users count
        const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/stats/users`);
        const usersData = await usersRes.json();
        // Fetch animes count
        const animesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/stats/animes`);
        const animesData = await animesRes.json();
        // Fetch roadmap (optional)
        let upcoming: Array<{ feature: string; eta: string }> = [];
        try {
          const roadmapRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/roadmap`);
          if (roadmapRes.ok) {
            const roadmapData = await roadmapRes.json();
            upcoming = roadmapData.upcoming || [];
          }
        } catch (e) {
          // ignore roadmap errors
        }

        setStats({
          users: usersData.count ?? 0,
          animes: animesData.count ?? 0,
          upcoming,
        });
      } catch (err) {
        console.error('Failed to fetch site stats:', err);
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Revalidate every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
};