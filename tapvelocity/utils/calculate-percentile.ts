/**
 * Calculate an optimistic percentile for a tap count based on
 * existing leaderboard data cached on the client.
 *
 * Returns the percentage of known scores this tap count beats or equals.
 * Used to give instant feedback before the server responds.
 */
export function calculateOptimisticPercentile(
  newTapCount: number,
  existingTapCounts: number[]
): number {
  if (existingTapCounts.length === 0) return 100;

  const beaten = existingTapCounts.filter((tc) => tc <= newTapCount).length;
  return Math.round((beaten / (existingTapCounts.length + 1)) * 10000) / 100;
}
