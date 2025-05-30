import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Consistent styling (can be imported from a shared styles file later)
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  background: '#F4F6F8', // Light Gray
  surface: '#FFFFFF', // White
  text: '#1A202C', // Dark Gray / Black
  textSecondary: '#4A5568', // Medium Gray
  textMuted: '#718096', // Light Gray
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0', // Light Border
  placeholder: '#A0AEC0',
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: STATIC_COLORS.primaryDark },
  h2: { fontSize: 24, fontWeight: 'bold', color: STATIC_COLORS.text, marginBottom: 16 },
  h3: { fontSize: 20, fontWeight: '600', color: STATIC_COLORS.primary, marginBottom: 8 },
  body: { fontSize: 16, color: STATIC_COLORS.textSecondary, lineHeight: 24 },
  caption: { fontSize: 14, color: STATIC_COLORS.textMuted, fontStyle: 'italic' },
  button: { fontSize: 16, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const FeatureCard = ({ title, description, iconName }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Icon name={iconName} size={28} color={STATIC_COLORS.primary} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardDescription}>{description}</Text>
    <View style={styles.comingSoonBadge}>
      <Text style={styles.comingSoonText}>Coming Soon</Text>
    </View>
  </View>
);

const WritingAssistantScreen = ({ navigation }) => {
  const features = [
    { id: '1', title: 'AI Outline Generator', description: 'Generate structured outlines for your essays and papers.', icon: 'file-document-outline', screen: 'AIOutlineGenerator' },
    { id: '2', title: 'Plagiarism Detection', description: 'Check your text for potential plagiarism.', icon: 'text-search', screen: 'PlagiarismChecker' }, // Updated screen name
    { id: '3', title: 'Citation Management', description: 'Organize and manage your research citations.', icon: 'book-multiple-outline', screen: 'ResearchOrganization' }, // Assuming this is the correct screen for now
    // ... more features can be added here
  ];

  // Helper to create navigable feature cards
  const NavigableFeatureCard = ({ title, description, iconName, screenName }) => (
    <TouchableOpacity onPress={() => navigation.navigate(screenName)} style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name={iconName} size={28} color={STATIC_COLORS.primary} style={styles.cardIcon} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
      {/* Remove Coming Soon for Research Organization or make it conditional */}
      {screenName !== 'ResearchOrganization' && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={28} color={STATIC_COLORS.primary} />
        </TouchableOpacity>
        <Text style={TYPOGRAPHY.h1}>Writing Assistant</Text>
      </View>
      <Text style={styles.subHeader}>Tools to elevate your academic writing.</Text>

      {features.map((feature) => (
        <NavigableFeatureCard
          key={feature.id}
          title={feature.title}
          description={feature.description}
          iconName={feature.icon}
          screenName={feature.screen}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.sm, // Make it easier to tap
  },
  subHeader: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    color: STATIC_COLORS.textSecondary,
  },
  card: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: STATIC_COLORS.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    marginRight: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.primaryDark, // Darker for more contrast
  },
  cardDescription: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    color: STATIC_COLORS.textSecondary,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: STATIC_COLORS.accent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 20, // Pill shape
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: STATIC_COLORS.surface, // White text on accent bg
  },
});

export default WritingAssistantScreen;
