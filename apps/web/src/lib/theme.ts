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
      theme: 'dark',
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'apc-theme-v2' },
  ),
);

// Keep the <html> class in sync with the store (runs on load + every change).
// The app is dark by default, so we only add a class for light mode.
function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('light', theme === 'light');
}

applyTheme(useTheme.getState().theme);
useTheme.subscribe((state) => applyTheme(state.theme));
