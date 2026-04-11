import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '../navigation/types';
import { colors, fonts, radius, shadow } from '../theme';
import { useGetEventQuery, useGetTracksQuery, useGetRegistrationsQuery } from '../store/api/eventsApi';
import { useRegisterMutation, useCancelRegistrationMutation, useCancelRegistrationByIdMutation } from '../store/api/eventsApi';
import { useJoinWaitlistMutation, useLeaveWaitlistMutation } from '../store/api/eventsApi';
import { useGetGroupQuery } from '../store/api/groupsApi';
import { formatShortDate, formatTime, getInitials } from '@gem/utils';
import TopAppBar from '../components/TopAppBar';
import CapacityBar from '../components/CapacityBar';
import AvatarStack from '../components/AvatarStack';

// EventDetailScreen can be reached from both DashboardStack and EventsStack.
// Using DashboardStackParamList here; EventsStack uses the same params shape.
type Props = NativeStackScreenProps<DashboardStackParamList, 'EventDetail'>;

export default function EventDetailScreen({ navigation, route }: Props) {
  const { groupId, eventId } = route.params;

  const { data: event,         isLoading: eventLoading   } = useGetEventQuery({ groupId, id: eventId });
  const { data: tracks  = [],  isLoading: tracksLoading  } = useGetTracksQuery({ groupId, eventId });
  const { data: registrations = [] }                        = useGetRegistrationsQuery({ groupId, eventId });
  const { data: group }                                     = useGetGroupQuery(groupId);

  const [register,               { isLoading: registering    }] = useRegisterMutation();
  const [cancelReg,              { isLoading: cancelling     }] = useCancelRegistrationMutation();
  const [cancelRegistrationById, { isLoading: cancellingById }] = useCancelRegistrationByIdMutation();
  const [joinWaitlist,           { isLoading: joiningWait    }] = useJoinWaitlistMutation();
  const [leaveWaitlist,          { isLoading: leavingWait    }] = useLeaveWaitlistMutation();

  const isAdmin = group?.role === 'owner' || group?.role === 'co_admin';

  const ctaLoading = registering || cancelling || joiningWait || leavingWait || cancellingById;

  const handleCTA = async () => {
    if (!event) return;
    const reg    = event.myRegistration;
    const isFull = event.confirmedCount >= event.totalCapacity;

    try {
      if (reg === 'confirmed') {
        await cancelReg({ groupId, eventId }).unwrap();
      } else if (reg === 'waitlisted') {
        await leaveWaitlist({ groupId, eventId }).unwrap();
      } else if (isFull) {
        await joinWaitlist({ groupId, eventId }).unwrap();
      } else {
        await register({ groupId, eventId }).unwrap();
      }
    } catch {
      // errors surfaced via RTK query state — no-op here
    }
  };

  const ctaLabel = () => {
    if (!event) return '';
    const reg    = event.myRegistration;
    const isFull = event.confirmedCount >= event.totalCapacity;
    if (reg === 'confirmed')  return 'Cancelar inscripción';
    if (reg === 'waitlisted') return 'Salir de la lista de espera';
    if (isFull)               return 'Unirme a lista de espera';
    return 'Registrarme';
  };

  const ctaDestructive = event?.myRegistration === 'confirmed' || event?.myRegistration === 'waitlisted';

  const handleDirections = () => {
    if (!event?.locationUrl && !event?.location) return;
    const query = event.locationUrl ?? `geo:0,0?q=${encodeURIComponent(event.location ?? '')}`;
    Linking.openURL(query);
  };

  if (eventLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.errorText}>No se encontró el evento.</Text>
      </View>
    );
  }

  const spotsLeft    = event.totalCapacity - event.confirmedCount;
  const confirmedRegs = registrations.filter(r => r.status === 'confirmed');
  const confirmedNames = confirmedRegs.map(r => r.displayName);

  return (
    <View style={styles.root}>
      <TopAppBar showBack onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ──────────────────────────────────────── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Type badge */}
            <View style={styles.typeBadge}>
              <MaterialIcons name="bolt" size={12} color={colors.onTertiaryFixed} />
              <Text style={styles.typeBadgeText}>{event.eventType}</Text>
            </View>

            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroSub}>
              {formatShortDate(event.scheduledAt, event.timezone)} · {formatTime(event.scheduledAt, event.timezone)}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.content}>

          {/* ── Capacity card ──────────────────────────────── */}
          <View style={styles.capacityCard}>
            <View style={styles.capacityHeader}>
              <View>
                <Text style={styles.availabilityLabel}>Disponibilidad</Text>
                <Text style={styles.slotsValue}>
                  {event.confirmedCount}/{event.totalCapacity} Slots
                </Text>
              </View>
              <View style={[
                styles.spotsBadge,
                spotsLeft === 0 && styles.spotsBadgeFull,
                spotsLeft <= 3 && spotsLeft > 0 && styles.spotsBadgeWarn,
              ]}>
                <Text style={styles.spotsBadgeText}>
                  {spotsLeft === 0 ? 'COMPLETO' : `${spotsLeft} ${spotsLeft === 1 ? 'Plaza' : 'Plazas'}`}
                </Text>
              </View>
            </View>
            <CapacityBar confirmed={event.confirmedCount} total={event.totalCapacity} />
          </View>

          {/* ── CTA ──────────────────────────────────────── */}
          {event.status === 'published' && (
            <TouchableOpacity
              style={[styles.ctaBtn, ctaDestructive && styles.ctaBtnDestructive]}
              onPress={handleCTA}
              disabled={ctaLoading}
              activeOpacity={0.88}
            >
              {ctaLoading
                ? <ActivityIndicator size="small" color={colors.onPrimary} />
                : (
                  <>
                    <Text style={styles.ctaText}>{ctaLabel()}</Text>
                    <MaterialIcons name="chevron-right" size={22} color={colors.onPrimary} />
                  </>
                )
              }
            </TouchableOpacity>
          )}

          {event.status === 'cancelled' && (
            <View style={styles.cancelledBanner}>
              <MaterialIcons name="cancel" size={18} color={colors.error} />
              <Text style={styles.cancelledText}>Este evento ha sido cancelado</Text>
            </View>
          )}

          {/* ── Description ──────────────────────────────── */}
          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : null}

          {/* ── Location ─────────────────────────────────── */}
          {event.location ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ubicación</Text>
                <TouchableOpacity onPress={handleDirections}>
                  <Text style={styles.sectionLink}>Ver indicaciones</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.locationCard}>
                <View style={styles.locationIcon}>
                  <MaterialIcons name="location-on" size={22} color={colors.primary} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{event.location}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* ── Registered Players ───────────────────────── */}
          {confirmedRegs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Jugadores inscritos</Text>
                <Text style={styles.sectionCount}>{confirmedRegs.length} confirmados</Text>
              </View>
              {isAdmin && event.status === 'published' ? (
                <View style={styles.playersList}>
                  {confirmedRegs.map(reg => (
                    <View key={reg.id} style={styles.playerRow}>
                      <View style={styles.playerAvatar}>
                        <Text style={styles.playerAvatarText}>{getInitials(reg.displayName)}</Text>
                      </View>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName} numberOfLines={1}>{reg.displayName}</Text>
                        {reg.isGuestRegistration && (
                          <Text style={styles.playerTag}>Invitado</Text>
                        )}
                        {reg.promotedFromWaitlist && (
                          <Text style={[styles.playerTag, styles.playerTagPromoted]}>De lista de espera</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => cancelRegistrationById({ groupId, eventId, registrationId: reg.id })}
                        disabled={cancellingById}
                        style={styles.playerCancelBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="person-remove" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.playersCard}>
                  <AvatarStack names={confirmedNames} max={8} size={40} />
                </View>
              )}
            </View>
          )}

          {/* ── Tracks ───────────────────────────────────── */}
          {!tracksLoading && tracks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pistas asignadas</Text>
              <View style={styles.tracksList}>
                {tracks.map(track => (
                  <View key={track.id} style={styles.trackRow}>
                    <View style={styles.trackIcon}>
                      <MaterialIcons name="sports-tennis" size={18} color={colors.onPrimaryContainer} />
                    </View>
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackName}>{track.name}</Text>
                      <Text style={styles.trackCapacity}>{track.capacity} plazas</Text>
                    </View>
                    <View style={styles.trackBadge}>
                      <Text style={styles.trackBadgeText}>Confirmada</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex:            1,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
  },
  scroll: {
    paddingBottom: 48,
  },

  // ── Hero
  hero: {
    marginHorizontal: 24,
    marginTop:        8,
    borderRadius:     radius.xl,
    overflow:         'hidden',
    ...shadow.md,
  },
  heroGradient: {
    padding:    28,
    gap:         8,
    minHeight:  200,
    justifyContent: 'flex-end',
  },
  typeBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    alignSelf:       'flex-start',
    backgroundColor: colors.tertiaryFixedDim,
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      radius.full,
    marginBottom:      4,
  },
  typeBadgeText: {
    fontFamily:    fonts.headline.bold,
    fontSize:      10,
    color:         colors.onTertiaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      28,
    color:         colors.onPrimary,
    letterSpacing: -0.5,
    lineHeight:    34,
  },
  heroSub: {
    fontFamily: fonts.body.medium,
    fontSize:   14,
    color:      `${colors.onPrimary}cc`,
  },

  // ── Content area
  content: {
    paddingHorizontal: 24,
    paddingTop:        24,
    gap:               20,
  },

  // ── Capacity card
  capacityCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    padding:         20,
    gap:             16,
    ...shadow.soft,
  },
  capacityHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
  },
  availabilityLabel: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      10,
    color:         colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom:  4,
  },
  slotsValue: {
    fontFamily:    fonts.headline.bold,
    fontSize:      22,
    color:         colors.primary,
    letterSpacing: -0.5,
  },
  spotsBadge: {
    backgroundColor:   colors.secondary,
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:      radius.md,
  },
  spotsBadgeFull: {
    backgroundColor: colors.error,
  },
  spotsBadgeWarn: {
    backgroundColor: colors.tertiaryFixedDim,
  },
  spotsBadgeText: {
    fontFamily: fonts.headline.bold,
    fontSize:   12,
    color:      colors.onPrimary,
  },

  // ── CTA
  ctaBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: colors.primary,
    borderRadius:    radius.xl,
    paddingVertical: 18,
    ...shadow.md,
  },
  ctaBtnDestructive: {
    backgroundColor: colors.error,
  },
  ctaText: {
    fontFamily: fonts.headline.extraBold,
    fontSize:   17,
    color:      colors.onPrimary,
  },

  // ── Cancelled banner
  cancelledBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: colors.errorContainer,
    borderRadius:    radius.xl,
    padding:         16,
  },
  cancelledText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   14,
    color:      colors.error,
  },

  // ── Description
  description: {
    fontFamily: fonts.body.regular,
    fontSize:   15,
    color:      colors.onSurfaceVariant,
    lineHeight: 22,
  },

  // ── Sections
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  sectionTitle: {
    fontFamily:    fonts.headline.bold,
    fontSize:      18,
    color:         colors.primary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontFamily: fonts.body.semiBold,
    fontSize:   13,
    color:      colors.secondary,
  },
  sectionCount: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      11,
    color:         `${colors.onSurfaceVariant}99`,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // ── Location
  locationCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius:    radius.xl,
    padding:         16,
  },
  locationIcon: {
    width:           44,
    height:          44,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius:    radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontFamily: fonts.headline.bold,
    fontSize:   15,
    color:      colors.primary,
  },

  // ── Players
  playersCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    padding:         20,
    ...shadow.soft,
  },
  playersList: {
    gap: 8,
  },
  playerRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.lg,
    padding:         12,
    ...shadow.soft,
  },
  playerAvatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.primaryContainer,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  playerAvatarText: {
    fontFamily: fonts.headline.bold,
    fontSize:   13,
    color:      colors.onPrimaryContainer,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontFamily: fonts.body.semiBold,
    fontSize:   14,
    color:      colors.onSurface,
  },
  playerTag: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      10,
    color:         colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop:     2,
  },
  playerTagPromoted: {
    color: colors.secondary,
  },
  playerCancelBtn: {
    padding:         6,
    borderRadius:    radius.md,
    backgroundColor: colors.errorContainer,
    flexShrink:      0,
  },

  // ── Tracks
  tracksList: {
    gap: 10,
  },
  trackRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius:    radius.xl,
    padding:         14,
  },
  trackIcon: {
    width:           40,
    height:          40,
    backgroundColor: colors.primaryContainer,
    borderRadius:    radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontFamily: fonts.headline.bold,
    fontSize:   15,
    color:      colors.primary,
  },
  trackCapacity: {
    fontFamily: fonts.body.regular,
    fontSize:   12,
    color:      colors.onSurfaceVariant,
    marginTop:  2,
  },
  trackBadge: {
    backgroundColor:   colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      radius.sm,
  },
  trackBadgeText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   11,
    color:      colors.onSurfaceVariant,
  },

  errorText: {
    fontFamily: fonts.body.regular,
    fontSize:   14,
    color:      colors.error,
  },
});
