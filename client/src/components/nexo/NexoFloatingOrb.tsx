'use client';

import React, { useState } from 'react';
import NexoChat from '../../app/dashboard/NexoChat';

export const NexoFloatingOrb: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="nexo-orb-container">
      {/* Panel de Chat (Overlay) */}
      <div className={`chat-overlay ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
           <span>Nexo AI Assistant</span>
           <button onClick={() => setIsOpen(false)}>×</button>
        </div>
        <div className="chat-body">
           <NexoChat />
        </div>
      </div>

      {/* Botón Orb Flotante */}
      <button 
        className={`nexo-orb ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="orb-core"></div>
        <div className="orb-rings"></div>
        <div className="orb-label">Nexo</div>
      </button>

      <style jsx>{`
        .nexo-orb-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 2000;
        }

        .chat-overlay {
          position: absolute;
          bottom: 90px;
          right: 0;
          width: 400px;
          height: 600px;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .chat-overlay.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .chat-header {
          padding: 15px 20px;
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(0, 229, 255, 0.2));
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .chat-header button {
          background: transparent;
          border: none;
          color: #888;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .chat-body {
          flex: 1;
          overflow: hidden;
        }

        /* Botón Orb */
        .nexo-orb {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: #050505;
          border: none;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s;
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
        }

        .nexo-orb:hover {
          transform: scale(1.1);
        }

        .orb-core {
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #00E5FF 0%, #A855F7 100%);
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 15px #00E5FF;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 10px #00E5FF; }
          50% { transform: scale(1.1); box-shadow: 0 0 25px #A855F7; }
          100% { transform: scale(1); box-shadow: 0 0 10px #00E5FF; }
        }

        .orb-rings {
          position: absolute;
          inset: -5px;
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 50%;
          animation: spin 10s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .orb-label {
          position: absolute;
          bottom: -25px;
          font-size: 0.7rem;
          font-weight: 900;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        @media (max-width: 500px) {
          .chat-overlay {
             width: 90vw;
             right: -10px;
             height: 70vh;
          }
        }
      `}</style>
    </div>
  );
};
