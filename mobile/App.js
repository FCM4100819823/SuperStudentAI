import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { auth } from './config/firebase';

// Default color for loading indicator if not using theme
const DEFAULT_PRIMARY_COLOR = '#6200EE'; // Example color, adjust as needed
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF'; // Example color

function AppContent({ user }) {
  return (
    <NavigationContainer>
      {/* Use a default status bar style or make it configurable elsewhere */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DEFAULT_BACKGROUND_COLOR}
      />
      <AppNavigator user={user} />
    </NavigationContainer>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DEFAULT_PRIMARY_COLOR} />
      </View>
    );
  }

  return <AppContent user={user} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
  },
});
