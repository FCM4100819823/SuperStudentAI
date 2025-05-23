import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import StudyPlanScreen from '../screens/StudyPlanScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const defaultFallbackFonts = {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System-Medium' : 'sans-serif-medium',
    bold: Platform.OS === 'ios' ? 'System-Bold' : 'sans-serif-bold',
  };

  // Ensure fonts object and specific font weights have fallbacks
  // Define static styles here if needed, or rely on screen-specific styles
  // For example, if you had tab bar styling dependent on theme:
  // const tabBarActiveTintColor = themeContext.colors?.primary || '#007AFF';
  // const tabBarInactiveTintColor = themeContext.colors?.text || '#8e8e93';
  // const tabBarBackgroundColor = themeContext.colors?.background || '#FFFFFF';

  // Replace with static values:
  const tabBarActiveTintColor = '#007AFF'; // Example static color
  const tabBarInactiveTintColor = '#8e8e93'; // Example static color
  const tabBarBackgroundColor = '#FFFFFF';   // Example static color

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarActiveTintColor,
        tabBarInactiveTintColor: tabBarInactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarBackgroundColor,
          // Add other static styles as needed
        },
        tabBarLabelStyle: { 
          fontFamily: defaultFallbackFonts.medium, // Use the more robust mediumFont
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="StudyPlans"
        component={StudyPlanScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
          title: "Study Plans"
        }}
      />
      <Tab.Screen
        name="Flashcards"
        component={FlashcardsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
