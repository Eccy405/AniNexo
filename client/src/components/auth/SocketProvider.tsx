'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Socket } from 'socket.io-client';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useChatStore } from '../../store/useChatStore';
import { NotificationToastContainer } from '../ui/NotificationToast/NotificationToast';
import { getApiUrl } from '../../lib/apiConfig';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useGlobalSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const addToast = useNotificationStore((s) => s.addToast);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const upsertNotification = useNotificationStore((s) => s.upsertNotification);
  const markConversationNotificationsRead = useNotificationStore(
    (s) => s.markConversationNotificationsRead
  );

  const {
    setUserStatus,
    setTyping,
    setUnreadSummary,
    recordMessageIfNew,
    incrementUnreadForMessage,
    clearUnreadForConversation
  } = useChatStore();

  const readDebounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refreshUnreadSummary = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/messaging/unread-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.success && data.data) {
        setUnreadSummary(data.data);
      }
    } catch {
      // ignore transient network errors
    }
  }, [setUnreadSummary]);

  const refreshNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch {
      // ignore transient network errors
    }
  }, [setNotifications]);

  const isConversationActiveAndVisible = useCallback((conversationId?: string | null) => {
    if (!conversationId || typeof document === 'undefined' || typeof window === 'undefined') {
      return false;
    }
    if (document.visibilityState !== 'visible') return false;

    const { activeFloatingConversationId, isFloatingChatMinimized } = useChatStore.getState();
    const isViewingFloating =
      activeFloatingConversationId === conversationId && !isFloatingChatMinimized;
    const isViewingRoute = window.location.pathname === `/home/chat/${conversationId}`;
    return isViewingFloating || isViewingRoute;
  }, []);

  const scheduleAutoRead = useCallback(
    (conversationId: string, senderId?: string) => {
      if (!conversationId) return;

      clearUnreadForConversation(conversationId, senderId);
      markConversationNotificationsRead(conversationId);

      if (readDebounceTimersRef.current[conversationId]) {
        clearTimeout(readDebounceTimersRef.current[conversationId]);
      }

      readDebounceTimersRef.current[conversationId] = setTimeout(async () => {
        delete readDebounceTimersRef.current[conversationId];
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${getApiUrl()}/messaging/${conversationId}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
        if (socket?.connected) {
          socket.emit('message_read', { conversationId });
        }
      }, 350);
    },
    [clearUnreadForConversation, markConversationNotificationsRead, socket]
  );

  useEffect(() => {
    refreshUnreadSummary();
    refreshNotifications();
  }, [refreshUnreadSummary, refreshNotifications]);

  // Limpiar timers pendientes al desmontar
  useEffect(() => {
    const timers = readDebounceTimersRef.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
    };
  }, []);

  // Si el usuario vuelve a enfocar la pestaña mientras tiene un chat abierto, marcar leído
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const { activeFloatingConversationId, isFloatingChatMinimized, unreadByConversation } =
        useChatStore.getState();

      let activeConvId: string | null = null;
      if (activeFloatingConversationId && !isFloatingChatMinimized) {
        activeConvId = activeFloatingConversationId;
      } else if (typeof window !== 'undefined' && window.location.pathname.startsWith('/home/chat/')) {
        activeConvId = window.location.pathname.replace('/home/chat/', '').split('/')[0] || null;
      }

      if (activeConvId && (unreadByConversation[activeConvId] || 0) > 0) {
        scheduleAutoRead(activeConvId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [scheduleAutoRead]);

  // Resincronización explícita ante reconexión de Socket.IO y eventos globales
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      try {
        const rawUser = localStorage.getItem('user');
        const userId = rawUser ? JSON.parse(rawUser)?.id : null;
        if (userId) {
          socket.emit('join_user', userId);
        }
      } catch {}

      const { activeFloatingConversationId } = useChatStore.getState();
      if (activeFloatingConversationId) {
        socket.emit('join_conversation', activeFloatingConversationId);
      }

      refreshUnreadSummary();
      refreshNotifications();
    };

    const handleNotification = (data: any) => {
      const convRefId =
        data?.type === 'MESSAGE' ? (data?.conversationId || data?.referenceId) : null;

      if (convRefId && isConversationActiveAndVisible(convRefId)) {
        markConversationNotificationsRead(convRefId);
        return;
      }

      upsertNotification(data);
      addToast(data);
    };

    const handleNewMessage = (msg: any) => {
      if (!recordMessageIfNew(msg?.id)) return;

      let myId: string | null = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw) myId = JSON.parse(raw)?.id || null;
      } catch {}

      if (!msg?.senderId || (myId && msg.senderId === myId)) return;

      if (isConversationActiveAndVisible(msg.conversationId)) {
        scheduleAutoRead(msg.conversationId, msg.senderId);
      } else {
        incrementUnreadForMessage(msg);
      }
    };

    const handleMessagesReadSync = ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        clearUnreadForConversation(conversationId);
        markConversationNotificationsRead(conversationId);
        refreshUnreadSummary();
      }
    };

    const handleUserStatus = ({
      userId,
      status
    }: {
      userId: string;
      status: 'online' | 'away' | 'busy' | 'offline';
    }) => {
      setUserStatus(userId, status);
    };

    const handleUserTyping = ({
      userId,
      conversationId
    }: {
      userId: string;
      conversationId: string;
    }) => {
      setTyping(conversationId, userId, true);
    };

    const handleUserStopTyping = ({
      userId,
      conversationId
    }: {
      userId: string;
      conversationId: string;
    }) => {
      setTyping(conversationId, userId, false);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('notification', handleNotification);
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read_sync', handleMessagesReadSync);
    socket.on('user_status', handleUserStatus);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification', handleNotification);
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read_sync', handleMessagesReadSync);
      socket.off('user_status', handleUserStatus);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [
    socket,
    isConnected,
    addToast,
    upsertNotification,
    markConversationNotificationsRead,
    setUserStatus,
    setTyping,
    recordMessageIfNew,
    incrementUnreadForMessage,
    clearUnreadForConversation,
    refreshUnreadSummary,
    refreshNotifications,
    isConversationActiveAndVisible,
    scheduleAutoRead
  ]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      <NotificationToastContainer />
      {children}
    </SocketContext.Provider>
  );
}
