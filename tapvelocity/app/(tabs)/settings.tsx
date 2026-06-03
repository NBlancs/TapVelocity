import React, { useState } from 'react';
import { StyleSheet, View, Modal, ScrollView, Pressable, Image } from 'react-native';
import Slider from '@react-native-community/slider';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettingsStore } from '@/stores/settings-store';
import { useUserStore, RANK_BADGES, LEVEL_THRESHOLDS, DAMAGE_INDICATORS } from '@/stores/user-store';
import { useThemeColor } from '@/hooks/use-theme-color';

const RANK_DESCRIPTIONS: Record<number, string> = {
  1: 'The beginning of your journey. Hone your tapping speed!',
  2: 'You have learned the basics of velocity. Keep tapping!',
  3: 'A skilled challenger in the arena. Defeat the bosses!',
  4: 'An experienced tapper who has seen many battles.',
  5: 'A true master of tap velocity. Few can match you!',
  6: 'The ultimate rank. A legendary tapping champion!',
};

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

  const [showRules, setShowRules] = useState(false);
  const [showRanks, setShowRanks] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>

      {/* Scrollable Container for Settings Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── User Profile ─────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText style={[styles.cardLabel, { color: mutedText }]}>
            Signed in as
          </ThemedText>
          <ThemedText style={[styles.username, { color: tint }]}>
            {username ?? 'Guest'}
          </ThemedText>
        </View>

        {/* ── Game Info Section ─────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Game Info</ThemedText>
          
          <Pressable
            onPress={() => setShowRules(true)}
            style={({ pressed }) => [
              styles.infoButton,
              { borderColor: border },
              pressed && styles.infoButtonPressed,
            ]}
          >
            <ThemedText style={styles.infoButtonText}>How to Play (Rules)</ThemedText>
            <IconSymbol size={20} name="chevron.right" color={tint} />
          </Pressable>

          <Pressable
            onPress={() => setShowRanks(true)}
            style={({ pressed }) => [
              styles.infoButton,
              { borderColor: border },
              pressed && styles.infoButtonPressed,
            ]}
          >
            <ThemedText style={styles.infoButtonText}>Ranks & Progression</ThemedText>
            <IconSymbol size={20} name="chevron.right" color={tint} />
          </Pressable>
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
      </ScrollView>

      {/* ── Rules Modal ───────────────────────────────────────── */}
      <Modal
        transparent
        visible={showRules}
        animationType="fade"
        onRequestClose={() => setShowRules(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="subtitle" style={styles.modalHeaderTitle}>
              Game Rules
            </ThemedText>
            
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Combat section */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalSectionTitle}>⚔️ Combat Mode</ThemedText>
                <ThemedText style={styles.modalSectionText}>
                  Tap as fast as you can in the single-player boss arena to defeat monsters, or go head-to-head in split-screen PVP Mode!
                </ThemedText>
                <Image
                  source={require('@/assets/images/monster1.png')}
                  style={styles.modalImageLarge}
                />
              </View>

              {/* Currency section */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalSectionTitle}>💰 Currency</ThemedText>
                <View style={styles.imageTextRow}>
                  <Image
                    source={require('@/assets/images/currency.png')}
                    style={styles.modalImageIcon}
                  />
                  <ThemedText style={styles.modalSectionTextSide}>
                    Earn 1 coin for every single-player tap achieved. Use your coins in the Store to purchase progression upgrades!
                  </ThemedText>
                </View>
              </View>

              {/* Upgrades section */}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalSectionTitle}>🚀 Upgrades</ThemedText>
                <ThemedText style={styles.modalSectionText}>
                  Upgrade your Attack Damage to hit up to 5 HP per tap! Buy Time Extensions to add up to 10 extra seconds to your match duration.
                </ThemedText>
                <Image
                  source={DAMAGE_INDICATORS[3]}
                  style={styles.modalImageSmall}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setShowRules(false)}
              style={[styles.modalCloseButton, { backgroundColor: tint }]}
            >
              <ThemedText style={styles.modalCloseButtonText}>CLOSE</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Ranks Modal ───────────────────────────────────────── */}
      <Modal
        transparent
        visible={showRanks}
        animationType="fade"
        onRequestClose={() => setShowRanks(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="subtitle" style={styles.modalHeaderTitle}>
              Player Ranks
            </ThemedText>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {LEVEL_THRESHOLDS.map((item) => (
                <View key={item.level} style={[styles.rankItemCard, { borderColor: border }]}>
                  <Image
                    source={RANK_BADGES[item.title]}
                    style={styles.rankItemBadge}
                  />
                  <View style={styles.rankItemDetails}>
                    <ThemedText style={styles.rankItemTitle}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.rankItemRequirement, { color: tint }]}>
                      Level {item.level} • {item.tapsRequired}+ Taps
                    </ThemedText>
                    <ThemedText style={styles.rankItemDesc}>
                      {RANK_DESCRIPTIONS[item.level]}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setShowRanks(false)}
              style={[styles.modalCloseButton, { backgroundColor: tint }]}
            >
              <ThemedText style={styles.modalCloseButtonText}>CLOSE</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
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
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  infoButtonPressed: {
    opacity: 0.8,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderWidth: 2,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalHeaderTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  modalSection: {
    gap: 8,
    alignItems: 'center',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    alignSelf: 'flex-start',
  },
  modalSectionText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    color: '#CCC',
    textAlign: 'center',
  },
  modalImageLarge: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginTop: 4,
  },
  modalImageSmall: {
    width: 90,
    height: 45,
    resizeMode: 'contain',
    marginTop: 4,
  },
  imageTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalImageIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  modalSectionTextSide: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    color: '#CCC',
  },
  modalCloseButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rankItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  rankItemBadge: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  rankItemDetails: {
    flex: 1,
    gap: 2,
  },
  rankItemTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  rankItemRequirement: {
    fontSize: 10,
    fontWeight: '800',
  },
  rankItemDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BBB',
    lineHeight: 15,
    marginTop: 2,
  },
});
