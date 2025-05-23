import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Platform } from 'react-native'; // Ensure Platform is imported

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

// Define default colors as a fallback
const defaultThemeColors = {
  primary: '#6A11CB',
  subtext: '#5A6B7C',
  card: '#FFFFFF',
  border: '#E0E6F0',
  text: '#1A2B4D',
  // Add other necessary fallbacks if accessed from theme.colors
  background: '#F0F4F8', // Example, ensure all accessed colors have fallbacks
};

// Define default fonts as a fallback
const defaultThemeFonts = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', // Corrected for consistency, ensure this font is available or use fontWeight
  light: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
  thin: Platform.OS === 'ios' ? 'System' : 'sans-serif-thin',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

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
  const themeContext = useTheme();

  // Safely get colors and fonts, falling back to defaults
  const colors = themeContext?.colors ?? defaultThemeColors;
  const fonts = themeContext?.fonts ?? defaultThemeFonts;

  // Ensure fonts object and fonts.medium are valid, otherwise provide a final fallback for fontFamily
  const tabBarFontFamily = fonts?.medium ?? defaultThemeFonts.medium;

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
          return <Ionicons name={iconName} size={size} color={focused ? colors.primary : colors.subtext} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 5,
          shadowOpacity: 0.1,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          paddingBottom: 3,
          fontFamily: tabBarFontFamily, // Use the safely derived font family
          color: colors.text,
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
