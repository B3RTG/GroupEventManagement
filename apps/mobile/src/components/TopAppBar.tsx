import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function TopAppBar({ title, showBack, onBack, right }: TopAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.brand}>{title ?? 'The Athletic'}</Text>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 24,
    paddingBottom:   12,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  backBtn: {
    marginRight: 4,
  },
  brand: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      20,
    color:         colors.primary,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
});
