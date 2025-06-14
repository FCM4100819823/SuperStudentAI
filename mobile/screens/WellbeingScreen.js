// WellbeingScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestoreDb } from '../config/firebase'; // Ensure firestoreDb is imported if not already
import JournalEntryModal from '../components/JournalEntryModal'; // Import the modal

const moods = [
  { name: 'Happy', icon: 'happy-outline', color: '#FFD700' }, // Gold
  { name: 'Calm', icon: 'leaf-outline', color: '#87CEEB' }, // Sky Blue
  { name: 'Okay', icon: 'thumbs-up-outline', color: '#90EE90' }, // Light Green
  { name: 'Sad', icon: 'sad-outline', color: '#A9A9A9' }, // Dark Gray
  { name: 'Stressed', icon: 'flash-outline', color: '#FFA07A' }, // Light Salmon
];

const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  secondary: '#4CAF50', // Green
  background: '#F5F5F5', // Light Grey
  card: '#FFFFFF', // White
  text: '#333333', // Dark Grey
  subtext: '#757575', // Medium Grey
  buttonText: '#FFFFFF', // White
  error: '#D32F2F', // Red
  success: '#388E3C', // Green
  warning: '#FFA000', // Amber
  info: '#1976D2', // Blue
  border: '#E0E0E0', // Light Grey Border
  shadow: '#000000', // Black for shadow
  disabled: '#BDBDBD', // Grey for disabled elements
  textSecondary: '#555555', // Slightly lighter than main text
  // Add any other static colors your app uses
};

const STATIC_FONTS = {
  // Define any static font families if needed
};

const WellbeingScreen = ({ navigation }) => {
  // const themeContext = useTheme() || {};
  // const colors = themeContext.colors || {};
  const colors = STATIC_COLORS; // Use static colors
  const styles = getStyles(colors); // Get styles based on theme
  const [selectedMood, setSelectedMood] = useState(null);
  const [lastMoodEntry, setLastMoodEntry] = useState(null);
  const [loadingMood, setLoadingMood] = useState(true);
  const [submittingMood, setSubmittingMood] = useState(false);
  const [isJournalModalVisible, setJournalModalVisible] = useState(false); // State for journal modal

  const journalPrompts = [
    'What are you grateful for today?',
    'Describe a small win you had recently.',
    "What's one thing you can do for yourself today?",
    'How are you feeling, really?',
    'What challenge did you overcome this week?',
  ];
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    // Fetch last mood entry
    const fetchLastMood = async () => {
      if (auth.currentUser) {
        try {
          const q = query(
            collection(firestoreDb, 'moodEntries'), // Use aliased firestoreDb
            where('userId', '==', auth.currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(1),
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const lastEntry = querySnapshot.docs[0].data();
            setLastMoodEntry({
              ...lastEntry,
              timestamp:
                lastEntry.timestamp?.toDate().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }) +
                ' ' +
                lastEntry.timestamp?.toDate().toLocaleDateString(),
            });
          }
        } catch (error) {
          console.error('Error fetching last mood entry: ', error);
        }
      }
      setLoadingMood(false);
    };

    fetchLastMood();
    // Set a random journal prompt
    setCurrentPrompt(
      journalPrompts[Math.floor(Math.random() * journalPrompts.length)],
    );
  }, []);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const submitMood = async () => {
    if (!selectedMood) {
      Alert.alert('Select Mood', 'Please select a mood before submitting.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to submit your mood.');
      return;
    }
    setSubmittingMood(true);
    try {
      const moodEntry = {
        userId: auth.currentUser.uid,
        mood: selectedMood.name,
        icon: selectedMood.icon,
        color: selectedMood.color,
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(firestoreDb, 'moodEntries'), moodEntry); // Use aliased firestoreDb
      Alert.alert(
        'Mood Logged',
        `You've logged your mood as ${selectedMood.name}.`,
      );
      setLastMoodEntry({
        ...moodEntry,
        timestamp:
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }) +
          ' ' +
          new Date().toLocaleDateString(),
      });
      setSelectedMood(null); // Reset selection
    } catch (error) {
      console.error('Error submitting mood: ', error);
      Alert.alert('Error', 'Could not log your mood. Please try again.');
    } finally {
      setSubmittingMood(false);
    }
  };

  const handleSaveJournalEntry = async (entryText) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to save a journal entry.');
      setJournalModalVisible(false);
      return;
    }
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Cannot save an empty journal entry.');
      return;
    }
    try {
      await addDoc(collection(firestoreDb, 'journalEntries'), {
        userId: auth.currentUser.uid,
        prompt: currentPrompt,
        entry: entryText,
        timestamp: serverTimestamp(),
      });
      Alert.alert('Journal Saved', 'Your journal entry has been saved.');
      // Optionally, refresh prompts or give other feedback
      setCurrentPrompt(
        journalPrompts[Math.floor(Math.random() * journalPrompts.length)],
      );
    } catch (error) {
      console.error('Error saving journal entry: ', error);
      Alert.alert(
        'Error',
        'Could not save your journal entry. Please try again.',
      );
    } finally {
      setJournalModalVisible(false);
    }
  };

  const FeatureCard = ({ title, icon, children, onPress, testID }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
    >
      <View style={styles.cardHeaderContainer}>
        {icon && (
          <Ionicons
            name={icon}
            size={24}
            color={colors.primary}
            style={styles.cardIcon}
          />
        )}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screenContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <Text style={styles.headerTitle}>Your Wellbeing Space</Text>
        <Text style={styles.headerSubtitle}>Take a moment for yourself.</Text>

        <FeatureCard title="Health Monitoring" icon="heart-circle-outline">
          <TouchableOpacity
            style={styles.subFeatureButton}
            onPress={() => navigation.navigate('ActivityTracking')}
            testID="activityTrackingButton"
          >
            <Ionicons name="walk-outline" size={22} color={colors.primary} />
            <Text style={styles.subFeatureText}>Activity Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.subFeatureButton}
            onPress={() => navigation.navigate('SleepTracking')}
            testID="sleepTrackingButton"
          >
            <Ionicons name="moon-outline" size={22} color={colors.primary} />
            <Text style={styles.subFeatureText}>Sleep Insights</Text>
          </TouchableOpacity>
        </FeatureCard>

        <FeatureCard title="How are you feeling?" icon="happy-outline">
          <View style={styles.moodSelectorContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.name}
                style={[
                  styles.moodButton,
                  selectedMood?.name === mood.name && {
                    backgroundColor: mood.color,
                    borderColor: mood.color,
                  }, // Keep dynamic mood color for selection
                  selectedMood?.name === mood.name && styles.selectedMoodButton,
                ]}
                onPress={() => handleMoodSelect(mood)}
              >
                <Ionicons
                  name={mood.icon}
                  size={30}
                  color={selectedMood?.name === mood.name ? '#FFF' : mood.color} // Keep dynamic icon color for selection
                />
                <Text
                  style={[
                    styles.moodText,
                    selectedMood?.name === mood.name && { color: '#FFF' },
                  ]}
                >
                  {mood.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.button, submittingMood && styles.buttonDisabled]}
            onPress={submitMood}
            disabled={submittingMood || !selectedMood}
          >
            {submittingMood ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={styles.buttonText}>Log My Mood</Text>
            )}
          </TouchableOpacity>
          {loadingMood ? (
            <ActivityIndicator
              style={{ marginTop: 10 }}
              color={colors.primary}
            />
          ) : (
            lastMoodEntry && (
              <Text style={styles.lastMoodText}>
                Last entry: {lastMoodEntry.mood} at {lastMoodEntry.timestamp}
              </Text>
            )
          )}
        </FeatureCard>

        <FeatureCard title="Journal Prompt" icon="pencil-outline">
          <Text style={styles.promptText}>{currentPrompt}</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setJournalModalVisible(true)} // Open the modal
          >
            <Text style={styles.secondaryButtonText}>Write in Journal</Text>
          </TouchableOpacity>
        </FeatureCard>

        <FeatureCard title="Quick Mindfulness" icon="leaf-outline">
          <TouchableOpacity
            style={styles.mindfulnessItem}
            onPress={() => navigation.navigate('GuidedBreathing')}
          >
            <Ionicons name="pulse-outline" size={22} color={colors.success} />
            <Text style={styles.mindfulnessText}>Guided Breathing (2 min)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mindfulnessItem}
            onPress={() => navigation.navigate('Meditation')}
          >
            <Ionicons name="headset-outline" size={22} color={colors.info} />
            <Text style={styles.mindfulnessText}>Short Meditation (5 min)</Text>
          </TouchableOpacity>
        </FeatureCard>

        <FeatureCard title="Positive Affirmation" icon="sparkles-outline">
          <Text style={styles.affirmationText}>
            "I am capable and I will succeed today."
          </Text>
        </FeatureCard>
      </ScrollView>
      <JournalEntryModal
        isVisible={isJournalModalVisible}
        onClose={() => setJournalModalVisible(false)}
        onSave={handleSaveJournalEntry}
        promptText={currentPrompt}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    screenContainer: {
      flex: 1,
    },
    scrollContentContainer: {
      paddingBottom: 30,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      paddingHorizontal: 20,
      marginTop: 20,
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.subtext,
      marginBottom: 20,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginHorizontal: 15,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 5,
      elevation: 3,
    },
    cardHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    cardIcon: {
      marginRight: 10,
      // color is set by theme.colors.primary directly in the component
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    moodSelectorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    moodButton: {
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 5,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      minWidth: '30%',
      marginBottom: 10,
      // backgroundColor and icon color are dynamic based on selection and mood.color
    },
    selectedMoodButton: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },
    moodText: {
      fontSize: 13,
      marginTop: 5,
      color: colors.subtext, // Default text color for mood
      // color changes dynamically for selected mood
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonDisabled: {
      backgroundColor: colors.disabled,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },
    lastMoodText: {
      textAlign: 'center',
      marginTop: 15,
      fontSize: 13,
      color: colors.subtext,
    },
    promptText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 15,
      fontStyle: 'italic',
    },
    secondaryButton: {
      backgroundColor: colors.card, // Or theme.colors.secondary if defined and appropriate
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      borderColor: colors.primary,
      borderWidth: 1,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '500',
    },
    mindfulnessItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    mindfulnessText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    affirmationText: {
      fontSize: 17,
      color: colors.primary, // Or a specific affirmation color from theme if added
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
      paddingVertical: 10,
    },
    subFeatureButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background, // Light background for the button itself
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderColor: colors.lightBorder, // Subtle border
      borderWidth: 1,
    },
    subFeatureText: {
      marginLeft: 10,
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
  });

export default WellbeingScreen;
