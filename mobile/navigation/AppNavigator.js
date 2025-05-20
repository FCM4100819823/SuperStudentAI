import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Dashboard from '../screens/Dashboard';
import ForgotPassword from '../screens/ForgotPassword';
import ProfileEdit from '../screens/ProfileEdit';
import AIScreen from '../screens/AIScreen';
import FileUploadScreen from '../screens/FileUploadScreen';

const Stack = createStackNavigator();

const AppNavigator = ({ user }) => {
  return (
    <Stack.Navigator 
      initialRouteName={user ? 'Dashboard' : 'Login'}
      screenOptions={{ headerShown: false }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
          <Stack.Screen name="AI" component={AIScreen} />
          <Stack.Screen name="FileUpload" component={FileUploadScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
