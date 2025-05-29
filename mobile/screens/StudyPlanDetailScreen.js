import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { auth } from '../config/firebase';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress'; // Using react-native-progress for progress bar

// Consistent Design Tokens (can be imported from a shared file)
const DESIGN_TOKENS = {
  colors: {
    primary: '#6366F1', // Indigo
    primaryDark: '#4F46E5',
    primaryLight: '#818CF8',
    secondary: '#10B981', // Emerald
    accent: '#F59E0B', // Amber
    background: '#F9FAFB', // Cool Gray 50
    surface: '#FFFFFF',
    textPrimary: '#1F2937', // Cool Gray 800
    textSecondary: '#6B7280', // Cool Gray 500
    textTertiary: '#9CA3AF', // Cool Gray 400
    border: '#E5E7EB', // Cool Gray 200
    error: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
    white: '#FFFFFF',
    black: '#000000',
    lightGray: '#D1D5DB', // Cool Gray 300
  },
  typography: {
    h1: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    h2: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    h3: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
    body: { fontSize: 16, color: '#374151' }, // Cool Gray 700
    caption: { fontSize: 12, color: '#6B7280' },
    button: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  shadows: {
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

const API_URL = 'http://172.20.10.2:3000'; // Replace with your actual IP

const StudyPlanDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { planId } = route.params;

  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudyPlanDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'No user logged in.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/study-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudyPlan(response.data);
    } catch (err) {
      console.error('Error fetching study plan details:', err.response?.data || err.message);
      setError('Failed to load study plan details. Please try again.');
      Alert.alert('Error', 'Failed to load study plan details. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId]);

  useFocusEffect(
    useCallback(() => {
      fetchStudyPlanDetails();
    }, [fetchStudyPlanDetails])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudyPlanDetails();
  }, [fetchStudyPlanDetails]);

  const handleToggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'No user logged in.');
        return;
      }
      const token = await user.getIdToken();
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      // Optimistically update UI
      const updatedTasks = studyPlan.tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      );
      const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
      const newProgress = studyPlan.tasks.length > 0 ? (completedCount / studyPlan.tasks.length) * 100 : 0;

      setStudyPlan(prev => ({
        ...prev,
        tasks: updatedTasks,
        progress: newProgress,
        completedTasks: completedCount,
      }));

      await axios.put(
        `${API_URL}/study-plans/${planId}/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // No need to re-fetch, backend will confirm or we can handle error
    } catch (err) {
      console.error('Error updating task status:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
      // Revert optimistic update if API call fails
      fetchStudyPlanDetails(); 
    }
  };


  if (loading && !studyPlan) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.primary} />
        <Text style={styles.loadingText}>Loading Study Plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={DESIGN_TOKENS.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudyPlanDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!studyPlan) {
    return (
      <View style={styles.centered}>
        <Ionicons name="information-circle-outline" size={48} color={DESIGN_TOKENS.colors.textSecondary} />
        <Text style={styles.emptyText}>Study plan not found.</Text>
      </View>
    );
  }

  const { title, description, startDate, endDate, progress = 0, tasks = [], completedTasks = 0, totalTasks = 0 } = studyPlan;
  const formattedStartDate = startDate ? format(parseISO(startDate), 'MMM dd, yyyy') : 'N/A';
  const formattedEndDate = endDate ? format(parseISO(endDate), 'MMM dd, yyyy') : 'N/A';

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN_TOKENS.colors.primary]} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={DESIGN_TOKENS.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      </View>

      <View style={styles.contentContainer}>
        {description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={20} color={DESIGN_TOKENS.colors.primary} style={styles.dateIcon} />
              <Text style={styles.dateLabel}>Start Date:</Text>
              <Text style={styles.dateValue}>{formattedStartDate}</Text>
            </View>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={20} color={DESIGN_TOKENS.colors.primary} style={styles.dateIcon} />
              <Text style={styles.dateLabel}>End Date:</Text>
              <Text style={styles.dateValue}>{formattedEndDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressContainer}>
            <Progress.Bar 
              progress={progress / 100} 
              width={null} // Null takes full width of parent
              height={12}
              color={DESIGN_TOKENS.colors.success} 
              unfilledColor={DESIGN_TOKENS.colors.lightGray}
              borderColor={DESIGN_TOKENS.colors.border}
              borderRadius={DESIGN_TOKENS.borderRadius.sm}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>{`${Math.round(progress)}%`} ({completedTasks}/{totalTasks} tasks)</Text>
          </View>
        </View>

        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            {tasks.map((task, index) => (
              <TouchableOpacity 
                key={task._id || index} 
                style={styles.taskItem}
                onPress={() => handleToggleTaskStatus(task._id, task.status)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={task.status === 'completed' ? "checkbox-outline" : "square-outline"} 
                  size={24} 
                  color={task.status === 'completed' ? DESIGN_TOKENS.colors.success : DESIGN_TOKENS.colors.primary} 
                  style={styles.taskCheckbox}
                />
                <Text style={[styles.taskText, task.status === 'completed' && styles.taskTextCompleted]}>
                  {task.title || `Task ${index + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
         {tasks.length === 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tasks</Text>
                <View style={styles.emptyTasksContainer}>
                    <Ionicons name="list-outline" size={32} color={DESIGN_TOKENS.colors.textTertiary} />
                    <Text style={styles.emptyTasksText}>No tasks added to this study plan yet.</Text>
                    <TouchableOpacity 
                        style={styles.addTaskButtonEmpty}
                        onPress={() => navigation.navigate('AddStudyTask', { planId })}
                    >
                        <Ionicons name="add-circle-outline" size={22} color={DESIGN_TOKENS.colors.primary} />
                        <Text style={styles.addTaskButtonText}>Add First Task</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
        {tasks.length > 0 && (
          <View style={styles.sectionHeaderWithButton}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity 
              style={styles.addTaskButton}
              onPress={() => navigation.navigate('AddStudyTask', { planId })}
            >
              <Ionicons name="add-outline" size={24} color={DESIGN_TOKENS.colors.primary} />
              <Text style={styles.addTaskButtonTextSmall}>Add Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_TOKENS.spacing.lg,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  loadingText: {
    marginTop: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  errorText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.error,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  retryButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
  },
  retryButtonText: {
    ...DESIGN_TOKENS.typography.button,
  },
  emptyText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: DESIGN_TOKENS.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? DESIGN_TOKENS.spacing.md : DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
    paddingTop: Platform.OS === 'android' ? DESIGN_TOKENS.spacing.lg : DESIGN_TOKENS.spacing.xl, // Adjust for status bar
  },
  backButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  headerTitle: {
    ...DESIGN_TOKENS.typography.h2,
    color: DESIGN_TOKENS.colors.textPrimary,
    flex: 1, // Ensure title takes available space and allows ellipsize
  },
  contentContainer: {
    padding: DESIGN_TOKENS.spacing.md,
  },
  section: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    padding: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.md,
  },
  sectionTitle: {
    ...DESIGN_TOKENS.typography.h3,
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  descriptionText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 22,
  },
  dateContainer: {
    // flexDirection: 'row', // Keep them stacked for clarity on mobile
    // justifyContent: 'space-between',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
    backgroundColor: DESIGN_TOKENS.colors.background, // Slightly different background for date items
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
  },
  dateIcon: {
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  dateLabel: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginRight: DESIGN_TOKENS.spacing.xs,
  },
  dateValue: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%', // Ensure progress bar takes full width of its container
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  progressText: {
    ...DESIGN_TOKENS.typography.caption,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
  },
  taskCheckbox: {
    marginRight: DESIGN_TOKENS.spacing.md,
  },
  taskText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.textPrimary,
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: DESIGN_TOKENS.colors.textTertiary,
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.lg,
    backgroundColor: DESIGN_TOKENS.colors.surface, // Match section background
    borderRadius: DESIGN_TOKENS.borderRadius.lg, // Match section border radius
    padding: DESIGN_TOKENS.spacing.md, // Match section padding
    ...DESIGN_TOKENS.shadows.md, // Match section shadow
  },
  emptyTasksText: {
    ...DESIGN_TOKENS.typography.body,
    color: DESIGN_TOKENS.colors.textTertiary,
    marginTop: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  addTaskButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.background, // Lighter background for the button itself
    paddingVertical: DESIGN_TOKENS.spacing.xs,
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.primaryLight,
  },
  addTaskButtonText: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.primary,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },
  addTaskButtonTextSmall: {
    fontSize: DESIGN_TOKENS.typography.caption.fontSize, // Smaller text for this button variant
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.primary,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md, // This is for the title part before the list of tasks
  }
});

export default StudyPlanDetailScreen;
