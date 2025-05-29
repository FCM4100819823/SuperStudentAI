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
import WellbeingScreen from '../screens/WellbeingScreen'; // Added WellbeingScreen
import FinanceScreen from '../screens/FinanceScreen'; // Added FinanceScreen

const Tab = createBottomTabNavigator();

// Define static colors for the tab bar for a professional look
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple - primary brand color from AppSettingsScreen
  secondary: '#4CAF50', // Green - secondary color from AppSettingsScreen
  inactive: '#718096', // textMuted from AppSettingsScreen
  background: '#FFFFFF', // surface from AppSettingsScreen
  // activeAccent: '#F59E0B', // accent from AppSettingsScreen (optional)
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
          const iconSize = focused ? size + 3 : size; // Slightly larger icon when focused

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home-sharp' : 'home-outline';
          } else if (route.name === 'Study') {
            iconName = focused ? 'library-sharp' : 'library-outline'; 
          } else if (route.name === 'Focus') {
            iconName = focused ? 'hourglass-sharp' : 'hourglass-outline'; // Changed icon for Focus
          } else if (route.name === 'AI') {
            iconName = focused ? 'sparkles-sharp' : 'sparkles-outline'; 
          } else if (route.name === 'Wellbeing') { // Added Wellbeing Tab
            iconName = focused ? 'heart-sharp' : 'heart-outline';
          } else if (route.name === 'Finance') { // Added Finance Tab
            iconName = focused ? 'cash-sharp' : 'cash-outline';
          } else if (route.name === 'SettingsTab') { 
            iconName = focused ? 'settings-sharp' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen} 
        options={{
          title: 'Study Hub', // Updated title
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusTimerScreen} 
        options={{
          title: 'Focus Zone',
        }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen} 
        options={{
          title: 'AI Assistant',
        }}
      />
      <Tab.Screen // Added Wellbeing Tab
        name="Wellbeing"
        component={WellbeingScreen}
        options={{
          title: 'Wellbeing',
        }}
      />
      <Tab.Screen // Added Finance Tab
        name="Finance"
        component={FinanceScreen}
        options={{
          title: 'Finances',
        }}
      />
      <Tab.Screen
        name="SettingsTab" 
        component={AppSettingsScreen} 
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
