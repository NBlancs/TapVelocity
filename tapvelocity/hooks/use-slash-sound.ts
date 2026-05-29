import { useEffect, useRef, useCallback } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '@/stores/settings-store';

const SLASH_SOUND = require('@/assets/sounds/slash.mp3');
const POOL_SIZE = 6;

/**
 * Pre-loads a pool of AudioPlayer instances for the slash SFX using expo-audio.
 * Enables rapid-fire overlapping playback without lag or deprecation warnings.
 * Volume is reactively synced with the SFX volume setting.
 */
export function useSlashSound() {
  const pool = useRef<AudioPlayer[]>([]);
  const cursor = useRef(0);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);

  useEffect(() => {
    const players: AudioPlayer[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const player = createAudioPlayer(SLASH_SOUND);
      player.volume = sfxVolume;
      players.push(player);
    }
    pool.current = players;

    return () => {
      pool.current.forEach((player) => {
        try {
          player.release();
        } catch (e) {
          console.warn('Error releasing player:', e);
        }
      });
      pool.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync volume whenever sfxVolume changes
  useEffect(() => {
    pool.current.forEach((player) => {
      player.volume = sfxVolume;
    });
  }, [sfxVolume]);

  const play = useCallback(() => {
    const players = pool.current;
    if (players.length === 0) return;
    const player = players[cursor.current % players.length];
    cursor.current += 1;

    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('Error playing slash sound:', e);
    }
  }, []);

  return play;
}
