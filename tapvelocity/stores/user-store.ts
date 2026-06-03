import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LevelInfo {
  level: number;
  title: string;
  totalTaps: number;
  tapsToNextLevel: number;
  nextLevelTaps: number;
  currentLevelMin: number;
  progress: number;
}

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Novice', tapsRequired: 0 },
  { level: 2, title: 'Apprentice', tapsRequired: 200 },
  { level: 3, title: 'Warrior', tapsRequired: 400 },
  { level: 4, title: 'Veteran', tapsRequired: 600 },
  { level: 5, title: 'Master', tapsRequired: 1000 },
  { level: 6, title: 'Grandmaster', tapsRequired: 2000 },
];

export const RANK_BADGES: Record<string, any> = {
  Novice: require('@/assets/images/novice_rank.png'),
  Apprentice: require('@/assets/images/apprentice_rank.png'),
  Warrior: require('@/assets/images/warrior_rank.png'),
  Veteran: require('@/assets/images/veteran_rank.png'),
  Master: require('@/assets/images/master_rank.png'),
  Grandmaster: require('@/assets/images/grandmaster_rank.png'),
};

export const DAMAGE_INDICATORS: Record<number, any> = {
  1: require('@/assets/images/minuslife.png'),
  2: require('@/assets/images/two-minuslife.png'),
  3: require('@/assets/images/three-minuslife.png'),
  4: require('@/assets/images/four-minuslife.png'),
  5: require('@/assets/images/five-minuslife.png'),
};

export function getLevelInfo(totalTaps: number): LevelInfo {
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalTaps >= LEVEL_THRESHOLDS[i].tapsRequired) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || null;
    } else {
      break;
    }
  }

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      totalTaps,
      tapsToNextLevel: 0,
      nextLevelTaps: 0,
      currentLevelMin: current.tapsRequired,
      progress: 1.0,
    };
  }

  const range = next.tapsRequired - current.tapsRequired;
  const earned = totalTaps - current.tapsRequired;
  const progress = Math.min(Math.max(earned / range, 0), 1);

  return {
    level: current.level,
    title: current.title,
    totalTaps,
    tapsToNextLevel: next.tapsRequired - totalTaps,
    nextLevelTaps: next.tapsRequired,
    currentLevelMin: current.tapsRequired,
    progress,
  };
}

interface UserState {
  userId: string | null;
  username: string | null;
  totalTaps: number;
  currency: number;
  attackDamageTier: number;
  timeExtensionSeconds: number;
  setUser: (userId: string, username: string) => void;
  clearUser: () => void;
  addTaps: (count: number) => void;
  addCurrency: (amount: number) => void;
  purchaseAttackUpgrade: (cost: number) => void;
  purchaseTimeUpgrade: (cost: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      totalTaps: 0,
      currency: 0,
      attackDamageTier: 1,
      timeExtensionSeconds: 0,
      setUser: (userId, username) => set({ userId, username }),
      clearUser: () =>
        set({
          userId: null,
          username: null,
          totalTaps: 0,
          currency: 0,
          attackDamageTier: 1,
          timeExtensionSeconds: 0,
        }),
      addTaps: (count) => set((state) => ({ totalTaps: state.totalTaps + count })),
      addCurrency: (amount) => set((state) => ({ currency: state.currency + amount })),
      purchaseAttackUpgrade: (cost) =>
        set((state) => ({
          currency: state.currency - cost,
          attackDamageTier: Math.min(5, state.attackDamageTier + 1),
        })),
      purchaseTimeUpgrade: (cost) =>
        set((state) => ({
          currency: state.currency - cost,
          timeExtensionSeconds: Math.min(10, state.timeExtensionSeconds + 1),
        })),
    }),
    {
      name: 'tapvelocity-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
