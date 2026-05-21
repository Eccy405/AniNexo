import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'LIKE' | 'FOLLOW' | 'COMMENT' | 'MENTION' | 'SYSTEM';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  toasts: Notification[];
  addToast: (notification: Notification) => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  addToast: (notification) => set((state) => ({ 
    toasts: [...state.toasts, notification] 
  })),
  removeToast: (id) => set((state) => ({ 
    toasts: state.toasts.filter((t) => t.id !== id) 
  })),
}));
