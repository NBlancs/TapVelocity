import { useEffect, useRef } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useGameStore, GameStatus, GameMode } from '@/stores/game-store';
import { useSettingsStore } from '@/stores/settings-store';

const MENU_MUSIC = require('@/assets/sounds/game_bg.mp3');
const MULTI_MUSIC = require('@/assets/sounds/multiplayer_bg.mp3');
const BUZZER_SFX = require('@/assets/sounds/buzzer.mp3');
const COUNTDOWN_SFX = require('@/assets/sounds/countdown.mp3');

/**
 * Manages all background music and the buzzer SFX based on game state.
 *
 * - idle          → game_bg.mp3 (looping)
 * - playing + duo → multiplayer_bg.mp3 (looping)
 * - finished      → buzzer.mp3 (one-shot), then silence
 * - countdown     → countdown.mp3 (one-shot)
 *
 * Volume is driven by the persisted settings store.
 */
export function useBackgroundMusic() {
  const status = useGameStore((s) => s.status);
  const mode = useGameStore((s) => s.mode);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);

  const menuPlayer = useRef<AudioPlayer | null>(null);
  const multiPlayer = useRef<AudioPlayer | null>(null);
  const buzzerPlayer = useRef<AudioPlayer | null>(null);
  const countdownPlayer = useRef<AudioPlayer | null>(null);

  // Track the previous status so we only trigger audio on transition
  const prevStatus = useRef<GameStatus | null>(null);

  // ── Create players on mount ──────────────────────────────────────────────
  useEffect(() => {
    const menu = createAudioPlayer(MENU_MUSIC);
    menu.loop = true;
    menu.volume = musicVolume;
    menuPlayer.current = menu;

    const multi = createAudioPlayer(MULTI_MUSIC);
    multi.loop = true;
    multi.volume = musicVolume;
    multiPlayer.current = multi;

    const buzzer = createAudioPlayer(BUZZER_SFX);
    buzzer.loop = false;
    buzzer.volume = sfxVolume;
    buzzerPlayer.current = buzzer;

    const countdown = createAudioPlayer(COUNTDOWN_SFX);
    countdown.loop = false;
    countdown.volume = sfxVolume;
    countdownPlayer.current = countdown;

    return () => {
      [menu, multi, buzzer, countdown].forEach((p) => {
        try { p.release(); } catch (_) { /* ignore */ }
      });
      menuPlayer.current = null;
      multiPlayer.current = null;
      buzzerPlayer.current = null;
      countdownPlayer.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync volumes whenever settings change ────────────────────────────────
  useEffect(() => {
    if (menuPlayer.current) menuPlayer.current.volume = musicVolume;
    if (multiPlayer.current) multiPlayer.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (buzzerPlayer.current) buzzerPlayer.current.volume = sfxVolume;
    if (countdownPlayer.current) countdownPlayer.current.volume = sfxVolume;
  }, [sfxVolume]);

  // ── State machine: decide which track plays ──────────────────────────────
  useEffect(() => {
    const menu = menuPlayer.current;
    const multi = multiPlayer.current;
    const buzzer = buzzerPlayer.current;
    const countdown = countdownPlayer.current;
    if (!menu || !multi || !buzzer || !countdown) return;

    const prev = prevStatus.current;
    prevStatus.current = status;

    const statusChanged = prev !== status;

    if (status === 'idle') {
      if (statusChanged) {
        multi.pause();
        menu.seekTo(0);
        menu.play();
      }
    } else if (status === 'countdown') {
      if (statusChanged) {
        menu.pause();
        multi.pause();
        countdown.seekTo(0);
        countdown.play();
      }
    } else if (status === 'playing') {
      if (statusChanged) {
        menu.pause();
        if (mode === 'duo') {
          multi.seekTo(0);
          multi.play();
        } else {
          // Single-player has no looping BG music
          multi.pause();
        }
      }
    } else if (status === 'finished') {
      if (statusChanged) {
        menu.pause();
        multi.pause();
        buzzer.seekTo(0);
        buzzer.play();
      }
    }
  }, [status, mode]);
}
