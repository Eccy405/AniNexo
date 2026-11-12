'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';

type PremiumStatusType = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

const getApiBase = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://aninexo.onrender.com/api'
    : 'http://localhost:3001/api');

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatusType>('NONE');
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [requestedAt, setRequestedAt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadPremiumStatus = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
        if (parsed.isPremium) {
          setPremiumStatus('APPROVED');
        } else if (parsed.premiumStatus) {
          setPremiumStatus(parsed.premiumStatus);
        }
      }

      if (!token) {
        setFetchingStatus(false);
        return;
      }

      const res = await fetch(`${getApiBase()}/premium/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          const resolvedStatus: PremiumStatusType = d.isPremium
            ? 'APPROVED'
            : (d.premiumStatus || 'NONE');
          setPremiumStatus(resolvedStatus);
          setPremiumUntil(d.premiumUntil || null);
          setSavedNote(d.premiumRequestNote || null);
          setRequestedAt(d.premiumRequestedAt || null);

          if (userStr) {
            const parsed = JSON.parse(userStr);
            const updatedUser = {
              ...parsed,
              isPremium: Boolean(d.isPremium),
              role: d.role || parsed.role,
              premiumStatus: resolvedStatus,
              premiumUntil: d.premiumUntil || null,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
          }
        }
      }
    } catch (err) {
      console.error('Error cargando estado Premium:', err);
    } finally {
      setFetchingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadPremiumStatus();
  }, [loadPremiumStatus]);

  const handleRequestPremium = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      setFeedback({ type: 'err', text: 'Debes iniciar sesión para solicitar AniNexo Premium.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${getApiBase()}/premium/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: requestNote.trim() || undefined }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPremiumStatus('PENDING');
        setSavedNote(requestNote.trim() || null);
        setRequestedAt(data.data?.premiumRequestedAt || new Date().toISOString());
        setRequestNote('');
        setFeedback({
          type: 'ok',
          text: data.message || 'Solicitud enviada correctamente. Un administrador la revisará pronto.',
        });

        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({ ...parsed, premiumStatus: 'PENDING' }));
        }
      } else {
        setFeedback({
          type: 'err',
          text: data.message || 'No se pudo enviar la solicitud.',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'err', text: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const isActivePremium = Boolean(currentUser?.isPremium) || premiumStatus === 'APPROVED';
  const isPending = !isActivePremium && premiumStatus === 'PENDING';
  const isRejected = !isActivePremium && premiumStatus === 'REJECTED';

  return (
    <div style={{ padding: '2.5rem 2rem 5rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem', fontSize: '2.2rem', fontWeight: 900 }}>
          Mejora tu Experiencia
        </h1>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '620px', margin: '0 auto' }}>
          La activación de AniNexo Premium requiere verificación manual por un Administrador para garantizar seguridad y control de cuentas.
        </p>
      </div>

      {/* Banner de estado actual */}
      {!fetchingStatus && currentUser && (
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          {isActivePremium ? (
            <div style={{
              padding: '12px 22px',
              borderRadius: '14px',
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              color: '#00E5FF',
              fontWeight: 800,
              textAlign: 'center'
            }}>
              ✨ Membresía Premium Activa
              {premiumUntil && (
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginTop: '4px' }}>
                  Vigente hasta {new Date(premiumUntil).toLocaleDateString('es-ES')}
                </span>
              )}
            </div>
          ) : isPending ? (
            <div style={{
              padding: '14px 22px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              fontWeight: 700,
              textAlign: 'center',
              maxWidth: '580px'
            }}>
              ⏳ Solicitud en revisión por un Administrador
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 400, color: '#e5e7eb', marginTop: '4px' }}>
                Recibirás una notificación en tiempo real en cuanto tu membresía sea aprobada.
                {savedNote ? ` Nota enviada: "${savedNote}"` : ''}
                {requestedAt ? ` (${new Date(requestedAt).toLocaleDateString('es-ES')})` : ''}
              </span>
            </div>
          ) : isRejected ? (
            <div style={{
              padding: '14px 22px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontWeight: 700,
              textAlign: 'center',
              maxWidth: '580px'
            }}>
              Tu solicitud anterior no fue aprobada. Puedes corregir o agregar un comprobante y volver a enviarla.
            </div>
          ) : null}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* Plan Gratuito */}
        <Card style={{ padding: '2rem', width: '320px', opacity: isActivePremium ? 0.7 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Plan Gratuito</h3>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>$0<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/mes</span></h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-muted)' }}>
              <li>✓ Feed Social básico</li>
              <li>✓ Listas de Anime (hasta 100)</li>
              <li>✓ Chat privado (1 a 1)</li>
              <li>✗ Nexo IA Sarcástico (Limitado)</li>
            </ul>
          </div>
          <Button variant="secondary" style={{ width: '100%' }} disabled>
            {isActivePremium ? 'Plan Anterior' : 'Tu Plan Actual'}
          </Button>
        </Card>

        {/* Plan Premium */}
        <Card style={{
          padding: '2rem',
          width: '360px',
          border: '2px solid #00E5FF',
          position: 'relative',
          boxShadow: '0 0 24px rgba(0, 229, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#00E5FF',
            color: '#000',
            padding: '2px 12px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            VERIFICACIÓN ADMIN
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', color: '#00E5FF' }}>AniNexo Premium</h3>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>$4.99<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/mes</span></h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li>✓ <strong>Nexo IA Ilimitado</strong> y profundo</li>
              <li>✓ Listas de Anime infinitas</li>
              <li>✓ Ocultar Publicidad</li>
              <li>✓ Prioridad en nuevas funciones</li>
              <li>✓ Badge Premium en el Perfil</li>
            </ul>
          </div>

          {!currentUser ? (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" style={{ width: '100%' }}>
                Inicia sesión para solicitar Premium
              </Button>
            </Link>
          ) : (
            <form onSubmit={handleRequestPremium} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {!isActivePremium && !isPending && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    Nota o comprobante para el Administrador (opcional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Ej: Referencia de pago, usuario de Discord o motivo..."
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%' }}
                disabled={loading || fetchingStatus || isActivePremium || isPending}
              >
                {fetchingStatus
                  ? 'Verificando estado...'
                  : loading
                  ? 'Enviando solicitud...'
                  : isActivePremium
                  ? '✨ Membresía Premium Activa'
                  : isPending
                  ? '⏳ Solicitud en revisión'
                  : 'Solicitar activación Premium (Verificación por Admin)'}
              </Button>

              {feedback && (
                <p style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  textAlign: 'center',
                  color: feedback.type === 'ok' ? '#34d399' : '#f87171',
                  fontWeight: 600
                }}>
                  {feedback.text}
                </p>
              )}
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
