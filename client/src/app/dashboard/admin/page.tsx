'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { StatsChart } from '../../../components/admin/StatsChart';
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, DollarSign } from 'lucide-react';

export default function AdminEnterprisePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState({ maintenance: false, registration: true, nexo: true });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [analyticsRes, statsRes, reportsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/analytics`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/reports`, { headers })
        ]);
        
        const analytics = await analyticsRes.json();
        const stats = await statsRes.json();
        const reportsData = await reportsRes.json();

        if (analytics.success) setMetrics(analytics.data.metrics);
        if (stats.success) setHistoricalData(stats.data.historical);
        if (reportsData.success) setReports(reportsData.data);
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
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <MetricCard label="Crecimiento Usuarios" value={metrics?.userCount} sub="+12% vs ayer" color="#00E5FF" />
                <MetricCard label="Conversión Premium" value={metrics?.premiumUsers} sub="4.2% del total" color="#FFD700" />
                <MetricCard label="Interacciones Nexo" value="2,841" sub="Promedio 3.1 msg/u" color="#A855F7" />
                <MetricCard label="Salud del Sistema" value="99.9%" sub="Uptime 30d" color="#22C55E" />
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
          <Card style={{ padding: '25px' }}>
            <h2 style={{ marginBottom: '20px' }}>Cola de Moderación</h2>
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
                  <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1c' }}>
                    <td style={{ padding: '15px' }}>{r.reportedUser.username}</td>
                    <td style={{ padding: '15px' }}>{r.reason}</td>
                    <td style={{ padding: '15px' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>
                       <Button variant="secondary" size="sm">Resolver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <Card style={{ padding: '25px' }}>
                <h3 style={{ marginBottom: '20px' }}>Control de Infraestructura</h3>
                <ConfigToggle label="Modo Mantenimiento" description="Bloquea el acceso a todos los usuarios no-admin." active={flags.maintenance} onChange={(v) => handleUpdateFlag('MAINTENANCE_MODE', v)} />
                <ConfigToggle label="Registros Públicos" description="Permitir que nuevos usuarios se unan." active={flags.registration} onChange={(v) => handleUpdateFlag('DISABLE_REGISTRATIONS', !v)} />
                <ConfigToggle label="IA Nexo Activa" description="Servicio global de inteligencia artificial." active={flags.nexo} onChange={(v) => handleUpdateFlag('NEXO_ACTIVE', v)} />
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

function ConfigToggle({ label, description, active, onChange }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #1a1a1c' }}>
      <div>
        <h4 style={{ margin: 0, color: '#eee' }}>{label}</h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>{description}</p>
      </div>
      <input type="checkbox" checked={active} onChange={(e) => onChange(e.target.checked)} style={{ width: '40px', height: '20px', cursor: 'pointer' }} />
    </div>
  );
}
