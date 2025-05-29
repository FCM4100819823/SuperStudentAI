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
import SyllabusAnalysisResultScreen from '../screens/SyllabusAnalysisResult';
import TaskManagerScreen from '../screens/TaskManagerScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen'; // Import FocusTimerScreen
import AnalyticsScreen from '../screens/AnalyticsScreen'; // Import AnalyticsScreen
import CreateStudyPlanScreen from '../screens/CreateStudyPlanScreen'; // Import CreateStudyPlanScreen
import StudyPlanDetailScreen from '../screens/StudyPlanDetailScreen'; // Import StudyPlanDetailScreen
import AddStudyTaskScreen from '../screens/AddStudyTaskScreen'; // Import AddStudyTaskScreen
import AddSpacedRepetitionItemScreen from '../screens/AddSpacedRepetitionItemScreen'; // Import AddSpacedRepetitionItemScreen
import GPACalculatorScreen from '../screens/GPACalculatorScreen'; // Import GPACalculatorScreen

import BottomTabNavigator from './BottomTabNavigator';

const RootStackNav = createStackNavigator();
const AuthStackNav = createStackNavigator();

const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Splash" component={SplashScreen} />
    <AuthStackNav.Screen name="Intro" component={IntroScreen} />
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
        <RootStackNav.Screen name="App" component={BottomTabNavigator} />
      ) : (
        <RootStackNav.Screen name="Auth" component={AuthStack} />
      )}
      <RootStackNav.Screen name="Profile" component={ProfileScreen} />
      <RootStackNav.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <RootStackNav.Screen name="AIScreen" component={AIScreen} />
      <RootStackNav.Screen name="FileUpload" component={FileUploadScreen} />
      <RootStackNav.Screen name="SpacedRepetitionScreen" component={SpacedRepetitionScreen} />
      <RootStackNav.Screen name="SyllabusAnalysisResult" component={SyllabusAnalysisResultScreen} /> 
      <RootStackNav.Screen name="TaskManager" component={TaskManagerScreen} />
      <RootStackNav.Screen name="AddTask" component={AddTaskScreen} />
      <RootStackNav.Screen name="FocusTimer" component={FocusTimerScreen} />
      <RootStackNav.Screen name="Analytics" component={AnalyticsScreen} />
      <RootStackNav.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} /> 
      <RootStackNav.Screen name="StudyPlanDetail" component={StudyPlanDetailScreen} />
      <RootStackNav.Screen name="AddStudyTask" component={AddStudyTaskScreen} />
      <RootStackNav.Screen name="AddSpacedRepetitionItem" component={AddSpacedRepetitionItemScreen} />
      <RootStackNav.Screen name="GPACalculatorScreen" component={GPACalculatorScreen} />
    </RootStackNav.Navigator>
  );
};

export default AppNavigator;
