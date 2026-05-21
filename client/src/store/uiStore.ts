import { create } from 'zustand';

interface UIState {
  theme: 'dark' | 'light' | 'premium';
  sidebarOpen: boolean;
  setTheme: (theme: 'dark' | 'light' | 'premium') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
