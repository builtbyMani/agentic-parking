import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '../components/Header';
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
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <Header
        title="Fleet"
        subtitleBold="Nearby Lots"
        subtitleLight="&amp; IR sensor telemetry"
        onPlusPress={onGoToHome}
        onArrowPress={onGoToBidding}
        statusBadge="Live Twin"
      />

      {/* Competing Lots List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Competing Parking Hubs</Text>
        <Text style={styles.sectionSub}>{lots.length} active lots</Text>
      </View>

      <View style={styles.lotsList}>
        {lots.map((lot) => {
          const occPct = Math.round((lot.occupied_slots / lot.total_slots) * 100);
          const isFar = lot.distance_m > 400;

          return (
            <View key={lot.lot_id} style={[styles.lotCard, shadows.card]}>
              <View style={styles.lotTopRow}>
                <View>
                  <View style={styles.lotNameRow}>
                    <Text style={styles.lotName}>{lot.name}</Text>
                    {isFar && (
                      <View style={styles.filterPill}>
                        <Text style={styles.filterPillText}>&gt;400m</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.lotDistance}>{lot.distance_m}m walk from destination</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>₹{lot.base_floor_paise / 100}–₹{lot.base_list_paise / 100}</Text>
                  <Text style={styles.priceUnit}>/hr range</Text>
                </View>
              </View>

              {/* Occupancy Bar */}
              <View style={styles.occupancyContainer}>
                <View style={styles.occupancyLabels}>
                  <Text style={styles.occupancyText}>
                    Occupancy: {lot.occupied_slots}/{lot.total_slots} slots ({occPct}%)
                  </Text>
                  {lot.event_active && (
                    <Text style={styles.eventText}>⚡ Event Active</Text>
                  )}
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${occPct}%`,
                        backgroundColor: occPct > 75 ? colors.danger : colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Interactive IR Slot Sensors (2x2 Stats Grid from image screen 4) */}
      <View style={[styles.sectionHeader, { marginTop: 14 }]}>
        <Text style={styles.sectionTitle}>Physical IR Slot Sensors</Text>
        <Text style={styles.sectionSub}>Tap slot to toggle</Text>
      </View>

      <View style={styles.sensorGrid}>
        {slots.map((slot) => {
          const isOccupied = Boolean(slot.sensor_occupied);

          return (
            <TouchableOpacity
              key={slot.slot_id}
              activeOpacity={0.8}
              onPress={() => onToggleSlot(slot.slot_id, isOccupied)}
              style={[
                styles.sensorCard,
                isOccupied ? styles.sensorCardOccupied : styles.sensorCardFree,
                shadows.card,
              ]}
            >
              <View style={styles.sensorCardHeader}>
                <View
                  style={[
                    styles.sensorIconCircle,
                    isOccupied ? styles.sensorIconOccupied : styles.sensorIconFree,
                  ]}
                >
                  <Feather
                    name={isOccupied ? 'disc' : 'check'}
                    size={16}
                    color={isOccupied ? colors.danger : colors.success}
                  />
                </View>
                <Text style={styles.slotLot}>{slot.lot_id}</Text>
              </View>

              <Text style={styles.slotIdText}>Slot {slot.slot_id}</Text>
              <Text style={[styles.slotStatus, isOccupied ? styles.statusOccupied : styles.statusFree]}>
                {isOccupied ? 'SENSOR OCCUPIED' : 'SLOT AVAILABLE'}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  lotsList: {
    paddingHorizontal: 18,
    gap: 12,
  },
  lotCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  lotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lotName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  filterPill: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  lotDistance: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 10,
    color: colors.textMuted,
  },
  occupancyContainer: {
    marginTop: 4,
  },
  occupancyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  occupancyText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  eventText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  sensorCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sensorCardOccupied: {
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  sensorCardFree: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  sensorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIconOccupied: {
    backgroundColor: colors.dangerLight,
  },
  sensorIconFree: {
    backgroundColor: colors.successLight,
  },
  slotLot: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  slotIdText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  slotStatus: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusOccupied: {
    color: colors.danger,
  },
  statusFree: {
    color: colors.success,
  },
});
