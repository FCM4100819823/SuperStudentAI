import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, differenceInDays } from 'date-fns';

const { width, height } = Dimensions.get('window');

// Design System - Matching FinanceScreen for consistency
const DESIGN_TOKENS = {
  colors: {
    // Primary palette
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#818CF8',
    secondary: '#10B981',
    secondaryDark: '#059669',
    accent: '#F59E0B',
    
    // Neutral palette
    background: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    
    // Text colors
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
      inverse: '#FFFFFF',
    },
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Study-specific colors
    study: {
      active: '#10B981',
      pending: '#F59E0B',
      completed: '#6366F1',
      overdue: '#EF4444',
    },
    
    // Gradients
    gradients: {
      primary: ['#667EEA', '#764BA2'],
      study: ['#667EEA', '#764BA2'],
      success: ['#10B981', '#059669'],
      warm: ['#F093FB', '#F5576C'],
      cool: ['#4FACFE', '#00F2FE'],
    },
    
    // Borders and dividers
    border: '#E2E8F0',
    divider: '#F1F5F9',
    
    // Shadows
    shadow: {
      light: 'rgba(15, 23, 42, 0.04)',
      medium: 'rgba(15, 23, 42, 0.08)',
      strong: 'rgba(15, 23, 42, 0.16)',
    },
  },
  
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      regular: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
      medium: Platform.OS === 'ios' ? 'System-Medium' : 'Roboto-Medium',
      semibold: Platform.OS === 'ios' ? 'System-SemiBold' : 'Roboto-Medium',
      bold: Platform.OS === 'ios' ? 'System-Bold' : 'Roboto-Bold',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

const API_URL = 'http://172.20.10.2:3000';

const StudyScreen = () => {
  const navigation = useNavigation();
  const [studyPlans, setStudyPlans] = useState([]);
  const [studyStats, setStudyStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    completedPlans: 0,
    totalStudyHours: 0,
    weeklyProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  // Fetch study data
  const fetchStudyData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'Please log in to continue.');
        return;
      }
      
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch study plans
      const plansResponse = await axios.get(`${API_URL}/study-plans`, { headers });
      const plans = plansResponse.data.map(plan => ({
        ...plan,
        status: new Date(plan.endDate) < new Date() ? 'completed' : 'active',
        progress: Math.random() * 100, // Replace with actual progress calculation
        daysRemaining: differenceInDays(new Date(plan.endDate), new Date()),
      }));
      
      setStudyPlans(plans);
      
      // Calculate study statistics
      const stats = {
        totalPlans: plans.length,
        activePlans: plans.filter(p => p.status === 'active').length,
        completedPlans: plans.filter(p => p.status === 'completed').length,
        totalStudyHours: plans.reduce((acc, plan) => acc + (plan.totalHours || 0), 0),
        weeklyProgress: Math.round(Math.random() * 100), // Replace with actual calculation
      };
      
      setStudyStats(stats);
    } catch (error) {
      console.error('Error fetching study data:', error);
      Alert.alert('Error', 'Failed to load study data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Animation setup
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudyData();
    }, [fetchStudyData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudyData();
  }, [fetchStudyData]);
  // Navigation helpers
  const navigateToStudyPlans = () => {
    navigation.navigate('StudyPlanListScreen');
  };

  const navigateToCreatePlan = () => {
    navigation.navigate('CreateStudyPlanScreen');
  };

  const navigateToSpacedRepetition = () => {
    navigation.navigate('SpacedRepetitionScreen');
  };

  const navigateToFocusTimer = () => {
    navigation.navigate('FocusTimerScreen');
  };

  const navigateToPlanDetail = (planId) => {
    navigation.navigate('StudyPlanDetailScreen', { planId });
  };

  // Component: Header with gradient
  const renderHeader = () => (
    <LinearGradient
      colors={DESIGN_TOKENS.colors.gradients.study}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={DESIGN_TOKENS.colors.primaryDark} />
      <Animated.View 
        style={[
          styles.headerContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Study Universe</Text>
          <Text style={styles.headerSubtitle}>Master your learning journey</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={navigateToCreatePlan}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={DESIGN_TOKENS.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );

  // Component: Study Statistics Cards
  const renderStatsCards = () => (
    <Animated.View 
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="library" size={24} color={DESIGN_TOKENS.colors.primary} />
          <Text style={styles.statValue}>{studyStats.activePlans}</Text>
          <Text style={styles.statLabel}>Active Plans</Text>
        </View>
        
        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Ionicons name="checkmark-circle" size={24} color={DESIGN_TOKENS.colors.success} />
          <Text style={styles.statValue}>{studyStats.completedPlans}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={[styles.statCard, styles.statCardWarning]}>
          <Ionicons name="time" size={24} color={DESIGN_TOKENS.colors.accent} />
          <Text style={styles.statValue}>{studyStats.totalStudyHours}h</Text>
          <Text style={styles.statLabel}>Study Hours</Text>
        </View>
        
        <View style={[styles.statCard, styles.statCardInfo]}>
          <Ionicons name="trending-up" size={24} color={DESIGN_TOKENS.colors.info} />
          <Text style={styles.statValue}>{studyStats.weeklyProgress}%</Text>
          <Text style={styles.statLabel}>Weekly Goal</Text>
        </View>
      </View>
    </Animated.View>
  );

  // Component: Quick Actions
  const renderQuickActions = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardPrimary]}
          onPress={navigateToStudyPlans}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={DESIGN_TOKENS.colors.gradients.primary}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="library" size={32} color={DESIGN_TOKENS.colors.text.inverse} />
            <Text style={styles.actionTitle}>Study Plans</Text>
            <Text style={styles.actionSubtitle}>Manage & track progress</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardSuccess]}
          onPress={navigateToSpacedRepetition}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={DESIGN_TOKENS.colors.gradients.success}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="brain" size={32} color={DESIGN_TOKENS.colors.text.inverse} />
            <Text style={styles.actionTitle}>Spaced Repetition</Text>
            <Text style={styles.actionSubtitle}>Smart review system</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardWarm]}
          onPress={navigateToFocusTimer}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={DESIGN_TOKENS.colors.gradients.warm}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="timer" size={32} color={DESIGN_TOKENS.colors.text.inverse} />
            <Text style={styles.actionTitle}>Focus Timer</Text>
            <Text style={styles.actionSubtitle}>Pomodoro sessions</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardCool]}
          onPress={navigateToCreatePlan}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={DESIGN_TOKENS.colors.gradients.cool}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add-circle" size={32} color={DESIGN_TOKENS.colors.text.inverse} />
            <Text style={styles.actionTitle}>Create Plan</Text>
            <Text style={styles.actionSubtitle}>Start new study plan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Component: Recent Study Plans
  const renderRecentPlans = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Study Plans</Text>
        <TouchableOpacity onPress={navigateToStudyPlans} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {studyPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={64} color={DESIGN_TOKENS.colors.text.tertiary} />
          <Text style={styles.emptyStateTitle}>No Study Plans Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Create your first study plan to start your learning journey
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={navigateToCreatePlan}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyStateButtonText}>Create Study Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.plansContainer}>
          {studyPlans.slice(0, 3).map((plan) => (
            <TouchableOpacity
              key={plan.id || plan._id}
              style={styles.planCard}
              onPress={() => navigateToPlanDetail(plan.id || plan._id)}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planTitle} numberOfLines={1}>
                    {plan.title}
                  </Text>
                  <Text style={styles.planSubject} numberOfLines={1}>
                    {plan.subject || 'General Studies'}
                  </Text>
                </View>
                <View style={[
                  styles.planStatusBadge,
                  plan.status === 'active' ? styles.statusActive : styles.statusCompleted
                ]}>
                  <Text style={[
                    styles.planStatusText,
                    plan.status === 'active' ? styles.statusActiveText : styles.statusCompletedText
                  ]}>
                    {plan.status === 'active' ? 'Active' : 'Completed'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.planProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${plan.progress || 0}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(plan.progress || 0)}%</Text>
              </View>
              
              <View style={styles.planFooter}>
                <View style={styles.planDate}>
                  <Ionicons name="calendar-outline" size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
                  <Text style={styles.planDateText}>
                    {plan.daysRemaining > 0 
                      ? `${plan.daysRemaining} days left`
                      : plan.daysRemaining === 0 
                        ? 'Due today'
                        : 'Overdue'
                    }
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.primary} />
        <Text style={styles.loadingText}>Loading your study universe...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[DESIGN_TOKENS.colors.primary]}
            tintColor={DESIGN_TOKENS.colors.primary}
          />
        }
      >
        {renderStatsCards()}
        {renderQuickActions()}
        {renderRecentPlans()}
        
        {/* Bottom spacing for better scrolling */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  
  // Header styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    paddingBottom: DESIGN_TOKENS.spacing.lg,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes['3xl'],
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  headerSubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.inverse,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },
  
  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
  },
  
  // Stats styles
  statsContainer: {
    marginTop: -30,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - DESIGN_TOKENS.spacing.md * 2 - DESIGN_TOKENS.spacing.sm) / 2,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    padding: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    alignItems: 'center',
    ...DESIGN_TOKENS.shadows.md,
  },
  statCardPrimary: {
    borderTopWidth: 3,
    borderTopColor: DESIGN_TOKENS.colors.primary,
  },
  statCardSuccess: {
    borderTopWidth: 3,
    borderTopColor: DESIGN_TOKENS.colors.success,
  },
  statCardWarning: {
    borderTopWidth: 3,
    borderTopColor: DESIGN_TOKENS.colors.accent,
  },
  statCardInfo: {
    borderTopWidth: 3,
    borderTopColor: DESIGN_TOKENS.colors.info,
  },
  statValue: {
    fontSize: DESIGN_TOKENS.typography.sizes['2xl'],
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginTop: DESIGN_TOKENS.spacing.sm,
  },
  statLabel: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginTop: DESIGN_TOKENS.spacing.xs,
    textAlign: 'center',
  },
  
  // Section styles
  section: {
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  sectionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.xl,
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  sectionAction: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.primary,
  },
  
  // Actions styles
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - DESIGN_TOKENS.spacing.md * 2 - DESIGN_TOKENS.spacing.sm) / 2,
    height: 120,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.md,
  },
  actionGradient: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
    marginTop: DESIGN_TOKENS.spacing.sm,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.inverse,
    marginTop: DESIGN_TOKENS.spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Plans styles
  plansContainer: {
    marginTop: DESIGN_TOKENS.spacing.sm,
  },
  planCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    padding: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    ...DESIGN_TOKENS.shadows.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  planTitleContainer: {
    flex: 1,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  planTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.lg,
    fontFamily: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  planSubject: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.secondary,
  },
  planStatusBadge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
  },
  statusActive: {
    backgroundColor: `${DESIGN_TOKENS.colors.success}15`,
  },
  statusCompleted: {
    backgroundColor: `${DESIGN_TOKENS.colors.primary}15`,
  },
  planStatusText: {
    fontSize: DESIGN_TOKENS.typography.sizes.xs,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
  },
  statusActiveText: {
    color: DESIGN_TOKENS.colors.success,
  },
  statusCompletedText: {
    color: DESIGN_TOKENS.colors.primary,
  },
  planProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: DESIGN_TOKENS.colors.divider,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
  },
  progressText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planDateText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.tertiary,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing['2xl'],
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.xl,
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginTop: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
  },
  emptyStateButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.inverse,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  loadingText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginTop: DESIGN_TOKENS.spacing.md,
  },
  
  // Utility styles
  bottomSpacing: {
    height: DESIGN_TOKENS.spacing['2xl'],
  },
});

export default StudyScreen;
