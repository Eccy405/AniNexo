'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NexoAlertProps {
  show: boolean;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
  onClose?: () => void;
}

export const NexoAlert: React.FC<NexoAlertProps> = ({ show, type, title, message, onClose }) => {
  const colors = {
    error: '#FF4D4D',
    success: '#00FF88',
    info: '#00E5FF'
  };

  const icon = {
    error: '⚠️',
    success: '✅',
    info: '🌐'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="nexo-alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="nexo-alert-card"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
          >
            <div className="alert-glow" style={{ background: `radial-gradient(circle, ${colors[type]}33 0%, transparent 70%)` }}></div>
            <div className="alert-content">
              <span className="alert-icon">{icon[type]}</span>
              <h3>{title}</h3>
              <p>{message}</p>
              <button 
                onClick={onClose}
                style={{ borderColor: colors[type], color: colors[type] }}
              >
                ENTENDIDO
              </button>
            </div>

            <style jsx>{`
              .nexo-alert-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
              }
              .nexo-alert-card {
                position: relative;
                width: 100%;
                max-width: 400px;
                background: #0a0a0a;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
                text-align: center;
                overflow: hidden;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
              }
              .alert-glow {
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                z-index: 0;
              }
              .alert-content {
                position: relative;
                z-index: 1;
              }
              .alert-icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 20px;
              }
              h3 {
                color: #fff;
                font-size: 1.5rem;
                font-weight: 900;
                margin-bottom: 10px;
                letter-spacing: 1px;
              }
              p {
                color: #aaa;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              button {
                background: transparent;
                border: 2px solid;
                padding: 12px 30px;
                border-radius: 12px;
                font-weight: 900;
                cursor: pointer;
                transition: all 0.2s;
                letter-spacing: 2px;
              }
              button:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px currentColor;
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
