import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { store } from './src/store/store';
import { initAuth } from './src/store/authSlice';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

/**
 * Inner component — runs after the Provider mounts so it can
 * dispatch to the Redux store via hooks.
 */
function AppLoader() {
  const [authReady, setAuthReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    // Restore persisted auth from AsyncStorage before first render
    store.dispatch(initAuth()).finally(() => setAuthReady(true));
  }, []);

  if (!fontsLoaded || !authReady) {
    // Blank splash until fonts + auth state are ready
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppLoader />
      </SafeAreaProvider>
    </Provider>
  );
}
