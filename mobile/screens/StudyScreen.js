import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  ImageBackground
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db as firestoreDb } from '../config/firebase'; // Assuming firebase config
// import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore'; // Example Firestore imports

const { width, height } = Dimensions.get('window');

// Consistent color palette (primary: Deep Purple, secondary: Green)
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  danger: '#EF4444',
  success: '#4CAF50',
  warning: '#F59E0B',
  background: '#F4F6F8', // Light, clean background for the main content area
  surface: '#FFFFFF', // For cards and interactive elements
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  border: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.05)',
  gradientPurple: ['#6A1B9A', '#8E24AA'], // Deeper purple gradient
  gradientGreen: ['#4CAF50', '#66BB6A'], // Softer green gradient
  gradientBlue: ['#3B82F6', '#60A5FA'], // Blue for some actions
  gradientAmber: ['#F59E0B', '#FBBF24'], // Amber for highlights
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
  h2: { fontSize: 22, fontWeight: 'bold', color: STATIC_COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: STATIC_COLORS.text },
  body: { fontSize: 16, fontWeight: '400', color: STATIC_COLORS.textSecondary, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', color: STATIC_COLORS.textMuted, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: STATIC_COLORS.primaryDark },
  cardSubtitle: { fontSize: 14, color: STATIC_COLORS.textMuted, marginTop: 4 },
};

const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

const FeatureCard = ({ title, subtitle, iconName, iconType = 'ionicons', gradientColors, onPress, onLongPress, tag }) => (
  <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.featureCardContainer} activeOpacity={0.8}>
    <LinearGradient colors={gradientColors} style={styles.featureCardGradient}>
      <View style={styles.featureCardHeader}>
        {iconType === 'ionicons' ? (
          <Ionicons name={iconName} size={32} color={STATIC_COLORS.textOnPrimary} />
        ) : (
          <MaterialCommunityIcons name={iconName} size={32} color={STATIC_COLORS.textOnPrimary} />
        )}
        {tag && <View style={styles.tagContainer}><Text style={styles.tagText}>{tag}</Text></View>}
      </View>
      <Text style={styles.featureCardTitle}>{title}</Text>
      <Text style={styles.featureCardSubtitle}>{subtitle}</Text>
    </LinearGradient>
  </TouchableOpacity>
);


const StudyScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false); // For any data fetching if needed
  const [userName, setUserName] = useState('Student');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser?.displayName) {
      setUserName(currentUser.displayName.split(' ')[0]); // Get first name
    }
    // Potentially fetch upcoming tasks or study sessions here
  }, []);

  const handleNavigate = (screenName, params = {}) => {
    navigation.navigate(screenName, params);
  };
  
  const handleComingSoon = (featureName) => {
    Alert.alert(
      `${featureName} - Coming Soon!`,
      "This feature is under active development and will be available in a future update. Stay tuned!"
    );
  };

  const academicFeatures = [
    {
      title: 'Syllabus Analyzer',
      subtitle: 'Upload & extract key dates',
      iconName: 'document-text-outline',
      gradientColors: STATIC_COLORS.gradientPurple,
      onPress: () => handleNavigate('FileUpload', { uploadType: 'syllabus', nextPage: 'SyllabusAnalysisResult' }), // Example navigation
      tag: 'AI Powered'
    },
    {
      title: 'Task Manager',
      subtitle: 'Organize your assignments',
      iconName: 'checkbox-outline',
      gradientColors: STATIC_COLORS.gradientGreen,
      onPress: () => handleComingSoon('Task Manager'), // To be implemented
    },
    {
      title: 'Spaced Repetition',
      subtitle: 'Optimize your learning',
      iconName: 'repeat-outline',
      gradientColors: STATIC_COLORS.gradientBlue,
      onPress: () => handleNavigate('SpacedRepetitionScreen'),
    },
    {
      title: 'Focus Sessions',
      subtitle: 'Pomodoro & tracking',
      iconName: 'timer-outline',
      gradientColors: STATIC_COLORS.gradientAmber,
      onPress: () => handleNavigate('FocusTimer'), // Navigate to existing FocusTimerScreen
    },
    {
      title: 'Grade Tracker',
      subtitle: 'Monitor CWA/GPA & courses',
      iconName: 'school-outline',
      gradientColors: ['#FF6B6B', '#FF8E8E'], // Custom gradient
      onPress: () => handleComingSoon('Grade Tracker'), // To be implemented
      tag: 'New'
    },
    {
      title: 'Writing Assistant',
      subtitle: 'Outlines, citations & more',
      iconName: 'pencil-outline',
      gradientColors: ['#4E65FF', '#748BFF'], // Custom gradient
      onPress: () => handleComingSoon('Writing Assistant'), // To be implemented
      tag: 'AI Powered'
    },
  ];

  if (loading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
        <Text style={{ marginTop: SPACING.sm, color: STATIC_COLORS.primary }}>Loading Study Hub...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContentContainer}>
      <StatusBar barStyle="light-content" backgroundColor={STATIC_COLORS.primaryDark} />
      <ImageBackground 
        source={require('../assets/study-banner.png')} // Replace with your desired banner image
        style={styles.headerContainer}
        imageStyle={styles.headerImageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'transparent']}
          style={styles.headerOverlay}
        >
          <Text style={styles.headerTitle}>Study Universe</Text>
          <Text style={styles.headerSubtitle}>All your academic tools in one place, {userName}.</Text>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Academic Toolkit</Text>
        <View style={styles.featuresGrid}>
          {academicFeatures.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              subtitle={feature.subtitle}
              iconName={feature.iconName}
              iconType={feature.iconType}
              gradientColors={feature.gradientColors}
              onPress={feature.onPress}
              tag={feature.tag}
            />
          ))}
        </View>
        
        {/* Placeholder for upcoming tasks or quick summary */}
        <View style={styles.quickSummaryCard}>
            <Ionicons name="newspaper-outline" size={24} color={STATIC_COLORS.primary} style={{marginRight: SPACING.sm}}/>
            <View>
                <Text style={styles.quickSummaryTitle}>Today's Focus</Text>
                <Text style={styles.quickSummaryText}>No upcoming tasks or sessions. Plan your day!</Text>
                {/* <Text style={styles.quickSummaryText}>- Math Assignment due at 11:59 PM</Text>
                <Text style={styles.quickSummaryText}>- History Quiz at 2:00 PM</Text> */}
            </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.lg,
  },
  headerContainer: {
    height: height * 0.25, // Adjust height as needed
    justifyContent: 'flex-end', // Align text to bottom
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: STATIC_COLORS.primaryDark, // Fallback if image fails
  },
  headerImageStyle: {
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject, // Cover the entire ImageBackground
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: STATIC_COLORS.textOnPrimary,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textOnPrimary,
    opacity: 0.9,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.primaryDark,
    marginBottom: SPACING.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCardContainer: {
    width: (width - (SPACING.md * 2) - SPACING.md) / 2, // Two cards per row with spacing
    marginBottom: SPACING.md,
    borderRadius: 15,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: STATIC_COLORS.surface, // Needed for elevation on Android
  },
  featureCardGradient: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 15,
    justifyContent: 'space-between', // Pushes subtitle to bottom
    minHeight: 160, // Ensure cards have a good height
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 8,
  },
  tagText: {
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureCardTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.textOnPrimary,
    marginTop: SPACING.sm,
    fontSize: 17, // Slightly adjusted
  },
  featureCardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textOnPrimary,
    opacity: 0.85,
    fontSize: 13, // Slightly adjusted
    marginTop: SPACING.xs,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
  },
  quickSummaryCard: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 15,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  quickSummaryTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.primaryDark,
    marginBottom: SPACING.xs,
  },
  quickSummaryText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    fontSize: 14,
  },
});

export default StudyScreen;
