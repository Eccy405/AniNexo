'use client';

import { useState } from 'react';
import { Button } from "../ui/Button/Button";
import { Card } from "../ui/Card/Card";
import { Input } from "../ui/Input/Input";

interface AuthFormProps {
  initialMode?: 'login' | 'register';
}

export default function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { email, username, password };

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error en la autenticación');
      }

      setMessage({ text: isLogin ? '¡Sesión iniciada con éxito!' : '¡Cuenta creada! Ya puedes entrar.', type: 'success' });
      
      if (!isLogin) {
        setIsLogin(true);
        setUsername('');
      } else {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        {isLogin ? 'Ingresa a tu cuenta para explorar el feed y hablar con Nexo.' : 'Únete a la comunidad de AniNexo y disfruta de la mejor experiencia.'}
      </p>

      {message.text && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem', 
          borderRadius: '4px',
          backgroundColor: message.type === 'error' ? 'rgba(229, 9, 20, 0.1)' : 'rgba(76, 175, 80, 0.1)',
          color: message.type === 'error' ? 'var(--color-primary)' : '#4CAF50',
          border: `1px solid ${message.type === 'error' ? 'var(--color-primary)' : '#4CAF50'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input 
          label="Correo Electrónico" 
          type="email" 
          placeholder="ejemplo@correo.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        {!isLogin && (
          <Input 
            label="Nombre de Usuario" 
            type="text" 
            placeholder="OtakuPro99" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        <Input 
          label="Contraseña" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div style={{ marginTop: '1rem' }}>
          <Button variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </Button>
        </div>
        
        <div style={{ marginTop: '0.5rem' }}>
          <Button 
            type="button" 
            variant="ghost" 
            size="md" 
            fullWidth 
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ text: '', type: '' });
            }}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </Button>
        </div>

        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>
          <Button 
            type="button" 
            variant="secondary" 
            size="md" 
            fullWidth 
            onClick={() => {
              localStorage.setItem('user', JSON.stringify({ username: 'Invitado', role: 'USER', isGuest: true }));
              localStorage.removeItem('token'); // Sin token para invitados
              window.location.href = '/dashboard';
            }}
          >
            🚀 Entrar como Invitado (Free)
          </Button>
        </div>
      </form>
    </Card>
  );
}
