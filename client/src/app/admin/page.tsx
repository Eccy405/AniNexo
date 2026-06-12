'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [investigationQuery, setInvestigationQuery] = useState('');
  const [investigationResult, setInvestigationResult] = useState<any>(null);
  const [editingAnime, setEditingAnime] = useState<any>(null);
  const [animeSearch, setAnimeSearch] = useState('');
  const [animeSearchLoading, setAnimeSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

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

        const [analyticsRes, statsRes, reportsRes, usersRes, financesRes, animeRes, nexoRes, telemetryRes, logsRes, emailLogsRes, settingsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/analytics`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/reports`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/users`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/finances`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/anime`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/nexo-logs`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/telemetry`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/logs`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/email-logs`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/settings`, { headers })
        ]);
        
        const analyticsData = await analyticsRes.json();
        const statsData = await statsRes.json();
        const reportsData = await reportsRes.json();
        const usersData = await usersRes.json();
        const financesData = await financesRes.json();
        const animeData = await animeRes.json();
        const nexoData = await nexoRes.json();
        const telemetryData = await telemetryRes.json();
        const logsData = await logsRes.json();
        const emailLogsData = await emailLogsRes.json();
        const settingsData = await settingsRes.json();

        if (analyticsData.success) setMetrics(analyticsData.data);
        if (statsData.success) setHistoricalData(statsData.data.historical);
        if (reportsData.success) setReports(reportsData.data);
        if (usersData.success) setUsers(usersData.data);
        if (financesData.success) setFinances(financesData.data);
        if (animeData.success) setAnimeCache(animeData.data);
        if (nexoData.success) setNexoLogs(nexoData.data);
        if (telemetryData.success) setTelemetry(telemetryData.data);
        if (logsData.success) setAuditLogs(logsData.data);
        if (emailLogsData.success) setEmailLogs(emailLogsData.data);
        if (settingsData.success) {
          setSystemSettings(settingsData.data);
          const maint = settingsData.data.find((s: any) => s.key === 'MAINTENANCE_MODE');
          if (maint) setMaintenance(maint.value === 'true');
        }

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
        setSystemSettings(prev => {
          const exists = prev.find(s => s.key === 'MAINTENANCE_MODE');
          if (exists) return prev.map(s => s.key === 'MAINTENANCE_MODE' ? { ...s, value: String(!maintenance) } : s);
          return [...prev, { key: 'MAINTENANCE_MODE', value: String(!maintenance) }];
        });
        alert(data.message);
      }
    } catch (e) {
      alert('Error cambiando estado de mantenimiento');
    }
  };

  const handleToggleFeatureFlag = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/feature-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key, value: newValue })
      });
      const data = await res.json();
      if (data.success) {
        setSystemSettings(prev => {
          const exists = prev.find(s => s.key === key);
          if (exists) return prev.map(s => s.key === key ? { ...s, value: newValue } : s);
          return [...prev, { key, value: newValue }];
        });
      } else {
        alert(data.message || 'Error al actualizar flag');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const handleToggleUserField = async (userId: string, field: 'role' | 'premium') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/users/${userId}/${field}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data.data } : u));
      } else {
        alert(data.message || `Error al actualizar campo ${field}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const handleMuteUser = async (userId: string) => {
    const reason = window.prompt('Razón del mute:');
    if (!reason) return;
    const hoursStr = window.prompt('Duración en horas (por defecto 24):', '24');
    const hours = hoursStr ? parseInt(hoursStr) : 24;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/moderation/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, reason, hours })
      });
      const data = await res.json();
      if (data.success) {
        alert('Usuario silenciado exitosamente.');
      } else {
        alert(data.message || 'Error al aplicar mute.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = window.prompt('Razón del ban:');
    if (!reason) return;
    const daysStr = window.prompt('Duración en días (dejar en blanco para permanente):');
    const days = daysStr ? parseInt(daysStr) : undefined;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/moderation/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, reason, days })
      });
      const data = await res.json();
      if (data.success) {
        alert('Usuario baneado exitosamente.');
      } else {
        alert(data.message || 'Error al aplicar ban.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/moderation/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reportId, status, internalNote: 'Resuelto desde el panel' })
      });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
        alert('Reporte actualizado.');
      } else {
        alert(data.message || 'Error al resolver reporte.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    }
  };

  const handleInvestigate = async () => {
    if (!investigationQuery) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/moderation/investigate/${investigationQuery.replace('@', '')}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setInvestigationResult(data.data);
      } else {
        alert(data.message || 'Usuario no encontrado.');
        setInvestigationResult(null);
      }
    } catch (e) {
      console.error(e);
      alert('Error al investigar usuario.');
    }
  };

  const handleUpdateAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnime) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/anime/${editingAnime.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          titleRomaji: editingAnime.titleRomaji,
          description: editingAnime.description,
          status: editingAnime.status,
          episodes: editingAnime.episodes,
          coverImage: editingAnime.coverImage
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnimeCache(prev => prev.map(a => a.id === editingAnime.id ? data.data : a));
        setEditingAnime(null);
        alert('Anime actualizado exitosamente.');
      } else {
        alert(data.message || 'Error al actualizar anime.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
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
                <h2 style={{ marginTop: 0 }}>Crecimiento de Usuarios</h2>
                <StatsChart 
                  title="Nuevos Usuarios por Día" 
                  dataKey="newUsers" 
                  data={historicalData} 
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
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          style={{ color: 'cyan', border: '1px solid cyan' }}
                          onClick={() => handleToggleUserField(u.id, 'role')}
                        >
                          {u.role === 'ADMIN' ? 'Quitar Admin' : 'Hacer Admin'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          style={{ color: 'gold', border: '1px solid gold' }}
                          onClick={() => handleToggleUserField(u.id, 'premium')}
                        >
                          {u.isPremium ? 'Quitar Premium' : 'Dar Premium'}
                        </Button>
                        <Button size="sm" variant="ghost" style={{ color: 'orange' }} onClick={() => handleMuteUser(u.id)}>Mute</Button>
                        <Button size="sm" variant="ghost" style={{ color: 'red' }} onClick={() => handleBanUser(u.id)}>Ban</Button>
                      </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Base de Datos de Anime</h2>
              <span style={{ color: '#555', fontSize: '0.85rem' }}>{animeCache.length} resultados</span>
            </div>

            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '1rem' }}>🔍</span>
              <Input
                placeholder="Buscar anime por título (Romaji, Inglés o Japonés)..."
                value={animeSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnimeSearch(val);
                  setAnimeSearchLoading(true);
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  const token = localStorage.getItem('token');
                  searchTimeoutRef.current = setTimeout(async () => {
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/anime${val ? `?q=${encodeURIComponent(val)}` : ''}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const data = await res.json();
                      if (data.success) setAnimeCache(data.data);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setAnimeSearchLoading(false);
                    }
                  }, 400);
                }}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
              {animeSearchLoading && (
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', fontSize: '0.8rem' }}>Buscando...</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {animeCache.length === 0 ? (
                <p style={{ color: '#555', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No se encontraron animes{animeSearch ? ` para "${animeSearch}"` : ''}.</p>
              ) : animeCache.map((a, i) => (
                <div key={a.id || i} style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <img src={a.coverImage || 'https://via.placeholder.com/200x300?text=No+Image'} alt={a.titleRomaji || 'Anime'} style={{ width: '100%', borderRadius: '4px', objectFit: 'cover', height: '240px' }} />
                  <h4 style={{ margin: '0.5rem 0', fontSize: '0.85rem', flex: 1, lineHeight: 1.3 }}>{a.titleRomaji || 'Unknown'}</h4>
                  {a.status && <span style={{ fontSize: '0.7rem', color: a.status === 'RELEASING' ? 'lime' : '#888', marginBottom: '0.5rem' }}>{a.status}</span>}
                  <Button size="sm" style={{ width: '100%' }} onClick={() => setEditingAnime(a)}>Editar Ficha</Button>
                </div>
              ))}
            </div>

            {editingAnime && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: '#111', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                  <h3 style={{ marginTop: 0 }}>Editar Anime: {editingAnime.titleRomaji}</h3>
                  <form onSubmit={handleUpdateAnime} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>Título (Romaji)</label>
                      <Input 
                        value={editingAnime.titleRomaji || ''} 
                        onChange={(e) => setEditingAnime({...editingAnime, titleRomaji: e.target.value})} 
                        style={{ width: '100%' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>Descripción</label>
                      <textarea 
                        value={editingAnime.description || ''} 
                        onChange={(e) => setEditingAnime({...editingAnime, description: e.target.value})} 
                        style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent', border: '1px solid #333', color: '#fff', padding: '0.8rem', borderRadius: '8px' }} 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>Estado</label>
                        <Input 
                          value={editingAnime.status || ''} 
                          onChange={(e) => setEditingAnime({...editingAnime, status: e.target.value})} 
                          style={{ width: '100%' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>Episodios</label>
                        <Input 
                          type="number"
                          value={editingAnime.episodes || ''} 
                          onChange={(e) => setEditingAnime({...editingAnime, episodes: e.target.value})} 
                          style={{ width: '100%' }} 
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>URL de Portada</label>
                      <Input 
                        value={editingAnime.coverImage || ''} 
                        onChange={(e) => setEditingAnime({...editingAnime, coverImage: e.target.value})} 
                        style={{ width: '100%' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <Button variant="ghost" type="button" onClick={() => setEditingAnime(null)}>Cancelar</Button>
                      <Button variant="primary" type="submit">Guardar Cambios</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
                      <Button variant="ghost" style={{ border: '1px solid #444' }} onClick={() => handleResolveReport(r.id, 'DISMISSED')}>Ignorar</Button>
                      <Button variant="ghost" style={{ border: '1px solid red', color: 'red' }} onClick={() => handleResolveReport(r.id, 'RESOLVED')}>Sancionar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>Investigación de Usuario</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Input 
                  placeholder="Buscar @username para ver historial de sanciones..." 
                  style={{ flex: 1 }} 
                  value={investigationQuery}
                  onChange={(e) => setInvestigationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvestigate()}
                />
                <Button variant="primary" onClick={handleInvestigate}>Ver Auditoría</Button>
              </div>

              {investigationResult && (
                <div style={{ padding: '1rem', backgroundColor: '#111', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Resultados para @{investigationResult.username}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <h4 style={{ color: 'red' }}>Bans ({investigationResult.bans.length})</h4>
                      <ul style={{ paddingLeft: '1rem', color: '#888', fontSize: '0.9rem' }}>
                        {investigationResult.bans.map((b: any, i: number) => <li key={i}>{b.reason}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: 'orange' }}>Mutes ({investigationResult.mutes.length})</h4>
                      <ul style={{ paddingLeft: '1rem', color: '#888', fontSize: '0.9rem' }}>
                        {investigationResult.mutes.map((m: any, i: number) => <li key={i}>{m.reason}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: 'cyan' }}>Advertencias ({investigationResult.warnings.length})</h4>
                      <ul style={{ paddingLeft: '1rem', color: '#888', fontSize: '0.9rem' }}>
                        {investigationResult.warnings.map((w: any, i: number) => <li key={i}>{w.reason}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: '#ccc' }}>Reportes Recibidos ({investigationResult.reportsReceived.length})</h4>
                      <ul style={{ paddingLeft: '1rem', color: '#888', fontSize: '0.9rem' }}>
                        {investigationResult.reportsReceived.map((r: any, i: number) => <li key={i}>{r.reason} ({r.status})</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
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
                  {systemSettings.filter((s: any) => s.key !== 'MAINTENANCE_MODE').map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                      <span>{s.key}</span>
                      <Button 
                        size="sm" 
                        variant={s.value === 'true' ? 'primary' : 'ghost'} 
                        style={s.value !== 'true' ? { border: '1px solid #333' } : undefined}
                        onClick={() => handleToggleFeatureFlag(s.key, s.value)}
                      >
                        {s.value === 'true' ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <Input id="newFlagKey" placeholder="Nueva Flag (EJ: REGISTRO_PUBLICO)" style={{ flex: 1 }} />
                    <Button onClick={() => {
                      const input = document.getElementById('newFlagKey') as HTMLInputElement;
                      if (input.value) {
                        handleToggleFeatureFlag(input.value.toUpperCase(), 'false');
                        input.value = '';
                      }
                    }}>Añadir</Button>
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
