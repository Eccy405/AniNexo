import { create } from 'zustand';

interface ChatWindow {
  conversationId: string;
  isMinimized: boolean;
  participantName: string;
  participantAvatar?: string;
  isNexo?: boolean;
}

interface ChatState {
  activeChats: ChatWindow[];
  onlineUsers: Set<string>;
  typingUsers: Map<string, boolean>; // convId_userId -> typing
  
  openChat: (convo: ChatWindow) => void;
  closeChat: (convoId: string) => void;
  toggleMinimize: (convoId: string) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  setTyping: (convoId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChats: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),

  openChat: (convo) => set((state) => {
    if (state.activeChats.find(c => c.conversationId === convo.conversationId)) {
      return { 
        activeChats: state.activeChats.map(c => 
          c.conversationId === convo.conversationId ? { ...c, isMinimized: false } : c
        ) 
      };
    }
    // Límite de 3 chats abiertos simultáneamente para no saturar la UI
    const newChats = [...state.activeChats, convo].slice(-3);
    return { activeChats: newChats };
  }),

  closeChat: (convoId) => set((state) => ({
    activeChats: state.activeChats.filter(c => c.conversationId !== convoId)
  })),

  toggleMinimize: (convoId) => set((state) => ({
    activeChats: state.activeChats.map(c => 
      c.conversationId === convoId ? { ...c, isMinimized: !c.isMinimized } : c
    )
  })),

  setOnlineStatus: (userId, isOnline) => set((state) => {
    const newSet = new Set(state.onlineUsers);
    if (isOnline) newSet.add(userId);
    else newSet.delete(userId);
    return { onlineUsers: newSet };
  }),

  setTyping: (convoId, userId, isTyping) => set((state) => {
    const newMap = new Map(state.typingUsers);
    newMap.set(`${convoId}_${userId}`, isTyping);
    return { typingUsers: newMap };
  })
}));
