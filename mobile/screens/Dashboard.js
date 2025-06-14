import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Animated, // Added Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Added import from react-native-safe-area-context
import { signOut } from 'firebase/auth';
import { auth, db as firestoreDb } from '../config/firebase'; // Corrected import path and alias db as firestoreDb
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore'; // Added collection, query, where, orderBy, limit, getDocs
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const { width, height } = Dimensions.get('window');

// Define studyTips outside the component to ensure it's stable
const studyTips = [
  'Break down large tasks into smaller, manageable ones.',
  'Schedule regular study breaks to stay focused and avoid burnout.',
  'Test yourself regularly on material to reinforce learning.',
  "Teach what you've learned to someone else to solidify your understanding.",
  'Stay hydrated and get enough sleep; they are crucial for cognitive function.',
  'Find a quiet study space free from distractions to maximize concentration.',
  'Use active recall and spaced repetition techniques for better memory retention.',
  'Set specific, measurable, achievable, relevant, and time-bound (SMART) goals.',
  "Don't be afraid to ask for help from teachers, tutors, or classmates.",
  'Reward yourself for achieving study milestones to stay motivated.',
];

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
  background: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  border: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.05)',
  gradientPrimary: ['#6A1B9A', '#4A0072'], // Deep Purple Gradient
  gradientSecondary: ['#4CAF50', '#388E3C'], // Green Gradient
  // Mood specific colors (can be overridden by mood entry color)
  moodHappy: '#FFD700',
  moodCalm: '#87CEEB',
  moodOkay: '#90EE90',
  moodSad: '#A9A9A9',
  moodStressed: '#FFA07A',
  // Updated Colors for "Your Day At a Glance" cards
  overviewTaskCard: ['#6D55F7', '#5438DC'], // Vibrant Blue/Purple
  overviewCalendarCard: ['#10B981', '#059669'], // Emerald Green
  overviewTipCard: ['#F59E0B', '#D97706'], // Amber/Orange
};

const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System-Medium' : 'sans-serif-medium',
  semibold: Platform.OS === 'ios' ? 'System-Semibold' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System-Bold' : 'sans-serif-bold',
};

const QuickActionCard = ({
  icon,
  title,
  subtitle,
  onPress,
  gradient,
  iconColor,
}) => (
  <TouchableOpacity
    style={styles.quickActionCard}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <LinearGradient colors={gradient} style={styles.quickActionGradient}>
      <View style={styles.quickActionContent}>
        <View style={[styles.quickActionIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const ProgressCard = ({ title, value, total, percentage, color, icon }) => (
  <View style={styles.progressCard}>
    <View style={styles.progressHeader}>
      <View style={[styles.progressIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.progressTitle}>{title}</Text>
    </View>
    <View style={styles.progressContent}>
      <Text style={styles.progressValue}>{value}</Text>
      <Text style={styles.progressTotal}>/ {total}</Text>
    </View>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { backgroundColor: `${color}20` }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.progressPercentage}>{percentage.toFixed(0)}%</Text>
    </View>
  </View>
);

const Dashboard = ({ route }) => {
  // Removed navigation from props, will use useNavigation hook
  const navigation = useNavigation(); // Added for FAB navigation
  const currentUser = auth.currentUser;
  const [profileData, setProfileData] = useState(null);
  const [studyStats, setStudyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentMood, setCurrentMood] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [currentStudyTip, setCurrentStudyTip] = useState('');

  // Animated values for "Your Day At a Glance" cards
  const [taskCardAnim] = useState(new Animated.ValueXY({ x: 0, y: 50 })); // y for slide, x for opacity
  const [calendarCardAnim] = useState(new Animated.ValueXY({ x: 0, y: 50 }));
  const [tipCardAnim] = useState(new Animated.ValueXY({ x: 0, y: 50 }));
  const [animationsDone, setAnimationsDone] = useState(false);

  const getRandomTip = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * studyTips.length);
    setCurrentStudyTip(studyTips[randomIndex]);
  }, []); // studyTips is stable and defined outside, so empty dependency array is correct.

  const getApiUrl = useCallback(async () => {
    try {
      return (
        (await AsyncStorage.getItem('apiUrl')) || 'http://192.168.1.100:3000'
      );
    } catch (error) {
      console.error('Error getting API URL:', error);
      return 'http://192.168.1.100:3000';
    }
  }, []);

  const getAuthToken = useCallback(async () => {
    try {
      if (currentUser) {
        return await currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }, [currentUser?.uid]); // MODIFIED: Depend on currentUser?.uid

  const fetchDashboardData = useCallback(async () => {
    try {
      const apiUrl = await getApiUrl();
      const token = await getAuthToken();

      if (!token) {
        setError('Authentication required');
        return;
      }

      // Temporarily commenting out studyStats fetching as the feature is being rebuilt
      // const statsResponse = await axios.get(`${apiUrl}/study-plans/stats/overview`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   timeout: 30000,
      // });
      // setStudyStats(statsResponse.data);
      setStudyStats({
        completedTasks: 0,
        upcomingSessions: 0,
        overallProgress: 0,
      }); // Placeholder
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
    }
  }, [getApiUrl, getAuthToken]); // getAuthToken is now more stable

  const fetchUserProfile = useCallback(async () => {
    try {
      if (!currentUser?.uid) {
        // Check uid directly
        setError('User not available. Cannot fetch profile.');
        setProfileData(null);
        setLoading(false);
        setRefreshing(false);
        // navigation.replace('Login'); // REMOVED: AppNavigator handles this
        return () => {}; // Return an empty unsubscribe function
      }

      const userDocRef = doc(firestoreDb, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfileData(docSnap.data());
            setError(''); // Clear error on success
          } else {
            setError('User profile not found.');
            setProfileData(null);
          }
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('Firestore error in fetchUserProfile:', err);
          setError('Error fetching profile data. ' + err.message);
          setProfileData(null);
          setLoading(false);
          setRefreshing(false);
        },
      );
      return unsubscribe;
    } catch (err) {
      console.error('Error in fetchUserProfile setup:', err);
      setError(err.message || 'Failed to load profile data');
      setProfileData(null);
      setLoading(false);
      setRefreshing(false);
      return () => {}; // Return an empty unsubscribe function for consistency
    }
  }, [currentUser?.uid, firestoreDb]); // MODIFIED: Removed navigation, using currentUser.uid

  const fetchCurrentMood = useCallback(async () => {
    // const user = auth.currentUser; // Use captured currentUser
    if (!currentUser) {
      return;
    }
    try {
      const q = query(
        collection(firestoreDb, 'moodEntries'),
        where('userId', '==', currentUser.uid), // Use currentUser.uid
        orderBy('timestamp', 'desc'),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const moodDoc = querySnapshot.docs[0].data();
        setCurrentMood({
          ...moodDoc,
          timestamp: moodDoc.timestamp?.toDate(),
        });
      } else {
        setCurrentMood(null);
      }
    } catch (err) {
      console.error('Error fetching current mood:', err);
    }
  }, [currentUser?.uid, firestoreDb]); // Use currentUser.uid

  const fetchUpcomingTasks = useCallback(async () => {
    // const user = auth.currentUser; // Use captured currentUser
    if (!currentUser) {
      return;
    }
    try {
      const tasksQuery = query(
        collection(firestoreDb, 'tasks'),
        where('userId', '==', currentUser.uid), // Use currentUser.uid
        where('status', '!=', 'completed'),
        orderBy('status'),
        orderBy('dueDate', 'asc'),
        limit(3),
      );
      const querySnapshot = await getDocs(tasksQuery);
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUpcomingTasks(tasks);
    } catch (err) {
      console.error('Error fetching upcoming tasks:', err);
    }
  }, [currentUser?.uid, firestoreDb]); // Use currentUser.uid

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    let unsubscribeProfile = () => {}; // Initialize with an empty function

    const initializeDashboard = async () => {
      setLoading(true);
      setError('');
      getRandomTip();

      // fetchUserProfile will handle the case where currentUser or currentUser.uid is null/undefined
      unsubscribeProfile = await fetchUserProfile();

      // Only fetch other data if currentUser is valid.
      // fetchUserProfile handles setting profileData and its own loading/refreshing states.
      if (currentUser?.uid) {
        await Promise.all([
          fetchDashboardData(),
          fetchCurrentMood(),
          fetchUpcomingTasks(),
        ]);
      }
      // setLoading(false) is primarily handled by fetchUserProfile\\\'s onSnapshot callback.
      // If the Promise.all above takes significant time, the UI might show "loaded"
      // (from profile fetch) while these are still pending. This is a common pattern.

      // Start animations after initial data load attempt (loading might still be true due to onSnapshot)
      // We will trigger animations more reliably when `loading` becomes false.
    };

    initializeDashboard();

    return () => {
      if (typeof unsubscribeProfile === 'function') {
        unsubscribeProfile();
      }
    };
    // REMOVED profileData from the dependency array to prevent the infinite loop.
    // The onSnapshot within fetchUserProfile handles reactivity for profileData changes.
  }, [
    currentUser?.uid,
    fetchUserProfile,
    fetchDashboardData,
    fetchCurrentMood,
    fetchUpcomingTasks,
    getRandomTip,
  ]);

  // Effect to run animations when loading is complete
  useEffect(() => {
    if (!loading && !animationsDone) {
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(taskCardAnim.y, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(taskCardAnim.x, {
            // Using x for opacity
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(calendarCardAnim.y, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(calendarCardAnim.x, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tipCardAnim.y, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(tipCardAnim.x, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setAnimationsDone(true); // Ensure animations run only once per load
      });
    }
  }, [loading, animationsDone, taskCardAnim, calendarCardAnim, tipCardAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    getRandomTip();

    // Re-fetch profile first
    const unsubscribe = await fetchUserProfile(); // fetchUserProfile will setRefreshing(false)

    if (currentUser?.uid) {
      await Promise.all([
        fetchDashboardData(),
        fetchCurrentMood(),
        fetchUpcomingTasks(),
      ]);
    }
    // Ensure unsubscribe is called if component unmounts during refresh, though less critical here.
    // setRefreshing(false) is handled by fetchUserProfile's onSnapshot
    return () => {
      // Allow cleanup if onRefresh itself is part of a hook that cleans up
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [
    currentUser?.uid,
    fetchUserProfile,
    fetchDashboardData,
    fetchCurrentMood,
    fetchUpcomingTasks,
    getRandomTip,
  ]);

  const handleCreateStudyPlan = () => {
    navigation.navigate('CreateStudyPlan'); // Navigate to CreateStudyPlanScreen
  };

  const handleViewStudyPlans = () => {
    navigation.navigate('StudyPlanList'); // Ensure StudyPlanList screen is in a navigator
  };

  const handleViewAnalytics = () => {
    navigation.navigate('Analytics');
  };

  const handleViewSettings = () => {
    navigation.navigate('SettingsTab');
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.replace('Login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const quickActions = [
    {
      icon: 'add-circle-outline', // Changed icon
      title: 'New Plan', // Simplified title
      subtitle: 'Create a study schedule',
      onPress: handleCreateStudyPlan,
      gradient: STATIC_COLORS.gradientSecondary, // Use green gradient
      iconColor: STATIC_COLORS.secondary,
    },
    {
      icon: 'library-outline', // Changed icon
      title: 'My Plans', // Simplified title
      subtitle: 'View your study plans',
      onPress: handleViewStudyPlans,
      gradient: STATIC_COLORS.gradientPrimary, // Use purple gradient
      iconColor: STATIC_COLORS.primary,
    },
    {
      icon: 'stats-chart-outline', // Changed icon
      title: 'Progress', // Simplified title
      subtitle: 'Track your achievements',
      onPress: handleViewAnalytics,
      gradient: [STATIC_COLORS.accent, '#FBBF24'], // Amber gradient
      iconColor: STATIC_COLORS.accent,
    },
    {
      icon: 'settings-outline', // Changed icon
      title: 'Settings',
      subtitle: 'App preferences',
      onPress: handleViewSettings,
      gradient: [STATIC_COLORS.textSecondary, STATIC_COLORS.textMuted], // Neutral gradient
      iconColor: STATIC_COLORS.textSecondary,
    },
    {
      icon: 'happy-outline',
      title: 'Wellbeing',
      subtitle: 'Mood & Focus',
      onPress: () => navigation.navigate('Wellbeing'),
      gradient: ['#22D3EE', '#06B6D4'], // Cyan gradient
      iconColor: '#06B6D4',
    },
    {
      icon: 'timer-outline',
      title: 'Focus Timer',
      subtitle: 'Stay concentrated',
      onPress: () => navigation.navigate('FocusTimer'), // Corrected: Navigate directly to FocusTimerScreen
      gradient: ['#F9A8D4', '#EC4899'], // Pink gradient
      iconColor: '#EC4899',
    },
  ];

  if (loading && !refreshing) {
    // Show full screen loader only on initial load
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error && !profileData) {
    // Show error if profile data failed to load and there's an error message
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Fallback if profileData is null but no specific error message (e.g. user not found but not an API error)
  if (!profileData) {
    return (
      <SafeAreaView style={styles.centeredLoader}>
        <Text style={styles.errorText}>
          Could not load profile. Please try logging out and back in.
        </Text>
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.retryButton, { marginTop: 20 }]}
        >
          <Text style={styles.retryButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    // <LinearGradient
    //   colors={STATIC_COLORS.gradientPrimary} // Using Deep Purple Gradient
    //   style={styles.container}
    // >
    <View style={styles.container}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
        backgroundColor={STATIC_COLORS.primaryDark}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[STATIC_COLORS.primary]}
            />
          }
        >
          <LinearGradient
            colors={STATIC_COLORS.gradientPrimary}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.greetingText}>{greeting},</Text>
                <Text style={styles.userNameText}>
                  {profileData?.name || 'User'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={styles.avatarContainer}
              >
                {profileData?.profilePictureUrl ? (
                  <Image
                    source={{ uri: profileData.profilePictureUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color={STATIC_COLORS.textOnPrimary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Mood Overview Section */}
            <View style={styles.moodOverviewContainer}>
              {currentMood ? (
                <View style={styles.moodContent}>
                  <Ionicons
                    name={currentMood.icon || 'happy-outline'}
                    size={28}
                    color={currentMood.color || STATIC_COLORS.textOnPrimary}
                    style={styles.moodIcon}
                  />
                  <View style={styles.moodTextContainer}>
                    <Text style={styles.moodText}>
                      Current Mood:{' '}
                      <Text
                        style={{
                          fontWeight: 'bold',
                          color:
                            currentMood.color || STATIC_COLORS.textOnPrimary,
                        }}
                      >
                        {currentMood.mood}
                      </Text>
                    </Text>
                    <Text style={styles.moodTimestampText}>
                      Logged:{' '}
                      {currentMood.timestamp?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {currentMood.timestamp?.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.moodContent}>
                  <Ionicons
                    name="sparkles-outline"
                    size={28}
                    color={STATIC_COLORS.textOnPrimary}
                    style={styles.moodIcon}
                  />
                  <View style={styles.moodTextContainer}>
                    <Text style={styles.moodText}>
                      No mood logged recently.
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Wellbeing')}
                    >
                      <Text style={styles.logMoodPromptText}>
                        Log your mood now?
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={STATIC_COLORS.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Quick Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  icon={action.icon}
                  title={action.title}
                  subtitle={action.subtitle}
                  onPress={action.onPress}
                  gradient={action.gradient}
                  iconColor={action.iconColor}
                />
              ))}
            </ScrollView>
          </View>

          {/* Study Stats Section - Placeholder for now */}
          {studyStats && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Study Progress</Text>
              <View style={styles.statsGrid}>
                <ProgressCard
                  title="Completed Tasks"
                  value={studyStats.completedTasks || 0}
                  total={studyStats.totalTasks || 0}
                  percentage={
                    studyStats.totalTasks
                      ? (studyStats.completedTasks / studyStats.totalTasks) *
                        100
                      : 0
                  }
                  color={STATIC_COLORS.secondary}
                  icon="checkmark-done-circle-outline"
                />
                <ProgressCard
                  title="Upcoming Sessions"
                  value={studyStats.upcomingSessions || 0}
                  total={studyStats.totalSessions || 0} // Assuming you might have total sessions
                  percentage={
                    studyStats.totalSessions
                      ? (studyStats.upcomingSessions /
                          studyStats.totalSessions) *
                        100
                      : 0
                  }
                  color={STATIC_COLORS.accent}
                  icon="calendar-outline"
                />
              </View>
              <View style={styles.overallProgressContainer}>
                <Text style={styles.overallProgressLabel}>
                  Overall Plan Progress
                </Text>
                <View style={styles.overallProgressBar}>
                  <LinearGradient
                    colors={STATIC_COLORS.gradientPrimary}
                    style={[
                      styles.overallProgressBarFill,
                      {
                        width: `${Math.min(studyStats.overallProgress || 0, 100)}%`,
                      },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.overallProgressPercentage}>
                  {(studyStats.overallProgress || 0).toFixed(0)}%
                </Text>
              </View>
            </View>
          )}

          {/* Placeholder for "Overview of Everything" */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Day At a Glance</Text>

            {/* Upcoming Tasks Card */}
            <Animated.View
              style={{
                opacity: taskCardAnim.x,
                transform: [{ translateY: taskCardAnim.y }],
              }}
            >
              <LinearGradient
                colors={STATIC_COLORS.overviewTaskCard}
                style={[styles.overviewCard, styles.overviewCardShadow]}
              >
                <View style={styles.overviewCardHeader}>
                  <Ionicons
                    name="list-circle-outline"
                    size={28}
                    color={STATIC_COLORS.textOnPrimary}
                  />
                  <Text style={styles.overviewCardTitle}>Upcoming Tasks</Text>
                </View>
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.overviewItem}
                      onPress={() =>
                        navigation.navigate('TaskManager', {
                          screen: 'AddTask',
                          params: { task: task },
                        })
                      } // Navigate to task details or edit
                    >
                      <Ionicons
                        name="chevron-forward-circle-outline"
                        size={20}
                        color={STATIC_COLORS.textOnPrimary}
                        style={styles.overviewItemIcon}
                      />
                      <View style={styles.overviewItemTextContainer}>
                        <Text
                          style={[
                            styles.overviewItemTextPrimary,
                            styles.textOnOverviewCard,
                          ]}
                        >
                          {task.title}
                        </Text>
                        {task.dueDate && (
                          <Text
                            style={[
                              styles.overviewItemTextSecondary,
                              styles.textOnOverviewCardMuted,
                            ]}
                          >
                            Due:{' '}
                            {new Date(
                              task.dueDate.seconds * 1000,
                            ).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.overviewItem}>
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={20}
                      color={STATIC_COLORS.textOnPrimary}
                      style={styles.overviewItemIcon}
                    />
                    <Text
                      style={[
                        styles.overviewItemTextPrimary,
                        styles.textOnOverviewCard,
                      ]}
                    >
                      No pressing tasks. Well done!
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Study', { screen: 'TaskManager' })
                  }
                  style={[styles.viewAllButton, styles.viewAllButtonTasks]}
                >
                  <Text style={styles.viewAllButtonText}>View All Tasks</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Calendar Events Placeholder Card */}
            <Animated.View
              style={{
                opacity: calendarCardAnim.x,
                transform: [{ translateY: calendarCardAnim.y }],
              }}
            >
              <LinearGradient
                colors={STATIC_COLORS.overviewCalendarCard}
                style={[styles.overviewCard, styles.overviewCardShadow]}
              >
                <View style={styles.overviewCardHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={28}
                    color={STATIC_COLORS.textOnPrimary}
                  />
                  <Text style={styles.overviewCardTitle}>Calendar Events</Text>
                </View>
                <View style={styles.overviewItem}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={STATIC_COLORS.textOnPrimary}
                    style={styles.overviewItemIcon}
                  />
                  <Text
                    style={[
                      styles.overviewItemTextPrimary,
                      styles.textOnOverviewCard,
                    ]}
                  >
                    Device calendar integration coming soon!
                  </Text>
                </View>
                {/* <TouchableOpacity onPress={() => {}} style={[styles.viewAllButton, styles.viewAllButtonCalendar]}>
                   <Text style={styles.viewAllButtonText}>Open Calendar</Text>
                 </TouchableOpacity> */}
              </LinearGradient>
            </Animated.View>

            {/* Study Tip Card */}
            {currentStudyTip && (
              <Animated.View
                style={{
                  opacity: tipCardAnim.x,
                  transform: [{ translateY: tipCardAnim.y }],
                }}
              >
                <LinearGradient
                  colors={STATIC_COLORS.overviewTipCard}
                  style={[styles.overviewCard, styles.overviewCardShadow]}
                >
                  <View style={styles.overviewCardHeader}>
                    <Ionicons
                      name="bulb-outline"
                      size={28}
                      color={STATIC_COLORS.textOnPrimary}
                    />
                    <Text style={styles.overviewCardTitle}>Study Tip</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Ionicons
                      name="star-outline"
                      size={20}
                      color={STATIC_COLORS.textOnPrimary}
                      style={styles.overviewItemIcon}
                    />
                    <Text
                      style={[
                        styles.overviewItemTextPrimary,
                        styles.textOnOverviewCard,
                      ]}
                    >
                      {currentStudyTip}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={getRandomTip}
                    style={[styles.viewAllButton, styles.viewAllButtonTip]}
                  >
                    <Text style={styles.viewAllButtonText}>
                      Get Another Tip
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      {/* </LinearGradient> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC_COLORS.primary, // Added fallback background color
  },
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    // New style to wrap ScrollView and FAB
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add padding for Android status bar when using SafeAreaView like this
  },
  screen: {
    flex: 1,
    // backgroundColor is inherited or can be set to transparent if screenContainer has it
    // paddingTop: Platform.OS === 'ios' ? 20 : 0, // Basic notch handling, SafeAreaView is better
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    // borderBottomWidth: 1,
    // borderBottomColor: STATIC_COLORS.border,
    // elevation: 4, // Android shadow
    // shadowColor: STATIC_COLORS.shadow,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: STATIC_COLORS.textOnPrimary,
  },
  userNameText: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.textOnPrimary,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: STATIC_COLORS.textOnPrimary,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  moodOverviewContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: STATIC_COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STATIC_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  moodTextContainer: {
    flexDirection: 'column',
  },
  moodText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.text,
  },
  moodTimestampText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.text,
  },
  logMoodPromptText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.accent,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: STATIC_COLORS.danger,
    margin: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.textOnPrimary,
    marginLeft: 10,
  },
  sectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: STATIC_COLORS.surface,
    padding: 15,
    elevation: 2,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semibold,
    color: STATIC_COLORS.text,
    marginBottom: 10,
  },
  quickActionsScroll: {
    paddingVertical: 10,
  },
  quickActionCard: {
    width: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    elevation: 2,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quickActionGradient: {
    padding: 15,
    borderRadius: 10,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.textOnPrimary,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.textOnPrimary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressCard: {
    flex: 1,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: STATIC_COLORS.surface,
    padding: 15,
    elevation: 2,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.text,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  progressValue: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: STATIC_COLORS.text,
    marginRight: 5,
  },
  progressTotal: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.textMuted,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: STATIC_COLORS.textMuted,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  overallProgressContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  overallProgressLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.text,
    marginBottom: 5,
  },
  overallProgressBar: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    backgroundColor: STATIC_COLORS.textMuted,
    overflow: 'hidden',
  },
  overallProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  overallProgressPercentage: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.text, // Changed from textMuted for better visibility
    marginTop: 4,
  },
  overviewCard: {
    borderRadius: 15, // Increased border radius
    // overflow: 'hidden', // Keep this if you don\'t want shadow to be clipped by gradient, but might clip shadow itself
    marginBottom: 20, // Increased margin
    // elevation: 0, // Remove default elevation if using custom shadow
    // shadowColor: STATIC_COLORS.shadow, // Moved to overviewCardShadow
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
  },
  overviewCardShadow: {
    // New style for consistent shadow
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 }, // Slightly increased offset for depth
    shadowOpacity: 0.2, // Adjusted opacity
    shadowRadius: 5, // Adjusted radius
    elevation: 5, // For Android
    backgroundColor: STATIC_COLORS.surface, // Important for iOS shadow rendering on gradients
  },
  overviewCardHeader: {
    paddingVertical: 15, // Adjusted padding
    paddingHorizontal: 20, // Adjusted padding
    // backgroundColor: STATIC_COLORS.primary, // Removed, as LinearGradient provides background
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 15, // Match card border radius
    borderTopRightRadius: 15, // Match card border radius
  },
  overviewCardTitle: {
    fontSize: 18, // Increased font size
    fontFamily: FONTS.semibold,
    color: STATIC_COLORS.textOnPrimary,
    marginLeft: 12, // Adjusted margin
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Adjusted padding
    paddingHorizontal: 20, // Adjusted padding
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)', // Lighter border for dark cards
  },
  overviewItemIcon: {
    // width: 24, // Removed, let icon size dictate
    // height: 24, // Removed
    // borderRadius: 12, // Removed
    // justifyContent: 'center', // Removed
    // alignItems: 'center', // Removed
    marginRight: 12, // Adjusted margin
    // color is set directly in the JSX
  },
  overviewItemTextContainer: {
    flex: 1,
  },
  overviewItemTextPrimary: {
    fontSize: 15, // Adjusted font size
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.textOnPrimary, // Default to textOnPrimary
  },
  overviewItemTextSecondary: {
    fontSize: 13, // Adjusted font size
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.7)', // Lighter secondary text for dark cards
  },
  textOnOverviewCard: {
    // Specific style for primary text on these cards
    color: STATIC_COLORS.textOnPrimary,
  },
  textOnOverviewCardMuted: {
    // Specific style for muted text on these cards
    color: 'rgba(255, 255, 255, 0.7)',
  },
  viewAllButton: {
    marginTop: 15, // Adjusted margin
    marginHorizontal: 20, // Added horizontal margin
    marginBottom: 15, // Added bottom margin
    paddingVertical: 12, // Adjusted padding
    borderRadius: 10, // Increased border radius
    // backgroundColor: STATIC_COLORS.secondary, // Removed, will use specific colors
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Added border for definition
    borderColor: 'rgba(255, 255, 255, 0.5)', // Light border
  },
  viewAllButtonTasks: {
    // Specific style for tasks button
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly transparent white
  },
  viewAllButtonCalendar: {
    // Specific style for calendar button
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewAllButtonTip: {
    // Specific style for tip button
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: STATIC_COLORS.textOnPrimary,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: STATIC_COLORS.text,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: STATIC_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    right: 30,
    bottom: 30,
    elevation: 8,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default Dashboard;
