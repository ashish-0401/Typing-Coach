import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'apc-theme' },
  ),
);

// Keep the <html> class in sync with the store (runs on load + every change).
function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

applyTheme(useTheme.getState().theme);
useTheme.subscribe((state) => applyTheme(state.theme));
