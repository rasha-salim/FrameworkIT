import { create } from 'zustand';
import type { GamePhase } from '../types';

export const CHAPTER_ORDER = [
  '01-load-balancing',
  '02-caching',
  '03-databases',
];

interface GameState {
  phase: GamePhase;
  currentChapter: string;
  currentPuzzleId: string | null;
  puzzleCompleted: boolean;
  bestGrade: string | null;
  completedChapters: string[];

  setPhase: (phase: GamePhase) => void;
  setCurrentChapter: (chapter: string) => void;
  setCurrentPuzzleId: (id: string | null) => void;
  setPuzzleCompleted: (completed: boolean) => void;
  setBestGrade: (grade: string | null) => void;
  markChapterCompleted: (chapter: string) => void;
  advanceToNextChapter: () => boolean;
  isChapterCompleted: (chapter: string) => boolean;
}

function loadCompletedChapters(): string[] {
  try {
    const stored = localStorage.getItem('completed-chapters');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function deriveCurrentChapter(completed: string[]): string {
  for (let i = 0; i < CHAPTER_ORDER.length; i++) {
    if (!completed.includes(CHAPTER_ORDER[i])) {
      return CHAPTER_ORDER[i];
    }
  }
  // All completed - stay on last chapter
  return CHAPTER_ORDER[CHAPTER_ORDER.length - 1];
}

const _completedChapters = loadCompletedChapters();

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'exploring',
  currentChapter: deriveCurrentChapter(_completedChapters),
  currentPuzzleId: null,
  puzzleCompleted: false,
  bestGrade: null,
  completedChapters: _completedChapters,

  setPhase: (phase) => set({ phase }),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setCurrentPuzzleId: (id) => set({ currentPuzzleId: id }),
  setPuzzleCompleted: (completed) => set({ puzzleCompleted: completed }),
  setBestGrade: (grade) => set({ bestGrade: grade }),

  markChapterCompleted: (chapter) => {
    const { completedChapters } = get();
    if (!completedChapters.includes(chapter)) {
      const updated = [...completedChapters, chapter];
      localStorage.setItem('completed-chapters', JSON.stringify(updated));
      set({ completedChapters: updated });
    }
  },

  advanceToNextChapter: () => {
    const { currentChapter } = get();
    const currentIndex = CHAPTER_ORDER.indexOf(currentChapter);
    if (currentIndex < 0 || currentIndex >= CHAPTER_ORDER.length - 1) {
      return false;
    }
    const nextChapter = CHAPTER_ORDER[currentIndex + 1];
    set({
      currentChapter: nextChapter,
      currentPuzzleId: null,
      puzzleCompleted: false,
      bestGrade: null,
    });
    return true;
  },

  isChapterCompleted: (chapter) => {
    return get().completedChapters.includes(chapter);
  },
}));
