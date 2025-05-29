import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import ForgotPasswordScreen from '../screens/ForgotPassword';
import ProfileEditScreen from '../screens/ProfileEdit';
import AIScreen from '../screens/AIScreen';
import FileUploadScreen from '../screens/FileUploadScreen';
import SpacedRepetitionScreen from '../screens/SpacedRepetitionScreen';
import SplashScreen from '../screens/SplashScreen';
import IntroScreen from '../screens/IntroScreen';
import ProfileScreen from '../screens/ProfileScreen';

import BottomTabNavigator from './BottomTabNavigator'; // Import the consolidated BottomTabNavigator

const RootStackNav = createStackNavigator();
const AuthStackNav = createStackNavigator();

const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Intro" component={IntroScreen} />
    <AuthStackNav.Screen name="Splash" component={SplashScreen} />
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    <AuthStackNav.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
    />
  </AuthStackNav.Navigator>
);

const AppNavigator = ({ user }) => {
  return (
    <RootStackNav.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Use BottomTabNavigator directly for the authenticated app experience
        <RootStackNav.Screen name="App" component={BottomTabNavigator} />
      ) : (
        <RootStackNav.Screen name="Auth" component={AuthStack} />
      )}
      {/* Screens that can be navigated to from anywhere, including from within tabs */}
      {/* These are typically modal screens or screens in a deeper navigation hierarchy */}
      <RootStackNav.Screen name="Profile" component={ProfileScreen} />
      <RootStackNav.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <RootStackNav.Screen name="AIScreenGlobal" component={AIScreen} />
      <RootStackNav.Screen name="FileUploadGlobal" component={FileUploadScreen} />
      <RootStackNav.Screen name="SpacedRepetitionGlobal" component={SpacedRepetitionScreen} />
      {/* Add other globally accessible screens here if needed */}
      {/* For example, if FocusTimerScreen needs to be launched from a notification or outside tabs:
      <RootStackNav.Screen name="FocusTimerGlobal" component={FocusTimerScreen} /> 
      */}
    </RootStackNav.Navigator>
  );
};

export default AppNavigator;
