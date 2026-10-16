import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';

export type TabKey = 'home' | 'bidding' | 'pass' | 'lots';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  biddingCount?: number;
  hasPass?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  biddingCount,
  hasPass,
}) => {
  const tabs: { key: TabKey; label: string; icon: keyof typeof Feather.glyphMap; badge?: boolean }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'bidding', label: 'Bidding', icon: 'activity', badge: !!biddingCount && biddingCount > 0 },
    { key: 'pass', label: 'Pass', icon: 'credit-card', badge: hasPass },
    { key: 'lots', label: 'Lots', icon: 'grid' },
  ];

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.bar, shadows.card]}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
            >
              <View style={styles.iconWrapper}>
                <Feather
                  name={tab.icon}
                  size={20}
                  color={isActive ? colors.blackPure : colors.textMuted}
                />
                {tab.badge && <View style={styles.tabDot} />}
              </View>
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  tabDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: colors.blackPure,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: colors.textMuted,
  },
});
