'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { StatsChart } from '../../../components/admin/StatsChart';
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, Search, BarChart3, Clock, Zap } from 'lucide-react';

export default function AdminEnterprisePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState({ maintenance: false, registration: true, nexo: true });
  const [telemetry, setTelemetry] = useState<any>(null);

  // Moderation & User Management States
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [internalNote, setInternalNote] = useState('');

  const [selectedUserForMod, setSelectedUserForMod] = useState<any | null>(null);
  const [modActionType, setModActionType] = useState<'warn' | 'mute' | 'ban' | null>(null);
  const [modReason, setModReason] = useState('');
  const [modDuration, setModDuration] = useState('24'); // Hours for mute, Days for ban

  const handleResolveReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/moderation/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: resolutionStatus,
          internalNote
        })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh reports list
        const reportsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const reportsData = await reportsRes.json();
        if (reportsData.success) setReports(reportsData.data);
        
        setSelectedReport(null);
        setInternalNote('');
      } else {
        alert(data.message || 'Error al resolver el reporte');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const handleUserModAction = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      const body: any = {
        userId: selectedUserForMod.id,
        reason: modReason
      };

      if (modActionType === 'warn') {
        endpoint = '/moderation/warning';
      } else if (modActionType === 'mute') {
        endpoint = '/moderation/mute';
        body.hours = Number(modDuration);
      } else if (modActionType === 'ban') {
        endpoint = '/moderation/ban';
        body.days = Number(modDuration);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Acción ${modActionType?.toUpperCase()} aplicada con éxito a ${selectedUserForMod.username}`);
        setSelectedUserForMod(null);
        setModActionType(null);
        setModReason('');
      } else {
        alert(data.message || 'Error al aplicar moderación');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const handleToggleUserField = async (userId: string, field: 'role' | 'verify' | 'premium') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/users/${userId}/${field}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Update user locally
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data.data } : u));
        
        // Refresh global analytics metrics
        const analyticsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const analytics = await analyticsRes.json();
        if (analytics.success) setMetrics(analytics.data.metrics);
      } else {
        alert(data.message || `Error al actualizar campo ${field}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [analyticsRes, statsRes, reportsRes, usersRes, telemetryRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/analytics`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/reports`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/users`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/telemetry`, { headers })
        ]);
        
        const analytics = await analyticsRes.json();
        const stats = await statsRes.json();
        const reportsData = await reportsRes.json();
        const usersData = await usersRes.json();
        const telemetryData = await telemetryRes.json();

        if (analytics.success) setMetrics(analytics.data.metrics);
        if (stats.success) setHistoricalData(stats.data.historical);
        if (reportsData.success) setReports(reportsData.data);
        if (usersData.success) setUsers(usersData.data);
        if (telemetryData.success) setTelemetry(telemetryData.data);
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleUpdateFlag = async (key: string, value: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/feature-flag`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) setFlags(prev => ({ ...prev, [key]: value }));
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ padding: '40px', color: '#fff' }}>Iniciando Consola Enterprise...</div>;

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#0a0a0c' }}>
      {/* Sidebar de Admin */}
      <aside style={{ width: '240px', background: '#111', borderRight: '1px solid #222', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Management</h2>
        <AdminNavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <AdminNavItem icon={<Users size={18}/>} label="Usuarios" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <AdminNavItem icon={<ShieldAlert size={18}/>} label="Moderación" active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} badge={reports.length} />
        <AdminNavItem icon={<Activity size={18}/>} label="Telemetría" active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')} />
        <AdminNavItem icon={<Settings size={18}/>} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </aside>

      {/* Área de Contenido */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>AniNexo Enterprise</h1>
            <p style={{ color: '#555' }}>Gestión centralizada de la infraestructura social.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
             <Card style={{ padding: '10px 20px', background: 'rgba(0, 229, 255, 0.05)', borderColor: 'rgba(0, 229, 255, 0.2)' }}>
                <span style={{ color: '#00E5FF', fontWeight: 700 }}>$1,240.50</span>
                <span style={{ color: '#555', fontSize: '0.7rem', marginLeft: '10px' }}>Ingresos Mes</span>
             </Card>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <MetricCard 
                  label="Usuarios Registrados" 
                  value={metrics?.userCount ?? 0} 
                  sub="Total registrados en DB" 
                  color="#00E5FF" 
                />
                <MetricCard 
                  label="Usuarios Verificados" 
                  value={metrics?.verifiedUsers ?? 0} 
                  sub={metrics?.userCount > 0 ? `${((metrics.verifiedUsers / metrics.userCount) * 100).toFixed(1)}% del total` : '0% del total'} 
                  color="#22C55E" 
                />
                <MetricCard 
                  label="Conversión Premium" 
                  value={metrics?.premiumUsers ?? 0} 
                  sub={metrics?.userCount > 0 ? `${((metrics.premiumUsers / metrics.userCount) * 100).toFixed(1)}% del total` : '0% del total'} 
                  color="#FFD700" 
                />
                <MetricCard 
                  label="Interacciones Nexo" 
                  value={metrics?.nexoInteractionsCount ?? 0} 
                  sub="Menciones e IA" 
                  color="#A855F7" 
                />
                <MetricCard 
                  label="Salud del Sistema" 
                  value="99.9%" 
                  sub="Uptime 30d" 
                  color="#FF5252" 
                />
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                <Card style={{ padding: '25px' }}>
                   <StatsChart title="Actividad de Nuevos Usuarios" data={historicalData} dataKey="newUsers" color="#00E5FF" />
                </Card>
                <Card style={{ padding: '25px' }}>
                   <h3 style={{ marginBottom: '20px' }}>Alertas de Nexo</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <SuggestionItem text="Detectado pico de menciones en 'Solo Leveling'. Considerar evento premium." type="info" />
                      <SuggestionItem text="Alta tasa de reportes en el post de @TrollBot. Recomendado ban preventivo." type="warning" />
                      <SuggestionItem text="Nuevos usuarios de LATAM aumentando. Sugerencia: Localizar Nexo al Español." type="idea" />
                   </div>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <Card style={{ padding: '25px' }}>
              <h2 style={{ marginBottom: '20px', color: '#fff' }}>Cola de Moderación</h2>
              {reports.length === 0 ? (
                <p style={{ color: '#555' }}>No hay reportes pendientes.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #222', color: '#555' }}>
                      <th style={{ padding: '15px' }}>Reportado</th>
                      <th style={{ padding: '15px' }}>Razón</th>
                      <th style={{ padding: '15px' }}>Fecha</th>
                      <th style={{ padding: '15px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r: any) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1c', color: '#ccc' }}>
                        <td style={{ padding: '15px', fontWeight: 600, color: '#fff' }}>{r.reportedUser?.username || 'Usuario Desconocido'}</td>
                        <td style={{ padding: '15px' }}>{r.reason}</td>
                        <td style={{ padding: '15px' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '15px' }}>
                          <Button variant="secondary" size="sm" onClick={() => {
                            setSelectedReport(r);
                            setResolutionStatus('RESOLVED');
                            setInternalNote('');
                          }}>
                            Resolver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {selectedReport && (
              <Card style={{ padding: '25px', border: '1px solid #00E5FF' }}>
                <h3 style={{ color: '#00E5FF', marginBottom: '20px' }}>Resolviendo Reporte de @{selectedReport.reportedUser?.username}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
                  <div>
                    <span style={{ color: '#555', fontSize: '0.8rem', display: 'block' }}>Razón del reporte</span>
                    <strong style={{ color: '#fff' }}>{selectedReport.reason}</strong>
                  </div>

                  <div>
                    <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Acción de Resolución</label>
                    <select 
                      value={resolutionStatus} 
                      onChange={(e) => setResolutionStatus(e.target.value)}
                      style={{ background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', width: '100%' }}
                    >
                      <option value="RESOLVED">Marcar como Resuelto (Acción Tomada)</option>
                      <option value="DISMISSED">Ignorar Reporte (Sin Acción)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Nota Interna (Mod/Admin)</label>
                    <textarea 
                      placeholder="Escribe la justificación interna de esta resolución..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      style={{ background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <Button variant="primary" onClick={handleResolveReport}>Guardar Resolución</Button>
                    <Button variant="ghost" onClick={() => setSelectedReport(null)}>Cancelar</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <Card style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#fff' }}>Gestión de Usuarios</h2>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>Mostrando {users.length} usuarios recientes</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #222', color: '#555' }}>
                    <th style={{ padding: '15px' }}>Usuario</th>
                    <th style={{ padding: '15px' }}>Email</th>
                    <th style={{ padding: '15px' }}>Rol</th>
                    <th style={{ padding: '15px' }}>Verificado</th>
                    <th style={{ padding: '15px' }}>Premium</th>
                    <th style={{ padding: '15px' }}>Fecha Registro</th>
                    <th style={{ padding: '15px' }}>Acciones rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1a1a1c', color: '#ccc' }}>
                      <td style={{ padding: '15px', fontWeight: 600, color: '#fff' }}>{u.username}</td>
                      <td style={{ padding: '15px' }}>{u.email}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: u.role === 'ADMIN' || u.role === 'SUPERADMIN' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: u.role === 'ADMIN' || u.role === 'SUPERADMIN' ? '#00E5FF' : '#888'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          color: u.isVerified ? '#22C55E' : '#FF5252',
                          fontWeight: 600
                        }}>
                          {u.isVerified ? '✓ Sí' : '✗ No'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          color: u.isPremium ? '#FFD700' : '#888',
                          fontWeight: 600
                        }}>
                          {u.isPremium ? '★ Premium' : 'Free'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#22C55E', color: '#22C55E' }}
                            onClick={() => handleToggleUserField(u.id, 'verify')}
                          >
                            {u.isVerified ? 'Quitar Verif.' : 'Verificar'}
                          </Button>
                          
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#FFD700', color: '#FFD700' }}
                            onClick={() => handleToggleUserField(u.id, 'premium')}
                          >
                            {u.isPremium ? 'Quitar Prem.' : 'Dar Premium'}
                          </Button>

                          <Button 
                            variant="secondary" 
                            size="sm" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#00E5FF', color: '#00E5FF' }}
                            onClick={() => handleToggleUserField(u.id, 'role')}
                          >
                            {u.role === 'ADMIN' ? 'Hacer Usuario' : 'Hacer Admin'}
                          </Button>

                          <Button 
                            variant="primary" 
                            size="sm" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#FF5252', color: '#fff', border: 'none' }}
                            onClick={() => {
                              setSelectedUserForMod(u);
                              setModActionType('warn');
                              setModReason('');
                              setModDuration('24');
                            }}
                          >
                            Moderar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {selectedUserForMod && (
              <Card style={{ padding: '25px', border: '1px solid #FF5252' }}>
                <h3 style={{ color: '#FF5252', marginBottom: '20px' }}>Sancionar a @{selectedUserForMod.username}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
                  <div>
                    <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Tipo de Sanción</label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <label style={{ color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                          type="radio" 
                          name="modActionType" 
                          checked={modActionType === 'warn'} 
                          onChange={() => setModActionType('warn')} 
                        /> Advertencia
                      </label>
                      <label style={{ color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                          type="radio" 
                          name="modActionType" 
                          checked={modActionType === 'mute'} 
                          onChange={() => setModActionType('mute')} 
                        /> Silenciar (Mute)
                      </label>
                      <label style={{ color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                          type="radio" 
                          name="modActionType" 
                          checked={modActionType === 'ban'} 
                          onChange={() => setModActionType('ban')} 
                        /> Banear (Ban)
                      </label>
                    </div>
                  </div>

                  {modActionType === 'mute' && (
                    <div>
                      <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Duración del Silencio (Horas)</label>
                      <input 
                        type="number" 
                        value={modDuration} 
                        onChange={(e) => setModDuration(e.target.value)}
                        style={{ background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', width: '100%' }}
                      />
                    </div>
                  )}

                  {modActionType === 'ban' && (
                    <div>
                      <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Duración de la Suspensión (Días - vacío para permanente)</label>
                      <input 
                        type="number" 
                        placeholder="Ej: 7"
                        value={modDuration === '24' ? '' : modDuration} 
                        onChange={(e) => setModDuration(e.target.value)}
                        style={{ background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', width: '100%' }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ color: '#888', display: 'block', marginBottom: '5px' }}>Razón Disciplinaria</label>
                    <textarea 
                      placeholder="Escribe la justificación de esta sanción (se registrará internamente y se le notificará al usuario)..."
                      value={modReason}
                      onChange={(e) => setModReason(e.target.value)}
                      style={{ background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <Button variant="primary" style={{ background: '#FF5252', border: 'none' }} onClick={handleUserModAction}>Aplicar Sanción</Button>
                    <Button variant="ghost" onClick={() => setSelectedUserForMod(null)}>Cancelar</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} color="#00E5FF" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#555', display: 'block', fontWeight: 600 }}>Sesiones Totales</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{telemetry?.totalSessions ?? 0}</span>
                </div>
              </Card>
              <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={24} color="#A855F7" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#555', display: 'block', fontWeight: 600 }}>Duración Promedio</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{telemetry?.avgSessionTime ? `${Math.round(telemetry.avgSessionTime / 60)}m` : '0m'}</span>
                </div>
              </Card>
              <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={24} color="#22C55E" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#555', display: 'block', fontWeight: 600 }}>Búsquedas Registradas</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{telemetry?.topSearches?.reduce((acc: number, s: any) => acc + s._count.query, 0) ?? 0}</span>
                </div>
              </Card>
              <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(255, 215, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={24} color="#FFD700" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#555', display: 'block', fontWeight: 600 }}>Ads Activos</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{telemetry?.adPerformance?.length ?? 0}</span>
                </div>
              </Card>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {/* Top Searches */}
              <Card style={{ padding: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Search size={20} color="#00E5FF" />
                  <h3 style={{ margin: 0, color: '#fff' }}>Top Búsquedas</h3>
                </div>
                {(!telemetry?.topSearches || telemetry.topSearches.length === 0) ? (
                  <p style={{ color: '#555', textAlign: 'center', padding: '30px 0' }}>Sin datos de búsqueda aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {telemetry.topSearches.map((s: any, i: number) => {
                      const maxCount = telemetry.topSearches[0]._count.query;
                      const barPercent = maxCount > 0 ? (s._count.query / maxCount) * 100 : 0;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: '#555', fontSize: '0.75rem', width: '24px', textAlign: 'right', fontWeight: 700 }}>#{i + 1}</span>
                          <div style={{ flex: 1, position: 'relative', height: '36px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ 
                              position: 'absolute', top: 0, left: 0, height: '100%', 
                              width: `${barPercent}%`, 
                              background: `linear-gradient(90deg, rgba(0,229,255,0.15), rgba(0,229,255,0.05))`,
                              borderRadius: '8px',
                              transition: 'width 0.5s ease'
                            }} />
                            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
                              <span style={{ color: '#eee', fontSize: '0.85rem', fontWeight: 500 }}>{s.query}</span>
                              <span style={{ color: '#00E5FF', fontSize: '0.8rem', fontWeight: 700 }}>{s._count.query}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Ad Performance */}
              <Card style={{ padding: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <BarChart3 size={20} color="#FFD700" />
                  <h3 style={{ margin: 0, color: '#fff' }}>Rendimiento de Ads</h3>
                </div>
                {(!telemetry?.adPerformance || telemetry.adPerformance.length === 0) ? (
                  <p style={{ color: '#555', textAlign: 'center', padding: '30px 0' }}>No hay anuncios registrados.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #222', color: '#555', fontSize: '0.75rem' }}>
                        <th style={{ padding: '10px' }}>Título</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Impresiones</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Clicks</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetry.adPerformance.map((ad: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1a1a1c' }}>
                          <td style={{ padding: '12px 10px', color: '#eee', fontWeight: 500, fontSize: '0.85rem' }}>{ad.title}</td>
                          <td style={{ padding: '12px 10px', color: '#aaa', textAlign: 'center', fontSize: '0.85rem' }}>{ad.impressions.toLocaleString()}</td>
                          <td style={{ padding: '12px 10px', color: '#aaa', textAlign: 'center', fontSize: '0.85rem' }}>{ad.clicks.toLocaleString()}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '3px 10px', 
                              borderRadius: '12px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700,
                              background: ad.ctr > 2 ? 'rgba(34,197,94,0.15)' : ad.ctr > 0.5 ? 'rgba(255,215,0,0.15)' : 'rgba(255,82,82,0.15)',
                              color: ad.ctr > 2 ? '#22C55E' : ad.ctr > 0.5 ? '#FFD700' : '#FF5252'
                            }}>
                              {ad.ctr.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>

            {/* Recent Events Timeline */}
            <Card style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Activity size={20} color="#A855F7" />
                <h3 style={{ margin: 0, color: '#fff' }}>Eventos Recientes</h3>
              </div>
              {(!telemetry?.recentEvents || telemetry.recentEvents.length === 0) ? (
                <p style={{ color: '#555', textAlign: 'center', padding: '30px 0' }}>No hay eventos registrados aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {telemetry.recentEvents.map((ev: any, i: number) => {
                    const eventColors: Record<string, string> = {
                      'PAGE_VIEW': '#00E5FF',
                      'CLICK': '#22C55E',
                      'SEARCH': '#FFD700',
                      'ERROR': '#FF5252',
                      'LOGIN': '#A855F7',
                      'SIGNUP': '#FF79C6'
                    };
                    const color = eventColors[ev.eventType] || '#888';
                    return (
                      <div key={ev.id || i} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < telemetry.recentEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '12px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}40`, marginTop: '4px' }} />
                          {i < telemetry.recentEvents.length - 1 && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: '4px', minHeight: '20px' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                              background: `${color}15`, color: color
                            }}>
                              {ev.eventType}
                            </span>
                            <span style={{ color: '#555', fontSize: '0.75rem' }}>{ev.user?.username || 'Anónimo'}</span>
                          </div>
                          <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>{ev.metadata ? (typeof ev.metadata === 'string' ? ev.metadata : JSON.stringify(ev.metadata)) : 'Sin detalles'}</p>
                        </div>
                        <span style={{ color: '#444', fontSize: '0.7rem', whiteSpace: 'nowrap', marginTop: '4px' }}>
                          {new Date(ev.createdAt).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <Card style={{ padding: '25px' }}>
                <h3 style={{ marginBottom: '20px' }}>Control de Infraestructura</h3>
                <ConfigToggle label="Modo Mantenimiento" description="Bloquea el acceso a todos los usuarios no-admin." active={flags.maintenance} onChange={(v: boolean) => handleUpdateFlag('MAINTENANCE_MODE', v)} />
                <ConfigToggle label="Registros Públicos" description="Permitir que nuevos usuarios se unan." active={flags.registration} onChange={(v: boolean) => handleUpdateFlag('DISABLE_REGISTRATIONS', !v)} />
                <ConfigToggle label="IA Nexo Activa" description="Servicio global de inteligencia artificial." active={flags.nexo} onChange={(v: boolean) => handleUpdateFlag('NEXO_ACTIVE', v)} />
             </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminNavItem({ icon, label, active, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px',
        background: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
        color: active ? '#00E5FF' : '#888', border: 'none', cursor: 'pointer', transition: '0.2s', textAlign: 'left',
        width: '100%', fontWeight: active ? 700 : 500
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span style={{ background: '#FF5252', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{badge}</span>}
    </button>
  );
}

function MetricCard({ label, value, sub, color }: any) {
  return (
    <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: color }}>{sub}</span>
    </Card>
  );
}

function SuggestionItem({ text, type }: any) {
  const colors: any = { info: '#00E5FF', warning: '#FF5252', idea: '#A855F7' };
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
      <div style={{ width: '4px', height: '40px', background: colors[type], borderRadius: '2px' }} />
      <p style={{ fontSize: '0.85rem', color: '#ccc', margin: 0 }}>{text}</p>
    </div>
  );
}

interface ConfigToggleProps {
  label: string;
  description: string;
  active: boolean;
  onChange: (v: boolean) => void;
}

function ConfigToggle({ label, description, active, onChange }: ConfigToggleProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #1a1a1c' }}>
      <div>
        <h4 style={{ margin: 0, color: '#eee' }}>{label}</h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>{description}</p>
      </div>
      <input type="checkbox" checked={active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)} style={{ width: '40px', height: '20px', cursor: 'pointer' }} />
    </div>
  );
}
