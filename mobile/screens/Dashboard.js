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

const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#8B5CF6',
  accent: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  success: '#059669',
  gradient: {
    primary: ['#667EEA', '#764BA2'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    blue: ['#3B82F6', '#1D4ED8'],
    purple: ['#8B5CF6', '#7C3AED'],
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
  }
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

      const statsResponse = await axios.get(`${apiUrl}/study-plans/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // Increased timeout to 30 seconds
      });

      setStudyStats(statsResponse.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!studyStats) {
        setError('Failed to load dashboard data. Please check your connection.');
      }
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const user = auth.currentUser;
      console.log('Dashboard - firestore instance:', firestore); // Add this line
      console.log('Dashboard - auth.currentUser:', user); // Add this line

      if (!user) {
        setError('You are not logged in. Please log in again.');
        setLoading(false);
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
          }
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError('Error fetching profile data.');
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
  }, []);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    let unsubscribe;
    const initializeDashboard = async () => {
      unsubscribe = await fetchUserProfile();
      await fetchDashboardData();
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
    await Promise.all([
      fetchUserProfile(),
      fetchDashboardData()
    ]);
    setRefreshing(false);
  }, [fetchUserProfile]);

  const handleCreateStudyPlan = () => {
    navigation.navigate('CreateStudyPlan');
  };

  const handleViewStudyPlans = () => {
    navigation.navigate('StudyPlanList');
  };

  const handleViewAnalytics = () => {
    navigation.navigate('Analytics');
  };

  const handleViewSettings = () => {
    navigation.navigate('SettingsTab'); // Corrected navigation target
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
      icon: 'add-circle',
      title: 'Create Plan',
      subtitle: 'New study plan',
      onPress: handleCreateStudyPlan,
      gradient: COLORS.gradient.primary,
      iconColor: COLORS.primary,
    },
    {
      icon: 'library',
      title: 'Study Plans',
      subtitle: 'View all plans',
      onPress: handleViewStudyPlans,
      gradient: COLORS.gradient.success,
      iconColor: COLORS.accent,
    },
    {
      icon: 'stats-chart',
      title: 'Analytics',
      subtitle: 'Track progress',
      onPress: handleViewAnalytics,
      gradient: COLORS.gradient.blue,
      iconColor: '#3B82F6',
    },
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'Preferences',
      onPress: handleViewSettings,
      gradient: COLORS.gradient.purple,
      iconColor: COLORS.secondary,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !profileData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={COLORS.gradient.primary} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: profileData?.profilePicture || 'https://via.placeholder.com/100'
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{greeting}!</Text>
                <Text style={styles.userName}>
                  {profileData?.name || 'Student'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </View>
        </View>

        {studyStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Overview</Text>
            <View style={styles.progressGrid}>
              <ProgressCard
                title="Active Plans"
                value={studyStats.activePlans || 0}
                total={studyStats.totalPlans || 0}
                percentage={studyStats.totalPlans > 0 ? (studyStats.activePlans / studyStats.totalPlans) * 100 : 0}
                color={COLORS.primary}
                icon="library"
              />
              <ProgressCard
                title="Completed Tasks"
                value={studyStats.completedTasks || 0}
                total={studyStats.totalTasks || 0}
                percentage={studyStats.totalTasks > 0 ? (studyStats.completedTasks / studyStats.totalTasks) * 100 : 0}
                color={COLORS.accent}
                icon="checkmark-circle"
              />
              <ProgressCard
                title="Study Streak"
                value={studyStats.studyStreak || 0}
                total="days"
                percentage={Math.min((studyStats.studyStreak || 0) * 10, 100)}
                color={COLORS.warning}
                icon="flame"
              />
              <ProgressCard
                title="This Week"
                value={studyStats.weeklyProgress || 0}
                total="100"
                percentage={studyStats.weeklyProgress || 0}
                color={COLORS.secondary}
                icon="trending-up"
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Study Plans</Text>
            <TouchableOpacity onPress={handleViewStudyPlans}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Ionicons name="school" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyStateTitle}>Ready to Start Studying?</Text>
            <Text style={styles.emptyStateText}>
              Create your first study plan and begin your learning journey!
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateStudyPlan}>
              <Text style={styles.emptyStateButtonText}>Create Study Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.surface,
    fontFamily: FONTS.regular,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    color: COLORS.surface,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONTS.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginHorizontal: -8,
  },
  quickActionCard: {
    width: (width - 56) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  quickActionGradient: {
    borderRadius: 16,
    padding: 1,
  },
  quickActionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginHorizontal: -8,
  },
  progressCard: {
    width: (width - 56) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 16,
    shadowColor: COLORS.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    flex: 1,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  progressTotal: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
});

export default Dashboard;
