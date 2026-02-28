import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';
import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const LEADERBOARD_QUERY = gql`
  query Leaderboard($limit: Int) {
    leaderboard(limit: $limit) {
      rank
      tapCount
      percentile
      user {
        id
        username
      }
    }
  }
`;

interface LeaderboardEntry {
  rank: number;
  tapCount: number;
  percentile: number;
  user: { id: string; username: string };
}

export default function LeaderboardScreen() {
  const tint = useThemeColor({}, 'tint');
  const isFocused = useIsFocused();
  const { data, loading, refetch, startPolling, stopPolling } = useQuery<{
    leaderboard: LeaderboardEntry[];
  }>(LEADERBOARD_QUERY, {
    variables: { limit: 50 },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (isFocused) {
      startPolling(3000);
      return () => stopPolling();
    }

    stopPolling();
    return undefined;
  }, [isFocused, startPolling, stopPolling]);

  const entries = data?.leaderboard ?? [];

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <ThemedView style={styles.row}>
      <ThemedText style={[styles.rank, { color: tint }]}>#{item.rank}</ThemedText>
      <View style={styles.info}>
        <ThemedText style={styles.username}>{item.user.username}</ThemedText>
        <ThemedText style={styles.detail}>
          {item.tapCount} taps · Top {(100 - item.percentile).toFixed(1)}%
        </ThemedText>
      </View>
      <ThemedText style={[styles.tapCount, { color: tint }]}>{item.tapCount}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Leaderboard
      </ThemedText>

      {entries.length === 0 && !loading ? (
        <ThemedText style={styles.empty}>No games played yet. Be the first!</ThemedText>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.rank}-${item.user.id}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => refetch()} />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    width: 48,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    opacity: 0.6,
  },
  tapCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
    fontSize: 16,
  },
});
