import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { colors, fonts } from '../theme';
import DashboardStack from './DashboardStack';
import EventsStack from './EventsStack';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderTopColor: 'rgba(240,244,248,0.15)',
          borderTopWidth: 1,
          paddingBottom: 24,
          paddingTop: 10,
          height: 80,
          // iOS blur effect via elevation on Android
          elevation: 0,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: 'rgba(18,38,54,0.4)',
        tabBarLabelStyle: {
          fontFamily: fonts.headline.bold,
          fontSize:   10,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            DashboardTab: 'dashboard',
            EventsTab:    'calendar-today',
            ProfileTab:   'person',
          };
          return (
            <MaterialIcons
              name={iconMap[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{ tabBarLabel: 'Events' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
