
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import PokedexScreen from './src/screens/PokedexScreen';
import TeamScreen from './src/screens/TeamScreen';
import GameScreen from './src/screens/GameScreen';
import DetailScreen from './src/screens/DetailScreen';
import { TeamProvider } from './src/context/TeamContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  background: '#111827',
  panel: '#1F2937',
  coral: '#FF7F6B',
  white: '#FFFFFF',
  muted: '#A7B0C0',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: COLORS.panel,
          borderTopColor: '#374151',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.coral,
        tabBarInactiveTintColor: COLORS.muted,
      }}
    >
      <Tab.Screen
        name="Pokédex"
        component={PokedexScreen}
        options={{ title: 'Pokédex' }}
      />

      <Tab.Screen
        name="My Team"
        component={TeamScreen}
        options={{ title: 'My Team' }}
      />

      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{ title: 'Guess the Pokémon' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <TeamProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{ title: 'Pokémon Details' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </TeamProvider>
  );
}
