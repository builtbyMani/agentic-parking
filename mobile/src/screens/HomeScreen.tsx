import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { OfferConvergenceChart } from '../components/OfferConvergenceChart';
import { colors, radii, shadows } from '../theme';
import { DriverConstraints } from '../types';

interface HomeScreenProps {
  onStartNegotiation: (constraints: DriverConstraints) => void;
  onTriggerReplay: () => void;
  isPacing: boolean;
  statusText: string;
  onGoToBidding: () => void;
  onGoToPass: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartNegotiation,
  onTriggerReplay,
  isPacing,
  statusText,
  onGoToBidding,
  onGoToPass,
}) => {
  const [budgetRupees, setBudgetRupees] = useState<number>(38);
  const [maxDistance, setMaxDistance] = useState<number>(400);
  const [hours, setHours] = useState<number>(3);
  const [prepay, setPrepay] = useState<boolean>(true);

  const handleStart = () => {
    onStartNegotiation({
      max_budget_per_hour_paise: budgetRupees * 100,
      max_walk_distance_m: maxDistance,
      hours: hours,
      prepay: prepay,
      walk_penalty_paise_per_m: 2,
    });
    onGoToBidding();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <Header
        title="Parking"
        subtitleBold="Autonomous Rates"
        subtitleLight="below public list price"
        onPlusPress={handleStart}
        onArrowPress={onGoToPass}
        statusBadge={isPacing ? 'Bidding...' : 'AI Ready'}
      />

      {/* Main Hero Card (Large White Card) */}
      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.cardEyebrow}>Target Rate</Text>
            <Text style={styles.heroPrice}>₹36.00 <Text style={styles.heroPriceUnit}>/ hr</Text></Text>
          </View>
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>-20% SAVED</Text>
          </View>
        </View>

        {/* Minimal Convergence Trajectory Chart */}
        <OfferConvergenceChart currentOfferRupees={36} />

        {/* Driver Constraint Inline Editor */}
        <View style={styles.constraintsRow}>
          {/* Budget */}
          <View style={styles.constraintItem}>
            <Text style={styles.constraintLabel}>Max Budget</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                value={String(budgetRupees)}
                onChangeText={(t) => setBudgetRupees(Number(t) || 30)}
                keyboardType="numeric"
                style={styles.numericInput}
              />
              <Text style={styles.constraintUnit}>/h</Text>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.constraintItem}>
            <Text style={styles.constraintLabel}>Max Walk</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={String(maxDistance)}
                onChangeText={(t) => setMaxDistance(Number(t) || 300)}
                keyboardType="numeric"
                style={styles.numericInput}
              />
              <Text style={styles.constraintUnit}>m</Text>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.constraintItem}>
            <Text style={styles.constraintLabel}>Duration</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={String(hours)}
                onChangeText={(t) => setHours(Number(t) || 1)}
                keyboardType="numeric"
                style={styles.numericInput}
              />
              <Text style={styles.constraintUnit}>hrs</Text>
            </View>
          </View>

          {/* Prepaid Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPrepay(!prepay)}
            style={[styles.prepayPill, prepay && styles.prepayPillActive]}
          >
            <Feather name={prepay ? 'check' : 'tag'} size={12} color={prepay ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.prepayText, prepay && styles.prepayTextActive]}>Prepay</Text>
          </TouchableOpacity>
        </View>

        {/* Big Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isPacing}
          onPress={handleStart}
          style={[styles.primaryButton, shadows.button]}
        >
          <Feather name="play" size={16} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {isPacing ? 'Autonomous Bidding in Progress...' : 'Start Autonomous Negotiation'}
          </Text>
        </TouchableOpacity>

        {/* Offline Demo Replay */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            onTriggerReplay();
            onGoToBidding();
          }}
          style={styles.replayButton}
        >
          <Feather name="rotate-ccw" size={14} color={colors.textSecondary} />
          <Text style={styles.replayButtonText}>Replay Golden Run (Offline Demo)</Text>
        </TouchableOpacity>
      </View>

      {/* Split Metric Cards (Income / Expense style from image) */}
      <View style={styles.splitRow}>
        <View style={[styles.splitCard, shadows.card]}>
          <View style={styles.splitIconRow}>
            <Text style={styles.splitLabel}>Reservation Cap</Text>
            <Feather name="arrow-up-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={styles.splitValue}>₹{budgetRupees}.00</Text>
          <Text style={styles.splitSub}>Driver hidden limit</Text>
        </View>

        <View style={[styles.splitCard, shadows.card]}>
          <View style={styles.splitIconRow}>
            <Text style={styles.splitLabel}>Policy Floor</Text>
            <Feather name="shield" size={16} color={colors.textMuted} />
          </View>
          <Text style={styles.splitValue}>₹30.00</Text>
          <Text style={styles.splitSub}>Owner minimum floor</Text>
        </View>
      </View>

      {/* Your Activity / Safety Guard Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Agent Policy Status</Text>
        <Text style={styles.sectionLink}>Active</Text>
      </View>

      <View style={[styles.activityCard, shadows.card]}>
        <View style={styles.activityIconCircle}>
          <Feather name="shield" size={18} color={colors.primary} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>7 Anti-Hallucination Barriers</Text>
          <Text style={styles.activityText}>
            Integer paise precision, PolicyGuard floor clamp, monotonic counters, and zero-LLM payment calculations active.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  heroPrice: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  heroPriceUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  discountPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  constraintsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.cardSmall,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  constraintItem: {
    alignItems: 'center',
  },
  constraintLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  numericInput: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingVertical: 0,
    minWidth: 26,
    textAlign: 'center',
  },
  constraintUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  prepayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  prepayPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  prepayText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  prepayTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.blackPure,
    borderRadius: radii.button,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  replayButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    gap: 12,
    marginBottom: 20,
  },
  splitCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  splitIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  splitValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  splitSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'flex-start',
    gap: 12,
  },
  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  activityText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});
