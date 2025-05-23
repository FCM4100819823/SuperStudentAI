import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig'; // Assuming this is your primary firebase export
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define static colors and fonts directly or import from a non-theme style utility
const STATIC_COLORS = {
  background: '#F0F4F8', // Light grey-blue
  surface: '#FFFFFF', // White
  primary: '#6A11CB', // Deep Purple
  secondary: '#2575FC', // Vibrant Blue
  text: '#1A2B4D', // Dark Blue/Black
  subtext: '#5A6B7C', // Greyish Blue
  placeholder: '#A0A0A0', // Medium Grey
  border: '#E0E6F0', // Light Grey
  accent: '#FFD700', // Gold
  success: '#28A745', // Green
  error: '#D32F2F', // Red
  gradientStart: '#6A11CB',
  gradientEnd: '#2575FC',
  card: '#FFFFFF',
  icon: '#1A2B4D',
  headerText: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};


const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const QUICK_ACTION_SIZE = width * 0.2;

const HomeScreen = () => {
  const navigation = useNavigation();
  const colors = STATIC_COLORS; // USE STATIC
  const fonts = STATIC_FONTS; // USE STATIC
  const styles = getStyles(colors, fonts);

  const [userName, setUserName] = useState('Student');
  const [profilePic, setProfilePic] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentPlans, setRecentPlans] = useState([]);
  const [motivationalQuote, setMotivationalQuote] = useState({ text: "Loading quote...", author: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserName(userData.name || currentUser.displayName || 'Student');
        setProfilePic(userData.profilePicture || null);
      } else {
        setUserName(currentUser.displayName || 'Student');
      }
    }
  };

  const fetchUpcomingEvents = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const eventsRef = collection(db, 'events');
      const qEvents = query(eventsRef, where('userId', '==', currentUser.uid), orderBy('date', 'asc'), limit(5));
      const eventsSnap = await getDocs(qEvents);
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingEvents(events);
    }
  };

  const fetchRecentStudyPlans = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const studyPlansRef = collection(db, 'studyPlans');
      const qPlans = query(studyPlansRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(5));
      const plansSnap = await getDocs(qPlans);
      const plans = plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentPlans(plans);
    }
  };

  const fetchMotivationalQuote = async () => {
    // This could be an API call or from a static list
    const quotes = [
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "Your limitation—it's only your imagination.", author: "" },
      { text: "Push yourself, because no one else is going to do it for you.", author: "" },
      { text: "Great things never come from comfort zones.", author: "" },
      { text: "Dream it. Wish it. Do it.", author: "" },
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchUpcomingEvents(),
        fetchRecentStudyPlans(),
        fetchMotivationalQuote(),
      ]);
    } catch (error) {
      console.error("Error loading home screen data:", error);
      Alert.alert("Error", "Could not load all data. Please try again.");
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Optional cleanup
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.greetingText}>Hello, {userName}!</Text>
        <Text style={styles.welcomeText}>Ready to ace your studies?</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profilePicButton}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.profilePic} />
        ) : (
          <Ionicons name="person-circle-outline" size={50} color={colors.placeholder} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('CreateStudyPlan')}>
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} style={styles.quickActionIcon} />
        <Text style={styles.quickActionText}>New Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('TaskList')}>
        <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} style={styles.quickActionIcon} />
        <Text style={styles.quickActionText}>Tasks</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('FocusTimer')}>
        <MaterialCommunityIcons name="timer-sand" size={24} color={colors.primary} style={styles.quickActionIcon} />
        <Text style={styles.quickActionText}>Focus</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('EventList')}>
        <Ionicons name="calendar-outline" size={24} color={colors.primary} style={styles.quickActionIcon} />
        <Text style={styles.quickActionText}>Events</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUpcomingEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event) => (
          <View key={event.id} style={[styles.card, styles.eventCard]}>
            <Text style={styles.cardTitle}>{event.title}</Text>
            <Text style={styles.cardText}>{event.description}</Text>
            <Text style={styles.cardDate}>{new Date(event.date).toLocaleDateString()}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No upcoming events found.</Text>
        </View>
      )}
    </View>
  );

  const renderRecentStudyPlans = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Study Plans</Text>
      {recentPlans.length > 0 ? (
        recentPlans.map((plan) => (
          <View key={plan.id} style={[styles.card, styles.studyPlanCard]}>
            <Text style={styles.cardTitle}>{plan.name}</Text>
            <Text style={styles.cardText}>{plan.description}</Text>
            <Text style={styles.cardDate}>{new Date(plan.createdAt).toLocaleDateString()}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No recent study plans found.</Text>
        </View>
      )}
    </View>
  );

  const renderMotivationalQuote = () => (
    <View style={styles.motivationalQuoteContainer}>
      <Text style={styles.quoteText}>"{motivationalQuote.text}"</Text>
      {motivationalQuote.author ? (
        <Text style={styles.quoteAuthor}>- {motivationalQuote.author}</Text>
      ) : null}
    </View>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradientBackground}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.surface} />}
      >
        {renderHeader()}
        {renderQuickActions()}
        {renderMotivationalQuote()}
        {renderUpcomingEvents()}
        {renderRecentStudyPlans()}
      </ScrollView>
    </LinearGradient>
  );
};

const getStyles = (colors, fonts) => StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background, // Use a solid background for loading
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 50, // Adjust for status bar
    paddingBottom: 20,
  },
  headerTextContainer: {
    maxWidth: '80%',
  },
  greetingText: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.headerText, // Ensure this is light for gradient
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.headerText, // Ensure this is light for gradient
    opacity: 0.9,
  },
  profilePicButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface, // Fallback color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface, // White border
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  profilePic: {
    width: '100%',
    height: '100%',
    borderRadius: 23, // Slightly less than button for border effect
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.headerText, // Light text on gradient
    marginBottom: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10, // Added margin for spacing
  },
  quickActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Translucent white
    width: QUICK_ACTION_SIZE,
    height: QUICK_ACTION_SIZE,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, // Add padding for icon and text
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  quickActionIcon: {
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.headerText,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: CARD_WIDTH,
    alignSelf: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  eventCard: {
    // Specific styles for event card if needed, inherits from card
  },
  studyPlanCard: {
    // Specific styles for study plan card, inherits from card
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.subtext,
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.secondary,
    marginTop: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly transparent for gradient
    borderRadius: 15,
    marginHorizontal: 20, // Match card horizontal alignment
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.headerText, // Light text
    opacity: 0.8,
  },
  motivationalQuoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Translucent white
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quoteText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.headerText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.headerText,
    opacity: 0.8,
  },
});

export default HomeScreen;
