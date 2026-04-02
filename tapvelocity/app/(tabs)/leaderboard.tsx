import { AppState, FlatList, StyleSheet, View } from 'react-native';
import { gql, useQuery, useSubscription } from '@apollo/client';
import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserStore } from '@/stores/user-store';

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

const LEADERBOARD_UPDATED_SUBSCRIPTION = gql`
  subscription LeaderboardUpdated {
    leaderboardUpdated
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
  const mutedText = useThemeColor({}, 'mutedText');
  const isFocused = useIsFocused();
  const currentUserId = useUserStore((s) => s.userId);
  const currentUsername = useUserStore((s) => s.username);
  const { data, loading, refetch, startPolling, stopPolling } = useQuery<{
    leaderboard: LeaderboardEntry[];
  }>(LEADERBOARD_QUERY, {
    variables: { limit: 50 },
    notifyOnNetworkStatusChange: true,
  });

  useSubscription(LEADERBOARD_UPDATED_SUBSCRIPTION, {
    skip: !isFocused,
    onData: () => {
      void refetch();
    },
  });

  useEffect(() => {
    if (isFocused) {
      // Always force a fresh fetch when tab becomes active.
      void refetch();
      startPolling(3000);
      return () => stopPolling();
    }

    stopPolling();
    return undefined;
  }, [isFocused, refetch, startPolling, stopPolling]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isFocused) {
        void refetch();
      }
    });

    return () => sub.remove();
  }, [isFocused, refetch]);

  const entries = data?.leaderboard ?? [];

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user.id === currentUserId;

    return (
      <ThemedView
        style={[
          styles.row,
          isCurrentUser && { borderColor: tint, borderWidth: 2, backgroundColor: `${tint}15` },
        ]}
      >
      <ThemedText style={[styles.rank, { color: tint }]}>#{item.rank}</ThemedText>
      <View style={styles.info}>
          <ThemedText style={styles.username}>
            {item.user.username}
            {isCurrentUser ? ' (You)' : ''}
          </ThemedText>
        <ThemedText style={[styles.detail, { color: mutedText }]}>
          {item.tapCount} taps · Top {(100 - item.percentile).toFixed(1)}%
        </ThemedText>
      </View>
      <ThemedText style={[styles.tapCount, { color: tint }]}>{item.tapCount}</ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Leaderboard
      </ThemedText>

      {currentUsername && (
        <ThemedText style={[styles.currentUser, { color: mutedText }]}>You are: {currentUsername}</ThemedText>
      )}

      {entries.length === 0 && !loading ? (
        <ThemedText style={[styles.empty, { color: mutedText }]}>No games played yet. Be the first!</ThemedText>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.rank}-${item.user.id}`}
          contentContainerStyle={styles.list}
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
  currentUser: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
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
  },
  tapCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
