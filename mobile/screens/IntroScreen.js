import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const logo = require('../assets/superstudentlogo.png');
const { width, height } = Dimensions.get('window');

const IntroScreen = ({ navigation }) => {
  const { theme, colors } = useTheme(); // Get theme and colors from context
  const styles = getStyles(colors); // Pass colors to getStyles

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: height,
          justifyContent: 'center',
          backgroundColor: colors.background,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.mainTitle}>SuperStudent AI</Text>
          <Text style={styles.subtitle}>Your AI-powered Academic Success Partner</Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="library-outline" size={24} color={colors.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>Syllabus Analysis & Smart Study Planning</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="pencil-outline" size={24} color={colors.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>AI-Powered Writing & Research Tools</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="heart-outline" size={24} color={colors.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>Wellbeing & Mindfulness Support</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="rocket-outline" size={24} color={colors.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>Boost Productivity & Achieve Goals</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.diveInButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="key-outline" size={20} color={colors.buttonText} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Dive In!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.getStartedButton]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.buttonText, styles.getStartedButtonText]}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.pathText}>Choose your path to begin</Text>

          <Text style={styles.footerText}>
            © {new Date().getFullYear()} SuperStudentAI - Elevate Your Learning
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: height * 0.05,
    paddingBottom: height * 0.03,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1, // Ensure content stretches to fill space
  },
  logo: {
    width: width < 600 ? width * 0.35 : 220,
    height: width < 600 ? width * 0.35 : 220,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center',
  },
  mainTitle: {
    fontSize: width < 600 ? width * 0.09 : 48,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'System',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: width < 600 ? width * 0.045 : 22,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'System',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
    alignSelf: 'center',
    maxWidth: 400,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  featureIcon: {
    marginRight: 15,
  },
  featureText: {
    fontSize: width * 0.04,
    color: colors.text,
    flexShrink: 1,
    fontFamily: 'System',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  diveInButton: {
    backgroundColor: colors.primary,
  },
  getStartedButton: {
    backgroundColor: colors.secondary, // Assuming a secondary color for this button
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: width * 0.045,
    fontWeight: '600',
    fontFamily: 'System',
  },
  getStartedButtonText: {
    color: colors.buttonText, // Ensure this is styled for secondary button if needed
  },
  buttonIcon: {
    marginRight: 8,
  },
  pathText: {
    fontSize: width * 0.038,
    color: colors.subtext,
    marginBottom: 20,
    fontFamily: 'System',
  },
  footerText: {
    fontSize: width * 0.032,
    color: colors.subtext,
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 30, // Add space above footer
    marginBottom: 10, // Add space below for iOS safe area
  },
});

export default IntroScreen;
