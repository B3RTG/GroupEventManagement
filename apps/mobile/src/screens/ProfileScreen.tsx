import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, logout } from '../store/authSlice';
import { useLogoutSessionMutation } from '../store/api/authApi';

// TODO M4: implementar ProfileScreen completa
export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [logoutSession] = useLogoutSessionMutation();

  const handleSignOut = async () => {
    await logoutSession().catch(() => {});
    dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName ?? 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.sub}>M4 — perfil completo próximamente</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontFamily: fonts.headline.extraBold,
    fontSize: 28,
    color: colors.onPrimary,
  },
  name: {
    fontFamily: fonts.headline.bold,
    fontSize: 22,
    color: colors.primary,
  },
  email: {
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  signOutBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  signOutText: {
    fontFamily: fonts.headline.bold,
    fontSize: 15,
    color: colors.onPrimary,
  },
  sub: {
    marginTop: 16,
    fontFamily: fonts.body.regular,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});
