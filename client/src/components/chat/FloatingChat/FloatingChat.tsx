'use client';

import { useChatStore } from '../../../store/useChatStore';
import { ChatWindow } from './ChatWindow';
import styles from './FloatingChat.module.css';

export function FloatingChatContainer() {
  const activeChats = useChatStore((s) => s.activeChats);

  return (
    <div className={styles.chatContainer}>
      {activeChats.map((chat) => (
        <ChatWindow 
          key={chat.conversationId} 
          chat={chat} 
        />
      ))}
    </div>
  );
}
