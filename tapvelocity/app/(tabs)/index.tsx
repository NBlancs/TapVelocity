import { useEffect, useRef, useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
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
  const { status, taps, timeRemaining, startGame, recordTap, resetGame } = useGameStore();
  const userId = useUserStore((s) => s.userId);
  const [hasHydrated, setHasHydrated] = useState(false);
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
    status === 'finished' ? calculateOptimisticPercentile(taps, existingTapCounts) : null;

  // Server percentile (replaces optimistic once available)
  const serverPercentile: number | null = submitData?.submitGame?.percentile ?? null;
  const displayPercentile = serverPercentile ?? optimisticPercentile;

  // Submit game when finished
  useEffect(() => {
    if (status === 'finished' && userId && !hasSubmitted.current) {
      hasSubmitted.current = true;
      submitGame({ variables: { userId, tapCount: taps } });
    }
  }, [status, userId, taps, submitGame]);

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
          <ThemedText style={styles.subtitle}>
            Tap as fast as you can in 10 seconds!
          </ThemedText>
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
        <Animated.View
          style={styles.centeredSection}
          entering={FadeInDown.duration(400)}
        >
          <TimerDisplay timeRemaining={timeRemaining} />
          <CPSDisplay taps={taps} timeRemaining={timeRemaining} />
          <TapButton tapCount={taps} onTap={recordTap} />
        </Animated.View>
      )}

      {status === 'finished' && (
        <ResultsCard
          taps={taps}
          percentile={displayPercentile}
          isSubmitting={submitting}
          error={submitError?.message}
          onPlayAgain={handlePlayAgain}
        />
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
    opacity: 0.6,
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
});
