'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../../store/useChatStore';
import { useGlobalSocket } from '../../auth/SocketProvider';
import styles from './FloatingChat.module.css';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function ChatWindow({ chat }: { chat: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const { socket } = useGlobalSocket();
  const { closeChat, toggleMinimize, onlineUsers, typingUsers, setTyping } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOnline = onlineUsers.has(chat.conversationId.split('_')[1]); // Simplificación para demo
  const isTyping = typingUsers.get(`${chat.conversationId}_${chat.participantName}`); // Mock o real

  useEffect(() => {
    // 1. Cargar historial inicial
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3001/api/messaging/conversation/${chat.conversationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setMessages(data);
      } catch (e) { console.error(e); }
    };
    fetchMessages();

    // 2. Unirse a la sala en el socket
    if (socket) {
      socket.emit('join_conversation', chat.conversationId);
      
      const handleNewMessage = (msg: Message) => {
        if (msg.conversationId === chat.conversationId) {
          setMessages(prev => [...prev, msg]);
        }
      };

      socket.on('new_message', handleNewMessage);
      return () => { socket.off('new_message', handleNewMessage); };
    }
  }, [chat.conversationId, socket]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    if (chat.isNexo) {
        // Lógica especial para Nexo Premium
        fetch('http://localhost:3001/api/nexo/chat-persistent', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ conversationId: chat.conversationId, message: inputText })
        });
    } else {
        socket.emit('send_message', {
            conversationId: chat.conversationId,
            senderId: 'ME', // El server lo sobreescribe con el JWT
            content: inputText
        });
    }

    setInputText('');
    socket.emit('stop_typing', { conversationId: chat.conversationId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket) {
      socket.emit('typing', { conversationId: chat.conversationId });
      // Debounce stop typing...
    }
  };

  return (
    <div className={`${styles.chatWindow} ${chat.isMinimized ? styles.minimized : ''}`}>
      <header className={styles.header} onClick={() => toggleMinimize(chat.conversationId)}>
        <div className={styles.userInfo}>
          <div style={{ position: 'relative' }}>
            <img src={chat.participantAvatar || 'https://ui-avatars.com/api/?name=' + chat.participantName} className={styles.avatar} />
            <div className={`${styles.statusDot} ${isOnline ? styles.online : ''}`} />
          </div>
          <span className={styles.name}>{chat.participantName}</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); closeChat(chat.conversationId); }}>✕</button>
        </div>
      </header>

      {!chat.isMinimized && (
        <>
          <div className={styles.messageArea} ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={`${styles.msg} ${m.senderId === 'ME_ID' ? styles.msgSent : styles.msgReceived}`}>
                {m.content}
              </div>
            ))}
            {isTyping && <div className={styles.typingIndicator}>{chat.participantName} está escribiendo...</div>}
          </div>
          <form className={styles.inputArea} onSubmit={handleSendMessage}>
            <input 
              className={styles.input} 
              placeholder="Escribe un mensaje..." 
              value={inputText}
              onChange={handleInputChange}
            />
          </form>
        </>
      )}
    </div>
  );
}
