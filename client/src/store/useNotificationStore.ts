import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'LIKE' | 'FOLLOW' | 'COMMENT' | 'MENTION' | 'SYSTEM' | 'MESSAGE' | 'BADGE' | 'NEXO';
  referenceId?: string;
  conversationId?: string;
  title?: string;
  message?: string;
  sender?: { id?: string; username?: string; avatarUrl?: string | null } | null;
  actionRequired?: boolean;
  isGroup?: boolean;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  toasts: Notification[];
  setNotifications: (list: Notification[]) => void;
  upsertNotification: (notification: Notification) => void;
  markAsReadLocal: (id: string) => void;
  markAllAsReadLocal: () => void;
  removeNotificationLocal: (id: string) => void;
  markConversationNotificationsRead: (conversationId: string) => void;
  addToast: (notification: Notification) => void;
  removeToast: (id: string) => void;
}

const computeUnread = (list: Notification[]) => list.filter((n) => !n.isRead).length;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],

  setNotifications: (list) =>
    set({
      notifications: list,
      unreadCount: computeUnread(list)
    }),

  upsertNotification: (notification) =>
    set((state) => {
      const convRef = notification.conversationId || notification.referenceId;
      const existingIdx = state.notifications.findIndex((n) => {
        if (n.id === notification.id) return true;
        if (
          notification.type === 'MESSAGE' &&
          !notification.isRead &&
          n.type === 'MESSAGE' &&
          !n.isRead &&
          convRef &&
          (n.conversationId || n.referenceId) === convRef
        ) {
          return true;
        }
        return false;
      });

      let nextList: Notification[];
      if (existingIdx >= 0) {
        const filtered = state.notifications.filter((_, idx) => idx !== existingIdx);
        nextList = [{ ...state.notifications[existingIdx], ...notification }, ...filtered];
      } else {
        nextList = [notification, ...state.notifications].slice(0, 50);
      }

      return {
        notifications: nextList,
        unreadCount: computeUnread(nextList)
      };
    }),

  markAsReadLocal: (id) =>
    set((state) => {
      const nextList = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: nextList,
        unreadCount: computeUnread(nextList)
      };
    }),

  markAllAsReadLocal: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    })),

  removeNotificationLocal: (id) =>
    set((state) => {
      const nextList = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: nextList,
        unreadCount: computeUnread(nextList),
        toasts: state.toasts.filter((t) => t.id !== id)
      };
    }),

  markConversationNotificationsRead: (conversationId) =>
    set((state) => {
      if (!conversationId) return state;
      let changed = false;
      const nextList = state.notifications.map((n) => {
        const ref = n.conversationId || n.referenceId;
        if (n.type === 'MESSAGE' && ref === conversationId && !n.isRead) {
          changed = true;
          return { ...n, isRead: true };
        }
        return n;
      });

      const nextToasts = state.toasts.filter((t) => {
        const ref = t.conversationId || t.referenceId;
        return !(t.type === 'MESSAGE' && ref === conversationId);
      });

      if (!changed && nextToasts.length === state.toasts.length) return state;

      return {
        notifications: nextList,
        unreadCount: computeUnread(nextList),
        toasts: nextToasts
      };
    }),

  addToast: (notification) =>
    set((state) => {
      const convRef = notification.conversationId || notification.referenceId;
      const existingIdx = state.toasts.findIndex((t) => {
        if (t.id === notification.id) return true;
        if (
          notification.type === 'MESSAGE' &&
          t.type === 'MESSAGE' &&
          convRef &&
          (t.conversationId || t.referenceId) === convRef
        ) {
          return true;
        }
        return false;
      });

      if (existingIdx >= 0) {
        const nextToasts = [...state.toasts];
        nextToasts[existingIdx] = { ...nextToasts[existingIdx], ...notification };
        return { toasts: nextToasts };
      }

      return {
        toasts: [...state.toasts, notification]
      };
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));
