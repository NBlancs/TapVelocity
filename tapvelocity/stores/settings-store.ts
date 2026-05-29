import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  musicVolume: number;   // 0–1, controls background music (game_bg, multiplayer_bg)
  sfxVolume: number;     // 0–1, controls sound effects (slash, buzzer)
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      musicVolume: 0.5,
      sfxVolume: 0.5,
      setMusicVolume: (vol) => set({ musicVolume: vol }),
      setSfxVolume: (vol) => set({ sfxVolume: vol }),
    }),
    {
      name: 'tapvelocity-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
