'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { StatsChart } from '../../components/admin/StatsChart';
import Link from 'next/link';

type Tab = 'dashboard' | 'users' | 'anime' | 'moderation' | 'finances' | 'system' | 'nexo' | 'telemetry' | 'logs' | 'emails';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [finances, setFinances] = useState<any>(null);
  const [animeCache, setAnimeCache] = useState<any[]>([]);
  const [nexoLogs, setNexoLogs] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      setLoading(true);
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [analyticsRes, reportsRes, usersRes, financesRes, animeRes, nexoRes, telemetryRes, logsRes, emailLogsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/analytics`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/reports`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/users`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/finances`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/anime`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/nexo-logs`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/telemetry`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/logs`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/email-logs`, { headers })
        ]);
        
        const analyticsData = await analyticsRes.json();
        const reportsData = await reportsRes.json();
        const usersData = await usersRes.json();
        const financesData = await financesRes.json();
        const animeData = await animeRes.json();
        const nexoData = await nexoRes.json();
        const telemetryData = await telemetryRes.json();
        const logsData = await logsRes.json();
        const emailLogsData = await emailLogsRes.json();

        if (analyticsData.success) setMetrics(analyticsData.data);
        if (reportsData.success) setReports(reportsData.data);
        if (usersData.success) setUsers(usersData.data);
        if (financesData.success) setFinances(financesData.data);
        if (animeData.success) setAnimeCache(animeData.data);
        if (nexoData.success) setNexoLogs(nexoData.data);
        if (telemetryData.success) setTelemetry(telemetryData.data);
        if (logsData.success) setAuditLogs(logsData.data);
        if (emailLogsData.success) setEmailLogs(emailLogsData.data);

      } catch (error) {
        console.error('Error fetching admin data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleMaintenance = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/maintenance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !maintenance })
      });
      const data = await res.json();
      if (data.success) {
        setMaintenance(!maintenance);
        alert(data.message);
      }
    } catch (e) {
      alert('Error cambiando estado de mantenimiento');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>Cargando Panel Enterprise...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Usuarios</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{metrics?.metrics.userCount}</p>
              </Card>
              <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Ingresos</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'lime' }}>${finances?.totalDonations.toFixed(2)}</p>
              </Card>
              <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Posts</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'var(--color-primary)' }}>{metrics?.metrics.postCount}</p>
              </Card>
              <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Reportes</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'red' }}>{reports.filter(r => r.status === 'PENDING').length}</p>
              </Card>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <Card>
                <h2 style={{ marginTop: 0 }}>Crecimiento de Usuarios (Simulado)</h2>
                <StatsChart 
                  title="Nuevos Usuarios por Día" 
                  dataKey="count" 
                  data={[
                    {date: '2026-05-01', count: 12},
                    {date: '2026-05-02', count: 18},
                    {date: '2026-05-03', count: 15},
                    {date: '2026-05-04', count: 25},
                    {date: '2026-05-05', count: 30},
                    {date: '2026-05-06', count: 22},
                    {date: '2026-05-10', count: 35},
                  ]} 
                />
              </Card>
              <Card>
                <h2 style={{ marginTop: 0 }}>Actividad Reciente</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {metrics?.recentUsers.map((u: any, i: number) => (
                    <div key={i} style={{ fontSize: '0.9rem', borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
                      <strong>@{u.username}</strong> se unió como <span style={{ color: 'gold' }}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        );
      
      case 'users':
        return (
          <Card>
            <h2 style={{ marginTop: 0 }}>Gestión de Usuarios</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '1rem' }}>Usuario</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Rol</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '1rem' }}>{u.username}</td>
                    <td style={{ padding: '1rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>{u.role}</td>
                    <td style={{ padding: '1rem' }}>{u.isPremium ? '💎 Premium' : 'Free'}</td>
                    <td style={{ padding: '1rem' }}>
                      <Button size="sm" variant="ghost" style={{ color: 'orange' }}>Mute</Button>
                      <Button size="sm" variant="ghost" style={{ color: 'red' }}>Ban</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );

      case 'anime':
        return (
          <Card>
            <h2 style={{ marginTop: 0 }}>Base de Datos de Anime (Caché)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {animeCache.map((a, i) => {
                const data = JSON.parse(a.data);
                return (
                  <div key={i} style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                    <img src={data.coverImage.medium} alt={data.title.romaji} style={{ width: '100%', borderRadius: '4px' }} />
                    <h4 style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{data.title.romaji}</h4>
                    <Button size="sm" style={{ width: '100%' }}>Editar Ficha</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        );

      case 'moderation':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Card>
              <h2 style={{ marginTop: 0 }}>Centro de Reportes Pro</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.map((r, i) => (
                  <div key={i} style={{ padding: '1.5rem', backgroundColor: '#1a1a1a', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>Reporte contra @{r.reportedUser.username}</h4>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: r.status === 'PENDING' ? 'rgba(255,165,0,0.1)' : 'rgba(0,255,0,0.1)', color: r.status === 'PENDING' ? 'orange' : 'lime' }}>{r.status}</span>
                      </div>
                      <p style={{ color: '#888', margin: '0.5rem 0' }}>Motivo: {r.reason}</p>
                      <small style={{ color: '#555' }}>Por: @{r.reporter.username} - {new Date(r.createdAt).toLocaleString()}</small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="ghost" style={{ border: '1px solid #444' }}>Investigar</Button>
                      <Button variant="ghost" style={{ border: '1px solid red', color: 'red' }}>Sancionar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Investigación de Usuario</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Input placeholder="Buscar @username para ver historial de sanciones..." style={{ flex: 1 }} />
                <Button variant="primary">Ver Auditoría</Button>
              </div>
            </Card>
          </div>
        );

      case 'logs':
        return (
          <Card>
            <h2 style={{ marginTop: 0 }}>Logs de Auditoría</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '1rem' }}>Moderador</th>
                  <th style={{ padding: '1rem' }}>Acción</th>
                  <th style={{ padding: '1rem' }}>Objetivo</th>
                  <th style={{ padding: '1rem' }}>Razón</th>
                  <th style={{ padding: '1rem' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '1rem' }}>@{log.moderator.username}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: log.action === 'BAN' ? 'red' : (log.action === 'MUTE' ? 'orange' : 'cyan')
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>@{log.targetUser.username}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{log.reason}</td>
                    <td style={{ padding: '1rem', color: '#555' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );

      case 'emails':
        return (
          <Card>
            <h2 style={{ marginTop: 0 }}>Cola de Correos Enterprise</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '1rem' }}>Destinatario</th>
                  <th style={{ padding: '1rem' }}>Asunto</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem' }}>Intentos</th>
                  <th style={{ padding: '1rem' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '1rem' }}>{l.to}</td>
                    <td style={{ padding: '1rem' }}>{l.subject}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.7rem',
                        backgroundColor: l.status === 'SENT' ? 'rgba(0,255,0,0.1)' : l.status === 'FAILED' ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        color: l.status === 'SENT' ? 'lime' : l.status === 'FAILED' ? 'red' : 'white'
                      }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{l.attempts}</td>
                    <td style={{ padding: '1rem' }}>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );

      case 'finances':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <Card>
                <h2 style={{ marginTop: 0 }}>Donaciones Recientes</h2>
                {finances?.donations.map((d: any, i: number) => (
                  <div key={i} style={{ padding: '1rem', borderBottom: '1px solid #222' }}>
                    <strong>{d.user ? `@${d.user.username}` : 'Anónimo'}</strong> donó <span style={{ color: 'lime' }}>${d.amount}</span>
                    <p style={{ margin: '0.5rem 0', color: '#888', fontSize: '0.9rem' }}>"{d.message}"</p>
                  </div>
                ))}
              </Card>
              <Card>
                <h2 style={{ marginTop: 0 }}>Anuncios Activos</h2>
                {finances?.ads.map((ad: any, i: number) => (
                  <div key={i} style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{ad.title}</strong>
                      <span style={{ color: ad.active ? 'lime' : 'red' }}>{ad.active ? 'Activo' : 'Pausado'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.5rem' }}>
                      Clicks: {ad.clicks} | Impresiones: {ad.impressions}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        );

      case 'nexo':
        return (
          <Card>
            <h2 style={{ marginTop: 0 }}>Telemetría Nexo (IA)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px' }}>
                <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>🤖 Sugerencia de Nexo</h4>
                <p style={{ margin: '0.5rem 0' }}>He detectado un aumento del 15% en mensajes negativos en el feed de "Chainsaw Man". Sugiero activar el filtro de moderación estricto para este tema.</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#555' }}>
                    <th style={{ padding: '1rem' }}>Usuario</th>
                    <th style={{ padding: '1rem' }}>Input</th>
                    <th style={{ padding: '1rem' }}>Tokens</th>
                    <th style={{ padding: '1rem' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {nexoLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '1rem' }}>@{log.user.username}</td>
                      <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.input}</td>
                      <td style={{ padding: '1rem' }}>{log.tokensUsed}</td>
                      <td style={{ padding: '1rem' }}>{new Date(log.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );

      case 'telemetry':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <Card style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Tiempo Sesión Promedio</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'var(--color-primary)' }}>{(telemetry?.avgSessionTime / 60).toFixed(1)} min</p>
              </Card>
              <Card style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Total Sesiones</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{telemetry?.totalSessions}</p>
              </Card>
              <Card style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#888' }}>Búsquedas (Hoy)</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'orange' }}>{metrics?.metrics.searchCount || 0}</p>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <Card>
                <h2 style={{ marginTop: 0 }}>Top Búsquedas</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {telemetry?.topSearches.map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
                      <span>{s.query}</span>
                      <span style={{ color: 'var(--color-primary)' }}>{s._count.query} búsquedas</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h2 style={{ marginTop: 0 }}>Performance de Anuncios (CTR)</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {telemetry?.adPerformance.map((ad: any, i: number) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span>{ad.title}</span>
                        <span style={{ color: 'lime' }}>{ad.ctr.toFixed(2)}% CTR</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#222', borderRadius: '4px' }}>
                        <div style={{ width: `${Math.min(ad.ctr * 5, 100)}%`, height: '100%', backgroundColor: 'lime', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <h2 style={{ marginTop: 0 }}>Eventos de Telemetría (Real-time)</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '1rem' }}>Evento</th>
                    <th style={{ padding: '1rem' }}>Usuario</th>
                    <th style={{ padding: '1rem' }}>Detalles</th>
                    <th style={{ padding: '1rem' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry?.recentEvents.map((e: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          backgroundColor: e.type === 'UI_ERROR' ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                          color: e.type === 'UI_ERROR' ? 'red' : 'lime'
                        }}>
                          {e.type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{e.user ? `@${e.user.username}` : 'Guest'}</td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#888' }}>{e.payload}</td>
                      <td style={{ padding: '1rem', color: '#555' }}>{new Date(e.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        );

      case 'system':
        return (
          <Card>
            <h2 style={{ marginTop: 0 }}>Configuraciones de Sistema</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3>Estado Global</h3>
                <Button 
                  style={{ backgroundColor: maintenance ? 'red' : 'green', color: 'white' }}
                  onClick={toggleMaintenance}
                >
                  {maintenance ? 'Desactivar Modo Mantenimiento' : 'Activar Modo Mantenimiento'}
                </Button>
              </div>
              <div>
                <h3>Feature Flags</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                    <span>Registro de Usuarios</span>
                    <Button size="sm">ON</Button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                    <span>IA Nexo (Public)</span>
                    <Button size="sm">ON</Button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                    <span>Pagos Premium</span>
                    <Button size="sm" variant="ghost" style={{ border: '1px solid #333' }}>OFF</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#050505', color: '#eee' }}>
      {/* Sidebar Enterprise */}
      <aside style={{ width: '280px', backgroundColor: '#0a0a0a', borderRight: '1px solid #1a1a1a', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', margin: 0 }}>AniNexo <span style={{ fontSize: '0.8rem', color: '#555' }}>ENTERPRISE</span></h1>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Dashboard" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="👥" label="Usuarios" />
          <TabButton active={activeTab === 'anime'} onClick={() => setActiveTab('anime')} icon="⛩️" label="Anime CRUD" />
          <TabButton active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} icon="⚖️" label="Moderación" />
          <TabButton active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon="💰" label="Finanzas" />
          <TabButton active={activeTab === 'nexo'} onClick={() => setActiveTab('nexo')} icon="🤖" label="IA Nexo" />
          <TabButton active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')} icon="📡" label="Telemetría Pro" />
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon="📋" label="Auditoría" />
          <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} icon="📧" label="Correos" />
          <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon="⚙️" label="Sistema" />
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #1a1a1a' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⬅</span> Salir al Portal
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{activeTab === 'dashboard' ? 'Resumen Ejecutivo' : activeTab}</h2>
            <p style={{ color: '#555', margin: '0.5rem 0 0 0' }}>Bienvenido de nuevo, Administrador.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <div style={{ backgroundColor: '#111', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #222', fontSize: '0.8rem' }}>
                Status: <span style={{ color: 'lime' }}>Sistemas Online</span>
             </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        width: '100%',
        border: 'none',
        borderRadius: '12px',
        backgroundColor: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
        color: active ? 'var(--color-primary)' : '#888',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      {label}
    </button>
  );
}
