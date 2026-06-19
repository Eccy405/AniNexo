'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '../../../../hooks/useSocket';
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { Users } from 'lucide-react';

interface Participant {
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender?: {
    username: string;
    avatarUrl?: string;
  };
  isRead?: boolean;
}

interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  theme?: string;
  adminId?: string;
  participants: Participant[];
}

export default function ChatWithIdPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { socket, isConnected } = useSocket(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        const convRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messaging/conversation/${conversationId}`);
        const convData = await convRes.json();
        if (convData.success) {
          setConversation(convData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messaging/conversation/${conversationId}`);
        const data = await res.json();
        if (data.success) {
          setConversation(data.data);
          setMessages(data.data?.messages || []);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !currentUser || !conversationId) return;

    const newMsg = {
      conversationId,
      senderId: currentUser.id,
      content: inputText
    };

    socket.emit('send_message', newMsg);
    
    setMessages(prev => [...prev, { 
      ...newMsg, 
      id: Date.now().toString(), 
      createdAt: new Date().toISOString(), 
      sender: { username: currentUser.username, avatarUrl: currentUser.avatarUrl } 
    }]);
    setInputText('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', padding: '2rem', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando conversación...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', padding: '2rem', gap: '1rem' }}>
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {conversation?.isGroup ? (
            conversation?.avatar ? (
              <img src={conversation.avatar} alt={conversation.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                background: conversation?.theme || 'linear-gradient(135deg, #00E5FF, #00B8D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700
              }}>
                {conversation?.name?.charAt(0) || 'G'}
              </div>
            )
          ) : (
            <img 
              src={conversation?.participants?.find(p => p.user.id !== currentUser?.id)?.user.avatarUrl || 'https://ui-avatars.com/api/?name=User'} 
              alt="contact" 
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
            />
          )}
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>
              {conversation?.isGroup ? conversation?.name : conversation?.participants?.find(p => p.user.id !== currentUser?.id)?.user.username}
            </strong>
            {conversation?.isGroup && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} /> {conversation?.participants?.length || 0} miembros
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: isConnected ? '#4CAF50' : 'red' }}>
              {isConnected ? '● En línea' : '○ Desconectado'}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              Aún no hay mensajes. ¡Sé el primero!
            </p>
          ) : (
            messages.map(msg => {
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
                  {!isMe && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                      {msg.sender?.username || 'Desconocido'}
                    </div>
                  )}
                  <div>{msg.content}</div>
                  <div style={{ fontSize: '0.7rem', color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', marginTop: '0.3rem', textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
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
      </Card>
    </div>
  );
}