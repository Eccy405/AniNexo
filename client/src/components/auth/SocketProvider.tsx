'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
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
  const { setUserStatus, setTyping, setUnreadSummary, incrementUnreadForMessage, clearUnreadForConversation } = useChatStore();

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

  useEffect(() => {
    refreshUnreadSummary();
  }, [refreshUnreadSummary]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    refreshUnreadSummary();

    const handleNotification = (data: any) => {
      const { activeFloatingConversationId, isFloatingChatMinimized } = useChatStore.getState();
      const isViewingChat =
        data?.type === 'MESSAGE' &&
        data?.referenceId &&
        ((activeFloatingConversationId === data.referenceId && !isFloatingChatMinimized) ||
          (typeof window !== 'undefined' && window.location.pathname === `/home/chat/${data.referenceId}`));

      if (!isViewingChat) {
        addToast(data);
      }
      window.dispatchEvent(new CustomEvent('aninexo:notifications-updated'));
    };

    const handleNewMessage = (msg: any) => {
      let myId: string | null = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw) myId = JSON.parse(raw)?.id || null;
      } catch {}

      if (!msg?.senderId || (myId && msg.senderId === myId)) return;

      const { activeFloatingConversationId, isFloatingChatMinimized } = useChatStore.getState();
      const isViewingFloating = activeFloatingConversationId === msg.conversationId && !isFloatingChatMinimized;
      const isViewingRoute =
        typeof window !== 'undefined' && window.location.pathname === `/home/chat/${msg.conversationId}`;

      if (!isViewingFloating && !isViewingRoute) {
        incrementUnreadForMessage(msg);
      }
    };

    const handleMessagesReadSync = ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        clearUnreadForConversation(conversationId);
        refreshUnreadSummary();
        window.dispatchEvent(new CustomEvent('aninexo:notifications-updated'));
      }
    };

    const handleUserStatus = ({ userId, status }: { userId: string; status: 'online' | 'away' | 'busy' | 'offline' }) => {
      setUserStatus(userId, status);
    };

    const handleUserTyping = ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTyping(conversationId, userId, true);
    };

    const handleUserStopTyping = ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTyping(conversationId, userId, false);
    };

    socket.on('notification', handleNotification);
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read_sync', handleMessagesReadSync);
    socket.on('user_status', handleUserStatus);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read_sync', handleMessagesReadSync);
      socket.off('user_status', handleUserStatus);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, isConnected, addToast, setUserStatus, setTyping, incrementUnreadForMessage, clearUnreadForConversation, refreshUnreadSummary]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      <NotificationToastContainer />
      {children}
    </SocketContext.Provider>
  );
}
