import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';

/**
 * Drives the game timer by calling `tick()` at ~60fps via requestAnimationFrame.
 * Automatically starts/stops based on game status.
 */
export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const status = useGameStore((s) => s.status);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (status !== 'playing') return;

    const loop = () => {
      tick();
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [status, tick]);
}
