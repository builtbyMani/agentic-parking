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
    { key: 'home', label: 'Explore', icon: 'compass' },
    { key: 'lots', label: 'Bays', icon: 'grid' },
    { key: 'bidding', label: 'Bidding', icon: 'activity', badge: !!biddingCount && biddingCount > 0 },
    { key: 'pass', label: 'Gate Key', icon: 'key', badge: hasPass },
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
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <View style={styles.iconWrapper}>
                <Feather
                  name={tab.icon}
                  size={19}
                  color={isActive ? colors.coralOrange : colors.textMuted}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 3,
  },
  tabDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coralOrange,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: colors.editorialDark,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: colors.textMuted,
  },
});
