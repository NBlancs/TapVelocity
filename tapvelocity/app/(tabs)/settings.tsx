import { StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettingsStore } from '@/stores/settings-store';
import { useUserStore } from '@/stores/user-store';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsScreen() {
  const tint = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({}, 'mutedText');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');

  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);

  const username = useUserStore((s) => s.username);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>

      {/* ── User Profile ─────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <ThemedText style={[styles.cardLabel, { color: mutedText }]}>
          Signed in as
        </ThemedText>
        <ThemedText style={[styles.username, { color: tint }]}>
          {username ?? 'Guest'}
        </ThemedText>
      </View>

      {/* ── Audio Section ────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Audio</ThemedText>

        {/* Music Volume */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <ThemedText style={styles.sliderLabel}>Music Volume</ThemedText>
            <ThemedText style={[styles.sliderValue, { color: tint }]}>
              {Math.round(musicVolume * 100)}%
            </ThemedText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={musicVolume}
            onValueChange={setMusicVolume}
            minimumTrackTintColor={tint}
            maximumTrackTintColor={border}
            thumbTintColor={tint}
          />
        </View>

        {/* SFX Volume */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <ThemedText style={styles.sliderLabel}>SFX Volume</ThemedText>
            <ThemedText style={[styles.sliderValue, { color: tint }]}>
              {Math.round(sfxVolume * 100)}%
            </ThemedText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={sfxVolume}
            onValueChange={setSfxVolume}
            minimumTrackTintColor={tint}
            maximumTrackTintColor={border}
            thumbTintColor={tint}
          />
        </View>
      </View>

      {/* ── App Info ─────────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <ThemedText style={[styles.cardLabel, { color: mutedText }]}>
          TapVelocity v1.0.0
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  cardLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sliderRow: {
    gap: 8,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 16,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
