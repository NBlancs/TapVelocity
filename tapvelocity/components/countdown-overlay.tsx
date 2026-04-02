import { useEffect, useState } from 'react';
import { StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { useGameStore } from '@/stores/game-store';
import { useThemeColor } from '@/hooks/use-theme-color';

type CountdownValue = 3 | 2 | 1 | 'GO!';
const SEQUENCE: CountdownValue[] = [3, 2, 1, 'GO!'];
const STEP_DURATION = 800; // ms per number
const GO_DURATION = 500; // ms for "GO!"

export function CountdownOverlay() {
  const tint = useThemeColor({}, 'tint');
  const beginPlaying = useGameStore((s) => s.beginPlaying);
  const [currentValue, setCurrentValue] = useState<CountdownValue>(3);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let stepIndex = 0;

    const triggerHaptic = () => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    };

    const runStep = () => {
      const value = SEQUENCE[stepIndex];
      setCurrentValue(value);
      triggerHaptic();

      const isGo = value === 'GO!';
      const dur = isGo ? GO_DURATION : STEP_DURATION;

      // Animate this step
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, {
          duration: dur * 0.25,
          easing: Easing.out(Easing.back(1.4)),
        }),
        withTiming(1, { duration: dur * 0.4 }),
        withTiming(isGo ? 1.8 : 1.5, {
          duration: dur * 0.35,
          easing: Easing.in(Easing.ease),
        })
      );
      opacity.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, {
          duration: dur * 0.25,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, { duration: dur * 0.4 }),
        withTiming(0, {
          duration: dur * 0.35,
          easing: Easing.in(Easing.ease),
        })
      );

      stepIndex++;

      if (stepIndex < SEQUENCE.length) {
        timeout = setTimeout(runStep, dur);
      } else {
        // Countdown finished — start the game
        timeout = setTimeout(() => {
          beginPlaying();
        }, dur);
      }
    };

    let timeout = setTimeout(runStep, 100); // small initial delay

    return () => clearTimeout(timeout);
  }, [beginPlaying, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {typeof currentValue === 'number' ? (
        <Animated.Text style={[styles.number, { color: tint }]}>
          {currentValue}
        </Animated.Text>
      ) : (
        <Animated.Text style={[styles.goText, { color: tint }]}>
          {currentValue}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 140,
    lineHeight: 160,
    fontWeight: '900',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  goText: {
    fontSize: 100,
    lineHeight: 120,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
});
