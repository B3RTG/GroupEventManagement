import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation/types';
import { colors, fonts, radius, shadow } from '../theme';
import { useGetMyUpcomingEventsQuery } from '../store/api/eventsApi';
import type { UpcomingEvent } from '@gem/api-client';
import TopAppBar from '../components/TopAppBar';
import CapacityBar from '../components/CapacityBar';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

export default function EventsScreen({ navigation }: Props) {
  const { data: events = [], isLoading, refetch } = useGetMyUpcomingEventsQuery({ limit: 20 });

  const renderItem = ({ item }: { item: UpcomingEvent }) => {
    const spotsLeft = item.totalCapacity - item.confirmedCount;
    const isFull    = spotsLeft <= 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('EventDetail', {
            groupId: item.groupId,
            eventId: item.id,
          })
        }
      >
        {/* Group label */}
        <Text style={styles.groupName} numberOfLines={1}>{item.groupName}</Text>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

        {/* Date row */}
        <View style={styles.metaRow}>
          <MaterialIcons name="event" size={14} color={colors.onSurfaceVariant} />
          <Text style={styles.metaText}>
            {new Date(item.scheduledAt).toLocaleDateString('es-ES', {
              weekday: 'short',
              day:     'numeric',
              month:   'short',
            })}
          </Text>
          <MaterialIcons name="schedule" size={14} color={colors.onSurfaceVariant} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>
            {new Date(item.scheduledAt).toLocaleTimeString('es-ES', {
              hour:   '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Capacity bar */}
        <View style={styles.capacityBlock}>
          <CapacityBar confirmed={item.confirmedCount} total={item.totalCapacity} />
          <View style={styles.capacityLabels}>
            <Text style={styles.capacityText}>
              {item.confirmedCount}/{item.totalCapacity} asistentes
            </Text>
            {isFull ? (
              <View style={[styles.badge, styles.badgeFull]}>
                <Text style={styles.badgeText}>COMPLETO</Text>
              </View>
            ) : spotsLeft <= 3 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{spotsLeft} LEFT</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Registration status chip */}
        {item.myRegistration === 'confirmed' && (
          <View style={styles.registeredChip}>
            <MaterialIcons name="check-circle" size={12} color={colors.secondary} />
            <Text style={styles.registeredText}>Inscrito</Text>
          </View>
        )}
        {item.myRegistration === 'waitlisted' && (
          <View style={styles.waitlistChip}>
            <MaterialIcons name="schedule" size={12} color={colors.onSurfaceVariant} />
            <Text style={styles.waitlistText}>En lista de espera</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <TopAppBar />

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        ListHeaderComponent={
          <Text style={styles.heading}>Próximos Eventos</Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>Sin eventos próximos</Text>
              <Text style={styles.emptySubtitle}>
                Únete a un grupo para ver sus eventos aquí.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom:     40,
  },
  heading: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      24,
    color:         colors.primary,
    letterSpacing: -0.5,
    marginTop:     24,
    marginBottom:  20,
  },

  // ── Event card
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    padding:         20,
    gap:             10,
    ...shadow.soft,
  },
  groupName: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      11,
    color:         colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fonts.headline.bold,
    fontSize:   18,
    color:      colors.primary,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  metaText: {
    fontFamily: fonts.body.medium,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
  },
  capacityBlock: {
    gap: 6,
  },
  capacityLabels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  capacityText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
  },
  badge: {
    backgroundColor:  colors.tertiaryFixedDim,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      radius.full,
  },
  badgeFull: {
    backgroundColor: colors.errorContainer,
  },
  badgeText: {
    fontFamily:    fonts.headline.bold,
    fontSize:      9,
    color:         colors.onTertiaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  registeredChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    alignSelf:       'flex-start',
    backgroundColor: `${colors.secondary}1a`,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      radius.full,
  },
  registeredText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   11,
    color:      colors.secondary,
  },
  waitlistChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    alignSelf:       'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      radius.full,
  },
  waitlistText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   11,
    color:      colors.onSurfaceVariant,
  },

  // ── Empty state
  emptyState: {
    alignItems:    'center',
    paddingTop:    60,
    gap:           12,
  },
  emptyTitle: {
    fontFamily: fonts.headline.bold,
    fontSize:   18,
    color:      colors.onSurfaceVariant,
  },
  emptySubtitle: {
    fontFamily: fonts.body.regular,
    fontSize:   14,
    color:      colors.outlineVariant,
    textAlign:  'center',
    maxWidth:   260,
  },
});
