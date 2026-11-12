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
      case 'MESSAGE': return '✉️';
      case 'MENTION': return '🏷️';
      case 'SYSTEM': return '🤝';
      case 'BADGE': return '🏅';
      default: return '🔔';
    }
  };

  const getTitle = (toast: Notification) => {
    if (toast.title) return toast.title;
    switch (toast.type) {
      case 'LIKE': return '¡Nuevo Like!';
      case 'FOLLOW': return 'Nuevo Seguidor';
      case 'COMMENT': return 'Nuevo Comentario';
      case 'MESSAGE': return 'Nuevo Mensaje';
      case 'MENTION': return 'Te han mencionado';
      case 'SYSTEM': return 'Solicitud de Amistad';
      case 'BADGE': return '¡Nueva Medalla!';
      default: return 'Notificación';
    }
  };

  const getMessage = (toast: Notification) => {
    if (toast.message) return toast.message;
    switch (toast.type) {
      case 'LIKE': return 'Alguien ha reaccionado a tu publicación.';
      case 'FOLLOW': return 'Un nuevo usuario ha comenzado a seguirte.';
      case 'COMMENT': return 'Han respondido a tu post.';
      case 'MESSAGE': return 'Has recibido un nuevo mensaje.';
      case 'SYSTEM': return 'Tienes una nueva solicitud de amistad.';
      default: return 'Tienes una nueva actualización en AniNexo.';
    }
  };

  const handleToastClick = () => {
    if (toast.type === 'MESSAGE' && toast.referenceId) {
      window.dispatchEvent(new CustomEvent('aninexo:open-chat', {
        detail: { conversationId: toast.referenceId }
      }));
      onRemove();
    }
  };

  return (
    <div
      className={styles.toast}
      onClick={handleToastClick}
      style={{ cursor: toast.type === 'MESSAGE' ? 'pointer' : 'default' }}
    >
      <div className={styles.icon}>{getIcon(toast.type)}</div>
      <div className={styles.content}>
        <strong className={styles.title}>{getTitle(toast)}</strong>
        <p className={styles.message}>{getMessage(toast)}</p>
      </div>
      <button
        className={styles.close}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ✕
      </button>
    </div>
  );
}
