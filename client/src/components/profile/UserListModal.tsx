'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card/Card';

interface UserListModalProps {
  type: 'followers' | 'following';
  userId: string;
  onClose: () => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({ type, userId, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(type === 'followers' ? 'Seguidores' : 'Siguiendo');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'followers' ? 'followers' : 'following';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/social/${endpoint}/${userId}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>{title}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="users-list">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
          ) : users.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '2rem', textAlign: 'center' }}>
              No hay {type === 'followers' ? 'seguidores' : 'usuarios'} que mostrar
            </p>
          ) : (
            users.map((user) => (
              <a key={user.id} href={`/dashboard/profile/${user.username}`} className="user-item">
                <img 
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`} 
                  alt={user.username} 
                  className="user-avatar"
                />
                <span className="username">{user.username}</span>
                {user.isPremium && <span className="premium-badge">PREMIUM</span>}
              </a>
            ))
          )}
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .modal-content {
            width: 100%;
            max-width: 400px;
            max-height: 80vh;
            background: var(--color-surface);
            border: 1px solid var(--color-secondary);
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .modal-header {
            padding: 20px;
            border-bottom: 1px solid var(--color-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .btn-close {
            background: none;
            border: none;
            color: var(--color-text-main);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .users-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
          }
          .user-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            text-decoration: none;
            border-radius: 12px;
            transition: background 0.2s;
          }
          .user-item:hover {
            background: var(--color-surface-hover);
          }
          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
          }
          .username {
            color: var(--color-text-main);
            font-weight: 600;
          }
          .premium-badge {
            background: gold;
            color: black;
            font-size: 0.6rem;
            font-weight: 900;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            margin-left: auto;
          }
        `}</style>
      </Card>
    </div>
  );
};