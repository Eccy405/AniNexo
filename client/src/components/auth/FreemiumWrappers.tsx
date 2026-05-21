'use client';

import { useEffect, useState, ReactNode } from 'react';

// Un hook rápido para no crear un context completo solo para esto en este ejemplo
function useIsPremium() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsPremium(user.isPremium === true || user.role === 'PREMIUM' || user.role === 'ADMIN');
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  return { isPremium, loading };
}

export function PremiumOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  const { isPremium, loading } = useIsPremium();
  
  if (loading) return null;
  if (!isPremium) return <>{fallback}</>;
  
  return <>{children}</>;
}

export function FreeOnly({ children }: { children: ReactNode }) {
  const { isPremium, loading } = useIsPremium();
  
  if (loading) return null;
  if (isPremium) return null;
  
  return <>{children}</>;
}
