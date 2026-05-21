'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    
    // Chequear query params para mensajes de éxito (mock o stripe)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setSuccess(true);
      // En modo mock, actualizamos el localstorage
      if (urlParams.get('mock') === 'true' && userStr) {
        const user = JSON.parse(userStr);
        user.isPremium = true;
        user.role = user.role === 'USER' ? 'PREMIUM' : user.role;
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
      }
    }
  }, []);

  const handleUpgrade = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/premium/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        alert(data.message || 'Error al iniciar checkout');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ color: '#00E5FF', marginBottom: '1rem' }}>¡Bienvenido a Premium!</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            Tu suscripción se ha procesado exitosamente. Ahora tienes acceso a Nexo Avanzado y mucho más.
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>Ir al Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Mejora tu Experiencia</h1>
      
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Plan Gratuito */}
        <Card style={{ padding: '2rem', width: '300px', opacity: currentUser?.isPremium ? 0.7 : 1 }}>
          <h3 style={{ marginBottom: '1rem' }}>Plan Gratuito</h3>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>$0<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/mes</span></h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-muted)' }}>
            <li>✓ Feed Social básico</li>
            <li>✓ Listas de Anime (hasta 100)</li>
            <li>✓ Chat privado (1 a 1)</li>
            <li>✗ Nexo IA Sarcástico (Limitado)</li>
          </ul>
          <Button variant="secondary" style={{ width: '100%' }} disabled>
            {currentUser?.isPremium ? 'Plan Anterior' : 'Tu Plan Actual'}
          </Button>
        </Card>

        {/* Plan Premium */}
        <Card style={{ 
          padding: '2rem', 
          width: '320px', 
          border: '2px solid #00E5FF',
          position: 'relative',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#00E5FF',
            color: '#000',
            padding: '2px 10px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            RECOMENDADO
          </div>
          <h3 style={{ marginBottom: '1rem', color: '#00E5FF' }}>AniNexo Premium</h3>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>$4.99<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/mes</span></h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li>✓ <strong>Nexo IA Ilimitado</strong> y profundo</li>
            <li>✓ Listas de Anime infinitas</li>
            <li>✓ Ocultar Publicidad</li>
            <li>✓ Prioridad en nuevas funciones</li>
            <li>✓ Badge Premium en el Perfil</li>
          </ul>
          <Button 
            variant="primary" 
            style={{ width: '100%' }} 
            onClick={handleUpgrade}
            disabled={loading || currentUser?.isPremium}
          >
            {loading ? 'Procesando...' : currentUser?.isPremium ? 'Ya eres Premium' : 'Subir a Premium'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
