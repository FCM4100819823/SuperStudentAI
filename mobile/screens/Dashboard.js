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
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db as firestore } from '../config/firebase'; // Corrected import path and alias db as firestore
import { doc, onSnapshot } from 'firebase/firestore';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

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
};


const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System-Medium' : 'sans-serif-medium',
  semibold: Platform.OS === 'ios' ? 'System-Semibold' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System-Bold' : 'sans-serif-bold',
};

const QuickActionCard = ({ icon, title, subtitle, onPress, gradient, iconColor }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.9}>
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
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      <Text style={styles.progressPercentage}>{percentage.toFixed(0)}%</Text>
    </View>
  </View>
);

const Dashboard = ({ navigation, route }) => {
  const [profileData, setProfileData] = useState(null);
  const [studyStats, setStudyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');

  const getApiUrl = async () => {
    try {
      return await AsyncStorage.getItem('apiUrl') || 'http://192.168.1.100:3000';
    } catch (error) {
      console.error('Error getting API URL:', error);
      return 'http://192.168.1.100:3000';
    }
  };

  const getAuthToken = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchDashboardData = async () => {
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
      setStudyStats({ completedTasks: 0, upcomingSessions: 0, overallProgress: 0 }); // Placeholder

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!studyStats) { // Keep this check, or adapt if studyStats is always initialized
        setError('Failed to load dashboard data. Please check your connection.');
      }
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You are not logged in. Please log in again.');
        setLoading(false);
        navigation.replace('Login');
        return;
      }

      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfileData(docSnap.data());
          } else {
            setError('User profile not found.');
            // Consider creating a default profile or guiding the user
          }
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError('Error fetching profile data. ' + err.message);
          setLoading(false);
          setRefreshing(false);
        },
      );
      return unsubscribe;
    } catch (err) {
      setError(err.message || 'Failed to load profile data');
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]); // Added navigation to dependency array

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    let unsubscribe;
    const initializeDashboard = async () => {
      setLoading(true); // Ensure loading is true at the start
      unsubscribe = await fetchUserProfile();
      await fetchDashboardData();
      // setLoading(false) is handled within fetchUserProfile and fetchDashboardData error/success paths
    };

    initializeDashboard();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(''); // Clear previous errors
    await Promise.all([
      fetchUserProfile(),
      fetchDashboardData()
    ]);
    // setRefreshing(false) is handled by fetchUserProfile
  }, [fetchUserProfile]);


  const handleCreateStudyPlan = () => {
    // navigation.navigate('CreateStudyPlan'); // To be re-enabled when feature is rebuilt
    Alert.alert("Coming Soon", "The Study Plan feature is currently under reconstruction.");
  };

  const handleViewStudyPlans = () => {
    // navigation.navigate('StudyPlanList'); // To be re-enabled
    Alert.alert("Coming Soon", "The Study Plan feature is currently under reconstruction.");
  };

  const handleViewAnalytics = () => {
    navigation.navigate('Analytics');
  };

  const handleViewSettings = () => {
    navigation.navigate('SettingsTab');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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
      ]
    );
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
      onPress: () => navigation.navigate('FocusTimer'),
      gradient: ['#F9A8D4', '#EC4899'], // Pink gradient
      iconColor: '#EC4899',
    },
  ];

  if (loading && !refreshing) { // Show full screen loader only on initial load
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[STATIC_COLORS.primary]} />}
    >
      <StatusBar barStyle="light-content" backgroundColor={STATIC_COLORS.primaryDark} />
      <LinearGradient
        colors={STATIC_COLORS.gradientPrimary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userNameText}>{profileData?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarContainer}>
            {profileData?.profilePictureUrl ? (
              <Image source={{ uri: profileData.profilePictureUrl }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={40} color={STATIC_COLORS.textOnPrimary} />
            )}
          </TouchableOpacity>
        </View>
        {/* Mood Overview Placeholder - To be implemented */}
        <View style={styles.moodOverviewPlaceholder}>
            <Text style={styles.moodPlaceholderText}>Mood Overview Coming Soon!</Text>
        </View>
      </LinearGradient>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={STATIC_COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Quick Actions Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
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
              percentage={studyStats.totalTasks ? (studyStats.completedTasks / studyStats.totalTasks) * 100 : 0}
              color={STATIC_COLORS.secondary}
              icon="checkmark-done-circle-outline"
            />
            <ProgressCard 
              title="Upcoming Sessions" 
              value={studyStats.upcomingSessions || 0} 
              total={studyStats.totalSessions || 0} // Assuming you might have total sessions
              percentage={studyStats.totalSessions ? (studyStats.upcomingSessions / studyStats.totalSessions) * 100 : 0}
              color={STATIC_COLORS.accent}
              icon="calendar-outline"
            />
          </View>
           <View style={styles.overallProgressContainer}>
             <Text style={styles.overallProgressLabel}>Overall Plan Progress</Text>
            <View style={styles.overallProgressBar}>
                <LinearGradient
                    colors={STATIC_COLORS.gradientPrimary}
                    style={[styles.overallProgressBarFill, { width: `${Math.min(studyStats.overallProgress || 0, 100)}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </View>
            <Text style={styles.overallProgressPercentage}>{(studyStats.overallProgress || 0).toFixed(0)}%</Text>
           </View>
        </View>
      )}
      
      {/* Placeholder for "Overview of Everything" */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Everything Overview</Text>
        <View style={styles.placeholderCard}>
          <Ionicons name="layers-outline" size={48} color={STATIC_COLORS.primaryLight} />
          <Text style={styles.placeholderText}>A comprehensive overview of your activities and insights will be displayed here soon.</Text>
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
    paddingBottom: 30, // Added padding at the bottom
  },
  header: {
    paddingTop: (Platform.OS === 'android' ? StatusBar.currentHeight : 0) + 20,
    paddingHorizontal: 20,
    paddingBottom: 60, // Increased padding to make space for mood overview
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // Space before mood overview
  },
  greetingText: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: STATIC_COLORS.textOnPrimary,
    opacity: 0.8,
  },
  userNameText: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: STATIC_COLORS.textOnPrimary,
  },
  avatarContainer: {
    // Styles for avatar touchable area if needed
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: STATIC_COLORS.textOnPrimary,
  },
  moodOverviewPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)', // Semi-transparent white
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPlaceholderText: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: STATIC_COLORS.textOnPrimary,
    textAlign: 'center',
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
    color: STATIC_COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    backgroundColor: '#FFF0F0', // Light red
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: STATIC_COLORS.danger,
  },
  errorText: {
    color: STATIC_COLORS.danger,
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginLeft: 10,
    flex: 1, // Allow text to wrap
  },
  sectionContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: STATIC_COLORS.text,
    marginBottom: 15,
  },
  quickActionsScroll: {
    paddingRight: 20, // Ensure last card is not cut off
  },
  quickActionCard: {
    width: width * 0.38, // Adjusted width
    height: 170, // Adjusted height
    borderRadius: 20,
    marginRight: 15,
    overflow: 'hidden', // Important for LinearGradient border radius
    elevation: 3,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickActionGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between', // Distribute content
  },
  quickActionContent: {
    alignItems: 'flex-start', // Align icon and text to the start
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 17, // Slightly larger
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 15,
    padding: 15,
    width: (width - 40 - 15) / 2, // 40 for padding, 15 for margin between cards
    elevation: 2,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  progressTitle: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: STATIC_COLORS.textSecondary,
    flex: 1, // Allow text to wrap
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: STATIC_COLORS.text,
  },
  progressTotal: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.textMuted,
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden', // For inner fill
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: STATIC_COLORS.textSecondary,
    marginLeft: 8,
  },
  overallProgressContainer: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 15,
    padding: 15,
    marginTop: 10, // Space from grid cards
    elevation: 2,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  overallProgressLabel: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    color: STATIC_COLORS.text,
    marginBottom: 10,
  },
  overallProgressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: STATIC_COLORS.border,
    overflow: 'hidden',
    marginBottom: 5,
  },
  overallProgressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  overallProgressPercentage: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: STATIC_COLORS.primary,
    alignSelf: 'flex-end',
  },
  placeholderCard: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    elevation: 2,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: STATIC_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 15,
  },
});

export default Dashboard;
