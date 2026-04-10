import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Event } from '@gem/api-client';
import { formatShortDate, formatTime } from '@gem/utils';
import { colors, fonts, radius, shadow } from '../theme';

interface EventCardProps {
  event:   Event;
  onPress: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const spotsLeft = event.totalCapacity - event.confirmedCount;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Icon + badge */}
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <MaterialIcons name="directions-run" size={20} color={colors.onSecondaryContainer} />
        </View>
        {spotsLeft <= 2 && spotsLeft > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{spotsLeft} LEFT</Text>
          </View>
        )}
        {spotsLeft === 0 && (
          <View style={[styles.badge, styles.badgeFull]}>
            <Text style={styles.badgeText}>FULL</Text>
          </View>
        )}
      </View>

      {/* Date + title */}
      <Text style={styles.date}>
        {formatShortDate(event.scheduledAt, event.timezone)} · {formatTime(event.scheduledAt, event.timezone)}
      </Text>
      <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

      {/* Capacity */}
      <View style={styles.footer}>
        <MaterialIcons name="people" size={14} color={colors.onSurfaceVariant} />
        <Text style={styles.capacity}>
          {event.confirmedCount}/{event.totalCapacity} asistentes
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width:           288,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    padding:         20,
    marginRight:     16,
    ...shadow.soft,
    gap:             8,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   4,
  },
  iconBox: {
    width:           40,
    height:          40,
    borderRadius:    radius.md,
    backgroundColor: colors.secondaryContainer,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badge: {
    backgroundColor: colors.tertiaryFixedDim,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      radius.full,
  },
  badgeFull: {
    backgroundColor: colors.errorContainer,
  },
  badgeText: {
    fontFamily:    fonts.headline.bold,
    fontSize:      10,
    color:         colors.onTertiaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontFamily: fonts.body.medium,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
  },
  title: {
    fontFamily: fonts.headline.bold,
    fontSize:   17,
    color:      colors.primary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     4,
  },
  capacity: {
    fontFamily: fonts.body.semiBold,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
  },
});
