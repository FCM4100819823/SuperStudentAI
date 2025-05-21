import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { auth } from './firebaseConfig';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null); // Changed to null as initial state for clarity

  useEffect(() => {
    console.log('App.js: useEffect for onAuthStateChanged, initializing:', initializing);
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('App.js: onAuthStateChanged triggered. User:', firebaseUser ? firebaseUser.uid : null);
      setUser(firebaseUser);
      if (initializing) {
        console.log('App.js: Setting initializing to false.');
        setInitializing(false);
      }
    });
    return () => {
      console.log('App.js: Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
    // The dependency array [initializing] is intentional here to re-subscribe 
    // if initializing were to change, though it primarily serves to run after initial mount
    // and when initializing becomes false. A simple [] might also work if setInitializing(false)
    // is handled carefully after the first auth check.
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4169E1" />
      </View>
    );
  }

  return (
    <NavigationContainer key={user ? 'app-stack' : 'auth-stack'}>
      <AppNavigator user={user} />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
