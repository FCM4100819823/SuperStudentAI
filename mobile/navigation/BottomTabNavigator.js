import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import StudyPlanScreen from '../screens/StudyPlanScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const themeContext = useTheme(); // Removed || {} to see if context is truly missing
  
  const defaultFallbackFonts = {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System-Medium' : 'sans-serif-medium',
    bold: Platform.OS === 'ios' ? 'System-Bold' : 'sans-serif-bold',
  };

  // Ensure fonts object and specific font weights have fallbacks
  const appFonts = themeContext?.fonts || defaultFallbackFonts;
  const mediumFont = appFonts?.medium || defaultFallbackFonts.medium;

  const defaultFallbackColors = {
    primary: '#4A90E2',    // Default blue if theme fails
    background: '#FFFFFF', // Default white background
    text: '#000000',       // Default black text
    card: '#F0F0F0',       // Default light gray for cards
    border: '#D0D0D0',      // Default border color
    // Ensure all colors accessed in this component have a fallback
    activeTintColor: '#4A90E2', 
    inactiveTintColor: '#8E8E93',
  };

  // More robustly determine colors:
  const colors = (themeContext?.colors && themeContext.colors.primary)
                 ? themeContext.colors
                 : defaultFallbackColors;

  // Ensure specific tint colors also have fallbacks if not in themeContext.colors
  const tabBarActiveTintColor = colors.tabBarActiveTint || colors.primary || defaultFallbackColors.activeTintColor;
  const tabBarInactiveTintColor = colors.tabBarInactiveTint || defaultFallbackColors.inactiveTintColor;
  const tabBarStyleBackground = colors.tabBarBackground || colors.background || defaultFallbackColors.background;
  const tabBarStyleBorderTopColor = colors.border || defaultFallbackColors.border;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: tabBarActiveTintColor,
        tabBarInactiveTintColor: tabBarInactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarStyleBackground,
          borderTopColor: tabBarStyleBorderTopColor,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: { 
          fontFamily: mediumFont, // Use the more robust mediumFont
          fontSize: 10,
        },
        headerShown: false
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
