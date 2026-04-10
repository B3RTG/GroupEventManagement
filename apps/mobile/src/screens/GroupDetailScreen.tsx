import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

// TODO M2: implementar GroupDetailScreen completa
export default function GroupDetailScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.label}>Group Detail</Text>
        <Text style={styles.sub}>M2 — próximamente</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label:     { fontFamily: fonts.headline.extraBold, fontSize: 24, color: colors.primary },
  sub:       { fontFamily: fonts.body.regular, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 8 },
});
