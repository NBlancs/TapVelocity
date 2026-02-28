import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  userId: string | null;
  username: string | null;
  setUser: (userId: string, username: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      setUser: (userId, username) => set({ userId, username }),
      clearUser: () => set({ userId: null, username: null }),
    }),
    {
      name: 'tapvelocity-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
