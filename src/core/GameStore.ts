import { create } from 'zustand';
import type { GamePhase, TrackId } from '../types';

export const CHAPTER_ORDER = [
  '01-load-balancing',
  '02-caching',
  '03-databases',
  '04-rate-limiting',
];

interface GameState {
  phase: GamePhase;
  selectedTrack: TrackId | null;
  currentChapter: string;
  currentPuzzleId: string | null;
  puzzleCompleted: boolean;
  debriefCompleted: boolean;
  bestGrade: string | null;
  completedChapters: string[];

  setPhase: (phase: GamePhase) => void;
  selectTrack: (track: TrackId) => void;
  backToTrackSelect: () => void;
  setCurrentChapter: (chapter: string) => void;
  setCurrentPuzzleId: (id: string | null) => void;
  setPuzzleCompleted: (completed: boolean) => void;
  setBestGrade: (grade: string | null) => void;
  saveGrade: (chapter: string, grade: string) => void;
  markDebriefCompleted: (chapter: string) => void;
  isDebriefCompleted: (chapter: string) => boolean;
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

function loadBestGrade(chapter: string): string | null {
  return localStorage.getItem(`puzzle-best-grade-${chapter}`);
}

function loadDebriefCompleted(chapter: string): boolean {
  return localStorage.getItem(`debrief-completed-${chapter}`) === 'true';
}

function loadSelectedTrack(): TrackId | null {
  const stored = localStorage.getItem('selected-track');
  if (stored === 'system-design' || stored === 'software-design') return stored;
  return null;
}

const _completedChapters = loadCompletedChapters();
const _currentChapter = deriveCurrentChapter(_completedChapters);
const _bestGrade = loadBestGrade(_currentChapter);
const _selectedTrack = loadSelectedTrack();
const _debriefCompleted = loadDebriefCompleted(_currentChapter);

export const useGameStore = create<GameState>((set, get) => ({
  phase: _selectedTrack ? 'exploring' : 'track-select',
  selectedTrack: _selectedTrack,
  currentChapter: _currentChapter,
  currentPuzzleId: null,
  puzzleCompleted: _bestGrade !== null,
  debriefCompleted: _debriefCompleted,
  bestGrade: _bestGrade,
  completedChapters: _completedChapters,

  setPhase: (phase) => set({ phase }),

  selectTrack: (track) => {
    localStorage.setItem('selected-track', track);
    set({ selectedTrack: track, phase: 'exploring' });
  },

  backToTrackSelect: () => {
    localStorage.removeItem('selected-track');
    set({ selectedTrack: null, phase: 'track-select' });
  },

  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setCurrentPuzzleId: (id) => set({ currentPuzzleId: id }),
  setPuzzleCompleted: (completed) => set({ puzzleCompleted: completed }),
  setBestGrade: (grade) => set({ bestGrade: grade }),

  saveGrade: (chapter, grade) => {
    const gradeKey = `puzzle-best-grade-${chapter}`;
    const existing = localStorage.getItem(gradeKey);
    const gradeRank: Record<string, number> = { none: 0, bronze: 1, silver: 2, gold: 3 };
    if (!existing || gradeRank[grade] > (gradeRank[existing] || 0)) {
      localStorage.setItem(gradeKey, grade);
    }
    set({ puzzleCompleted: true, bestGrade: grade });
  },

  markDebriefCompleted: (chapter) => {
    localStorage.setItem(`debrief-completed-${chapter}`, 'true');
    set({ debriefCompleted: true });
  },

  isDebriefCompleted: (chapter) => {
    return loadDebriefCompleted(chapter);
  },

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
    const nextBestGrade = loadBestGrade(nextChapter);
    const nextDebriefDone = loadDebriefCompleted(nextChapter);
    set({
      currentChapter: nextChapter,
      currentPuzzleId: null,
      puzzleCompleted: nextBestGrade !== null,
      debriefCompleted: nextDebriefDone,
      bestGrade: nextBestGrade,
    });
    return true;
  },

  isChapterCompleted: (chapter) => {
    return get().completedChapters.includes(chapter);
  },
}));
