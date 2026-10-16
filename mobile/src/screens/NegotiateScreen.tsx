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
import { NegotiationEvent, ValidatedMove, WinnerData } from '../types';

interface NegotiateScreenProps {
  events: NegotiationEvent[];
  isPacing: boolean;
  statusText: string;
  winner: WinnerData | null;
  onClear: () => void;
  onGoToPass: () => void;
}

export const NegotiateScreen: React.FC<NegotiateScreenProps> = ({
  events,
  isPacing,
  statusText,
  winner,
  onClear,
  onGoToPass,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Header
        title="Bidding"
        subtitleBold="Autonomous Rounds"
        subtitleLight="dual-model Gemini pacing"
        statusBadge={isPacing ? '1200ms Active' : `${events.length} Events`}
        onPlusPress={onClear}
        onArrowPress={onGoToPass}
      />

      {/* Status Bar */}
      <View style={[styles.statusBar, shadows.card]}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText} numberOfLines={1}>{statusText}</Text>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <View style={[styles.emptyCard, shadows.card]}>
          <Feather name="message-square" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Active Dialogue</Text>
          <Text style={styles.emptySub}>
            Start negotiation from the Home screen or trigger the offline golden replay.
          </Text>
        </View>
      ) : (
        <View style={styles.dialogueList}>
          {events.map((evt, idx) => {
            // Distance Filter skipped
            if (evt.event_type === 'LOT_SKIPPED') {
              return (
                <View key={idx} style={styles.skippedCard}>
                  <Feather name="alert-triangle" size={14} color={colors.warning} />
                  <Text style={styles.skippedText}>
                    <Text style={{ fontWeight: '700' }}>{evt.data.lot_id}</Text> skipped ({evt.data.distance_m}m &gt; limit)
                  </Text>
                </View>
              );
            }

            // Round Separator
            if (evt.event_type === 'ROUND_COMPLETED') {
              return (
                <View key={idx} style={styles.roundDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.roundText}>Round {evt.data.round}</Text>
                  <View style={styles.dividerLine} />
                </View>
              );
            }

            // Deal Accepted Card
            if (evt.event_type === 'ACCEPT' && !evt.data.from_agent) {
              const data = evt.data;
              return (
                <View key={idx} style={[styles.acceptCard, shadows.card]}>
                  <View style={styles.acceptHeader}>
                    <View style={styles.acceptBadge}>
                      <Feather name="check-circle" size={14} color="#FFFFFF" />
                      <Text style={styles.acceptBadgeText}>DEAL ACCEPTED</Text>
                    </View>
                    <Text style={styles.acceptSlot}>Slot {data.slot_id}</Text>
                  </View>
                  <Text style={styles.acceptLotName}>{data.winner_name || data.winner_lot_id}</Text>
                  <Text style={styles.acceptMessage}>
                    {data.message || `Agreed at ₹${data.agreed_rate_rupees}/hr. Slot ${data.slot_id} reserved.`}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onGoToPass}
                    style={styles.viewPassButton}
                  >
                    <Text style={styles.viewPassText}>Open Digital Pass &amp; Pay</Text>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            }

            // Walk Away Notification
            if (evt.event_type === 'WALK_AWAY' && !evt.data.from_agent) {
              return (
                <View key={idx} style={styles.walkAwayPill}>
                  <Text style={styles.walkAwayText}>
                    {evt.data.lot_name || evt.data.lot_id}: {evt.data.reason}
                  </Text>
                </View>
              );
            }

            // Standard Moves (REQUEST, OFFER, COUNTER)
            if (!['REQUEST', 'OFFER', 'COUNTER'].includes(evt.event_type)) {
              return null;
            }

            const move = evt.data as ValidatedMove;
            const isDriver = move.from_agent === 'driver';
            const price = move.price_per_hour_paise ? Math.round(move.price_per_hour_paise / 100) : 0;
            const rawPrice = move.raw_llm_paise ? Math.round(move.raw_llm_paise / 100) : price;

            return (
              <View
                key={idx}
                style={[
                  styles.moveCard,
                  isDriver ? styles.driverMoveCard : styles.lotMoveCard,
                  shadows.card,
                ]}
              >
                {/* Agent Header */}
                <View style={styles.moveHeader}>
                  <View style={styles.agentTag}>
                    <Feather
                      name={isDriver ? 'user' : 'home'}
                      size={12}
                      color={isDriver ? colors.primary : colors.textPrimary}
                    />
                    <Text style={styles.agentName}>
                      {isDriver ? 'Driver Agent' : move.from_agent.replace('lot_', '')}
                    </Text>
                    {move.model_used && (
                      <View style={styles.modelPill}>
                        <Text style={styles.modelText}>{move.model_used}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.actionPill}>
                    <Text style={styles.actionPrice}>₹{price}/hr</Text>
                  </View>
                </View>

                {/* Message Prose */}
                <Text style={styles.moveMessage}>{move.message}</Text>

                {/* Policy Guard Clamp Warning Badge */}
                {move.guard_triggered && (
                  <View style={styles.clampBadge}>
                    <View style={styles.clampTitleRow}>
                      <Feather name="shield" size={12} color={colors.warning} />
                      <Text style={styles.clampTitle}>ANTI-HALLUCINATION BARRIER</Text>
                    </View>
                    <Text style={styles.clampText}>
                      Raw bid <Text style={styles.strikethrough}>₹{rawPrice}</Text> → Enforced ₹{price}/hr
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Persistent Winner Quick Link */}
      {winner && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onGoToPass}
          style={[styles.floatingWinnerBanner, shadows.cardStacked]}
        >
          <View style={styles.floatingWinnerInfo}>
            <Text style={styles.floatingWinnerEyebrow}>READY FOR SETTLEMENT</Text>
            <Text style={styles.floatingWinnerTitle}>{winner.name} • Slot {winner.slot_id}</Text>
          </View>
          <View style={styles.floatingWinnerPriceBadge}>
            <Text style={styles.floatingWinnerPrice}>₹{winner.total_rupees}</Text>
            <Feather name="chevron-right" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 18,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogueList: {
    paddingHorizontal: 18,
    gap: 12,
  },
  roundDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  roundText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignSelf: 'center',
  },
  skippedText: {
    fontSize: 11,
    color: '#B45309',
  },
  walkAwayPill: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'center',
  },
  walkAwayText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  moveCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardSmall,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  driverMoveCard: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primary,
  },
  lotMoveCard: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.blackPure,
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modelPill: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modelText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  actionPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  actionPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  moveMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clampBadge: {
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  clampTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  clampTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  clampText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: colors.danger,
  },
  acceptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.success,
    marginVertical: 4,
  },
  acceptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  acceptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  acceptBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  acceptSlot: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  acceptLotName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  acceptMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  viewPassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 11,
  },
  viewPassText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  floatingWinnerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: radii.cardSmall,
    padding: 16,
  },
  floatingWinnerInfo: {
    flex: 1,
  },
  floatingWinnerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  floatingWinnerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingWinnerPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingWinnerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
