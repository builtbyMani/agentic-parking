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
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import { Header } from '../components/Header';
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen 1 Header */}
      <Header
        greeting="Good Morning"
        userName="John Abraham"
        title="Let's Find"
        highlightWord="Parking"
        subtitle="near You"
        onSearchPress={handleStart}
        statusBadge={isPacing ? 'Bidding...' : 'AI Ready'}
      />

      {/* Map & Route Card with 450m Badge */}
      <View style={[styles.mapCard, shadows.card]}>
        <Svg width="100%" height={210} viewBox="0 0 340 210" style={styles.mapSvg}>
          {/* Stylized warm ivory road networks */}
          <Path
            d="M-30 80 Q 90 95 160 50 T 370 40"
            fill="none"
            stroke="#DFD9CE"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <Path
            d="M 50 230 Q 110 140 170 120 T 360 80"
            fill="none"
            stroke="#DFD9CE"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <Path
            d="M-10 170 Q 120 180 220 220"
            fill="none"
            stroke="#DFD9CE"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Navigation route trajectory line */}
          <Path
            d="M 100 155 C 110 95, 140 75, 195 95"
            fill="none"
            stroke={colors.editorialDark}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Start point dot */}
          <Circle cx="100" cy="155" r="4.5" fill={colors.editorialDark} />

          {/* Target destination point */}
          <Circle cx="195" cy="95" r="6" fill={colors.coralOrange} stroke="#FFFFFF" strokeWidth="2.5" />
        </Svg>

        {/* Floating 450 m Distance Pill */}
        <View style={styles.distancePill}>
          <View style={styles.distanceDot} />
          <Text style={styles.distanceText}>450 m</Text>
        </View>

        {/* Map Zoom Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.7}>
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.7}>
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Lot Card (Vivid Coral Orange with Overlapping 9 Available Pill) */}
      <View style={[styles.coralCard, shadows.cardStacked]}>
        {/* Overlapping Frosted Badge */}
        <View style={styles.availableBadge}>
          <Text style={styles.availableBadgeText}>9 Available</Text>
        </View>

        {/* Micro Parking Layout Preview */}
        <View style={styles.microBayContainer}>
          <View style={styles.microBayRow}>
            {/* Slot 1: Car parked */}
            <View style={styles.microSlot}>
              <View style={[styles.microCar, { backgroundColor: '#FFFFFF' }]} />
              <Text style={styles.microSlotText}>01</Text>
            </View>

            {/* Slot 2: Empty/Available */}
            <View style={[styles.microSlot, styles.microSlotEmpty]}>
              <Text style={styles.microSlotText}>02</Text>
            </View>

            {/* Slot 3: Car parked */}
            <View style={styles.microSlot}>
              <View style={[styles.microCar, { backgroundColor: colors.editorialDark }]} />
              <Text style={styles.microSlotText}>03</Text>
            </View>

            {/* Slot 4: Empty */}
            <View style={[styles.microSlot, styles.microSlotEmpty]}>
              <Text style={styles.microSlotText}>04</Text>
            </View>

            {/* Slot 5: Car parked */}
            <View style={styles.microSlot}>
              <View style={[styles.microCar, { backgroundColor: '#FFFFFF' }]} />
              <Text style={styles.microSlotText}>05</Text>
            </View>
          </View>
        </View>

        {/* Lot Title & Round Arrow CTA */}
        <View style={styles.lotFooterRow}>
          <View>
            <Text style={styles.lotTitle}>37th Avenue Parking</Text>
            <Text style={styles.lotSubtitle}>₹36/hr · Dual-Agent Autonomous</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStart}
            style={styles.arrowButton}
          >
            <Feather name="arrow-up-right" size={20} color={colors.coralOrange} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Driver Constraints Editor Card */}
      <View style={[styles.configCard, shadows.card]}>
        <View style={styles.configHeader}>
          <Text style={styles.configTitle}>Driver Bidding Preferences</Text>
          <Text style={styles.configBadge}>Policy-Guarded</Text>
        </View>

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
            <Feather name={prepay ? 'check' : 'tag'} size={11} color={prepay ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.prepayText, prepay && styles.prepayTextActive]}>Prepay</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isPacing}
          onPress={handleStart}
          style={[styles.primaryButton, shadows.coralButton]}
        >
          <Feather name="play" size={15} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {isPacing ? 'Bidding in Progress...' : 'Start Autonomous Negotiation'}
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
          <Feather name="rotate-ccw" size={13} color={colors.textSecondary} />
          <Text style={styles.replayButtonText}>Replay Golden Run (Offline Demo)</Text>
        </TouchableOpacity>
      </View>

      {/* Safety & Anti-Hallucination Indicator */}
      <View style={[styles.policyCard, shadows.card]}>
        <View style={styles.policyIconCircle}>
          <Feather name="shield" size={16} color={colors.editorialBlue} />
        </View>
        <View style={styles.policyTextWrap}>
          <Text style={styles.policyTitle}>7 Deterministic Security Barriers</Text>
          <Text style={styles.policyDesc}>
            Integer paise precision, PolicyGuard floor enforcement, and zero-LLM payment calculation.
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
    paddingBottom: 24,
  },

  // Map & Route card
  mapCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: radii.card,
    marginHorizontal: 18,
    height: 210,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: -24,
  },
  mapSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  distancePill: {
    position: 'absolute',
    top: 36,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: colors.editorialDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  distanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.editorialBlue,
    marginRight: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.editorialDark,
  },
  mapControls: {
    position: 'absolute',
    right: 14,
    bottom: 34,
    flexDirection: 'column',
    gap: 6,
  },
  zoomBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.editorialDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoomBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.editorialDark,
  },

  // Featured Coral Orange Card
  coralCard: {
    backgroundColor: colors.coralOrange,
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 20,
    position: 'relative',
    marginBottom: 16,
    zIndex: 10,
  },
  availableBadge: {
    position: 'absolute',
    top: -12,
    left: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: colors.coralOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  availableBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.coralOrange,
    letterSpacing: 0.3,
  },
  microBayContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radii.cardSmall,
    padding: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  microBayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  microSlot: {
    width: 32,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  microSlotEmpty: {
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  microCar: {
    width: 22,
    height: 34,
    borderRadius: 5,
    marginBottom: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  microSlotText: {
    fontSize: 7,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  lotFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  lotSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.coralMuted,
    marginTop: 1,
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Driver Constraints Config
  configCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.editorialDark,
    letterSpacing: -0.2,
  },
  configBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.editorialBlue,
    backgroundColor: colors.editorialLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  constraintsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.cardSmall,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  constraintItem: {
    flex: 1,
    alignItems: 'center',
  },
  constraintLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  numericInput: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 26,
    textAlign: 'center',
    padding: 0,
  },
  constraintUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  prepayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prepayPillActive: {
    backgroundColor: colors.editorialDark,
    borderColor: colors.editorialDark,
  },
  prepayText: {
    fontSize: 10,
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
    backgroundColor: colors.coralOrange,
    paddingVertical: 14,
    borderRadius: radii.button,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  replayButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Security Policy card
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: radii.cardSmall,
    marginHorizontal: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
  },
  policyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.editorialLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTextWrap: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.editorialDark,
  },
  policyDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 1,
  },
});
