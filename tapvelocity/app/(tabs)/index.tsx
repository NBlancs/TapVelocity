import { useEffect, useRef, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { gql, useMutation, useQuery } from '@apollo/client';
import Animated, { FadeInDown, FadeOutUp, FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TapButton } from '@/components/tap-button';
import { TimerDisplay } from '@/components/timer-display';
import { CPSDisplay } from '@/components/cps-display';
import { ResultsCard } from '@/components/results-card';
import { CountdownOverlay } from '@/components/countdown-overlay';
import { useGameStore } from '@/stores/game-store';
import { useUserStore } from '@/stores/user-store';
import { useGameLoop } from '@/hooks/use-game-loop';
import { useThemeColor } from '@/hooks/use-theme-color';
import { calculateOptimisticPercentile } from '@/utils/calculate-percentile';

const SUBMIT_GAME = gql`
  mutation SubmitGame($userId: ID!, $tapCount: Int!) {
    submitGame(userId: $userId, tapCount: $tapCount) {
      id
      tapCount
      percentile
    }
  }
`;

const LEADERBOARD_QUERY = gql`
  query Leaderboard($limit: Int) {
    leaderboard(limit: $limit) {
      tapCount
    }
  }
`;

export default function GameScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({}, 'mutedText');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const {
    mode,
    status,
    taps,
    playerOneTaps,
    playerTwoTaps,
    timeRemaining,
    setMode,
    startGame,
    recordTap,
    resetGame,
  } = useGameStore();
  const userId = useUserStore((s) => s.userId);
  const [hasHydrated, setHasHydrated] = useState(false);
  const duoArenaRef = useRef<View | null>(null);
  const [duoArenaFrame, setDuoArenaFrame] = useState({ top: 0, height: 0 });
  const hasSubmitted = useRef(false);

  // Track store hydration without triggering a persist write
  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useUserStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, []);

  useGameLoop();

  // Fetch leaderboard data for optimistic percentile calculation
  const { data: leaderboardData } = useQuery(LEADERBOARD_QUERY, {
    variables: { limit: 100 },
  });

  const [submitGame, { data: submitData, loading: submitting, error: submitError }] =
    useMutation(SUBMIT_GAME);

  // Calculate optimistic percentile from cached leaderboard
  const existingTapCounts: number[] =
    leaderboardData?.leaderboard?.map((e: { tapCount: number }) => e.tapCount) ?? [];
  const optimisticPercentile =
    status === 'finished' && mode === 'single'
      ? calculateOptimisticPercentile(taps, existingTapCounts)
      : null;

  // Server percentile (replaces optimistic once available)
  const serverPercentile: number | null = submitData?.submitGame?.percentile ?? null;
  const displayPercentile = serverPercentile ?? optimisticPercentile;

  // Submit game when finished
  useEffect(() => {
    if (status === 'finished' && mode === 'single' && userId && !hasSubmitted.current) {
      hasSubmitted.current = true;
      submitGame({ variables: { userId, tapCount: taps } });
    }
  }, [status, mode, userId, taps, submitGame]);

  // Redirect to username modal if no user (wait for hydration first)
  useEffect(() => {
    if (hasHydrated && !userId) {
      router.push('/modal');
    }
  }, [hasHydrated, userId, router]);

  const handlePlayAgain = useCallback(() => {
    hasSubmitted.current = false;
    resetGame();
  }, [resetGame]);

  const measureDuoArena = useCallback(() => {
    duoArenaRef.current?.measureInWindow((_x, y, _width, height) => {
      setDuoArenaFrame({ top: y, height });
    });
  }, []);

  const handleDuoTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      if (status !== 'playing' || mode !== 'duo' || duoArenaFrame.height <= 0) return;

      const splitY = duoArenaFrame.top + duoArenaFrame.height / 2;
      for (const touch of event.nativeEvent.changedTouches) {
        if (touch.pageY < splitY) {
          recordTap(1);
        } else {
          recordTap(2);
        }
      }
    },
    [status, mode, duoArenaFrame, recordTap]
  );

  const playerOneCps = ((playerOneTaps / 10) || 0).toFixed(1);
  const playerTwoCps = ((playerTwoTaps / 10) || 0).toFixed(1);
  const duoWinner =
    playerOneTaps === playerTwoTaps
      ? 'Tie game!'
      : playerOneTaps > playerTwoTaps
        ? 'Player 1 wins!'
        : 'Player 2 wins!';

  return (
    <ThemedView style={styles.container}>
      {status === 'idle' && (
        <Animated.View
          style={styles.centeredSection}
          exiting={FadeOutUp.duration(400)}
        >
          <ThemedText type="title" style={styles.appTitle}>
            TapVelocity
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>
            Tap as fast as you can in 10 seconds!
          </ThemedText>
          <View style={styles.modeRow}>
              <Pressable
              onPress={() => setMode('single')}
              style={[
                styles.modeButton,
                  { borderColor: border },
                  mode === 'single' && { borderColor: tint, backgroundColor: `${tint}20` },
              ]}
            >
              <ThemedText style={styles.modeText}>Single Player</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('duo')}
              style={[
                styles.modeButton,
                  { borderColor: border },
                  mode === 'duo' && { borderColor: tint, backgroundColor: `${tint}20` },
              ]}
            >
              <ThemedText style={styles.modeText}>2 Players</ThemedText>
            </Pressable>
          </View>
          <Pressable
            onPress={startGame}
            style={[
              styles.startButton, 
              { 
                backgroundColor: tint,
                shadowColor: tint,
              }
            ]}
          >
            <ThemedText style={[styles.startText, { color: '#fff' }]}>
              START
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}

      {status === 'countdown' && (
        <Animated.View
          style={styles.centeredSection}
          entering={FadeIn.duration(300).delay(200)}
          exiting={FadeOut.duration(200)}
        >
          <CountdownOverlay />
        </Animated.View>
      )}

      {status === 'playing' && (
        mode === 'single' ? (
          <Animated.View
            style={styles.centeredSection}
            entering={FadeInDown.duration(400)}
          >
            <TimerDisplay timeRemaining={timeRemaining} />
            <CPSDisplay taps={taps} timeRemaining={timeRemaining} />
            <TapButton tapCount={taps} onTap={() => recordTap(1)} />
          </Animated.View>
        ) : (
          <Animated.View
            style={styles.duoContainer}
            entering={FadeInDown.duration(400)}
          >
            <View style={styles.duoHud}>
              <TimerDisplay timeRemaining={timeRemaining} />
            </View>
            <View
              ref={duoArenaRef}
              collapsable={false}
              style={styles.duoArena}
              onLayout={measureDuoArena}
              onTouchStart={handleDuoTouchStart}
            >
              <View style={[styles.duoHalf, { backgroundColor: surface, borderBottomColor: border }]}>
                <ThemedText type="subtitle">Player 1</ThemedText>
                <ThemedText style={[styles.duoTapCount, { color: tint }]}>{playerOneTaps}</ThemedText>
                <ThemedText style={[styles.duoCps, { color: mutedText }]}>{playerOneCps} CPS</ThemedText>
              </View>
              <View style={[styles.duoHalf, styles.duoRight, { backgroundColor: surface }]}>
                <ThemedText type="subtitle">Player 2</ThemedText>
                <ThemedText style={[styles.duoTapCount, { color: tint }]}>{playerTwoTaps}</ThemedText>
                <ThemedText style={[styles.duoCps, { color: mutedText }]}>{playerTwoCps} CPS</ThemedText>
              </View>
            </View>
          </Animated.View>
        )
      )}

      {status === 'finished' && (
        mode === 'single' ? (
          <ResultsCard
            taps={taps}
            percentile={displayPercentile}
            isSubmitting={submitting}
            error={submitError?.message}
            onPlayAgain={handlePlayAgain}
          />
        ) : (
          <ThemedView style={styles.duoResultCard}>
            <ThemedText type="title" style={styles.scoreTitle}>2 Player Results</ThemedText>
            <ThemedText style={[styles.duoWinner, { color: tint }]}>{duoWinner}</ThemedText>
            <View style={styles.duoResultRow}>
              <ThemedText>Player 1</ThemedText>
              <ThemedText style={styles.duoResultValue}>{playerOneTaps} taps ({playerOneCps} CPS)</ThemedText>
            </View>
            <View style={styles.duoResultRow}>
              <ThemedText>Player 2</ThemedText>
              <ThemedText style={styles.duoResultValue}>{playerTwoTaps} taps ({playerTwoCps} CPS)</ThemedText>
            </View>
            <Pressable
              onPress={handlePlayAgain}
              style={[styles.playAgainButton, { borderColor: tint }]}
            >
              <ThemedText style={[styles.playAgainText, { color: tint }]}>Play Again</ThemedText>
            </Pressable>
          </ThemedView>
        )
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  appTitle: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  startButton: {
    paddingVertical: 20,
    paddingHorizontal: 64,
    borderRadius: 100, // Pill shape
    marginTop: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6, // for Android
  },
  startText: {
    fontSize: 28,
    lineHeight: 36, // fix clipping
    fontWeight: '900',
    letterSpacing: 4,
  },
  centeredSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modeButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  duoContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  duoHud: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  duoArena: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 16,
    overflow: 'hidden',
  },
  duoHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  duoRight: {
    borderBottomWidth: 0,
  },
  duoTapCount: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '900',
  },
  duoCps: {
    fontSize: 18,
  },
  duoResultCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    gap: 14,
  },
  scoreTitle: {
    textAlign: 'center',
  },
  duoWinner: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  duoResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  duoResultValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  playAgainButton: {
    marginTop: 8,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
