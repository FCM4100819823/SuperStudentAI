import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import useTheme

import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import ForgotPasswordScreen from '../screens/ForgotPassword';
import ProfileEditScreen from '../screens/ProfileEdit';
import AIScreen from '../screens/AIScreen';
import FileUploadScreen from '../screens/FileUploadScreen';
import StudyPlanListScreen from '../screens/StudyPlanListScreen';
import CreateStudyPlanScreen from '../screens/CreateStudyPlanScreen';
import StudyPlanDetailScreen from '../screens/StudyPlanDetailScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen';
import SplashScreen from '../screens/SplashScreen';
import IntroScreen from '../screens/IntroScreen';
import HomeScreen from '../screens/HomeScreen'; // Main Home tab screen
import StudyPlansDashboardScreen from '../screens/Dashboard'; // This is the original Dashboard, now for "Study" tab
import WellbeingScreen from '../screens/WellbeingScreen'; // Placeholder
import FinanceScreen from '../screens/FinanceScreen'; // Placeholder
import ProfileScreen from '../screens/ProfileScreen'; // Placeholder for Profile tab
import AppSettingsScreen from '../screens/AppSettingsScreen'; // Import AppSettingsScreen
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen'; // Import ThemeSettingsScreen
import SpacedRepetitionScreen from '../screens/SpacedRepetitionScreen'; // Import SpacedRepetitionScreen

const AuthStackNav = createStackNavigator();
const AppTabsNav = createBottomTabNavigator();
const RootStackNav = createStackNavigator();

// Stack for screens within the Home Tab
const HomeStackNav = createStackNavigator();
const HomeStack = () => (
  <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
    <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
    {/* Add other screens navigable from Home tab here, e.g., AI, FileUpload, CreateStudyPlan */}
    <HomeStackNav.Screen name="AI" component={AIScreen} />
    <HomeStackNav.Screen name="FileUpload" component={FileUploadScreen} />
    <HomeStackNav.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
    <HomeStackNav.Screen name="FocusTimer" component={FocusTimerScreen} />
     <HomeStackNav.Screen name="StudyPlanDetail" component={StudyPlanDetailScreen} />
  </HomeStackNav.Navigator>
);

// Stack for screens within the Study Tab
const StudyStackNav = createStackNavigator();
const StudyStack = () => (
  <StudyStackNav.Navigator screenOptions={{ headerShown: false }}>
    <StudyStackNav.Screen name="StudyPlansDashboard" component={StudyPlansDashboardScreen} />
    <StudyStackNav.Screen name="StudyPlanList" component={StudyPlanListScreen} />
    <StudyStackNav.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
    <StudyStackNav.Screen name="StudyPlanDetail" component={StudyPlanDetailScreen} />
    <StudyStackNav.Screen name="SpacedRepetition" component={SpacedRepetitionScreen} /> {/* Add SpacedRepetitionScreen */}
  </StudyStackNav.Navigator>
);

// Stack for screens within the Settings Tab
const SettingsStackNav = createStackNavigator();
const SettingsStack = () => (
    <SettingsStackNav.Navigator screenOptions={{ headerShown: false }}>
        <SettingsStackNav.Screen name="SettingsMain" component={AppSettingsScreen} />
        <SettingsStackNav.Screen name="ProfileSettings" component={ProfileScreen} /> 
        <SettingsStackNav.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <SettingsStackNav.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
        {/* Add other specific settings screens here, e.g., Notifications, Account */}
    </SettingsStackNav.Navigator>
);


const AuthStack = () => (
  <AuthStackNav.Navigator
    initialRouteName="Intro"
    screenOptions={{ headerShown: false }}
  >
    <AuthStackNav.Screen name="Intro" component={IntroScreen} />
    <AuthStackNav.Screen name="Splash" component={SplashScreen} />
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    <AuthStackNav.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStackNav.Navigator>
);

const AppTabs = () => {
  const { theme } = useTheme(); // Get theme context

  return (
    <AppTabsNav.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StudyTab') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'WellbeingTab') {
            iconName = focused ? 'heart-circle' : 'heart-circle-outline';
          } else if (route.name === 'FinanceTab') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          // Use theme color for focused icon, allow default for inactive
          return <Ionicons name={iconName} size={size} color={focused ? theme.colors.primary : theme.colors.subtext} />; // Changed theme.colors.icon to theme.colors.subtext
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext, // Changed theme.colors.textSecondary to theme.colors.subtext
        tabBarStyle: { 
          backgroundColor: theme.colors.card, // Use theme color for tab bar background
          borderTopWidth: 0, 
          elevation: 5, 
          shadowOpacity: 0.1,
          borderTopColor: theme.colors.border, // Add border color from theme
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          paddingBottom: 3,
          color: theme.colors.text, // Use theme color for label
        },
      })}
    >
      <AppTabsNav.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <AppTabsNav.Screen name="StudyTab" component={StudyStack} options={{ tabBarLabel: 'Study' }} />
      <AppTabsNav.Screen name="WellbeingTab" component={WellbeingScreen} options={{ tabBarLabel: 'Wellbeing' }} />
      <AppTabsNav.Screen name="FinanceTab" component={FinanceScreen} options={{ tabBarLabel: 'Finance' }} />
      <AppTabsNav.Screen name="SettingsTab" component={SettingsStack} options={{ tabBarLabel: 'Settings' }} />
    </AppTabsNav.Navigator>
  );
};

const AppNavigator = ({ user }) => {
  return (
    <RootStackNav.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStackNav.Screen name="App" component={AppTabs} />
      ) : (
        <RootStackNav.Screen name="Auth" component={AuthStack} />
      )}
    </RootStackNav.Navigator>
  );
};

export default AppNavigator;
