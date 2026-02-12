import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,

  initialize: async () => {
    if (!supabase) {
      // Offline-only mode: no Supabase configured
      set({ initialized: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        user: session?.user ?? null,
        session,
        initialized: true,
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          session,
        });
      });
    } catch {
      set({ initialized: true });
    }
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) return;
    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    });
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) return;
    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      user: data.user,
      session: data.session,
      loading: false,
    });
  },

  signOut: async () => {
    if (!supabase) return;

    // Clear all game data from localStorage to prevent data leakage between users
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('puzzle-best-grade') ||
        key === 'completed-chapters' ||
        key === 'current-chapter'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    await supabase.auth.signOut();
    set({ user: null, session: null });

    // Reload page to reset all game state
    window.location.reload();
  },

  clearError: () => set({ error: null }),
}));
