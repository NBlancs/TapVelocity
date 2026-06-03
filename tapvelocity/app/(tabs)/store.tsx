import React from 'react';
import { StyleSheet, View, Image, Pressable, Alert, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUserStore, DAMAGE_INDICATORS } from '@/stores/user-store';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function StoreScreen() {
  const tint = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({}, 'mutedText');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');

  const currency = useUserStore((s) => s.currency);
  const attackDamageTier = useUserStore((s) => s.attackDamageTier);
  const timeExtensionSeconds = useUserStore((s) => s.timeExtensionSeconds);

  const purchaseAttackUpgrade = useUserStore((s) => s.purchaseAttackUpgrade);
  const purchaseTimeUpgrade = useUserStore((s) => s.purchaseTimeUpgrade);

  const getAttackUpgradeCost = (tier: number) => {
    if (tier === 1) return 200;
    if (tier === 2) return 300;
    if (tier === 3) return 600;
    if (tier === 4) return 1000;
    return null;
  };

  const getTimeUpgradeCost = (seconds: number) => {
    if (seconds >= 10) return null;
    return 150 + (seconds + 1) * 50;
  };

  const attackCost = getAttackUpgradeCost(attackDamageTier);
  const timeCost = getTimeUpgradeCost(timeExtensionSeconds);

  const handleBuyAttack = () => {
    if (attackCost === null || attackDamageTier >= 5) {
      Alert.alert('Maxed Out', 'Your attack damage is already at the maximum tier!');
      return;
    }
    if (currency < attackCost) {
      Alert.alert('Insufficient Balance', 'You need more coins to buy this upgrade.');
      return;
    }

    purchaseAttackUpgrade(attackCost);
    Alert.alert('Upgrade Unlocked!', `Your attack tap damage is now Tier ${attackDamageTier + 1} (${attackDamageTier + 1} HP per tap).`);
  };

  const handleBuyTime = () => {
    if (timeCost === null || timeExtensionSeconds >= 10) {
      Alert.alert('Maxed Out', 'Your gameplay time extension is already at the maximum limit (+10 seconds)!');
      return;
    }
    if (currency < timeCost) {
      Alert.alert('Insufficient Balance', 'You need more coins to buy this upgrade.');
      return;
    }

    purchaseTimeUpgrade(timeCost);
    Alert.alert('Upgrade Unlocked!', `Gameplay time is now extended to ${10 + timeExtensionSeconds + 1} seconds.`);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText type="title" style={styles.title}>
          Store
        </ThemedText>

        {/* Wallet Card */}
        <View style={[styles.walletCard, { backgroundColor: surface, borderColor: border }]}>
          <Image
            source={require('@/assets/images/currency.png')}
            style={styles.currencyIcon}
          />
          <View style={styles.walletDetails}>
            <ThemedText style={[styles.walletLabel, { color: mutedText }]}>
              BALANCE
            </ThemedText>
            <ThemedText style={styles.walletAmount}>
              {currency}
            </ThemedText>
          </View>
        </View>

        {/* Upgrades Section */}
        <View style={styles.upgradesContainer}>
          {/* Attack Damage Card */}
          <View style={[styles.upgradeCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.upgradeHeader}>
              <View style={styles.upgradeTextGroup}>
                <ThemedText type="subtitle" style={styles.upgradeTitle}>
                  Attack Damage
                </ThemedText>
                <ThemedText style={[styles.upgradeDesc, { color: mutedText }]}>
                  Deduct more HP per tap
                </ThemedText>
              </View>
              <View style={[styles.badgeContainer, { backgroundColor: border }]}>
                <Image
                  source={DAMAGE_INDICATORS[attackDamageTier]}
                  style={styles.damageBadgeImage}
                />
              </View>
            </View>

            <View style={styles.upgradeStats}>
              <ThemedText style={styles.statLabel}>
                Current: <ThemedText style={{ color: tint }}>{attackDamageTier} HP/tap</ThemedText>
              </ThemedText>
              {attackDamageTier < 5 ? (
                <ThemedText style={styles.statLabel}>
                  Next Tier: <ThemedText style={{ color: '#4CAF50' }}>{attackDamageTier + 1} HP/tap</ThemedText>
                </ThemedText>
              ) : (
                <ThemedText style={[styles.maxedText, { color: tint }]}>
                  MAXED OUT
                </ThemedText>
              )}
            </View>

            {attackCost !== null ? (
              <Pressable
                onPress={handleBuyAttack}
                disabled={currency < attackCost}
                style={({ pressed }) => [
                  styles.buyButton,
                  { backgroundColor: currency >= attackCost ? tint : `${border}80` },
                  pressed && styles.buyButtonPressed,
                ]}
              >
                <Image
                  source={require('@/assets/images/currency.png')}
                  style={styles.buttonCoinIcon}
                />
                <ThemedText style={styles.buyButtonText}>
                  UPGRADE · {attackCost}
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.buyButton, styles.disabledButton, { backgroundColor: border }]}>
                <ThemedText style={styles.disabledButtonText}>
                  MAX TIER REACHED
                </ThemedText>
              </View>
            )}
          </View>

          {/* Time Extension Card */}
          <View style={[styles.upgradeCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.upgradeHeader}>
              <View style={styles.upgradeTextGroup}>
                <ThemedText type="subtitle" style={styles.upgradeTitle}>
                  Time Extension
                </ThemedText>
                <ThemedText style={[styles.upgradeDesc, { color: mutedText }]}>
                  Add extra match seconds
                </ThemedText>
              </View>
              <View style={[styles.badgeContainer, { backgroundColor: border }]}>
                <ThemedText style={styles.timeBadgeText}>
                  +{timeExtensionSeconds}s
                </ThemedText>
              </View>
            </View>

            <View style={styles.upgradeStats}>
              <ThemedText style={styles.statLabel}>
                Duration: <ThemedText style={{ color: tint }}>{10 + timeExtensionSeconds} seconds</ThemedText>
              </ThemedText>
              {timeExtensionSeconds < 10 ? (
                <ThemedText style={styles.statLabel}>
                  Next level: <ThemedText style={{ color: '#4CAF50' }}>+{timeExtensionSeconds + 1}s extension</ThemedText>
                </ThemedText>
              ) : (
                <ThemedText style={[styles.maxedText, { color: tint }]}>
                  MAXED OUT
                </ThemedText>
              )}
            </View>

            {timeCost !== null ? (
              <Pressable
                onPress={handleBuyTime}
                disabled={currency < timeCost}
                style={({ pressed }) => [
                  styles.buyButton,
                  { backgroundColor: currency >= timeCost ? tint : `${border}80` },
                  pressed && styles.buyButtonPressed,
                ]}
              >
                <Image
                  source={require('@/assets/images/currency.png')}
                  style={styles.buttonCoinIcon}
                />
                <ThemedText style={styles.buyButtonText}>
                  UPGRADE · {timeCost}
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.buyButton, styles.disabledButton, { backgroundColor: border }]}>
                <ThemedText style={styles.disabledButtonText}>
                  MAX TIER REACHED
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 64,
    gap: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  currencyIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  walletDetails: {
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  upgradesContainer: {
    flex: 1,
    gap: 20,
  },
  upgradeCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTextGroup: {
    flex: 1,
    gap: 4,
  },
  upgradeTitle: {
    fontSize: 18,
  },
  upgradeDesc: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  damageBadgeImage: {
    width: 48,
    height: 24,
    resizeMode: 'contain',
  },
  timeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  upgradeStats: {
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DDD',
  },
  maxedText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  buttonCoinIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  disabledButton: {
    borderColor: 'transparent',
  },
  disabledButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '800',
  },
});
