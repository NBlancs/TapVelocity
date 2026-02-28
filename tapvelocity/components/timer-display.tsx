import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TimerDisplayProps {
  timeRemaining: number;
}

export function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  const tint = useThemeColor({}, 'tint');
  const isUrgent = timeRemaining <= 3 && timeRemaining > 0;
  const display = timeRemaining.toFixed(1);

  return (
    <View style={[styles.container, { shadowColor: tint }]}>
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
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timer: {
    fontSize: 64, // Slightly scaled down to fit nicely
    lineHeight: 76, // Fix clipping on Android
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  urgent: {
    color: '#e53935',
  },
});
