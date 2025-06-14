import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const AnalyticsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Analytics Screen</Text>
        <Text style={styles.subtitle}>
          Insights and data visualizations will be displayed here.
        </Text>
        {/* TODO: Implement charts and data display */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8', // Consistent background
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C', // Dark text
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568', // Secondary text
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
