import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface CapacityBarProps {
  confirmed: number;
  total:     number;
}

export default function CapacityBar({ confirmed, total }: CapacityBarProps) {
  const pct = total > 0 ? Math.min(confirmed / total, 1) : 0;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { flex: pct }]} />
      <View style={{ flex: 1 - pct }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection:   'row',
    height:          12,
    backgroundColor: colors.surfaceContainer,
    borderRadius:    radius.full,
    overflow:        'hidden',
  },
  fill: {
    backgroundColor: colors.secondary,
    borderRadius:    radius.full,
  },
});
