'use client';

import { ReactNode } from 'react';
import { SocketProvider } from '../../components/auth/SocketProvider';
import { TopNavbar } from '../../components/layout/TopNavbar';
import { NexoFloatingOrb } from '../../components/nexo/NexoFloatingOrb';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SocketProvider>
      <div className="dashboard-layout">
        
        {/* Navegación Superior Fija */}
        <TopNavbar />

        {/* Área de Contenido Principal (Ahora ocupa todo el ancho) */}
        <main className="dashboard-main-content">
          <div className="content-inner">
            {children}
          </div>
        </main>

        {/* Asistente Nexo Inteligente (Flotante) */}
        <NexoFloatingOrb />

        <style jsx>{`
          .dashboard-layout {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background-color: var(--color-background);
            overflow-x: hidden;
          }

          .dashboard-main-content {
            flex: 1;
            padding-top: 70px; /* Altura de la Navbar */
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .content-inner {
            flex: 1;
            width: 100%;
            max-width: 100%; /* Expansión total */
          }

          /* Scrollbar Custom para look Premium */
          :global(::-webkit-scrollbar) {
            width: 8px;
          }
          :global(::-webkit-scrollbar-track) {
            background: #050505;
          }
          :global(::-webkit-scrollbar-thumb) {
            background: #222;
            border-radius: 4px;
          }
          :global(::-webkit-scrollbar-thumb:hover) {
            background: var(--color-primary);
          }
        `}</style>
      </div>
    </SocketProvider>
  );
}
