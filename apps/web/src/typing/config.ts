import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'time' | 'words';

interface TypingConfigState {
  mode: Mode;
  timeSec: number;
  wordCount: number;
  setMode: (mode: Mode) => void;
  setTimeSec: (timeSec: number) => void;
  setWordCount: (wordCount: number) => void;
}

export const useTypingConfig = create<TypingConfigState>()(
  persist(
    (set) => ({
      mode: 'time',
      timeSec: 30,
      wordCount: 25,
      setMode: (mode) => set({ mode }),
      setTimeSec: (timeSec) => set({ timeSec }),
      setWordCount: (wordCount) => set({ wordCount }),
    }),
    { name: 'apc-typing-config' },
  ),
);
