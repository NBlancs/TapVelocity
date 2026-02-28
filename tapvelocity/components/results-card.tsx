import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ResultsCardProps {
  taps: number;
  percentile: number | null;
  isSubmitting: boolean;
  error?: string | null;
  onPlayAgain: () => void;
}

export function ResultsCard({
  taps,
  percentile,
  isSubmitting,
  error,
  onPlayAgain,
}: ResultsCardProps) {
  const tint = useThemeColor({}, 'tint');
  const cps = (taps / 10).toFixed(1);
  const topPercent = percentile != null ? (100 - percentile).toFixed(1) : null;

  return (
    <ThemedView style={styles.card}>
      <ThemedText type="title" style={styles.scoreTitle}>
        Results
      </ThemedText>

      <View style={styles.statRow}>
        <ThemedText style={styles.statLabel}>Total Taps</ThemedText>
        <ThemedText style={[styles.statValue, { color: tint }]}>{taps}</ThemedText>
      </View>

      <View style={styles.statRow}>
        <ThemedText style={styles.statLabel}>Taps/Second</ThemedText>
        <ThemedText style={[styles.statValue, { color: tint }]}>{cps}</ThemedText>
      </View>

      <View style={styles.statRow}>
        <ThemedText style={styles.statLabel}>Ranking</ThemedText>
        {isSubmitting ? (
          <ActivityIndicator size="small" color={tint} />
        ) : topPercent != null ? (
          <ThemedText style={[styles.statValue, { color: tint }]}>
            Top {topPercent}%
          </ThemedText>
        ) : (
          <ThemedText style={styles.statValue}>—</ThemedText>
        )}
      </View>

      {error && (
        <ThemedText style={styles.error}>{error}</ThemedText>
      )}

      <Pressable
        onPress={onPlayAgain}
        style={[styles.playAgainButton, { borderColor: tint }]}
      >
        <ThemedText style={[styles.playAgainText, { color: tint }]}>
          Play Again
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    gap: 16,
  },
  scoreTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  error: {
    color: '#e53935',
    fontSize: 14,
    textAlign: 'center',
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
