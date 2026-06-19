'use client';

import React, { useEffect, useRef } from 'react';
import { Card } from '../ui/Card/Card';
import styles from './ChatModal.module.css';

interface ChatModalProps {
  profile: any;
  currentUser: any;
  conversationId: string | null;
  chatMessages: any[];
  chatInput: string;
  isConnected: boolean;
  isSending: boolean;
  setChatInput: (value: string) => void;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  profile,
  currentUser,
  conversationId,
  chatMessages,
  chatInput,
  isConnected,
  isSending,
  setChatInput,
  onSendMessage,
  onClose
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isSending) {
      onSendMessage(chatInput);
    }
  };

  return (
    <div className={styles.chatModalOverlay} onClick={onClose}>
      <Card className={styles.chatModalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.chatHeader}>
          <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Chat con @{profile.username}</h3>
          <button className={styles.btnClose} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.chatMessages}>
          {chatMessages.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              Aún no hay mensajes. ¡Sé el primero!
            </p>
          ) : (
            chatMessages.map((msg: any) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  borderBottomRightRadius: isMe ? 0 : '16px',
                  borderBottomLeftRadius: !isMe ? 0 : '16px',
                }}>
                  {!isMe && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                      {msg.sender?.username || profile.username}
                    </div>
                  )}
                  <div>{msg.content}</div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} className={styles.chatInputForm}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className={styles.chatInput}
            disabled={!isConnected || isSending}
          />
          <button type="submit" className={styles.chatSendBtn} disabled={!chatInput.trim() || isSending}>
            Enviar
          </button>
        </form>

        <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: isConnected ? '#4CAF50' : 'red' }}>
          {isConnected ? '● En línea' : '○ Desconectado'}
        </div>
      </Card>
    </div>
  );
};