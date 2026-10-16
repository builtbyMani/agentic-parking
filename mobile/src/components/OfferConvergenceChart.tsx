import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

interface OfferConvergenceChartProps {
  currentOfferRupees?: number;
}

export const OfferConvergenceChart: React.FC<OfferConvergenceChartProps> = ({
  currentOfferRupees = 36,
}) => {
  const width = 310;
  const height = 90;

  // Convergence trajectory:
  // Lots ask: 45 -> 40 -> 38 -> 36
  // Driver bid: 30 -> 32 -> 35 -> 36
  // SVG coordinates:
  // x points: 20, 110, 200, 290
  const askPath = `M 20 20 Q 80 32 110 38 T 200 52 T 290 60`;
  const bidPath = `M 20 80 Q 80 72 110 68 T 200 64 T 290 60`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Subtle grid lines */}
        <Line x1="10" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" />
        <Line x1="10" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="1" />
        <Line x1="10" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />

        {/* Dotted vertical marker at convergence */}
        <Line
          x1="290"
          y1="10"
          x2="290"
          y2="80"
          stroke={colors.primary}
          strokeWidth="1.2"
          strokeDasharray="3,3"
        />

        {/* Lots Ask Trajectory (Soft Slate/Blue) */}
        <Path d={askPath} fill="none" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />

        {/* Driver Bids Trajectory (Vivid Cobalt Blue) */}
        <Path d={bidPath} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />

        {/* Final Convergence Point Dot */}
        <Circle cx="290" cy="60" r="5" fill="#FFFFFF" stroke={colors.primary} strokeWidth="2.5" />
      </Svg>

      {/* Convergence Badge Highlight */}
      <View style={styles.highlightBadge}>
        <Text style={styles.highlightText}>₹{currentOfferRupees}/hr</Text>
      </View>

      {/* Axis Labels */}
      <View style={styles.labelsRow}>
        <Text style={styles.axisLabel}>Open</Text>
        <Text style={styles.axisLabel}>Round 1</Text>
        <Text style={styles.axisLabel}>Round 2</Text>
        <Text style={[styles.axisLabel, { color: colors.primary, fontWeight: '700' }]}>Deal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  highlightBadge: {
    position: 'absolute',
    top: 4,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  highlightText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '94%',
    marginTop: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
