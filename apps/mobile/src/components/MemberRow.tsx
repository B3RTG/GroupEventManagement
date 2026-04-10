import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GroupMember } from '@gem/api-client';
import { getInitials } from '@gem/utils';
import { colors, fonts, radius } from '../theme';
import RoleBadge from './RoleBadge';

interface MemberRowProps {
  member: GroupMember;
}

export default function MemberRow({ member }: MemberRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(member.displayName)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{member.displayName}</Text>
        <RoleBadge role={member.role} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius:    radius.xl,
    gap:             16,
  },
  avatar: {
    width:           48,
    height:          48,
    borderRadius:    radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems:      'center',
    justifyContent:  'center',
  },
  initials: {
    fontFamily: fonts.headline.bold,
    fontSize:   16,
    color:      colors.onPrimaryContainer,
  },
  info: {
    flex: 1,
    gap:  4,
  },
  name: {
    fontFamily: fonts.headline.bold,
    fontSize:   15,
    color:      colors.primary,
  },
});
