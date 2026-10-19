import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, radii, shadows } from '../theme';
import { LotPolicy, Slot } from '../types';

interface LotsScreenProps {
  lots: LotPolicy[];
  slots: Slot[];
  onToggleSlot: (slotId: string, currentOccupied: boolean) => void;
  onGoToHome: () => void;
  onGoToBidding: () => void;
}

export const LotsScreen: React.FC<LotsScreenProps> = ({
  lots,
  slots,
  onToggleSlot,
  onGoToHome,
  onGoToBidding,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string>('A-01');
  const [activeFilter, setActiveFilter] = useState<'today' | 'tomorrow' | 'later'>('today');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(265); // 04:25

  // Live countdown timer ticker for the radial dial
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 265));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `04:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Mock architectural layout slots merged with real backend slot sensors
  const displaySlots = [
    { id: '01', slotRef: 'A-01', status: 'Booked', carColor: colors.editorialDark },
    { id: '02', slotRef: 'A-02', status: 'Free' },
    { id: '03', slotRef: 'B-01', status: 'Booked', carColor: '#FFFFFF' },
    { id: '05', slotRef: 'B-02', status: 'Free' },
    { id: '08', slotRef: 'C-01', status: 'Booked', carColor: '#FFFFFF' },
    { id: '11', slotRef: 'A-01', status: 'Selected', isSelected: true },
    { id: '12', slotRef: 'C-02', status: 'Free' },
    { id: '14', slotRef: 'B-01', status: 'Booked', carColor: colors.editorialBlue },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Controls Bar (Screen 2 style) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onGoToHome}
          style={styles.roundActionBtn}
        >
          <Feather name="volume-2" size={16} color={colors.editorialDark} />
        </TouchableOpacity>

        <View style={styles.sideSelectorPill}>
          <Text style={styles.sideSelectorArrow}>⇋</Text>
          <Text style={styles.sideSelectorText}>Left Side · Level 1</Text>
        </View>
      </View>

      {/* Architectural Bay Grid (Top-Down Blueprint Layout) */}
      <View style={[styles.bayCard, shadows.card]}>
        <View style={styles.bayHeaderRow}>
          <Text style={styles.bayEyebrow}>ARCHITECTURAL PARKING BAY</Text>
          <View style={styles.liveSensorPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveSensorText}>ESP32 IR Live</Text>
          </View>
        </View>

        {/* 2 Rows of 4 Parking Bays with Drive Lane */}
        <View style={styles.gridContainer}>
          <View style={styles.slotsRow}>
            {displaySlots.slice(0, 4).map((item) => {
              const realSlot = slots.find((s) => s.slot_id === item.slotRef);
              const isOccupied = realSlot ? Boolean(realSlot.sensor_occupied) : item.status === 'Booked';
              const isSelected = item.isSelected || selectedSlotId === item.slotRef;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedSlotId(item.slotRef);
                    if (realSlot) onToggleSlot(realSlot.slot_id, isOccupied);
                  }}
                  style={[
                    styles.slotBox,
                    isSelected && styles.slotBoxSelected,
                    !isOccupied && !isSelected && styles.slotBoxFree,
                  ]}
                >
                  <View style={styles.slotNumberWrap}>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>{item.id}</Text>
                      </View>
                    ) : (
                      <Text style={styles.slotIdText}>{item.id}</Text>
                    )}
                  </View>

                  {/* Top-down vehicle or empty bay */}
                  {isOccupied ? (
                    <View
                      style={[
                        styles.topDownCar,
                        { backgroundColor: item.carColor || colors.editorialDark },
                      ]}
                    />
                  ) : (
                    <View style={styles.emptyBayMark} />
                  )}

                  <Text
                    style={[
                      styles.slotStatusText,
                      isSelected
                        ? styles.slotStatusSelected
                        : isOccupied
                        ? styles.slotStatusBooked
                        : styles.slotStatusFree,
                    ]}
                  >
                    {isSelected ? 'Selected' : isOccupied ? 'Booked' : 'Free'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Central Driving Lane Divider */}
          <View style={styles.driveLane}>
            <View style={styles.laneDash} />
            <View style={styles.laneDash} />
            <View style={styles.laneDash} />
            <View style={styles.laneDash} />
          </View>

          <View style={styles.slotsRow}>
            {displaySlots.slice(4, 8).map((item) => {
              const realSlot = slots.find((s) => s.slot_id === item.slotRef);
              const isOccupied = realSlot ? Boolean(realSlot.sensor_occupied) : item.status === 'Booked';
              const isSelected = item.isSelected || selectedSlotId === item.slotRef;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedSlotId(item.slotRef);
                    if (realSlot) onToggleSlot(realSlot.slot_id, isOccupied);
                  }}
                  style={[
                    styles.slotBox,
                    isSelected && styles.slotBoxSelected,
                    !isOccupied && !isSelected && styles.slotBoxFree,
                  ]}
                >
                  <View style={styles.slotNumberWrap}>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>{item.id}</Text>
                      </View>
                    ) : (
                      <Text style={styles.slotIdText}>{item.id}</Text>
                    )}
                  </View>

                  {isOccupied ? (
                    <View
                      style={[
                        styles.topDownCar,
                        { backgroundColor: item.carColor || colors.editorialDark },
                      ]}
                    />
                  ) : (
                    <View style={styles.emptyBayMark} />
                  )}

                  <Text
                    style={[
                      styles.slotStatusText,
                      isSelected
                        ? styles.slotStatusSelected
                        : isOccupied
                        ? styles.slotStatusBooked
                        : styles.slotStatusFree,
                    ]}
                  >
                    {isSelected ? 'Selected' : isOccupied ? 'Booked' : 'Free'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Bottom Closing Time & Radial Dial Card */}
      <View style={[styles.timerCard, shadows.card]}>
        {/* Card Header: Clock Icon + Closing Time + Park Button */}
        <View style={styles.timerHeaderRow}>
          <View style={styles.timerTitleGroup}>
            <Feather name="clock" size={16} color={colors.coralOrange} />
            <Text style={styles.timerTitle}>Closing Time</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onGoToBidding}
            style={styles.parkButton}
          >
            <Text style={styles.parkButtonText}>Park</Text>
          </TouchableOpacity>
        </View>

        {/* Day Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('today')}
            style={[styles.filterPill, activeFilter === 'today' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'today' && styles.filterPillTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('tomorrow')}
            style={[styles.filterPill, activeFilter === 'tomorrow' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'tomorrow' && styles.filterPillTextActive]}>
              Tomorrow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveFilter('later')}
            style={[styles.filterPill, activeFilter === 'later' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'later' && styles.filterPillTextActive]}>
              Later
            </Text>
          </TouchableOpacity>
        </View>

        {/* Radial Countdown Gauge Dial with Particle Dots */}
        <View style={styles.radialGaugeContainer}>
          <Svg width={220} height={120} viewBox="0 0 220 120">
            {/* Background Arch Track */}
            <Path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="#EAE6DE"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Vivid Coral Orange Progress Arch */}
            <Path
              d="M 65 38 A 90 90 0 0 1 200 110"
              fill="none"
              stroke={colors.coralOrange}
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Scattered Particle Dots from Image */}
            <Circle cx="120" cy="55" r="2.8" fill={colors.coralOrange} opacity={0.85} />
            <Circle cx="132" cy="65" r="3.5" fill={colors.coralOrange} opacity={0.65} />
            <Circle cx="145" cy="52" r="3" fill={colors.coralOrange} opacity={0.9} />
            <Circle cx="155" cy="72" r="2.2" fill={colors.coralOrange} opacity={0.5} />
            <Circle cx="165" cy="60" r="3.2" fill={colors.coralOrange} opacity={0.8} />
          </Svg>

          {/* Center Digital Clock readout */}
          <View style={styles.clockCenterOverlay}>
            <Feather name="clock" size={15} color={colors.textSecondary} style={{ marginBottom: 2 }} />
            <Text style={styles.clockDigitText}>{formatTimer(countdownSeconds)}</Text>
          </View>
        </View>

        <Text style={styles.alertNotice}>Alert me 15 mins before</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  roundActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.editorialDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sideSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 6,
  },
  sideSelectorArrow: {
    fontSize: 14,
    color: colors.editorialDark,
    fontWeight: '700',
  },
  sideSelectorText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.editorialDark,
  },

  // Bay Grid Card
  bayCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
  },
  bayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  bayEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  liveSensorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveSensorText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.editorialDark,
  },
  gridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.cardSmall,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slotBox: {
    width: 62,
    height: 94,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  slotBoxFree: {
    borderStyle: 'dashed',
    borderColor: colors.borderWarm,
  },
  slotBoxSelected: {
    backgroundColor: colors.coralLight,
    borderWidth: 2,
    borderColor: colors.coralOrange,
    shadowColor: colors.coralOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  slotNumberWrap: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.coralOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  topDownCar: {
    width: 24,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  emptyBayMark: {
    width: 24,
    height: 44,
    borderRadius: 6,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: colors.borderWarm,
  },
  slotStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  slotStatusBooked: {
    color: colors.danger,
  },
  slotStatusFree: {
    color: colors.success,
  },
  slotStatusSelected: {
    color: colors.coralOrange,
    fontWeight: '800',
  },
  driveLane: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  laneDash: {
    width: 28,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },

  // Timer & Radial Dial Card
  timerCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  timerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  timerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.editorialDark,
  },
  parkButton: {
    backgroundColor: colors.coralOrange,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.pill,
    shadowColor: colors.coralOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  parkButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.coralOrange,
    borderColor: colors.coralOrange,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  radialGaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  clockCenterOverlay: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
  },
  clockDigitText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.editorialDark,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  alertNotice: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
  },
});
