import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Text } from 'react-native';
import { ThemedText } from './themed-text';

interface PushBarProps {
  player1Taps: number;       // Current tap count for player 1
  player2Taps: number;       // Current tap count for player 2
  player1Label?: string;     // Display name for player 1 (default: "YOU")
  player2Label?: string;     // Display name for player 2 (default: "RIVAL")
  maxDelta?: number;         // Tap difference that pushes bar fully to one side (default: 30)
  isGameActive: boolean;     // Pauses animation when false
}

export default function PushBar({
  player1Taps,
  player2Taps,
  player1Label = 'YOU',
  player2Label = 'RIVAL',
  maxDelta = 30,
  isGameActive,
}: PushBarProps): React.JSX.Element {
  const delta = player1Taps - player2Taps;
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
  const positionPercent = (clamped + maxDelta) / (2 * maxDelta); // 0 = P2 wins, 1 = P1 wins

  const indicatorAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const wasActiveRef = useRef(isGameActive);

  // Update animated value in real-time
  useEffect(() => {
    if (isGameActive) {
      Animated.spring(indicatorAnim, {
        toValue: positionPercent,
        tension: 80,
        friction: 10,
        useNativeDriver: false,
      }).start();
    }
  }, [positionPercent, isGameActive, indicatorAnim]);

  // Handle Game End State "Slam" Effect
  useEffect(() => {
    if (wasActiveRef.current && !isGameActive) {
      if (delta !== 0) {
        const overshootAmount = delta > 0 ? 0.08 : -0.08;
        const overshootVal = Math.max(0, Math.min(1, positionPercent + overshootAmount));

        Animated.sequence([
          // Slam / overshoot
          Animated.spring(indicatorAnim, {
            toValue: overshootVal,
            tension: 180,
            friction: 7,
            useNativeDriver: false,
          }),
          // Snap back
          Animated.spring(indicatorAnim, {
            toValue: positionPercent,
            tension: 100,
            friction: 12,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
    wasActiveRef.current = isGameActive;
  }, [isGameActive, player1Taps, player2Taps, positionPercent, indicatorAnim, delta]);

  // Handle Win-Zone Pulse
  useEffect(() => {
    const isPlayer1Dominant = positionPercent >= 0.75;
    const isPlayer2Dominant = positionPercent <= 0.25;

    if (isGameActive && (isPlayer1Dominant || isPlayer2Dominant)) {
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  }, [positionPercent, isGameActive, pulseAnim]);

  const p1Width = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const p2Width = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });

  const thumbLeft = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Keep thumb fully within container bounds
  const thumbTranslateX = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -36],
  });

  // Pulse interpolation for dominant fills
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  const isP1Dominant = positionPercent >= 0.75;
  const isP2Dominant = positionPercent <= 0.25;

  const p1ScaleY = isP1Dominant ? pulseScale : 1;
  const p1Opacity = isP1Dominant ? pulseOpacity : 1;

  const p2ScaleY = isP2Dominant ? pulseScale : 1;
  const p2Opacity = isP2Dominant ? pulseOpacity : 1;

  // Determine track shadow & border glow properties
  const getGlowStyle = () => {
    if (isGameActive) {
      if (isP1Dominant) {
        return {
          shadowColor: '#E63946',
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        };
      } else if (isP2Dominant) {
        return {
          shadowColor: '#457B9D',
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        };
      }
    } else {
      // Game over state
      if (delta > 0) {
        return {
          borderColor: '#E63946',
          borderWidth: 2,
          shadowColor: '#E63946',
          shadowOpacity: 0.8,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        };
      } else if (delta < 0) {
        return {
          borderColor: '#457B9D',
          borderWidth: 2,
          shadowColor: '#457B9D',
          shadowOpacity: 0.8,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        };
      }
    }
    return {};
  };

  const diffText = delta === 0 ? '0' : `+${Math.abs(delta)}`;
  const accessibilityValueText = `You: ${player1Taps}, Rival: ${player2Taps}. Difference: ${Math.abs(delta)} taps.`;

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityLabel={`Push bar: ${delta > 0 ? 'You are leading' : delta < 0 ? 'Rival is leading' : 'Tied'}`}
      accessibilityValue={{ text: accessibilityValueText }}
    >
      {/* Player Labels */}
      <View style={styles.labelsRow}>
        <View style={styles.labelGroup}>
          <ThemedText style={[styles.playerLabel, { color: '#E63946' }]}>
            {player1Label}
          </ThemedText>
          <ThemedText style={styles.tapCountText}>{player1Taps}</ThemedText>
        </View>
        <View style={[styles.labelGroup, styles.labelGroupRight]}>
          <ThemedText style={styles.tapCountText}>{player2Taps}</ThemedText>
          <ThemedText style={[styles.playerLabel, { color: '#457B9D' }]}>
            {player2Label}
          </ThemedText>
        </View>
      </View>

      {/* Push Bar Track */}
      <View style={[styles.track, getGlowStyle()]}>
        {/* Player 1 Fill (Red, expands from Left) */}
        <Animated.View
          style={[
            styles.fill,
            styles.fillP1,
            {
              width: p1Width,
              opacity: p1Opacity,
              transform: [{ scaleY: p1ScaleY }],
            },
          ]}
        />

        {/* Player 2 Fill (Blue, expands from Right) */}
        <Animated.View
          style={[
            styles.fill,
            styles.fillP2,
            {
              width: p2Width,
              opacity: p2Opacity,
              transform: [{ scaleY: p2ScaleY }],
            },
          ]}
        />

        {/* Center Divider Marker */}
        <View style={styles.centerDivider} />

        {/* Indicator Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: thumbLeft,
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        >
          <Text style={styles.badgeText}>{diffText}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 12,
    zIndex: 10,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelGroupRight: {
    flexDirection: 'row-reverse',
  },
  playerLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tapCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  track: {
    height: 32,
    backgroundColor: '#1A1A1A',
    borderColor: '#2E2E2E',
    borderWidth: 2,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  fillP1: {
    left: 0,
    backgroundColor: '#E63946',
  },
  fillP2: {
    right: 0,
    backgroundColor: '#457B9D',
  },
  centerDivider: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginLeft: -1,
    zIndex: 2,
  },
  thumb: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    // Glow/Shadow effect
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  badgeText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
