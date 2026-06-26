import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'time' | 'words' | 'prose';

interface TypingConfigState {
  mode: Mode;
  timeSec: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  wordDiff: number;
  setMode: (mode: Mode) => void;
  setTimeSec: (timeSec: number) => void;
  setWordCount: (wordCount: number) => void;
  setPunctuation: (punctuation: boolean) => void;
  setNumbers: (numbers: boolean) => void;
  setWordDiff: (wordDiff: number) => void;
}

export const useTypingConfig = create<TypingConfigState>()(
  persist(
    (set) => ({
      mode: 'time',
      timeSec: 30,
      wordCount: 25,
      punctuation: false,
      numbers: false,
      wordDiff: 1,
      setMode: (mode) => set({ mode }),
      setTimeSec: (timeSec) => set({ timeSec }),
      setWordCount: (wordCount) => set({ wordCount }),
      setPunctuation: (punctuation) => set({ punctuation }),
      setNumbers: (numbers) => set({ numbers }),
      setWordDiff: (wordDiff) => set({ wordDiff }),
    }),
    { name: 'apc-typing-config' },
  ),
);
