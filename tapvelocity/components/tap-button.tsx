import { Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TapButtonProps {
  tapCount: number;
  onTap: () => void;
}

export function TapButton({ tapCount, onTap }: TapButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    onTap();
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button, 
          { 
            borderColor: tint,
            backgroundColor: `${tint}15`, // Light tint background
            shadowColor: tint,
          }
        ]}
      >
        <ThemedText style={[styles.tapLabel, { color: tint }]}>TAP!</ThemedText>
        <ThemedText style={[styles.tapCount, { color: tint }]}>{tapCount}</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tapLabel: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: 4,
    opacity: 0.8,
  },
  tapCount: {
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '900',
    marginTop: 4,
  },
});
