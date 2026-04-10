import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { store } from './src/store/store';
import { initAuth, selectIsLoggedIn } from './src/store/authSlice';
import { useAppSelector } from './src/store/hooks';
import { useUpdatePushTokenMutation } from './src/store/api/authApi';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation/types';

// Show notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push tokens only work on real devices
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    // getDevicePushTokenAsync returns a native FCM token (Android) or APNs token (iOS)
    // that can be sent directly to the FCM HTTP v1 API in the backend.
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    return token;
  } catch {
    return null;
  }
}

/**
 * Registers the Expo push token with the backend when the user is logged in.
 * Rendered as a null component so it can use Redux hooks.
 */
function NotificationSetup() {
  const [updatePushToken] = useUpdatePushTokenMutation();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) updatePushToken({ pushToken: token });
    });
  }, [isLoggedIn]);

  return null;
}

/**
 * Inner component — runs after the Provider mounts so it can
 * dispatch to the Redux store via hooks.
 */
function AppLoader() {
  const [authReady, setAuthReady] = useState(false);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

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

  // Handle notification tap (app in background or killed state)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      const groupId = data?.groupId;
      const eventId = data?.eventId;

      if (groupId && eventId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigationRef.navigate('Main' as any, {
          screen: 'DashboardTab',
          params: { screen: 'EventDetail', params: { groupId, eventId } },
        });
      }
    });

    return () => sub.remove();
  }, [navigationRef]);

  if (!fontsLoaded || !authReady) {
    // Blank splash until fonts + auth state are ready
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <NotificationSetup />
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
