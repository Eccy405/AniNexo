import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

export function useTheme() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-premium');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
