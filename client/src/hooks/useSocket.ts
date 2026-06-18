'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket(conversationId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // SI NO HAY TOKEN O ES UN STRING DE RELLENO, NO HACEMOS NADA. 
    // Esto evita errores de "Invalid Token" en la consola para invitados.
    if (!token || token === 'null' || token === 'undefined') return;

    if (!socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('🔗 Conectado al servidor de WebSockets de AniNexo');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Desconectado de WebSockets');
      });

      newSocket.on('connect_error', (err) => {
        // Downgrade to warn — auth token may not be ready yet on first load
        console.warn('[Socket] connect_error:', err.message);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Si se pasa un conversationId, nos unimos a esa sala automáticamente
  useEffect(() => {
    if (socket && isConnected && conversationId) {
      socket.emit('join_conversation', conversationId);
      console.log(`Unido a la sala de conversación: ${conversationId}`);
    }
  }, [socket, isConnected, conversationId]);

  return { socket, isConnected };
}
