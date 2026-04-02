import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CPSDisplayProps {
  taps: number;
  timeRemaining: number;
}

export function CPSDisplay({ taps, timeRemaining }: CPSDisplayProps) {
  const tint = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');
  const elapsed = 10 - timeRemaining;
  const cps = elapsed > 0 ? (taps / elapsed).toFixed(1) : '0.0';

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>
      <ThemedText style={[styles.cps, { color: tint }]}>
        {cps} CPS
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 4,
  },
  cps: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
