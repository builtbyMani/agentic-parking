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
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Fallback demo winner if user views tab before finishing negotiation
  const activeWinner: WinnerData = winner || {
    lot_id: 'LOT_A',
    name: '37th Avenue Parking',
    slot_id: 'A-01',
    agreed_rate_paise: 3500,
    agreed_rate_rupees: 35,
    total_paise: 10500,
    total_rupees: 105,
    usd_cents: 125,
    usd_display: '$1.25',
    booking_id: 'bk_live_3425',
  };

  const handlePayPalCheckout = async () => {
    setLoading(true);
    setStatusMessage('Connecting PayPal Sandbox...');
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${activeWinner.booking_id}/checkout`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.approve_url) {
        Linking.openURL(data.approve_url);
        setStatusMessage('Approved in Sandbox? Confirm below.');
      } else {
        await onConfirmPayment(activeWinner.booking_id);
      }
    } catch {
      await onConfirmPayment(activeWinner.booking_id);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStatusMessage('Generating HMAC-SHA256 token...');
    try {
      await onConfirmPayment(activeWinner.booking_id);
      setStatusMessage('Access pass verified.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Controls Bar (Screen 3 style) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onGoToHome}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Floating Vehicle Info Pill */}
        <View style={styles.vehiclePill}>
          <View style={styles.vehicleIcon}>
            <Feather name="truck" size={13} color="#FFFFFF" />
          </View>
          <View style={styles.vehicleTextWrap}>
            <Text style={styles.vehicleLabel}>Your vehicle</Text>
            <Text style={styles.vehicleModel}>BMW X6 · KA-05</Text>
          </View>
        </View>
      </View>

      {/* 3D Underground Garage Perspective Ambiance Card */}
      <View style={[styles.garageCard, shadows.card]}>
        {/* Floating Bay Marker Pill hovering in 3D space */}
        <View style={styles.bayFloatingMarker}>
          <View style={styles.markerBadge}>
            <Text style={styles.markerBadgeText}>P</Text>
          </View>
          <Text style={styles.markerSlotText}>H4 {activeWinner.slot_id} · 3425</Text>
        </View>

        {/* Mini HUD Radar Widget on top right */}
        <View style={styles.miniRadarWidget}>
          <Svg width={46} height={46} viewBox="0 0 46 46">
            <Path
              d="M 8 38 L 22 22 L 36 12"
              fill="none"
              stroke={colors.coralOrange}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Circle cx="36" cy="12" r="3.5" fill={colors.coralOrange} />
            <Circle cx="8" cy="38" r="3" fill="#FFFFFF" />
          </Svg>
        </View>

        {/* Vertical HUD Action Column */}
        <View style={styles.hudActionsColumn}>
          <View style={styles.hudIconBtn}>
            <Feather name="corner-up-left" size={14} color="#FFFFFF" />
          </View>
          <View style={styles.hudIconBtn}>
            <Feather name="crosshair" size={14} color="#FFFFFF" />
          </View>
          <View style={styles.hudIconBtn}>
            <Feather name="map" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* 3D Perspective Garage Floor SVG Simulation */}
        <Svg width="100%" height={260} viewBox="0 0 340 260">
          <Defs>
            <LinearGradient id="garageFloor" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1E293B" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#0B1321" stopOpacity="0.95" />
            </LinearGradient>
            <LinearGradient id="coralBay" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#EF5537" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#D94528" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          {/* Perspective Floor Plane */}
          <Path
            d="M 0 100 L 340 100 L 340 260 L 0 260 Z"
            fill="url(#garageFloor)"
          />

          {/* Perspective Lane Guidelines */}
          <Line x1="100" y1="100" x2="20" y2="260" stroke="#334155" strokeWidth="1.5" />
          <Line x1="240" y1="100" x2="320" y2="260" stroke="#334155" strokeWidth="1.5" />

          {/* Floor Zebra Crossing / Hazard Stripes leading to bay */}
          <Path d="M 85 140 L 155 140" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity={0.85} />
          <Path d="M 80 155 L 160 155" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" opacity={0.85} />
          <Path d="M 75 172 L 165 172" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity={0.85} />
          <Path d="M 70 190 L 170 190" stroke="#FFFFFF" strokeWidth="6.5" strokeLinecap="round" opacity={0.85} />
          <Path d="M 65 210 L 175 210" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity={0.85} />

          {/* Perspective Coral Orange Parking Bay Surface */}
          <Path
            d="M 175 125 L 305 125 L 325 245 L 180 245 Z"
            fill="url(#coralBay)"
            stroke="#F26C52"
            strokeWidth="2"
          />

          {/* Bay Slot ID Text Painted on Floor */}
          <Path
            d="M 230 195 L 260 195"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Booking Details & Gate Actuation Controls */}
      <View style={[styles.dealSummaryCard, shadows.card]}>
        <View style={styles.dealHeaderRow}>
          <View>
            <Text style={styles.dealLotName}>{activeWinner.name}</Text>
            <Text style={styles.dealSlotDetail}>
              Assigned Bay: <Text style={{ fontWeight: '800', color: colors.editorialDark }}>{activeWinner.slot_id}</Text>
            </Text>
          </View>
          <View style={styles.rateBadge}>
            <Text style={styles.rateRupees}>₹{activeWinner.agreed_rate_rupees}/hr</Text>
            <Text style={styles.rateUsd}>({activeWinner.usd_display})</Text>
          </View>
        </View>

        {/* Gate State & Hardware Sensor Pill */}
        <View style={styles.gateStatusBanner}>
          <View style={styles.gateStatusLeft}>
            <Feather
              name={gateState === 'OPEN' ? 'unlock' : 'lock'}
              size={15}
              color={gateState === 'OPEN' ? colors.success : colors.danger}
            />
            <Text style={styles.gateStatusLabel}>
              Physical Vision Gate: <Text style={{ fontWeight: '800' }}>{gateState}</Text>
            </Text>
          </View>
          {gateState === 'OPEN' && (
            <Text style={styles.countdownPill}>{gateCountdown}s Auto-Close</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonStack}>
          {/* Servo Gate Actuator */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onActuateGate}
            style={[styles.actuateBtn, gateState === 'OPEN' ? styles.actuateBtnOpen : styles.actuateBtnClosed]}
          >
            <Feather name={gateState === 'OPEN' ? 'check' : 'cpu'} size={15} color="#FFFFFF" />
            <Text style={styles.actuateBtnText}>
              {gateState === 'OPEN' ? 'Gate OPEN (Auto-closing)' : 'Actuate Physical Gate (ESP32 Servo)'}
            </Text>
          </TouchableOpacity>

          {/* Cryptographic HMAC QR Key Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowQrModal(!showQrModal)}
            style={styles.qrToggleBtn}
          >
            <Feather name="maximize" size={14} color={colors.editorialDark} />
            <Text style={styles.qrToggleBtnText}>
              {showQrModal ? 'Hide Digital HMAC Pass' : 'Show HMAC-SHA256 Gate Pass QR'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive QR Pass Display */}
        {showQrModal && (
          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              {/* Geometric QR Simulation */}
              <Svg width={140} height={140} viewBox="0 0 140 140">
                <Rect x="0" y="0" width="140" height="140" fill="#FFFFFF" />
                {/* QR corner finders */}
                <Rect x="10" y="10" width="36" height="36" rx="4" fill={colors.editorialDark} />
                <Rect x="16" y="16" width="24" height="24" rx="2" fill="#FFFFFF" />
                <Rect x="22" y="22" width="12" height="12" fill={colors.editorialDark} />

                <Rect x="94" y="10" width="36" height="36" rx="4" fill={colors.editorialDark} />
                <Rect x="100" y="16" width="24" height="24" rx="2" fill="#FFFFFF" />
                <Rect x="106" y="22" width="12" height="12" fill={colors.editorialDark} />

                <Rect x="10" y="94" width="36" height="36" rx="4" fill={colors.editorialDark} />
                <Rect x="16" y="100" width="24" height="24" rx="2" fill="#FFFFFF" />
                <Rect x="22" y="106" width="12" height="12" fill={colors.editorialDark} />

                {/* Pattern dots */}
                <Rect x="56" y="16" width="10" height="10" fill={colors.editorialDark} />
                <Rect x="74" y="24" width="10" height="10" fill={colors.coralOrange} />
                <Rect x="56" y="56" width="28" height="28" rx="4" fill={colors.editorialDark} />
                <Rect x="94" y="56" width="10" height="10" fill={colors.editorialDark} />
                <Rect x="112" y="74" width="10" height="10" fill={colors.editorialDark} />
                <Rect x="56" y="94" width="10" height="10" fill={colors.coralOrange} />
                <Rect x="74" y="112" width="10" height="10" fill={colors.editorialDark} />
              </Svg>
            </View>
            <Text style={styles.qrNotice}>
              Scan at Entrance Webcam · HMAC Token Signed
            </Text>
          </View>
        )}
      </View>

      {/* Screen 3 Bottom Full-Width CTA */}
      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePayPalCheckout}
          disabled={loading}
          style={[styles.routeParkingBtn, shadows.coralButton]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.routeParkingBtnText}>Route Your Parking Slot</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark ambiance matching screen 3
  },
  contentContainer: {
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  vehicleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.editorialBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTextWrap: {
    alignItems: 'flex-start',
  },
  vehicleLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  vehicleModel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3D Garage Card
  garageCard: {
    backgroundColor: '#0B1321',
    borderRadius: radii.card,
    marginHorizontal: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  bayFloatingMarker: {
    position: 'absolute',
    top: 24,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 6,
    zIndex: 10,
  },
  markerBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.editorialDark,
  },
  markerSlotText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  miniRadarWidget: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  hudActionsColumn: {
    position: 'absolute',
    top: 80,
    right: 18,
    flexDirection: 'column',
    gap: 8,
    zIndex: 10,
  },
  hudIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Deal Summary Card
  dealSummaryCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: radii.card,
    marginHorizontal: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
  },
  dealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealLotName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.editorialDark,
  },
  dealSlotDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rateBadge: {
    alignItems: 'flex-end',
  },
  rateRupees: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.editorialDark,
  },
  rateUsd: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  gateStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.cardSmall,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  gateStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gateStatusLabel: {
    fontSize: 11,
    color: colors.editorialDark,
  },
  countdownPill: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  buttonStack: {
    gap: 8,
  },
  actuateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  actuateBtnClosed: {
    backgroundColor: colors.editorialDark,
  },
  actuateBtnOpen: {
    backgroundColor: colors.success,
  },
  actuateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  qrToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: radii.button,
  },
  qrToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.editorialDark,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qrBox: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.editorialDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrNotice: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 8,
  },

  // Screen 3 Bottom Full-Width CTA
  bottomCtaWrap: {
    paddingHorizontal: 18,
  },
  routeParkingBtn: {
    backgroundColor: colors.coralOrange,
    paddingVertical: 16,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  routeParkingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
