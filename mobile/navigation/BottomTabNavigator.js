import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import your screens
import Dashboard from '../screens/Dashboard'; // Changed from HomeScreen to Dashboard
import StudyScreen from '../screens/StudyScreen'; // New comprehensive Study screen
import AIScreen from '../screens/AIScreen'; // Assuming you have an AIScreen
import AppSettingsScreen from '../screens/AppSettingsScreen'; // Changed from SettingsScreen to AppSettingsScreen
import FocusTimerScreen from '../screens/FocusTimerScreen'; // Added FocusTimerScreen

const Tab = createBottomTabNavigator();

// Define static colors for the tab bar for a professional look
const STATIC_COLORS = {
  primary: '#6A11CB', // Deep purple - primary brand color
  inactive: '#8E8E93', // Standard inactive color
  background: '#FFFFFF', // Tab bar background
  activeAccent: '#2575FC', // A secondary color for active tab, if desired (or use primary)
  // Add more if needed
};

const BottomTabNavigator = () => {
  const defaultFallbackFonts = {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System-Medium' : 'sans-serif-medium',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: STATIC_COLORS.primary,
        tabBarInactiveTintColor: STATIC_COLORS.inactive,
        tabBarStyle: {
          backgroundColor: STATIC_COLORS.background,
          borderTopWidth: Platform.OS === 'ios' ? 0 : 1, // No top border on iOS, subtle on Android
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 90 : 60, // Adjust height for different platforms
          paddingBottom: Platform.OS === 'ios' ? 30 : 5, // Padding for notch/home indicator
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontFamily: defaultFallbackFonts.medium,
          fontSize: 10,
          marginBottom: Platform.OS === 'ios' ? -5 : 0, // Adjust label position
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          const iconSize = focused ? size + 2 : size; // Slightly larger icon when focused

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          } else if (route.name === 'Study') {
            iconName = focused ? 'library' : 'library-outline'; // Changed icon
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          } else if (route.name === 'Focus') {
            iconName = focused ? 'timer' : 'timer-outline';
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          } else if (route.name === 'AI') {
            iconName = focused ? 'sparkles' : 'sparkles-outline'; // Using sparkles for AI
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          } else if (route.name === 'SettingsTab') { // Changed from 'Settings' to 'SettingsTab'
            iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        // Options can be kept minimal if defaults are good
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen} // New comprehensive Study screen
        options={{
          title: 'Study Universe', // Updated title
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusTimerScreen} // Added Focus Timer screen
        options={{
          title: 'Focus Timer',
        }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen} // Added AI screen
        options={{
          title: 'AI Tutor',
        }}
      />
      <Tab.Screen
        name="SettingsTab" // Changed from 'Settings' to 'SettingsTab'
        component={AppSettingsScreen} // Updated component
        // Options can be kept minimal
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
