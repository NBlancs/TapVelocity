import { useEffect, useRef, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, GestureResponderEvent, Image, Modal, Platform, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { gql, useMutation, useQuery } from '@apollo/client';
import Animated, { FadeInDown, FadeOutUp, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimerDisplay } from '@/components/timer-display';
import { CPSDisplay } from '@/components/cps-display';
import { ResultsCard } from '@/components/results-card';
import { CountdownOverlay } from '@/components/countdown-overlay';
import { SlashOverlay } from '@/components/slash-overlay';
import { useGameStore } from '@/stores/game-store';
import { useUserStore, getLevelInfo, RANK_BADGES } from '@/stores/user-store';
import { useGameLoop } from '@/hooks/use-game-loop';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSlashSound } from '@/hooks/use-slash-sound';
import { useBackgroundMusic } from '@/hooks/use-background-music';
import { calculateOptimisticPercentile } from '@/utils/calculate-percentile';
import PushBar from '@/components/PushBar';

const BOSSES = [
  {
    name: 'Gorgon',
    maxHp: 40,
    idle: require('@/assets/images/monster1.png'),
    damaged: require('@/assets/images/monster1_damaged.png'),
    defeated: require('@/assets/images/monster_defeated.png'),
  },
  {
    name: 'Behemoth',
    maxHp: 80,
    idle: require('@/assets/images/monster2.png'),
    damaged: require('@/assets/images/monster2_damaged.png'),
    defeated: require('@/assets/images/monster_defeated.png'),
  },
  {
    name: 'Shadow Dragon',
    maxHp: 120,
    idle: require('@/assets/images/monster3.png'),
    damaged: require('@/assets/images/monster3_damaged.png'),
    defeated: require('@/assets/images/monster_defeated.png'),
  },
];

interface DamageIndicator {
  id: number;
  x: number;
  y: number;
}

interface FloatingIndicatorProps {
  x: number;
  y: number;
  onDone: () => void;
}

function FloatingIndicator({ x, y, onDone }: FloatingIndicatorProps) {
  const animY = useRef(new RNAnimated.Value(0)).current;
  const animOpacity = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(animY, {
        toValue: -120,
        duration: 450,
        useNativeDriver: true,
      }),
      RNAnimated.timing(animOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone();
    });
  }, [animY, animOpacity, onDone]);

  return (
    <RNAnimated.View
      pointerEvents="none"
      style={[
        styles.floatingIndicator,
        {
          left: x - 160,
          top: y - 80,
          transform: [{ translateY: animY }],
          opacity: animOpacity,
        },
      ]}
    >
      <Image
        source={require('@/assets/images/minuslife.png')}
        style={styles.floatingIndicatorImage}
      />
    </RNAnimated.View>
  );
}

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
    finishGame,
  } = useGameStore();
  const userId = useUserStore((s) => s.userId);
  const clearUser = useUserStore((s) => s.clearUser);
  const username = useUserStore((s) => s.username);
  const totalTaps = useUserStore((s) => s.totalTaps);
  const addTaps = useUserStore((s) => s.addTaps);

  const [hasHydrated, setHasHydrated] = useState(false);
  const duoArenaRef = useRef<View | null>(null);
  const [duoArenaFrame, setDuoArenaFrame] = useState({ top: 0, height: 0 });
  const hasSubmitted = useRef(false);

  // Leveling and Level Up Modal States
  const [levelUpInfo, setLevelUpInfo] = useState<{ oldLevel: number; newLevel: number; newTitle: string } | null>(null);
  const levelInfo = getLevelInfo(totalTaps);

  // Boss and damage animation states
  const [bossIndex, setBossIndex] = useState(0);
  const [bossHp, setBossHp] = useState(40);
  const [bossState, setBossState] = useState<'idle' | 'damaged' | 'defeated'>('idle');
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);
  
  const damageIdRef = useRef(0);
  const revertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<View | null>(null);
  const monsterRef = useRef<View | null>(null);
  const [monsterCoords, setMonsterCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Slash effects
  const playSlash = useSlashSound();
  const spawnSlashRef = useRef<((x?: number, y?: number) => void) | null>(null);

  const updateMonsterCoords = useCallback(() => {
    if (monsterRef.current && wrapperRef.current) {
      monsterRef.current.measureLayout(
        wrapperRef.current,
        (left, top, width, height) => {
          setMonsterCoords({ x: left, y: top, width, height });
        },
        () => {
          // Silent fallback on render lag
        }
      );
    }
  }, []);

  const damageBoss = useCallback(() => {
    setBossHp((prevHp) => {
      const nextHp = Math.max(0, prevHp - 1);
      if (nextHp === 0) {
        setBossState('defeated');

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setTimeout(() => {
          if (bossIndex < 2) {
            const nextIndex = bossIndex + 1;
            setBossIndex(nextIndex);
            setBossHp(BOSSES[nextIndex].maxHp);
            setBossState('idle');
          } else {
            finishGame();
          }
        }, 500);
      } else {
        setBossState('damaged');
        if (revertTimeoutRef.current) {
          clearTimeout(revertTimeoutRef.current);
        }
        revertTimeoutRef.current = setTimeout(() => {
          setBossState('idle');
        }, 180);
      }
      return nextHp;
    });
  }, [bossIndex, finishGame]);

  const spawnDamageIndicator = useCallback((x: number, y: number) => {
    const id = damageIdRef.current++;
    setDamageIndicators((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeDamageIndicator = useCallback((id: number) => {
    setDamageIndicators((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleMonsterTap = useCallback((event: GestureResponderEvent) => {
    if (status !== 'playing' || bossState === 'defeated') return;

    recordTap(1);
    playSlash();
    damageBoss();

    if (monsterCoords) {
      const centerX = monsterCoords.x + monsterCoords.width / 2;
      const centerY = monsterCoords.y + monsterCoords.height / 2;
      spawnSlashRef.current?.(centerX, centerY);
    } else {
      spawnSlashRef.current?.();
    }

    const touchX = event.nativeEvent.locationX + (monsterCoords?.x ?? 0);
    // Shift the spawn position of the floating indicator 60 pixels upward
    // to prevent it from being obscured by the user's hand/finger.
    const touchY = event.nativeEvent.locationY + (monsterCoords?.y ?? 0) - 60;
    spawnDamageIndicator(touchX, touchY);
  }, [status, bossState, recordTap, playSlash, monsterCoords, damageBoss, spawnDamageIndicator]);



  // Reset boss states when entering game
  useEffect(() => {
    if (status === 'playing') {
      setBossIndex(0);
      setBossHp(BOSSES[0].maxHp);
      setBossState('idle');
      setDamageIndicators([]);
    }
  }, [status]);

  // Recalculate monster coordinates when boss or status changes
  useEffect(() => {
    if (status === 'playing') {
      const timer = setTimeout(() => {
        updateMonsterCoords();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, bossIndex, updateMonsterCoords]);

  // Clear revert timeout on unmount
  useEffect(() => {
    return () => {
      if (revertTimeoutRef.current) {
        clearTimeout(revertTimeoutRef.current);
      }
    };
  }, []);

  // Handle game end leveling up
  useEffect(() => {
    if (status === 'finished') {
      const gameTaps = mode === 'single' ? taps : playerOneTaps;
      if (gameTaps > 0) {
        const oldLevelInfo = getLevelInfo(totalTaps);
        addTaps(gameTaps);
        const newLevelInfo = getLevelInfo(totalTaps + gameTaps);

        if (newLevelInfo.level > oldLevelInfo.level) {
          setLevelUpInfo({
            oldLevel: oldLevelInfo.level,
            newLevel: newLevelInfo.level,
            newTitle: newLevelInfo.title,
          });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
  useBackgroundMusic();

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
      submitGame({ variables: { userId, tapCount: taps } }).catch((err) => {
        // If the server says the userId is stale, clear it so the registration
        // modal reappears automatically on the next render cycle.
        const isStaleUser = err?.graphQLErrors?.some(
          (e: any) => e?.extensions?.code === 'USER_NOT_FOUND'
        );
        if (isStaleUser) {
          clearUser();
        }
      });
    }
  }, [status, mode, userId, taps, submitGame, clearUser]);

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
      {/* Level Up Celebration Modal */}
      {levelUpInfo && (
        <Modal transparent visible={!!levelUpInfo} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
              <Image
                source={RANK_BADGES[levelUpInfo.newTitle]}
                style={styles.modalRankBadge}
              />
              <ThemedText type="title" style={styles.levelUpTitle}>
                LEVEL UP!
              </ThemedText>
              <ThemedText style={styles.levelUpSubtitle}>
                You are now a
              </ThemedText>
              <ThemedText style={[styles.levelUpBadge, { color: tint }]}>
                {levelUpInfo.newTitle}
              </ThemedText>
              <ThemedText style={styles.levelUpDetails}>
                Level {levelUpInfo.oldLevel} ➡️ Level {levelUpInfo.newLevel}
              </ThemedText>
              
              <Pressable
                onPress={() => setLevelUpInfo(null)}
                style={[styles.closeButton, { backgroundColor: tint }]}
              >
                <ThemedText style={styles.closeButtonText}>AWESOME</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {status === 'idle' && (
        <Animated.View
          style={styles.centeredSection}
          exiting={FadeOutUp.duration(400)}
        >
          <ThemedText
            type="title"
            style={styles.appTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            TapVelocity
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>
            Tap as fast as you can in 10 seconds!
          </ThemedText>

          {/* Persistent Level Progress HUD */}
          {username && (
            <View style={[styles.profileCard, { backgroundColor: surface, borderColor: border }]}>
              <Image
                source={RANK_BADGES[levelInfo.title]}
                style={styles.hudRankBadge}
              />
              <ThemedText style={styles.usernameText}>@{username}</ThemedText>
              <ThemedText style={styles.levelTitleText}>
                {levelInfo.title}  •  Level {levelInfo.level}
              </ThemedText>

              {levelInfo.tapsToNextLevel > 0 ? (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBg, { backgroundColor: border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${levelInfo.progress * 100}%`,
                          backgroundColor: tint,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.progressText, { color: mutedText }]}>
                    {levelInfo.totalTaps} / {levelInfo.nextLevelTaps} taps
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.maxLevelContainer}>
                  <ThemedText style={[styles.maxLevelText, { color: tint }]}>
                    👑 MAX LEVEL reached! ({levelInfo.totalTaps} taps)
                  </ThemedText>
                </View>
              )}
            </View>
          )}

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
            ref={wrapperRef}
            style={styles.singlePlayerWrapper}
            entering={FadeInDown.duration(400)}
          >
            <SlashOverlay
              color={tint}
              onRegisterSpawn={(fn) => { spawnSlashRef.current = fn; }}
            />

            {damageIndicators.map((item) => (
              <FloatingIndicator
                key={item.id}
                x={item.x}
                y={item.y}
                onDone={() => removeDamageIndicator(item.id)}
              />
            ))}

            <View style={styles.centeredSection}>
              <TimerDisplay timeRemaining={timeRemaining} />
              
              {/* Boss HP Bar */}
              <View style={[styles.hpBarContainer, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText style={styles.hpBarLabel}>
                  ⚔️ {BOSSES[bossIndex].name}
                </ThemedText>
                <View style={[styles.hpBg, { backgroundColor: border }]}>
                  <View
                    style={[
                      styles.hpFill,
                      {
                        width: `${(bossHp / BOSSES[bossIndex].maxHp) * 100}%`,
                        backgroundColor: tint,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.hpText, { color: mutedText }]}>
                  {bossHp} / {BOSSES[bossIndex].maxHp} HP
                </ThemedText>
              </View>

              {/* Tapping Target Monster */}
              <View
                ref={monsterRef}
                onLayout={updateMonsterCoords}
                style={styles.monsterWrapper}
              >
                <Pressable
                  onPressIn={handleMonsterTap}
                  disabled={bossState === 'defeated'}
                  style={styles.monsterPressable}
                >
                  <Image
                    source={
                      bossState === 'defeated'
                        ? BOSSES[bossIndex].defeated
                        : bossState === 'damaged'
                          ? BOSSES[bossIndex].damaged
                          : BOSSES[bossIndex].idle
                    }
                    style={styles.monsterImage}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              <CPSDisplay taps={taps} timeRemaining={timeRemaining} />
            </View>
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
              <View style={[styles.duoHalf, { backgroundColor: surface, borderBottomWidth: 0 }]}>
                <ThemedText type="subtitle">Player 1</ThemedText>
                <ThemedText style={[styles.duoTapCount, { color: tint }]}>{playerOneTaps}</ThemedText>
                <ThemedText style={[styles.duoCps, { color: mutedText }]}>{playerOneCps} CPS</ThemedText>
              </View>
              <PushBar
                player1Taps={playerOneTaps}
                player2Taps={playerTwoTaps}
                player1Label={username || 'PLAYER 1'}
                player2Label="RIVAL"
                maxDelta={30}
                isGameActive={status === 'playing'}
              />
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
            <PushBar
              player1Taps={playerOneTaps}
              player2Taps={playerTwoTaps}
              player1Label={username || 'PLAYER 1'}
              player2Label="RIVAL"
              maxDelta={30}
              isGameActive={false}
            />
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
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  startButton: {
    paddingVertical: 20,
    paddingHorizontal: 64,
    borderRadius: 100,
    marginTop: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startText: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 4,
  },
  centeredSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  singlePlayerWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
  monsterWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  monsterPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monsterImage: {
    width: '100%',
    height: '100%',
  },
  hpBarContainer: {
    width: 260,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  hpBarLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  hpBg: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileCard: {
    width: 280,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '800',
  },
  levelTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  progressBg: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  maxLevelContainer: {
    marginTop: 4,
  },
  maxLevelText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  congratsEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  levelUpTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  levelUpSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
    textAlign: 'center',
  },
  levelUpBadge: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  levelUpDetails: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  closeButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  floatingIndicator: {
    position: 'absolute',
    width: 320,
    height: 160,
    zIndex: 99,
  },
  modalRankBadge: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  hudRankBadge: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  floatingIndicatorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
