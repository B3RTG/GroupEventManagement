import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GroupRole } from '@gem/api-client';
import { colors, fonts, radius } from '../theme';

interface RoleBadgeProps {
  role: GroupRole;
}

const CONFIG: Record<GroupRole, { label: string; bg: string; fg: string } | null> = {
  owner:    { label: 'Founder',  bg: colors.primary,           fg: colors.onPrimary },
  co_admin: { label: 'Co-Admin', bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  member:   null,
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const config = CONFIG[role];
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      radius.sm,
  },
  label: {
    fontFamily:    fonts.headline.bold,
    fontSize:      10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
