import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TimerDisplayProps {
  timeRemaining: number;
}

export function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  const tint = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');
  const isUrgent = timeRemaining <= 3 && timeRemaining > 0;
  const display = timeRemaining.toFixed(1);

  return (
    <View style={[styles.container, { shadowColor: tint, backgroundColor: surface }]}>
      <ThemedText
        style={[
          styles.timer,
          isUrgent ? styles.urgent : { color: tint },
        ]}
      >
        {display}s
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timer: {
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  urgent: {
    color: '#e53935',
  },
});
