import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
const DEFAULT_SERVER_URL = 'https://tapvelocity-production.up.railway.app/graphql';

interface ServerState {
  serverUrl: string;
  wsUrl: string;
  setServerUrl: (url: string) => void;
  resetServerUrl: () => void;
}

function getWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http/, 'ws');
}

export const useServerStore = create<ServerState>()(
  persist(
    (set) => ({
      serverUrl: DEFAULT_SERVER_URL,
      wsUrl: getWsUrl(DEFAULT_SERVER_URL),
      setServerUrl: (url) => {
        set({
          serverUrl: url,
          wsUrl: getWsUrl(url),
        });
      },
      resetServerUrl: () => {
        set({
          serverUrl: DEFAULT_SERVER_URL,
          wsUrl: getWsUrl(DEFAULT_SERVER_URL),
        });
      },
    }),
    {
      name: 'tapvelocity-server-config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
