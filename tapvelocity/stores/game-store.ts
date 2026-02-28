import { create } from 'zustand';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'finished';

interface GameState {
  status: GameStatus;
  taps: number;
  timeRemaining: number;
  startTime: number | null;

  startGame: () => void;
  beginPlaying: () => void;
  recordTap: () => void;
  tick: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  taps: 0,
  timeRemaining: 10,
  startTime: null,

  startGame: () =>
    set({
      status: 'countdown',
      taps: 0,
      timeRemaining: 10,
      startTime: null,
    }),

  beginPlaying: () =>
    set({
      status: 'playing',
      startTime: Date.now(),
    }),

  recordTap: () => {
    const { status } = get();
    if (status === 'playing') {
      set((state) => ({ taps: state.taps + 1 }));
    }
  },

  tick: () => {
    const { startTime, status } = get();
    if (status !== 'playing' || !startTime) return;

    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, 10 - elapsed);

    if (remaining <= 0) {
      set({ status: 'finished', timeRemaining: 0 });
    } else {
      set({ timeRemaining: remaining });
    }
  },

  resetGame: () =>
    set({
      status: 'idle',
      taps: 0,
      timeRemaining: 10,
      startTime: null,
    }),
}));
