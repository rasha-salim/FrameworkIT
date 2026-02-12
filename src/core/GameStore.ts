import { create } from 'zustand';
import type { GamePhase } from '../types';

interface GameState {
  phase: GamePhase;
  currentChapter: string;
  currentPuzzleId: string | null;
  puzzleCompleted: boolean;
  bestGrade: string | null;

  setPhase: (phase: GamePhase) => void;
  setCurrentChapter: (chapter: string) => void;
  setCurrentPuzzleId: (id: string | null) => void;
  setPuzzleCompleted: (completed: boolean) => void;
  setBestGrade: (grade: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'exploring',
  currentChapter: '01-load-balancing',
  currentPuzzleId: null,
  puzzleCompleted: false,
  bestGrade: null,

  setPhase: (phase) => set({ phase }),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setCurrentPuzzleId: (id) => set({ currentPuzzleId: id }),
  setPuzzleCompleted: (completed) => set({ puzzleCompleted: completed }),
  setBestGrade: (grade) => set({ bestGrade: grade }),
}));
