import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '../navigation/types';
import { colors, fonts, radius, shadow } from '../theme';
import { useGetMyGroupsQuery } from '../store/api/groupsApi';
import { useGetMyUpcomingEventsQuery } from '../store/api/eventsApi';
import { useJoinGroupMutation } from '../store/api/groupsApi';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/authSlice';
import { getInitials } from '@gem/utils';
import type { UpcomingEvent } from '@gem/api-client';
import GroupCard from '../components/GroupCard';
import TopAppBar from '../components/TopAppBar';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const user = useAppSelector(selectUser);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError]   = useState('');

  const { data: groups = [],         isLoading: groupsLoading  } = useGetMyGroupsQuery();
  const { data: upcomingEvents = [],                             } = useGetMyUpcomingEventsQuery();
  const [joinGroup, { isLoading: joining }] = useJoinGroupMutation();

  // Next event per group from upcoming events
  const nextEventByGroup = upcomingEvents.reduce<Record<string, UpcomingEvent>>((acc, ev) => {
    if (!acc[ev.groupId]) acc[ev.groupId] = ev;
    return acc;
  }, {});

  const handleJoin = async () => {
    const code = inviteCode.trim();
    if (!code) return;
    setJoinError('');
    try {
      await joinGroup({ inviteCode: code }).unwrap();
      setInviteCode('');
    } catch {
      setJoinError('Código inválido o ya eres miembro.');
    }
  };

  const appBarRight = (
    <View style={styles.appBarRight}>
      <MaterialIcons name="search" size={24} color={colors.primary} />
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitials}>
          {user ? getInitials(user.displayName) : '?'}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TopAppBar right={appBarRight} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Explorar Comunidades ──────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorar Comunidades</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={styles.joinInput}
              placeholder="Código de grupo o nombre..."
              placeholderTextColor={`${colors.onSurfaceVariant}80`}
              value={inviteCode}
              onChangeText={t => { setInviteCode(t); setJoinError(''); }}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={handleJoin}
              disabled={joining}
              activeOpacity={0.85}
            >
              {joining
                ? <ActivityIndicator size="small" color={colors.onPrimary} />
                : <Text style={styles.joinBtnText}>Join</Text>
              }
            </TouchableOpacity>
          </View>
          {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
        </View>

        {/* ── Stats card ─────────────────────────────────── */}
        <View style={styles.section}>
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <Text style={styles.statsLabel}>Rendimiento Semanal</Text>
            <Text style={styles.statsValue}>{groups.length > 0 ? `${groups.length} grupos` : '—'}</Text>
            <View style={styles.statsFooter}>
              <MaterialIcons name="stars" size={18} color={colors.tertiaryFixedDim} />
              <Text style={styles.statsFooterText}>Activo en {groups.length} comunidades</Text>
            </View>
            {/* Decorative glow */}
            <View style={styles.statsGlow} />
          </LinearGradient>
        </View>

        {/* ── Mis Grupos ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Grupos</Text>
          </View>

          {groupsLoading && (
            <ActivityIndicator
              size="large"
              color={colors.secondary}
              style={{ marginTop: 32 }}
            />
          )}

          {!groupsLoading && groups.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="group-add" size={40} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>Sin grupos todavía</Text>
              <Text style={styles.emptySubtitle}>
                Usa el código de invitación de arriba para unirte a un grupo.
              </Text>
            </View>
          )}

          {groups.map(group => (
            <View key={group.id} style={styles.cardWrapper}>
              <GroupCard
                group={group}
                nextEvent={nextEventByGroup[group.id]}
                onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── FAB ────────────────────────────────────────── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 120,
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  avatarCircle: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: colors.primaryContainer,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitials: {
    fontFamily: fonts.headline.bold,
    fontSize:   12,
    color:      colors.onPrimaryContainer,
  },

  // ── Sections
  section: {
    paddingHorizontal: 24,
    marginBottom:      32,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   20,
  },
  sectionTitle: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      24,
    color:         colors.primary,
    letterSpacing: -0.5,
    marginBottom:  16,
  },

  // ── Join
  joinRow: {
    flexDirection:   'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius:    radius.md,
    overflow:        'hidden',
    ...shadow.soft,
  },
  joinInput: {
    flex:            1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily:      fonts.body.regular,
    fontSize:        14,
    color:           colors.onSurface,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    alignItems:      'center',
    justifyContent:  'center',
    minWidth:        72,
  },
  joinBtnText: {
    fontFamily: fonts.headline.bold,
    fontSize:   14,
    color:      colors.onPrimary,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize:   12,
    color:      colors.error,
    marginTop:  8,
  },

  // ── Stats card
  statsCard: {
    borderRadius: radius.xl,
    padding:      24,
    overflow:     'hidden',
    ...shadow.md,
  },
  statsLabel: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      11,
    color:         colors.onPrimaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom:  4,
  },
  statsValue: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      36,
    color:         colors.onPrimary,
    letterSpacing: -1,
    marginBottom:  12,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  statsFooterText: {
    fontFamily: fonts.body.medium,
    fontSize:   13,
    color:      colors.onPrimary,
  },
  statsGlow: {
    position:        'absolute',
    right:           -40,
    bottom:          -40,
    width:           160,
    height:          160,
    borderRadius:    80,
    backgroundColor: `${colors.secondary}33`,
  },

  // ── Groups list
  cardWrapper: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems:    'center',
    paddingVertical: 40,
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

  // ── FAB
  fab: {
    position:        'absolute',
    right:           24,
    bottom:          100,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadow.md,
  },
});
