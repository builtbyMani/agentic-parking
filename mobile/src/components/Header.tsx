import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';

interface HeaderProps {
  greeting?: string;
  userName?: string;
  title?: string;
  highlightWord?: string;
  subtitle?: string;
  subtitleBold?: string;
  subtitleLight?: string;
  onSearchPress?: () => void;
  onBellPress?: () => void;
  onBookmarkPress?: () => void;
  onPlusPress?: () => void;
  onArrowPress?: () => void;
  statusBadge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  greeting = 'Good Morning',
  userName = 'John Abraham',
  title = "Let's Find",
  highlightWord = 'Parking',
  subtitle = 'near You',
  subtitleBold,
  subtitleLight,
  onSearchPress,
  onBellPress,
  onBookmarkPress,
  onPlusPress,
  onArrowPress,
  statusBadge,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Profile / Action Bar */}
      <View style={styles.topRow}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>JA</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
        </View>

        <View style={styles.actionPillsRow}>
          {statusBadge && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>{statusBadge}</Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSearchPress || onPlusPress}
            style={styles.roundActionBtn}
          >
            <Feather name="search" size={15} color={colors.editorialDark} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBellPress}
            style={styles.roundActionBtn}
          >
            <Feather name="bell" size={15} color={colors.editorialDark} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBookmarkPress || onArrowPress}
            style={styles.roundActionBtn}
          >
            <Feather name="bookmark" size={15} color={colors.editorialDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Editorial Headline */}
      <View style={styles.titleContainer}>
        {subtitleBold ? (
          <>
            <Text style={styles.headline}>
              {title} <Text style={styles.headlineBold}>{subtitleBold}</Text>
            </Text>
            {subtitleLight && <Text style={styles.subheadline}>{subtitleLight}</Text>}
          </>
        ) : (
          <>
            <Text style={styles.headline}>
              {title} <Text style={styles.headlineBold}>{highlightWord}</Text>
            </Text>
            <Text style={styles.subheadline}>{subtitle}</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.editorialBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: colors.editorialDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  greetingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.editorialDark,
    letterSpacing: -0.2,
  },
  actionPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coralOrange,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.editorialDark,
  },
  roundActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.editorialDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  titleContainer: {
    marginTop: 2,
  },
  headline: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.editorialDark,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  headlineBold: {
    fontWeight: '800',
    color: colors.editorialDark,
  },
  subheadline: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
});
