import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';

interface HeaderProps {
  title: string;
  subtitleBold?: string;
  subtitleLight?: string;
  onPlusPress?: () => void;
  onArrowPress?: () => void;
  statusBadge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitleBold,
  subtitleLight,
  onPlusPress,
  onArrowPress,
  statusBadge,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Row: Title + 2 Circular Action Buttons */}
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actionGroup}>
          {statusBadge && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{statusBadge}</Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPlusPress}
            style={[styles.circleButton, shadows.button]}
          >
            <Feather name="plus" size={17} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onArrowPress}
            style={[styles.circleButton, shadows.button]}
          >
            <Feather name="arrow-up-right" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle Statement */}
      {(subtitleBold || subtitleLight) && (
        <View style={styles.subtitleContainer}>
          {subtitleBold && <Text style={styles.subtitleBold}>{subtitleBold}</Text>}
          {subtitleLight && <Text style={styles.subtitleLight}>{subtitleLight}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blackPure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleContainer: {
    marginTop: 10,
  },
  subtitleBold: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitleLight: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.textMuted,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
});
