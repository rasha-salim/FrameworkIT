import { supabase } from '../lib/supabase';
import { useAuthStore } from '../auth/AuthStore';
import { useGameStore, CHAPTER_ORDER } from '../core/GameStore';

let pushTimer: ReturnType<typeof setTimeout> | null = null;

function getUser() {
  return useAuthStore.getState().user;
}

function readLocalProgress() {
  const completedChapters: string[] = (() => {
    try {
      const stored = localStorage.getItem('completed-chapters');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const bestGrades: Record<string, string> = {};
  for (const ch of CHAPTER_ORDER) {
    const grade = localStorage.getItem(`puzzle-best-grade-${ch}`);
    if (grade) {
      bestGrades[ch] = grade;
    }
  }

  // Derive current chapter from completed chapters
  let currentChapter = CHAPTER_ORDER[0];
  for (let i = 0; i < CHAPTER_ORDER.length; i++) {
    if (completedChapters.includes(CHAPTER_ORDER[i]) && i + 1 < CHAPTER_ORDER.length) {
      currentChapter = CHAPTER_ORDER[i + 1];
    }
  }

  return { completedChapters, bestGrades, currentChapter };
}

function writeLocalProgress(data: {
  completed_chapters: string[];
  best_grades: Record<string, string>;
  current_chapter: string;
}) {
  localStorage.setItem('completed-chapters', JSON.stringify(data.completed_chapters));
  for (const [ch, grade] of Object.entries(data.best_grades)) {
    localStorage.setItem(`puzzle-best-grade-${ch}`, grade);
  }

  // Update GameStore to reflect cloud data
  const store = useGameStore.getState();
  store.setCurrentChapter(data.current_chapter);

  // Sync completed chapters into store
  for (const ch of data.completed_chapters) {
    if (!store.completedChapters.includes(ch)) {
      store.markChapterCompleted(ch);
    }
  }
}

export async function pullFromCloud(): Promise<void> {
  if (!supabase) return;
  const user = getUser();
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row found: first login, push local data up
      await pushToCloud();
      return;
    }

    if (error) {
      console.warn('[ProgressSync] pull failed:', error.message);
      return;
    }

    if (data) {
      writeLocalProgress({
        completed_chapters: data.completed_chapters || [],
        best_grades: data.best_grades || {},
        current_chapter: data.current_chapter || CHAPTER_ORDER[0],
      });
    }
  } catch (err) {
    console.warn('[ProgressSync] pull error:', err);
  }
}

export async function pushToCloud(): Promise<void> {
  if (!supabase) return;
  const user = getUser();
  if (!user) return;

  try {
    const local = readLocalProgress();
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        completed_chapters: local.completedChapters,
        best_grades: local.bestGrades,
        current_chapter: local.currentChapter,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[ProgressSync] push failed:', error.message);
    }
  } catch (err) {
    console.warn('[ProgressSync] push error:', err);
  }
}

export function schedulePush(): void {
  if (!supabase || !getUser()) return;

  if (pushTimer) {
    clearTimeout(pushTimer);
  }
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushToCloud();
  }, 2000);
}
