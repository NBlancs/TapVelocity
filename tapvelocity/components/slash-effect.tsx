import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  interpolate,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlashParticle {
  id: number;
  x: number;     // center X in the play-area coordinate space
  y: number;     // center Y
  angle: number;  // rotation degrees
  variant: 0 | 1 | 2; // slash variant
}

interface SlashEffectProps {
  particle: SlashParticle;
  color: string;
  onDone: (id: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATION = 220; // 0.22s as specified in the css

// Crescent paths for slash motion
const SLASH_PATHS = [
  // Variant 0: Normal crescent sweeping up
  'M 10 90 Q 150 -40 290 80 Q 150 15 10 90 Z',
  // Variant 1: Mirrored horizontally (sweeping left/down)
  'M 290 90 Q 150 -40 10 80 Q 150 15 290 90 Z',
  // Variant 2: Curved crescent sweeping down
  'M 10 30 Q 150 160 290 40 Q 150 60 10 30 Z',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SlashEffect({ particle, color, onDone }: SlashEffectProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Easing matched to cubic-bezier(0.1, 0.8, 0.25, 1)
    progress.value = withTiming(
      1,
      {
        duration: DURATION,
        easing: Easing.bezier(0.1, 0.8, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(onDone)(particle.id);
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animates the stroke-dashoffset matching the CSS keyframes:
  // 0% -> 1000
  // 15% -> 500
  // 100% -> 0
  const animatedProps = useAnimatedProps(() => {
    const dashOffset = interpolate(
      progress.value,
      [0, 0.15, 1],
      [1000, 500, 0]
    );
    return {
      strokeDashoffset: dashOffset,
    };
  });

  // Animates the container scale, opacity and position (translation)
  // Opacity keyframes:
  // 0% -> 0
  // 15% -> 1
  // 70% -> 0.8
  // 100% -> 0
  const animatedStyle = useAnimatedStyle(() => {
    const opacityValue = interpolate(
      progress.value,
      [0, 0.15, 0.7, 1],
      [0, 1, 0.8, 0]
    );

    // Subtle scale growth to give the sweep extra impact
    const scaleValue = interpolate(
      progress.value,
      [0, 1],
      [0.85, 1.15]
    );

    return {
      opacity: opacityValue,
      transform: [
        { translateX: -150 },
        { translateY: -75 },
        { scale: scaleValue },
        { rotate: `${particle.angle}deg` },
      ],
    };
  });

  const pathD = SLASH_PATHS[particle.variant] || SLASH_PATHS[0];
  const gradId = `slash-grad-${particle.id}`;

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: particle.x, top: particle.y },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Svg
        width="300"
        height="150"
        viewBox="0 0 300 150"
        style={{ overflow: 'visible' }}
      >
        <Defs>
          {/* A dynamic gradient fading from transparent, to solid color, to white, and back to transparent */}
          <LinearGradient id={gradId} x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0" />
            <Stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <Stop offset="85%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* 1. Base glow / Drop Shadow Path layer (matches drop-shadow filter) */}
        <AnimatedPath
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="1000"
          animatedProps={animatedProps}
          opacity={0.35}
        />

        {/* 2. Inner Hot Core Orange Path layer */}
        <AnimatedPath
          d={pathD}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="1000"
          animatedProps={animatedProps}
          opacity={0.7}
        />

        {/* 3. Razor-sharp white-hot main path layer with Gradient Fill */}
        <AnimatedPath
          d={pathD}
          fill={`url(#${gradId})`}
          stroke={`url(#${gradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1000"
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 300,
    height: 150,
  },
});
