import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth'; // Import getAuth
// import CalendarEvents from 'react-native-calendar-events'; // Consider for adding to device calendar

const backendUrl = 'http://172.20.10.3.2:3000'; // Ensure this is your correct backend URL

// Define STATIC_COLORS and SPACING for consistent styling
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A148C',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#757575',
  textOnPrimary: '#FFFFFF',
  error: '#D32F2F',
  success: '#388E3C',
  info: '#1976D2', // Blue for info
  shadow: 'rgba(0,0,0,0.1)',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  caption: { fontSize: 12 },
};

const SyllabusAnalysisResultScreen = ({ route, navigation }) => {
  const { analysisId, fileName } = route.params;
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  const auth = getAuth(); // Get auth instance
  const user = auth.currentUser; // Get current user

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!analysisId) {
        setError('Analysis ID is missing.');
        setLoading(false);
        return;
      }
      if (!user || !user.uid) {
        // Check for user and user.uid
        setError('User not authenticated. Please login again.');
        setLoading(false);
        // Optionally navigate to login screen
        // navigation.navigate('Login');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${backendUrl}/file/syllabus-analysis/${analysisId}?userId=${user.uid}`,
        ); // Use actual user.uid

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({
              message:
                'Failed to fetch analysis results. Server returned an error.',
            }));
          throw new Error(
            errorData.message || `Server error: ${response.status}`,
          );
        }

        const data = await response.json();
        setAnalysisData(data);
      } catch (e) {
        console.error('Error fetching syllabus analysis:', e);
        setError(e.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [analysisId]);

  const handleAddToCalendar = (event) => {
    // Basic share functionality for now.
    // For direct calendar integration, explore libraries like 'react-native-calendar-events'
    // or 'expo-calendar' and handle permissions.
    const eventDetails = `Event: ${event.topic}\nDate: ${new Date(event.date).toLocaleDateString()}\nDescription: ${event.description || 'N/A'}`;
    Share.share({
      title: `Add to Calendar: ${event.topic}`,
      message: eventDetails,
    }).catch((shareError) => console.log('Share error:', shareError));

    Alert.alert(
      'Add to Calendar',
      `Would you like to add "${event.topic}" on ${new Date(event.date).toLocaleDateString()} to your calendar? (Feature coming soon)`,
      [{ text: 'OK' }],
    );
  };

  const renderEventCard = (event, index) => (
    <View key={index} style={styles.eventCard}>
      <View style={styles.eventDateBadge}>
        <Text style={styles.eventDateBadgeDay}>
          {new Date(event.date).getDate()}
        </Text>
        <Text style={styles.eventDateBadgeMonth}>
          {new Date(event.date)
            .toLocaleString('default', { month: 'short' })
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{event.topic || 'Untitled Event'}</Text>
        <Text style={styles.eventDescription}>
          {event.description || 'No description available.'}
        </Text>
        {event.type && <Text style={styles.eventType}>Type: {event.type}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => handleAddToCalendar(event)}
        style={styles.addToCalendarButton}
      >
        <Ionicons
          name="calendar-outline"
          size={24}
          color={STATIC_COLORS.primary}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
        <Text style={styles.loadingText}>
          Analyzing syllabus: {fileName || 'your file'}...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredMessage}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={STATIC_COLORS.error}
        />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back & Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (
    !analysisData ||
    !analysisData.extractedEvents ||
    analysisData.extractedEvents.length === 0
  ) {
    return (
      <View style={styles.centeredMessage}>
        <Ionicons
          name="information-circle-outline"
          size={60}
          color={STATIC_COLORS.info}
        />
        <Text style={styles.errorTitle}>No Events Found</Text>
        <Text style={styles.errorMessage}>
          We couldn't find any specific events or key dates in "{fileName}". The
          syllabus might be in a format we couldn't fully process, or it might
          not contain explicit dates.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Upload a Different File</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={STATIC_COLORS.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Analysis: {fileName || 'Syllabus Results'}
        </Text>
        {/* Add a refresh button to allow refetching data */}
        <TouchableOpacity
          onPress={fetchAnalysisData}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh-outline"
            size={24}
            color={STATIC_COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Extracted Key Dates & Topics</Text>
        <Text style={styles.sectionSubtitle}>
          Found {analysisData.extractedEvents.length} event(s) in your syllabus.
          Review and add them to your calendar.
        </Text>

        {analysisData.extractedEvents.map(renderEventCard)}

        {/* Placeholder for summary or further actions */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>What's Next?</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                'Coming Soon!',
                'This feature will be available shortly.',
              )
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={STATIC_COLORS.textOnPrimary}
              style={{ marginRight: SPACING.sm }}
            />
            <Text style={styles.actionButtonText}>
              Create Study Plan from Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: STATIC_COLORS.secondary,
                marginTop: SPACING.sm,
              },
            ]}
            onPress={() => navigation.navigate('Study')}
          >
            <Ionicons
              name="arrow-back-circle-outline"
              size={22}
              color={STATIC_COLORS.textOnPrimary}
              style={{ marginRight: SPACING.sm }}
            />
            <Text style={styles.actionButtonText}>Back to Study Hub</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: STATIC_COLORS.surface,
    paddingTop: Platform.OS === 'android' ? 25 + SPACING.sm : 50 + SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: SPACING.xs,
    // marginRight: SPACING.sm, // Removed to allow refresh button on the other side
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.text,
    flex: 1, // Allow title to take space and truncate
    textAlign: 'center', // Center the title
    marginHorizontal: SPACING.sm, // Add some margin if title is too close to buttons
  },
  refreshButton: {
    // Style for the refresh button
    padding: SPACING.xs,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.error,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    padding: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.primaryDark,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  eventCard: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventDateBadge: {
    backgroundColor: STATIC_COLORS.accent,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    minWidth: 60,
  },
  eventDateBadgeDay: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 22,
  },
  eventDateBadgeMonth: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 2,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.text,
    marginBottom: SPACING.xs,
  },
  eventDescription: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  eventType: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.info,
    fontStyle: 'italic',
  },
  addToCalendarButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  summarySection: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.primaryDark,
    marginBottom: SPACING.md,
  },
  actionButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textOnPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SyllabusAnalysisResultScreen;
