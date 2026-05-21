'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { socket, isConnected } = useSocket(activeConvId || undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar usuario y conversaciones al iniciar
  useEffect(() => {
    const init = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        const res = await fetch(`http://localhost:3001/api/messaging/user/${user.id}`);
        const data = await res.json();
        if (data.success) {
          setConversations(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  // Cargar historial cuando seleccionamos una conversación
  useEffect(() => {
    if (!activeConvId) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/messaging/${activeConvId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [activeConvId]);

  // Escuchar mensajes entrantes del socket
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === activeConvId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeConvId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !currentUser || !activeConvId) return;

    const newMsg = {
      conversationId: activeConvId,
      senderId: currentUser.id,
      content: inputText
    };

    // Emitir por Socket
    socket.emit('send_message', newMsg);
    
    // Optimistic UI update
    setMessages(prev => [...prev, { ...newMsg, id: Date.now(), createdAt: new Date().toISOString(), sender: { username: currentUser.username } }]);
    setInputText('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participants.find((p: any) => p.userId !== currentUser?.id)?.user || { username: 'Desconocido' };
  };

  return (
    <div style={{ display: 'flex', height: '100%', padding: '2rem', gap: '1rem' }}>
      {/* Lista de Conversaciones */}
      <Card style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Mensajes</h3>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conversations.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No tienes conversaciones.</p>
          ) : (
            conversations.map(conv => {
              const otherUser = getOtherParticipant(conv);
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: activeConvId === conv.id ? 'var(--color-surface-hover)' : 'transparent',
                    border: '1px solid var(--color-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <strong style={{ display: 'block' }}>{otherUser.username}</strong>
                  {conv.messages && conv.messages[0] && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.messages[0].content}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Ventana de Chat Activa */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Selecciona una conversación para empezar a chatear
          </div>
        ) : (
          <>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-secondary)', marginBottom: '1rem' }}>
              <strong>Chateando con: </strong> 
              <span style={{ color: 'var(--color-primary)' }}>
                {getOtherParticipant(conversations.find(c => c.id === activeConvId)).username}
              </span>
              <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: isConnected ? '#4CAF50' : 'red' }}>
                {isConnected ? '● Conectado (En Vivo)' : '○ Desconectado'}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    backgroundColor: isMe ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius-lg)',
                    borderBottomRightRadius: isMe ? 0 : 'var(--border-radius-lg)',
                    borderBottomLeftRadius: !isMe ? 0 : 'var(--border-radius-lg)',
                  }}>
                    {!isMe && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{msg.sender?.username}</div>}
                    <div>{msg.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Escribe un mensaje..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--color-secondary)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-main)',
                  fontFamily: 'inherit'
                }}
              />
              <Button type="submit" variant="primary" disabled={!inputText.trim()}>Enviar</Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
