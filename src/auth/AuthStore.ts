import { create } from 'zustand';

const PLAYER_NAME_KEY = 'player-name';

interface AuthState {
  playerName: string | null;
  initialized: boolean;

  initialize: () => void;
  setPlayerName: (name: string) => void;
  clearPlayer: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  playerName: null,
  initialized: false,

  initialize: () => {
    const stored = localStorage.getItem(PLAYER_NAME_KEY);
    set({ playerName: stored, initialized: true });
  },

  setPlayerName: (name: string) => {
    localStorage.setItem(PLAYER_NAME_KEY, name);
    set({ playerName: name });
  },

  clearPlayer: () => {
    localStorage.removeItem(PLAYER_NAME_KEY);

    // Clear all game data
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

    set({ playerName: null });
    window.location.reload();
  },
}));
