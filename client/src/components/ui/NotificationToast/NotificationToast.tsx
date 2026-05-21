'use client';

import { useEffect } from 'react';
import { useNotificationStore, Notification } from '../../../store/useNotificationStore';
import styles from './NotificationToast.module.css';

export function NotificationToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Notification, onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onRemove]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return '❤️';
      case 'FOLLOW': return '👤';
      case 'COMMENT': return '💬';
      case 'MENTION': return '🏷️';
      default: return '🔔';
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'LIKE': return '¡Nuevo Like!';
      case 'FOLLOW': return 'Nuevo Seguidor';
      case 'COMMENT': return 'Nuevo Comentario';
      case 'MENTION': return 'Te han mencionado';
      default: return 'Notificación';
    }
  };

  const getMessage = (toast: Notification) => {
    switch (toast.type) {
      case 'LIKE': return 'Alguien ha reaccionado a tu publicación.';
      case 'FOLLOW': return 'Un nuevo usuario ha comenzado a seguirte.';
      case 'COMMENT': return 'Han respondido a tu post.';
      default: return 'Tienes una nueva actualización en AniNexo.';
    }
  };

  return (
    <div className={styles.toast}>
      <div className={styles.icon}>{getIcon(toast.type)}</div>
      <div className={styles.content}>
        <strong className={styles.title}>{getTitle(toast.type)}</strong>
        <p className={styles.message}>{getMessage(toast)}</p>
      </div>
      <button className={styles.close} onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
