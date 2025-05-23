import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
import SpacedRepetitionScreen from '../screens/SpacedRepetitionScreen'; // Import SpacedRepetitionScreen

const RootStackNav = createStackNavigator();
const AuthStackNav = createStackNavigator();
const AppTabsNav = createBottomTabNavigator();
const HomeStackNav = createStackNavigator();
const StudyStackNav = createStackNavigator();
const SettingsStackNav = createStackNavigator();

// Define some default colors here if needed for navigator styling, or rely on component-level styling
const DEFAULT_TAB_BAR_ACTIVE_TINT = '#6A11CB'; // Example: Deep Purple
const DEFAULT_TAB_BAR_INACTIVE_TINT = '#8E8E93'; // Example: Grey
const DEFAULT_TAB_BAR_BACKGROUND = '#FFFFFF'; // Example: White
const DEFAULT_HEADER_TINT = '#000000'; // Example: Black for header text

// Stack for screens within the Home Tab
const HomeStack = () => (
  <HomeStackNav.Navigator 
    screenOptions={{
      headerShown: false, 
    }}
  >
    <HomeStackNav.Screen name="Home" component={HomeScreen} />
    <HomeStackNav.Screen name="AI" component={AIScreen} />
    <HomeStackNav.Screen name="FileUpload" component={FileUploadScreen} />
    <HomeStackNav.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
    <HomeStackNav.Screen name="FocusTimer" component={FocusTimerScreen} />
    <HomeStackNav.Screen name="StudyPlanDetail" component={StudyPlanDetailScreen} />
  </HomeStackNav.Navigator>
);

// Stack for screens within the Study Tab
const StudyStack = () => (
  <StudyStackNav.Navigator 
    screenOptions={{
      headerShown: false,
    }}
  >
    <StudyStackNav.Screen name="StudyDashboard" component={StudyPlansDashboardScreen} />
    <StudyStackNav.Screen name="StudyPlanList" component={StudyPlanListScreen} />
    <StudyStackNav.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
    <StudyStackNav.Screen name="StudyPlanDetail" component={StudyPlanDetailScreen} />
    <StudyStackNav.Screen name="SpacedRepetition" component={SpacedRepetitionScreen} /> {/* Add SpacedRepetitionScreen */}
  </StudyStackNav.Navigator>
);

// Stack for screens within the Settings Tab
const SettingsStack = () => (
  <SettingsStackNav.Navigator 
    screenOptions={{
      headerShown: false,
    }}
  >
    <SettingsStackNav.Screen name="AppSettings" component={AppSettingsScreen} />
    <SettingsStackNav.Screen name="Profile" component={ProfileScreen} /> 
    <SettingsStackNav.Screen name="ProfileEdit" component={ProfileEditScreen} />
  </SettingsStackNav.Navigator>
);


const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Intro" component={IntroScreen} />
    <AuthStackNav.Screen name="Splash" component={SplashScreen} />
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    <AuthStackNav.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStackNav.Navigator>
);

const AppTabs = () => {
  return (
    <AppTabsNav.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StudyTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'WellbeingTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'FinanceTab') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: DEFAULT_TAB_BAR_ACTIVE_TINT, // Use default or remove for system default
        tabBarInactiveTintColor: DEFAULT_TAB_BAR_INACTIVE_TINT, // Use default or remove for system default
        tabBarStyle: {
          backgroundColor: DEFAULT_TAB_BAR_BACKGROUND, // Use default or remove for system default
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
