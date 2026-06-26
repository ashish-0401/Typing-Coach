import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'time' | 'words' | 'quote';
export type WordDifficulty = 'easy' | 'medium' | 'hard';

interface TypingConfigState {
  mode: Mode;
  timeSec: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  wordDifficulty: WordDifficulty;
  setMode: (mode: Mode) => void;
  setTimeSec: (timeSec: number) => void;
  setWordCount: (wordCount: number) => void;
  setPunctuation: (punctuation: boolean) => void;
  setNumbers: (numbers: boolean) => void;
  setWordDifficulty: (wordDifficulty: WordDifficulty) => void;
}

export const useTypingConfig = create<TypingConfigState>()(
  persist(
    (set) => ({
      mode: 'time',
      timeSec: 30,
      wordCount: 25,
      punctuation: false,
      numbers: false,
      wordDifficulty: 'easy',
      setMode: (mode) => set({ mode }),
      setTimeSec: (timeSec) => set({ timeSec }),
      setWordCount: (wordCount) => set({ wordCount }),
      setPunctuation: (punctuation) => set({ punctuation }),
      setNumbers: (numbers) => set({ numbers }),
      setWordDifficulty: (wordDifficulty) => set({ wordDifficulty }),
    }),
    { name: 'apc-typing-config' },
  ),
);
