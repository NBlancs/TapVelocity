import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getDefaultHost = () => {
  return Platform.select({
    android: '10.0.2.2',
    default: 'localhost',
  });
};

const DEFAULT_SERVER_URL = `http://${getDefaultHost()}:4000/graphql`;

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
