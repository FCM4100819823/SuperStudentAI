import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, differenceInDays } from 'date-fns';

const { width, height } = Dimensions.get('window');

// Enhanced Design System - Matching StudyScreen for consistency
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

const API_URL = 'http://192.168.1.10:3000';

const StudyPlanListScreen = () => {
  const navigation = useNavigation();
  const [studyPlans, setStudyPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

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

  const fetchStudyPlans = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'No user logged in.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/study-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const plansWithStatus = response.data.map(plan => ({
        ...plan,
        status: new Date(plan.endDate) < new Date() ? 'completed' : 'active',
        progress: Math.random() * 100,
        daysRemaining: differenceInDays(new Date(plan.endDate), new Date()),
      }));
      setStudyPlans(plansWithStatus);
    } catch (error) {
      console.error('Error fetching study plans:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch study plans. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudyPlans();
    }, [fetchStudyPlans]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudyPlans();
  }, [fetchStudyPlans]);

  const handleDeletePlan = async (planId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'No user logged in. Please log in again.');
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.delete(`${API_URL}/study-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 204) {
        Alert.alert('Success', 'Study plan deleted successfully.');
        fetchStudyPlans();
      } else {
        const errorMessage = response.data?.message || 'Failed to delete study plan. Please try again.';
        Alert.alert('Deletion Failed', errorMessage);
      }
    } catch (error) {
      console.error('Error deleting study plan:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const confirmDelete = (planId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this study plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => handleDeletePlan(planId), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  const filteredPlans = studyPlans.filter(plan => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return plan.status === 'active';
    if (activeFilter === 'completed') return plan.status === 'completed';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return DESIGN_TOKENS.colors.study.active;
      case 'completed':
        return DESIGN_TOKENS.colors.study.completed;
      case 'overdue':
        return DESIGN_TOKENS.colors.study.overdue;
      default:
        return DESIGN_TOKENS.colors.text.tertiary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'play';
      case 'completed':
        return 'checkmark-circle';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const renderStudyPlan = ({ item }) => (
    <Animated.View
      style={[
        styles.planCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('StudyPlanDetailScreen', { planId: item.id })}
        activeOpacity={0.8}
        style={styles.cardTouchable}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.planTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Ionicons name={getStatusIcon(item.status)} size={12} color="#FFFFFF" />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            {item.description && (
              <Text style={styles.planDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>

          <View style={styles.cardContent}>
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${item.progress}%`,
                      backgroundColor: getStatusColor(item.status)
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={14} color={DESIGN_TOKENS.colors.text.tertiary} />
                <Text style={styles.dateText}>
                  {format(parseISO(item.startDate), 'MMM dd')} - {format(parseISO(item.endDate), 'MMM dd')}
                </Text>
              </View>
              
              {item.daysRemaining > 0 && (
                <View style={styles.daysRemaining}>
                  <Text style={styles.daysText}>{item.daysRemaining} days left</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={DESIGN_TOKENS.colors.error} />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Header Component
  const renderHeader = () => (
    <LinearGradient
      colors={DESIGN_TOKENS.colors.gradients.study}
      style={styles.header}
    >
      <StatusBar barStyle="light-content" backgroundColor={DESIGN_TOKENS.colors.primary} />
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Plans</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateStudyPlanScreen')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {studyPlans.length} total plans
        </Text>
      </View>
    </LinearGradient>
  );

  // Filter Tabs Component
  const renderFilterTabs = () => (
    <View style={styles.filtersContainer}>
      {['all', 'active', 'completed'].map((filter) => {
        const count = filter === 'all' ? studyPlans.length : 
                     filter === 'active' ? studyPlans.filter(p => p.status === 'active').length :
                     studyPlans.filter(p => p.status === 'completed').length;
                     
        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter && styles.activeFilterText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
            <View style={[
              styles.filterBadge,
              activeFilter === filter && styles.activeFilterBadge
            ]}>
              <Text style={[
                styles.filterBadgeText,
                activeFilter === filter && styles.activeFilterBadgeText
              ]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Empty State Component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={DESIGN_TOKENS.colors.gradients.study}
        style={styles.emptyIcon}
      >
        <MaterialCommunityIcons name="book-outline" size={48} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {activeFilter === 'all' ? 'No Study Plans Yet' :
         activeFilter === 'active' ? 'No Active Plans' :
         'No Completed Plans'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'all' ? 
          'Create your first study plan to get started on your learning journey!' :
          activeFilter === 'active' ? 
          'Start a new study plan to begin your learning journey!' :
          'Complete some study plans to see them here!'}
      </Text>
      {activeFilter !== 'completed' && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => navigation.navigate('CreateStudyPlanScreen')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={DESIGN_TOKENS.colors.gradients.study}
            style={styles.emptyActionGradient}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={styles.emptyActionIcon} />
            <Text style={styles.emptyActionText}>Create Study Plan</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={DESIGN_TOKENS.colors.gradients.study}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading study plans...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <View style={styles.content}>
        {renderFilterTabs()}

        {filteredPlans.length === 0 ? (
          <ScrollView
            style={styles.emptyContainer}
            contentContainerStyle={styles.emptyContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[DESIGN_TOKENS.colors.primary]}
                tintColor={DESIGN_TOKENS.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredPlans}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStudyPlan}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[DESIGN_TOKENS.colors.primary]}
                tintColor={DESIGN_TOKENS.colors.primary}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.md,
    fontSize: DESIGN_TOKENS.typography.sizes.lg,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DESIGN_TOKENS.spacing.lg,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes['3xl'],
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },

  // Filter Tabs
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    marginHorizontal: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    backgroundColor: DESIGN_TOKENS.colors.surfaceElevated,
  },
  activeFilterTab: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  filterText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginRight: DESIGN_TOKENS.spacing.xs,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: DESIGN_TOKENS.colors.border,
    paddingHorizontal: DESIGN_TOKENS.spacing.xs,
    paddingVertical: 2,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: DESIGN_TOKENS.typography.sizes.xs,
    fontFamily: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.text.tertiary,
  },
  activeFilterBadgeText: {
    color: '#FFFFFF',
  },

  // Study Plan Cards
  listContainer: {
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: DESIGN_TOKENS.spacing.md,
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  planCard: {
    marginBottom: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    ...DESIGN_TOKENS.shadows.md,
  },
  cardTouchable: {
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: DESIGN_TOKENS.spacing.lg,
    position: 'relative',
  },
  cardHeader: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  planTitle: {
    flex: 1,
    fontSize: DESIGN_TOKENS.typography.sizes.lg,
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginRight: DESIGN_TOKENS.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
  },
  statusText: {
    fontSize: DESIGN_TOKENS.typography.sizes.xs,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: '#FFFFFF',
    marginLeft: DESIGN_TOKENS.spacing.xs,
    textTransform: 'capitalize',
  },
  planDescription: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.secondary,
    lineHeight: 20,
  },

  // Card Content
  cardContent: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  progressSection: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
  },
  progressText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: DESIGN_TOKENS.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.xs,
  },
  dateText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.tertiary,
  },
  daysRemaining: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceElevated,
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.sm,
  },
  daysText: {
    fontSize: DESIGN_TOKENS.typography.sizes.xs,
    fontFamily: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
  },

  // Delete Button
  deleteButton: {
    position: 'absolute',
    top: DESIGN_TOKENS.spacing.md,
    right: DESIGN_TOKENS.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing['3xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  emptyTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes['2xl'],
    fontFamily: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  emptySubtitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.regular,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DESIGN_TOKENS.spacing.xl,
  },
  emptyAction: {
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.md,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
  },
  emptyActionIcon: {
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  emptyActionText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontFamily: DESIGN_TOKENS.typography.weights.semibold,
    color: '#FFFFFF',
  },
});

export default StudyPlanListScreen;
