import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Clipboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '../navigation/types';
import { colors, fonts, radius, shadow } from '../theme';
import { useGetGroupQuery, useGetMembersQuery } from '../store/api/groupsApi';
import { useGetEventsQuery } from '../store/api/eventsApi';
import type { Event } from '@gem/api-client';
import TopAppBar from '../components/TopAppBar';
import EventCard from '../components/EventCard';
import MemberRow from '../components/MemberRow';

type Props = NativeStackScreenProps<DashboardStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const [copied, setCopied] = useState(false);

  const { data: group,   isLoading: groupLoading   } = useGetGroupQuery(groupId);
  const { data: members = [], isLoading: membersLoading } = useGetMembersQuery(groupId);
  const { data: events  = [], isLoading: eventsLoading  } = useGetEventsQuery(groupId);

  // Only upcoming published events
  const upcomingEvents = events.filter(e => e.status === 'published');

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
    Clipboard.setString(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const appBarRight = (
    <TouchableOpacity hitSlop={8}>
      <MaterialIcons name="more-vert" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (groupLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.errorText}>No se encontró el grupo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopAppBar
        showBack
        onBack={() => navigation.goBack()}
        right={appBarRight}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero / Group Identity ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.groupName}>{group.name}</Text>

          {/* Invite Code Card */}
          {group.inviteCode && (
            <View style={styles.inviteCard}>
              <View>
                <Text style={styles.inviteLabel}>Código de invitación</Text>
                <Text style={styles.inviteCode}>{group.inviteCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={copied ? 'check' : 'content-copy'}
                  size={20}
                  color={colors.onPrimary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Upcoming Events ─────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {eventsLoading && (
          <ActivityIndicator
            size="small"
            color={colors.secondary}
            style={{ marginBottom: 24 }}
          />
        )}

        {!eventsLoading && upcomingEvents.length === 0 && (
          <View style={styles.emptyEvents}>
            <MaterialIcons name="event" size={32} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>Sin eventos próximos</Text>
          </View>
        )}

        {upcomingEvents.length > 0 && (
          <FlatList
            data={upcomingEvents}
            keyExtractor={item => item.id}
            renderItem={({ item }: { item: Event }) => (
              <EventCard
                event={item}
                onPress={() =>
                  navigation.navigate('EventDetail', {
                    groupId,
                    eventId: item.id,
                  })
                }
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
            style={styles.eventsScroll}
          />
        )}

        {/* ── Member Roster ────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Roster</Text>
          <Text style={styles.rosterCount}>
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
          </Text>
        </View>

        {membersLoading && (
          <ActivityIndicator
            size="small"
            color={colors.secondary}
            style={{ marginBottom: 24 }}
          />
        )}

        <View style={styles.section}>
          {members.map(member => (
            <View key={member.userId} style={styles.memberWrapper}>
              <MemberRow member={member} />
            </View>
          ))}
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
    paddingBottom: 40,
  },

  // ── Hero section
  section: {
    paddingHorizontal: 24,
    marginBottom:      8,
  },
  groupName: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      32,
    color:         colors.primary,
    letterSpacing: -1,
    lineHeight:    38,
    marginBottom:  8,
  },
  groupDesc: {
    fontFamily: fonts.body.regular,
    fontSize:   15,
    color:      colors.onSurfaceVariant,
    lineHeight: 22,
    maxWidth:   '90%',
    marginBottom: 20,
  },

  // ── Invite card (glassmorphism approximation)
  inviteCard: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: `${colors.surfaceContainerLowest}cc`,
    borderRadius:    radius.xl,
    padding:         16,
    marginTop:       4,
    marginBottom:    12,
    borderWidth:     1,
    borderColor:     `${colors.outlineVariant}26`,
    ...shadow.soft,
  },
  inviteLabel: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      10,
    color:         colors.onPrimaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom:  4,
  },
  inviteCode: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      20,
    color:         colors.primary,
    letterSpacing: 3,
  },
  copyBtn: {
    backgroundColor: colors.primary,
    padding:         12,
    borderRadius:    radius.md,
  },

  // ── Section headers
  sectionHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 24,
    marginBottom:      16,
    marginTop:         24,
  },
  sectionTitle: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      20,
    color:         colors.primary,
    letterSpacing: -0.5,
  },
  sectionLink: {
    fontFamily: fonts.body.semiBold,
    fontSize:   13,
    color:      colors.secondary,
  },
  rosterCount: {
    fontFamily:    fonts.body.semiBold,
    fontSize:      11,
    color:         `${colors.onSurfaceVariant}99`,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // ── Events horizontal list
  eventsScroll: {
    marginBottom: 8,
  },
  eventsList: {
    paddingHorizontal: 24,
    paddingBottom:     4,
  },
  emptyEvents: {
    alignItems:        'center',
    paddingVertical:   24,
    paddingHorizontal: 24,
    gap:               8,
    marginBottom:      16,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize:   14,
    color:      colors.outlineVariant,
  },

  // ── Members
  memberWrapper: {
    marginBottom: 10,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize:   14,
    color:      colors.error,
  },
});
