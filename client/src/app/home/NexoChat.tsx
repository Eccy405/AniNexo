'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';

interface Message {
  id: number;
  sender: 'user' | 'nexo';
  text: string;
  isError?: boolean;
}

export default function NexoChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'nexo',
      text: '¡Hola! Soy Nexo, tu asistente otaku personal en AniNexo. ¿Qué anime o manga quieres analizar hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const NEXO_THINKING_PHRASES = [
    '✨ Nexo está canalizando energía dimensional...',
    '📜 Consultando los pergaminos del gremio...',
    '⚡ Analizando los archivos akáshicos del anime...',
    '🧠 Sincronizando núcleos de memoria...',
    '🌀 Explorando líneas temporales otakus...',
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % NEXO_THINKING_PHRASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api');

  useEffect(() => {
    const syncUser = async () => {
      const u = localStorage.getItem('user');
      if (u) {
        try {
          const parsed = JSON.parse(u);
          if (parsed?.id) setUserId(parsed.id);
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
        }
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data?.id) {
              setUserId(data.data.id);
              localStorage.setItem('user', JSON.stringify(data.data));
            }
          }
        } catch {
          // ignore silent sync error
        }
      }
    };
    syncUser();
  }, [apiUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const token = localStorage.getItem('token');

    if (!userId && !token) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'nexo',
          text: 'Debes iniciar sesión en tu cuenta para conversar con Nexo AI.',
          isError: true,
        },
      ]);
      return;
    }

    const historyPayload = messages
      .filter((m) => m.id !== 1 && !m.isError)
      .slice(-10)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/nexo/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...(userId ? { userId } : {}),
          message: userMessage,
          history: historyPayload,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429 || data.action === 'UPGRADE_REQUIRED') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'nexo', text: data.message, isError: true },
        ]);
      } else if (res.ok && data.success && data.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'nexo', text: data.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'nexo',
            text: data.message || `Error ${res.status}: No se pudo obtener respuesta de Gemini.`,
            isError: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'nexo',
          text: 'Error de conexión con el servidor de Nexo AI.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header del Chat */}
      <div
        style={{
          padding: '1.5rem 1rem',
          borderBottom: '1px solid var(--color-secondary)',
          background: 'linear-gradient(90deg, #181818, #2a0845)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#00E5FF',
              boxShadow: '0 0 8px #00E5FF',
            }}
          />
          Nexo AI
        </h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
          Asistente Otaku Inteligente
        </p>
      </div>

      {/* Área de Mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              backgroundColor: msg.isError
                ? 'rgba(239, 68, 68, 0.16)'
                : msg.sender === 'user'
                  ? 'var(--color-primary)'
                  : 'var(--color-surface-hover)',
              border: msg.isError ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
              color: msg.isError ? '#fca5a5' : undefined,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              borderBottomRightRadius: msg.sender === 'user' ? '0' : '12px',
              borderBottomLeftRadius: msg.sender === 'nexo' ? '0' : '12px',
              lineHeight: '1.45',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#00E5FF', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'pulse 1.5s infinite' }}>
            <span>{NEXO_THINKING_PHRASES[loadingTextIndex]}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Chat */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--color-secondary)' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              placeholder="Pregúntame algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              label=""
            />
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <Button variant="primary" size="md" disabled={loading}>
              →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
