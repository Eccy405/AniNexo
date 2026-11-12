'use client';

import { useEffect, useState } from 'react';
import styles from './notifications.module.css';

interface Notification {
  id: string;
  type: 'LIKE' | 'FOLLOW' | 'COMMENT' | 'MENTION' | 'SYSTEM' | 'MESSAGE' | 'BADGE' | 'NEXO';
  referenceId?: string;
  title?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Actualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const getMessage = (n: Notification) => {
    if (n.message) return n.message;
    switch (n.type) {
      case 'LIKE': return 'Le ha gustado tu publicación';
      case 'FOLLOW': return 'Ha comenzado a seguirte';
      case 'COMMENT': return 'Ha comentado en tu post';
      case 'MESSAGE': return 'Tienes un nuevo mensaje en tu chat';
      case 'MENTION': return 'Te ha mencionado en una conversación';
      default: return 'Nueva actualización en tu cuenta';
    }
  };

  if (loading) {
    return <div className={styles.container}><p>Cargando notificaciones...</p></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Notificaciones</h1>
        {notifications.some(n => !n.isRead) && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Marcar todas como leídas
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <p>No tienes notificaciones aún.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <div key={n.id} className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}>
              <div className={styles.icon}>{getIcon(n.type)}</div>
              <div className={styles.content}>
                <p className={styles.text}>{getMessage(n)}</p>
                <span className={styles.time}>
                  {new Date(n.createdAt).toLocaleDateString()} a las {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
