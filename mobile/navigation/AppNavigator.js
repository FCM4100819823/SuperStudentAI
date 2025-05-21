import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Dashboard from '../screens/Dashboard';
import ForgotPassword from '../screens/ForgotPassword';
import ProfileEdit from '../screens/ProfileEdit';
import AIScreen from '../screens/AIScreen';
import FileUploadScreen from '../screens/FileUploadScreen';
import StudyPlanListScreen from '../screens/StudyPlanListScreen';
import CreateStudyPlanScreen from '../screens/CreateStudyPlanScreen';
import StudyPlanDetailScreen from '../screens/StudyPlanDetailScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen';

const AuthStackNav = createStackNavigator();
const AppStackNav = createStackNavigator();
const RootStackNav = createStackNavigator();

const AuthStack = () => (
  <AuthStackNav.Navigator 
    initialRouteName="Login"
    screenOptions={{ headerShown: false }}
  >
    <AuthStackNav.Screen name="Login" component={Login} />
    <AuthStackNav.Screen name="Register" component={Register} />
    <AuthStackNav.Screen name="ForgotPassword" component={ForgotPassword} />
  </AuthStackNav.Navigator>
);

const AppStack = () => (
  <AppStackNav.Navigator 
    initialRouteName="Dashboard"
    screenOptions={{ headerShown: false }}
  >
    <AppStackNav.Screen name="Dashboard" component={Dashboard} />
    <AppStackNav.Screen name="ProfileEdit" component={ProfileEdit} />
    <AppStackNav.Screen name="AI" component={AIScreen} />
    <AppStackNav.Screen name="FileUpload" component={FileUploadScreen} />
    <AppStackNav.Screen name="StudyPlanList" component={StudyPlanListScreen} />
    <AppStackNav.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
    <AppStackNav.Screen name="StudyPlanDetail" component={StudyPlanDetailScreen} />
    <AppStackNav.Screen name="FocusTimer" component={FocusTimerScreen} />
  </AppStackNav.Navigator>
);

const AppNavigator = ({ user }) => {
  return (
    <RootStackNav.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStackNav.Screen name="AppStack" component={AppStack} />
      ) : (
        <RootStackNav.Screen name="AuthStack" component={AuthStack} />
      )}
    </RootStackNav.Navigator>
  );
};

export default AppNavigator;
