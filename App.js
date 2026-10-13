
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
  border: '#374151',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
        headerShadowVisible: false,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Pokédex') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'My Team') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Game') {
            iconName = focused
              ? 'game-controller'
              : 'game-controller-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={focused ? 24 : 22}
              color={color}
            />
          );
        },

        tabBarStyle: {
          backgroundColor: COLORS.panel,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 0,
        },

        tabBarActiveTintColor: COLORS.coral,
        tabBarInactiveTintColor: COLORS.muted,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },

        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Pokédex"
        component={PokedexScreen}
        options={{
          title: 'Pokédex',
          tabBarLabel: 'Pokédex',
        }}
      />

      <Tab.Screen
        name="My Team"
        component={TeamScreen}
        options={{
          title: 'My Team',
          tabBarLabel: 'My Team',
        }}
      />

      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{
          title: 'Guess the Pokémon',
          tabBarLabel: 'Game',
        }}
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
            headerStyle: {
              backgroundColor: COLORS.background,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: '800',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{
              title: 'Pokémon Details',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </TeamProvider>
  );
}
