'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/notifications/preferences', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setPreferences(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching preferences', error);
    }
  };

  const togglePreference = async (type: string, channel: 'email' | 'push' | 'inApp', currentVal: boolean) => {
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          [channel]: !currentVal
        })
      });
      if (res.ok) fetchPreferences();
    } catch (error) {
      console.error('Error updating preference', error);
    }
  };

  const subscribePush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BIm_lfKczXUqbzHq3wH3GgquLcSwQuNmShx0Fk7FQDm6GZwtXPxz1plohkVTEisOFRVJWqOGWXMgiDcTxuZHtbE'
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
      
      alert('¡Suscrito con éxito!');
    } catch (error) {
      console.error('Error subscribing to push', error);
      alert('Error al suscribirse a notificaciones push.');
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Cargando preferencias...</div>;

  const types = ['FOLLOW', 'LIKE', 'SYSTEM', 'NEXO', 'MESSAGE'];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: 'white', marginBottom: '2rem' }}>Configuración de Notificaciones</h1>
      
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Notificaciones Push</h3>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Recibe alertas directamente en tu navegador incluso si AniNexo está cerrado.</p>
          </div>
          <Button variant="primary" onClick={subscribePush}>Activar Push</Button>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {types.map(type => {
          const pref = preferences.find(p => p.type === type) || { emailEnabled: true, pushEnabled: true, inAppEnabled: true };
          return (
            <Card key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>{type}</h4>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <Toggle label="Email" active={pref.emailEnabled} onChange={() => togglePreference(type, 'email', pref.emailEnabled)} />
                  <Toggle label="Push" active={pref.pushEnabled} onChange={() => togglePreference(type, 'push', pref.pushEnabled)} />
                  <Toggle label="App" active={pref.inAppEnabled} onChange={() => togglePreference(type, 'inApp', pref.inAppEnabled)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, active, onChange }: { label: string, active: boolean, onChange: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
      <span style={{ fontSize: '0.7rem', color: '#555' }}>{label}</span>
      <div 
        onClick={onChange}
        style={{
          width: '40px',
          height: '20px',
          backgroundColor: active ? 'lime' : '#333',
          borderRadius: '10px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: active ? '22px' : '2px',
          transition: 'all 0.3s'
        }} />
      </div>
    </div>
  );
}
