import { create } from 'zustand';
import type { GamePhase, TrackId } from '../types';

export const CHAPTER_ORDER = [
  '01-load-balancing',
  '02-caching',
  '03-databases',
  '04-rate-limiting',
  '05-sessions',
  '06-partitioning',
];

export const SD_CHAPTER_ORDER = [
  'sd-01-solid',
  'sd-02-patterns',
  'sd-03-refactoring',
  'sd-04-orchestration',
  'sd-05-architecture',
  'sd-06-ddd',
];

export function getChapterOrder(track: TrackId | null): string[] {
  if (track === 'software-design') return SD_CHAPTER_ORDER;
  return CHAPTER_ORDER;
}

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

function lsKey(track: TrackId | null, key: string): string {
  if (track === 'software-design') return `sd-${key}`;
  return key;
}

function loadCompletedChapters(track: TrackId | null): string[] {
  try {
    const stored = localStorage.getItem(lsKey(track, 'completed-chapters'));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function deriveCurrentChapter(completed: string[], track: TrackId | null): string {
  const order = getChapterOrder(track);
  for (let i = 0; i < order.length; i++) {
    if (!completed.includes(order[i])) {
      return order[i];
    }
  }
  return order[order.length - 1];
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

const _selectedTrack = loadSelectedTrack();
const _completedChapters = loadCompletedChapters(_selectedTrack);
const _currentChapter = deriveCurrentChapter(_completedChapters, _selectedTrack);
const _bestGrade = loadBestGrade(_currentChapter);
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
    const completed = loadCompletedChapters(track);
    const current = deriveCurrentChapter(completed, track);
    const grade = loadBestGrade(current);
    const debriefDone = loadDebriefCompleted(current);
    set({
      selectedTrack: track,
      phase: 'exploring',
      completedChapters: completed,
      currentChapter: current,
      bestGrade: grade,
      puzzleCompleted: grade !== null,
      debriefCompleted: debriefDone,
    });
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
    const { completedChapters, selectedTrack } = get();
    if (!completedChapters.includes(chapter)) {
      const updated = [...completedChapters, chapter];
      localStorage.setItem(lsKey(selectedTrack, 'completed-chapters'), JSON.stringify(updated));
      set({ completedChapters: updated });
    }
  },

  advanceToNextChapter: () => {
    const { currentChapter, selectedTrack } = get();
    const order = getChapterOrder(selectedTrack);
    const currentIndex = order.indexOf(currentChapter);
    if (currentIndex < 0 || currentIndex >= order.length - 1) {
      return false;
    }
    const nextChapter = order[currentIndex + 1];
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
