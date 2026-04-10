import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Group, UpcomingEvent } from '@gem/api-client';
import { formatShortDate, formatTime } from '@gem/utils';
import { colors, fonts, radius, shadow } from '../theme';
import AvatarStack from './AvatarStack';
import RoleBadge from './RoleBadge';

interface GroupCardProps {
  group:      Group;
  nextEvent?: UpcomingEvent;
  memberNames?: string[];
  onPress:    () => void;
}

export default function GroupCard({ group, nextEvent, memberNames = [], onPress }: GroupCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          <RoleBadge role={group.role} />
        </View>
        <MaterialIcons name="more-vert" size={20} color={colors.outline} />
      </View>

      {/* Members */}
      <View style={styles.membersRow}>
        {memberNames.length > 0 ? (
          <AvatarStack names={memberNames} max={3} size={32} />
        ) : (
          <View style={styles.memberCountPill}>
            <MaterialIcons name="group" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.memberCountText}>{group.memberCount}</Text>
          </View>
        )}
        <Text style={styles.membersLabel}>Miembros activos</Text>
      </View>

      {/* Next session */}
      <View style={styles.sessionBlock}>
        <View style={styles.sessionIcon}>
          <MaterialIcons name="event-repeat" size={20} color={colors.secondary} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionLabel}>Próxima Sesión</Text>
          <Text style={styles.sessionTime}>
            {nextEvent
              ? `${formatShortDate(nextEvent.scheduledAt, 'UTC')}, ${formatTime(nextEvent.scheduledAt, 'UTC')}`
              : 'Sin eventos próximos'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    padding:         20,
    ...shadow.soft,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   16,
    gap:            8,
  },
  headerLeft: {
    flex:    1,
    gap:     6,
  },
  name: {
    fontFamily:  fonts.headline.bold,
    fontSize:    18,
    color:       colors.primary,
    lineHeight:  22,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  20,
    gap:           12,
  },
  memberCountPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius:    radius.full,
  },
  memberCountText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
  },
  membersLabel: {
    fontFamily: fonts.body.semiBold,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
  },
  sessionBlock: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius:    radius.md,
    padding:         12,
    gap:             12,
  },
  sessionIcon: {
    width:           40,
    height:          40,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      10,
    color:         colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sessionTime: {
    fontFamily: fonts.headline.bold,
    fontSize:   13,
    color:      colors.onSurface,
    marginTop:  2,
  },
});
