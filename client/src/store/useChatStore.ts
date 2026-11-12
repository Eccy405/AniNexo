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
  onlineUsers: Set<string>; // kept for backward compatibility if needed
  userStatuses: Record<string, 'online' | 'away' | 'busy' | 'offline'>;
  typingUsers: Map<string, boolean>; // convId_userId -> typing

  // Unread counters for floating Messenger & friend list
  totalUnreadMessages: number;
  unreadByConversation: Record<string, number>;
  unreadBySender: Record<string, number>;
  conversationToSender: Record<string, string>;
  seenUnreadMsgIds: Record<string, true>;
  activeFloatingConversationId: string | null;
  isFloatingChatMinimized: boolean;
  
  openChat: (convo: ChatWindow) => void;
  closeChat: (convoId: string) => void;
  toggleMinimize: (convoId: string) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  setUserStatus: (userId: string, status: 'online' | 'away' | 'busy' | 'offline') => void;
  setTyping: (convoId: string, userId: string, isTyping: boolean) => void;
  setActiveFloatingChat: (conversationId: string | null, isMinimized?: boolean) => void;
  setUnreadSummary: (summary: { totalUnread: number; byConversation: Record<string, number>; bySender: Record<string, number> }) => void;
  incrementUnreadForMessage: (msg: { id?: string | number; conversationId?: string; senderId?: string }) => void;
  clearUnreadForConversation: (conversationId: string, senderId?: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChats: [],
  onlineUsers: new Set(),
  userStatuses: {},
  typingUsers: new Map(),
  totalUnreadMessages: 0,
  unreadByConversation: {},
  unreadBySender: {},
  conversationToSender: {},
  seenUnreadMsgIds: {},
  activeFloatingConversationId: null,
  isFloatingChatMinimized: false,

  openChat: (convo) => set((state) => {
    if (state.activeChats.find(c => c.conversationId === convo.conversationId)) {
      return { 
        activeChats: state.activeChats.map(c => 
          c.conversationId === convo.conversationId ? { ...c, isMinimized: false } : c
        ) 
      };
    }
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
    return { 
      onlineUsers: newSet,
      userStatuses: { 
        ...state.userStatuses, 
        [userId]: isOnline ? 'online' : 'offline' 
      }
    };
  }),

  setUserStatus: (userId, status) => set((state) => {
    const newSet = new Set(state.onlineUsers);
    if (status !== 'offline') newSet.add(userId);
    else newSet.delete(userId);
    return {
      onlineUsers: newSet,
      userStatuses: {
        ...state.userStatuses,
        [userId]: status
      }
    };
  }),

  setTyping: (convoId, userId, isTyping) => set((state) => {
    const newMap = new Map(state.typingUsers);
    newMap.set(`${convoId}_${userId}`, isTyping);
    return { typingUsers: newMap };
  }),

  setActiveFloatingChat: (conversationId, isMinimized = false) => set({
    activeFloatingConversationId: conversationId,
    isFloatingChatMinimized: isMinimized
  }),

  setUnreadSummary: (summary) => set({
    totalUnreadMessages: summary.totalUnread || 0,
    unreadByConversation: summary.byConversation || {},
    unreadBySender: summary.bySender || {}
  }),

  incrementUnreadForMessage: (msg) => set((state) => {
    if (!msg.conversationId || !msg.senderId) return state;
    const msgId = msg.id !== undefined ? String(msg.id) : '';
    if (msgId && state.seenUnreadMsgIds[msgId]) return state;

    const nextByConv = {
      ...state.unreadByConversation,
      [msg.conversationId]: (state.unreadByConversation[msg.conversationId] || 0) + 1
    };
    const nextBySender = {
      ...state.unreadBySender,
      [msg.senderId]: (state.unreadBySender[msg.senderId] || 0) + 1
    };
    const nextTotal = Object.values(nextByConv).reduce((acc, n) => acc + n, 0);

    return {
      unreadByConversation: nextByConv,
      unreadBySender: nextBySender,
      conversationToSender: {
        ...state.conversationToSender,
        [msg.conversationId]: msg.senderId
      },
      seenUnreadMsgIds: msgId
        ? { ...state.seenUnreadMsgIds, [msgId]: true }
        : state.seenUnreadMsgIds,
      totalUnreadMessages: nextTotal
    };
  }),

  clearUnreadForConversation: (conversationId, senderId) => set((state) => {
    const prevConvCount = state.unreadByConversation[conversationId] || 0;
    const resolvedSenderId = senderId || state.conversationToSender[conversationId];
    const hasSenderCount = resolvedSenderId ? (state.unreadBySender[resolvedSenderId] || 0) > 0 : false;

    if (prevConvCount === 0 && !hasSenderCount) return state;

    const nextByConv = { ...state.unreadByConversation };
    delete nextByConv[conversationId];

    const nextBySender = { ...state.unreadBySender };
    if (resolvedSenderId) {
      if (prevConvCount > 0 && nextBySender[resolvedSenderId] !== undefined) {
        const remaining = nextBySender[resolvedSenderId] - prevConvCount;
        if (remaining > 0) nextBySender[resolvedSenderId] = remaining;
        else delete nextBySender[resolvedSenderId];
      } else {
        delete nextBySender[resolvedSenderId];
      }
    }

    const nextTotal = Object.values(nextByConv).reduce((acc, n) => acc + n, 0);
    return {
      unreadByConversation: nextByConv,
      unreadBySender: nextBySender,
      totalUnreadMessages: nextTotal
    };
  })
}));
