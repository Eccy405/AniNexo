import { create } from 'zustand';

interface UIState {
  theme: 'dark' | 'light' | 'premium';
  sidebarOpen: boolean;
  backgroundMode: 'full' | 'reduced' | 'static';
  setTheme: (theme: 'dark' | 'light' | 'premium') => void;
  toggleSidebar: () => void;
  setBackgroundMode: (backgroundMode: 'full' | 'reduced' | 'static') => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  backgroundMode: 'full',
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setBackgroundMode: (backgroundMode) => set({ backgroundMode }),
}));
