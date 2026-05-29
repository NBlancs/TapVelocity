import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, LayoutRectangle } from 'react-native';
import { SlashEffect, SlashParticle } from './slash-effect';

interface SlashOverlayProps {
  color: string;
  /** Call the returned `spawnSlash` whenever a tap occurs */
  onRegisterSpawn: (spawner: () => void) => void;
}

let _nextId = 0;

function makeParticle(bounds: LayoutRectangle): SlashParticle {
  // Spawn anywhere inside the measured area with a small inset
  const INSET = 60;
  const x = INSET + Math.random() * Math.max(bounds.width - INSET * 2, 1);
  const y = INSET + Math.random() * Math.max(bounds.height - INSET * 2, 1);
  const angle = -45 + Math.random() * 90; // -45° … +45°
  const variant = (Math.floor(Math.random() * 3)) as 0 | 1 | 2;
  return { id: _nextId++, x, y, angle, variant };
}

export function SlashOverlay({ color, onRegisterSpawn }: SlashOverlayProps) {
  const [particles, setParticles] = useState<SlashParticle[]>([]);
  const boundsRef = useRef<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });

  // Expose the spawn function to the parent via callback ref pattern
  const spawnerRegistered = useRef(false);

  const spawnSlash = useCallback(() => {
    if (boundsRef.current.width === 0) return;
    const p = makeParticle(boundsRef.current);
    setParticles((prev) => [...prev, p]);
  }, []);

  // Register once
  if (!spawnerRegistered.current) {
    spawnerRegistered.current = true;
    onRegisterSpawn(spawnSlash);
  }

  const handleDone = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        boundsRef.current = e.nativeEvent.layout;
      }}
    >
      {particles.map((p) => (
        <SlashEffect key={p.id} particle={p} color={color} onDone={handleDone} />
      ))}
    </View>
  );
}
