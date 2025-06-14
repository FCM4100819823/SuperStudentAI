import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Platform,
  StatusBar,
} from 'react-native';
import GPACalculator from '../components/GPACalculator'; // Assuming GPACalculator is in components
import { LinearGradient } from 'expo-linear-gradient';

// Consistent color palette (using a subset for simplicity, can be expanded)
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  background: '#F4F6F8',
  textOnPrimary: '#FFFFFF',
  text: '#1A202C',
};

const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
};

const SPACING = {
  md: 16,
  lg: 24,
};

const GPACalculatorScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={STATIC_COLORS.primaryDark}
      />
      <LinearGradient
        colors={[STATIC_COLORS.primary, STATIC_COLORS.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>GPA/CWA Calculator</Text>
      </LinearGradient>
      <View style={styles.container}>
        <GPACalculator />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.lg, // Extra padding for status bar area if not handled by SafeAreaView fully
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: STATIC_COLORS.primaryDark,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    // The GPACalculator component itself will have padding
  },
});

export default GPACalculatorScreen;
