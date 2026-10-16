import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { colors, radii, shadows } from '../theme';
import { WinnerData } from '../types';
import { API_BASE } from '../hooks/useMobileNegotiation';

interface PassScreenProps {
  winner: WinnerData | null;
  qrToken: string | null;
  gateState: 'OPEN' | 'CLOSED';
  gateCountdown: number;
  onActuateGate: () => void;
  onConfirmPayment: (bookingId: string) => Promise<string | undefined>;
  onGoToBidding: () => void;
  onGoToHome: () => void;
}

export const PassScreen: React.FC<PassScreenProps> = ({
  winner,
  qrToken,
  gateState,
  gateCountdown,
  onActuateGate,
  onConfirmPayment,
  onGoToBidding,
  onGoToHome,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fallback demo winner if user views tab before completing a negotiation
  const activeWinner: WinnerData = winner || {
    lot_id: 'LOT_C',
    name: 'Lot C (Metro Plaza)',
    slot_id: 'C-01',
    agreed_rate_paise: 3500,
    agreed_rate_rupees: 35,
    total_paise: 10500,
    total_rupees: 105,
    usd_cents: 125,
    usd_display: '$1.25',
    booking_id: 'bk_demo_2026',
  };

  const handlePayPalCheckout = async () => {
    setLoading(true);
    setStatusMessage('Initiating PayPal Sandbox order...');
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${activeWinner.booking_id}/checkout`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.approve_url) {
        Linking.openURL(data.approve_url);
        setStatusMessage('Approved in Sandbox? Tap Confirm below.');
      } else {
        setStatusMessage('Sandbox session ready. Confirming...');
        await onConfirmPayment(activeWinner.booking_id);
      }
    } catch (e) {
      // Local fallback simulator
      setStatusMessage('Issuing cryptographic HMAC pass...');
      await onConfirmPayment(activeWinner.booking_id);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStatusMessage('Acquiring HMAC-SHA256 signature...');
    try {
      await onConfirmPayment(activeWinner.booking_id);
      setStatusMessage('Access pass activated! Ready for gate entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <Header
        title="Pass"
        subtitleBold="Digital Wallet"
        subtitleLight="PayPal &amp; physical gate key"
        onPlusPress={onGoToHome}
        onArrowPress={onGoToBidding}
        statusBadge={gateState === 'OPEN' ? 'Gate OPEN' : 'Access Locked'}
      />

      {/* THE SIGNATURE STACKED CARDS UI (from image screen 3) */}
      <View style={styles.cardStackWrapper}>
        {/* Layer 1: Top Card (Light) */}
        <View style={[styles.stackCardLayer1, shadows.card]}>
          <Text style={styles.layer1Title}>{activeWinner.name}</Text>
          <Text style={styles.layer1Sub}>Walking: 150m</Text>
        </View>

        {/* Layer 2: Middle Card (Soft Blue) */}
        <View style={[styles.stackCardLayer2, shadows.card]}>
          <Text style={styles.layer2Title}>Slot {activeWinner.slot_id} Reserved</Text>
          <Text style={styles.layer2Sub}>Soft-lock: 180s active</Text>
        </View>

        {/* Layer 3: Main Active Cobalt Card */}
        <View style={[styles.stackCardMain, shadows.cardStacked]}>
          <View style={styles.mainCardTopRow}>
            <View>
              <Text style={styles.mainCardLabel}>AGREED RATE</Text>
              <Text style={styles.mainCardPrice}>₹{activeWinner.agreed_rate_rupees}<Text style={styles.mainCardUnit}>/hr</Text></Text>
            </View>
            <View style={styles.mainCardBadge}>
              <Feather name="check" size={14} color="#FFFFFF" />
              <Text style={styles.mainCardBadgeText}>CONFIRMED</Text>
            </View>
          </View>

          <View style={styles.mainCardDivider} />

          <View style={styles.mainCardBottomRow}>
            <View>
              <Text style={styles.mainCardSettlement}>Total: ₹{activeWinner.total_rupees} ({activeWinner.usd_display} USD)</Text>
              <Text style={styles.mainCardPassId}>Digital Pass •••••••• {activeWinner.booking_id.slice(-4)}</Text>
            </View>
            <View style={styles.chipIcon}>
              <Feather name="shield" size={20} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>

      {/* Action Modules */}
      <View style={styles.actionsContainer}>
        {/* Step 1: PayPal Checkout */}
        {!qrToken ? (
          <View style={[styles.actionCard, shadows.card]}>
            <View style={styles.actionCardHeader}>
              <View style={styles.actionIconPill}>
                <Feather name="credit-card" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Zero-LLM PayPal Settlement</Text>
                <Text style={styles.actionCardSub}>Calculated in Python paise to USD cents ($1.25)</Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 14 }} />
            ) : (
              <View style={styles.buttonStack}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePayPalCheckout}
                  style={[styles.payPalButton, shadows.button]}
                >
                  <Text style={styles.payPalButtonText}>Approve via PayPal Sandbox</Text>
                  <Feather name="external-link" size={14} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirm}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>Confirm &amp; Issue Signed Pass</Text>
                </TouchableOpacity>
              </View>
            )}

            {statusMessage && <Text style={styles.statusFeedback}>{statusMessage}</Text>}
          </View>
        ) : (
          /* Step 2: Cryptographic QR Access Key & Gate Trigger */
          <View style={[styles.actionCard, shadows.card]}>
            <View style={styles.qrHeader}>
              <View style={styles.qrBadge}>
                <Feather name="lock" size={12} color={colors.success} />
                <Text style={styles.qrBadgeText}>HMAC-SHA256 SIGNED</Text>
              </View>
              <Text style={styles.qrBookingId}>Slot {activeWinner.slot_id}</Text>
            </View>

            {/* Visual QR Representation */}
            <View style={styles.qrMockContainer}>
              <View style={styles.qrSquare}>
                <Feather name="maximize" size={54} color={colors.primary} />
                <Text style={styles.qrLabelText}>VALID PASS</Text>
              </View>
              <Text style={styles.tokenMonoText} numberOfLines={1}>
                {qrToken}
              </Text>
            </View>

            {/* Actuate Physical/Twin Barrier Gate */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onActuateGate}
              style={[
                styles.gateButton,
                gateState === 'OPEN' ? styles.gateButtonOpen : styles.gateButtonClosed,
                shadows.button,
              ]}
            >
              <Feather
                name={gateState === 'OPEN' ? 'unlock' : 'key'}
                size={18}
                color={gateState === 'OPEN' ? colors.success : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.gateButtonText,
                  gateState === 'OPEN' ? styles.gateButtonTextOpen : styles.gateButtonTextClosed,
                ]}
              >
                {gateState === 'OPEN'
                  ? `BARRIER OPEN (${gateCountdown}s auto-close)`
                  : 'Present to Security Gate Barrier'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Twin Feedback */}
        <View style={styles.twinPill}>
          <Feather name="cpu" size={13} color={colors.textSecondary} />
          <Text style={styles.twinPillText}>
            Physical ESP32 Twin: SG90 Servo Barrier &amp; IR Sensors Synced
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
  cardStackWrapper: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 20,
    height: 250,
    position: 'relative',
    alignItems: 'center',
  },
  stackCardLayer1: {
    position: 'absolute',
    top: 0,
    width: '88%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  layer1Title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  layer1Sub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  stackCardLayer2: {
    position: 'absolute',
    top: 26,
    width: '93%',
    height: 130,
    backgroundColor: '#93C5FD',
    borderRadius: radii.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  layer2Title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  layer2Sub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  stackCardMain: {
    position: 'absolute',
    top: 54,
    width: '100%',
    height: 180,
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    padding: 22,
    justifyContent: 'space-between',
  },
  mainCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  mainCardPrice: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  mainCardUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  mainCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  mainCardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mainCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },
  mainCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainCardSettlement: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mainCardPassId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.7)',
  },
  chipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 18,
    gap: 12,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  actionIconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionCardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  buttonStack: {
    gap: 10,
  },
  payPalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0070BA',
    borderRadius: radii.button,
    paddingVertical: 14,
  },
  payPalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.button,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statusFeedback: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  qrBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  qrBookingId: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  qrMockContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  qrSquare: {
    width: 130,
    height: 130,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qrLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  tokenMonoText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    maxWidth: '90%',
  },
  gateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.button,
    paddingVertical: 14,
    marginTop: 6,
  },
  gateButtonClosed: {
    backgroundColor: colors.blackPure,
  },
  gateButtonOpen: {
    backgroundColor: colors.successLight,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  gateButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  gateButtonTextClosed: {
    color: '#FFFFFF',
  },
  gateButtonTextOpen: {
    color: colors.success,
  },
  twinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 4,
  },
  twinPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
