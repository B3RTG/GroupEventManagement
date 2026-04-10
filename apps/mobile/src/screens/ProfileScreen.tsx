import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, logout } from '../store/authSlice';
import { useLogoutSessionMutation } from '../store/api/authApi';
import { useGetMyGroupsQuery } from '../store/api/groupsApi';
import { getInitials } from '@gem/utils';
import TopAppBar from '../components/TopAppBar';
import RoleBadge from '../components/RoleBadge';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user     = useAppSelector(selectUser);

  const [logoutSession] = useLogoutSessionMutation();
  const { data: groups = [] } = useGetMyGroupsQuery();

  const ownedGroups  = groups.filter(g => g.role === 'owner');
  const activeGroups = groups.length;

  const handleSignOut = async () => {
    await logoutSession().catch(() => {});
    dispatch(logout());
  };

  return (
    <View style={styles.root}>
      <TopAppBar />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero / Avatar ────────────────────────────── */}
        <LinearGradient
          colors={[colors.primary, colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {user ? getInitials(user.displayName) : '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName ?? 'Usuario'}</Text>
          {user?.email ? (
            <Text style={styles.email}>{user.email}</Text>
          ) : null}
          <View style={styles.heroGlow} />
        </LinearGradient>

        {/* ── Stats ────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeGroups}</Text>
            <Text style={styles.statLabel}>Grupos activos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ownedGroups.length}</Text>
            <Text style={styles.statLabel}>Grupos fundados</Text>
          </View>
        </View>

        {/* ── My Groups ────────────────────────────────── */}
        {groups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis Grupos</Text>
            <View style={styles.groupsList}>
              {groups.map(group => (
                <View key={group.id} style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <MaterialIcons name="group" size={18} color={colors.secondary} />
                  </View>
                  <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                  <RoleBadge role={group.role} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Account actions ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={[styles.actionRow, styles.signOutRow]}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
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
  scroll: {
    paddingBottom: 48,
  },

  // ── Hero card
  heroCard: {
    marginHorizontal: 24,
    marginTop:        16,
    borderRadius:     radius.xl,
    padding:          28,
    alignItems:       'center',
    gap:              8,
    overflow:         'hidden',
    ...shadow.md,
  },
  avatarCircle: {
    width:           80,
    height:          80,
    borderRadius:    radius.full,
    backgroundColor: `${colors.onPrimary}22`,
    borderWidth:     2,
    borderColor:     `${colors.onPrimary}44`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  avatarInitials: {
    fontFamily: fonts.headline.extraBold,
    fontSize:   28,
    color:      colors.onPrimary,
  },
  displayName: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      22,
    color:         colors.onPrimary,
    letterSpacing: -0.5,
  },
  email: {
    fontFamily: fonts.body.regular,
    fontSize:   13,
    color:      `${colors.onPrimary}bb`,
  },
  heroGlow: {
    position:        'absolute',
    right:           -40,
    bottom:          -40,
    width:           160,
    height:          160,
    borderRadius:    80,
    backgroundColor: `${colors.secondary}33`,
  },

  // ── Stats
  statsRow: {
    flexDirection:   'row',
    marginHorizontal: 24,
    marginTop:       16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    ...shadow.soft,
    overflow:        'hidden',
  },
  statCard: {
    flex:          1,
    alignItems:    'center',
    paddingVertical: 20,
    gap:           4,
  },
  statDivider: {
    width:           1,
    marginVertical:  16,
    backgroundColor: colors.outlineVariant,
  },
  statValue: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      28,
    color:         colors.primary,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: fonts.body.semiBold,
    fontSize:   11,
    color:      colors.onSurfaceVariant,
    textAlign:  'center',
  },

  // ── Sections
  section: {
    marginTop:         28,
    paddingHorizontal: 24,
    gap:               12,
  },
  sectionTitle: {
    fontFamily:    fonts.headline.extraBold,
    fontSize:      20,
    color:         colors.primary,
    letterSpacing: -0.5,
  },

  // ── Groups list
  groupsList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    overflow:        'hidden',
    ...shadow.soft,
  },
  groupRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  groupIcon: {
    width:           36,
    height:          36,
    borderRadius:    radius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems:      'center',
    justifyContent:  'center',
  },
  groupName: {
    flex:       1,
    fontFamily: fonts.headline.bold,
    fontSize:   14,
    color:      colors.primary,
  },

  // ── Actions
  actionsList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius:    radius.xl,
    overflow:        'hidden',
    ...shadow.soft,
  },
  actionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   16,
  },
  signOutRow: {
    // no extra styles needed
  },
  signOutText: {
    fontFamily: fonts.body.semiBold,
    fontSize:   15,
    color:      colors.error,
  },
});
