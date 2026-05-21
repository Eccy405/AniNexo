'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Guardar sesión
      localStorage.setItem('token', token);
      
      // Enviar al onboarding inteligente para terminar el perfil
      router.push('/dashboard?onboarding=true');
    } else {
      router.push('/login?error=oauth_failed');
    }
  }, [token, router]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#050505',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div className="spinner"></div>
      <h2 style={{ marginTop: '20px', color: '#00E5FF' }}>Sincronizando con AniNexo...</h2>
      <p style={{ color: '#555' }}>Casi listo, estamos preparando tu aventura.</p>

      <style jsx>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 229, 255, 0.1);
          border-top-color: #00E5FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
