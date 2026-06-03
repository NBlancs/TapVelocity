import { create } from 'zustand';
import { useUserStore } from './user-store';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'finished';
export type GameMode = 'single' | 'duo';

interface GameState {
  mode: GameMode;
  status: GameStatus;
  taps: number;
  playerOneTaps: number;
  playerTwoTaps: number;
  timeRemaining: number;
  startTime: number | null;

  setMode: (mode: GameMode) => void;
  startGame: () => void;
  beginPlaying: () => void;
  recordTap: (player?: 1 | 2) => void;
  tick: () => void;
  resetGame: () => void;
  finishGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'single',
  status: 'idle',
  taps: 0,
  playerOneTaps: 0,
  playerTwoTaps: 0,
  timeRemaining: 10,
  startTime: null,

  setMode: (mode) => set({ mode }),

  startGame: () =>
    set({
      status: 'countdown',
      taps: 0,
      playerOneTaps: 0,
      playerTwoTaps: 0,
      timeRemaining: 10 + useUserStore.getState().timeExtensionSeconds,
      startTime: null,
    }),

  beginPlaying: () =>
    set({
      status: 'playing',
      startTime: Date.now(),
    }),

  recordTap: (player = 1) => {
    const { status, mode } = get();
    if (status === 'playing') {
      if (mode === 'duo') {
        set((state) => ({
          playerOneTaps: player === 1 ? state.playerOneTaps + 1 : state.playerOneTaps,
          playerTwoTaps: player === 2 ? state.playerTwoTaps + 1 : state.playerTwoTaps,
        }));
      } else {
        set((state) => ({ taps: state.taps + 1 }));
      }
    }
  },

  tick: () => {
    const { startTime, status } = get();
    if (status !== 'playing' || !startTime) return;

    const elapsed = (Date.now() - startTime) / 1000;
    const duration = 10 + useUserStore.getState().timeExtensionSeconds;
    const remaining = Math.max(0, duration - elapsed);

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
      playerOneTaps: 0,
      playerTwoTaps: 0,
      timeRemaining: 10 + useUserStore.getState().timeExtensionSeconds,
      startTime: null,
    }),

  finishGame: () =>
    set({
      status: 'finished',
      timeRemaining: 0,
    }),
}));
