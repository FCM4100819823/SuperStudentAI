import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

const { width, height } = Dimensions.get('window');

// Modern Design System
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
      regular: Platform.OS === 'ios' ? '400' : 'normal',
      medium: Platform.OS === 'ios' ? '500' : 'normal',
      semibold: Platform.OS === 'ios' ? '600' : 'normal',
      bold: Platform.OS === 'ios' ? '700' : 'bold',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// API Configuration
const API_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://your-production-api.com/api';

const StudyPlanDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { planId } = route.params;
  const auth = getAuth();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // State management
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [aiOptimizedSuggestions, setAiOptimizedSuggestions] = useState(null);

  // Task modal states
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState('');

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());

  // Animation effects
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Utility functions
  const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

  const getTaskStatusColor = (task) => {
    if (task.status === 'completed') return DESIGN_TOKENS.colors.success;
    if (task.dueDate && isAfter(new Date(), new Date(task.dueDate))) {
      return DESIGN_TOKENS.colors.error;
    }
    return DESIGN_TOKENS.colors.warning;
  };

  const getProgressPercentage = () => {
    if (!studyPlan?.tasks || studyPlan.tasks.length === 0) return 0;
    const completedTasks = studyPlan.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / studyPlan.tasks.length) * 100);
  };

  const getDaysRemaining = () => {
    if (!studyPlan?.endDate) return null;
    const days = differenceInDays(new Date(studyPlan.endDate), new Date());
    return days > 0 ? days : 0;
  };

  // API functions
  const fetchStudyPlanDetail = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const response = await axios.get(`${API_URL}/study-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudyPlan(response.data);
    } catch (error) {
      console.error('Error fetching study plan detail:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        'Failed to fetch study plan details. ' + (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStudyPlanDetail();
    }, [planId, auth]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudyPlanDetail();
  }, [planId, auth]);

  // Task management functions
  const openTaskModal = (task = null) => {
    setCurrentTask(task);
    if (task) {
      setNewTaskTitle(task.title);
      setNewTaskDescription(task.description || '');
      const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
      setNewTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setDatePickerDate(isValidDate(dueDate) ? dueDate : new Date());
      setNewTaskEstimatedHours(task.estimatedHours?.toString() || '');
    } else {
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setDatePickerDate(new Date());
      setNewTaskEstimatedHours('');
    }
    setIsTaskModalVisible(true);
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || datePickerDate;
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set') {
      setDatePickerDate(currentDate);
      const day = currentDate.getDate().toString().padStart(2, '0');
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = currentDate.getFullYear();
      setNewTaskDueDate(`${year}-${month}-${day}`);
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const showDatepickerMode = () => {
    setShowDatePicker(true);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const payload = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        dueDate: newTaskDueDate || undefined,
        estimatedHours: newTaskEstimatedHours ? parseFloat(newTaskEstimatedHours) : undefined,
      };

      let response;
      if (currentTask) {
        response = await axios.put(
          `${API_URL}/study-plans/${planId}/tasks/${currentTask._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setStudyPlan((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t._id === currentTask._id ? response.data : t)),
        }));
        Alert.alert('Success', 'Task updated successfully!');
      } else {
        response = await axios.post(`${API_URL}/study-plans/${planId}/tasks`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudyPlan((prev) => ({
          ...prev,
          tasks: [...(prev?.tasks || []), response.data],
        }));
        Alert.alert('Success', 'Task added successfully!');
      }

      setIsTaskModalVisible(false);
    } catch (error) {
      console.error(`Error ${currentTask ? 'updating' : 'adding'} task:`, error.response?.data || error.message);
      Alert.alert(
        'Error',
        `Failed to ${currentTask ? 'update' : 'add'} task. ` + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) throw new Error('User not authenticated');
              const token = await user.getIdToken();

              await axios.delete(`${API_URL}/study-plans/${planId}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              setStudyPlan((prev) => ({
                ...prev,
                tasks: prev.tasks.filter((task) => task._id !== taskId),
              }));
              Alert.alert('Success', 'Task deleted successfully.');
            } catch (error) {
              console.error('Error deleting task:', error.response?.data || error.message);
              Alert.alert('Error', 'Failed to delete task. ' + (error.response?.data?.message || error.message));
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      await axios.put(
        `${API_URL}/study-plans/${planId}/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStudyPlan((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      }));
    } catch (error) {
      console.error('Error updating task status:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update task status. ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOptimizePlan = async () => {
    if (!studyPlan || !studyPlan._id) {
      Alert.alert('Error', 'Study plan details are not available.');
      return;
    }
    if (!studyPlan.tasks || studyPlan.tasks.length === 0) {
      Alert.alert('No Tasks', 'There are no tasks in this plan to optimize.');
      return;
    }

    setOptimizing(true);
    setAiOptimizedSuggestions(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const response = await axios.post(
        `${API_URL}/study-plans/${studyPlan._id}/optimize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data && response.data.message) {
        Alert.alert('Optimization Started', response.data.message);
        if (response.data.suggestions) {
          setAiOptimizedSuggestions(response.data.suggestions);
        }
        if (response.data.updatedTasks) {
          setStudyPlan((prev) => ({
            ...prev,
            tasks: response.data.updatedTasks,
          }));
        } else {
          fetchStudyPlanDetail();
        }
      } else {
        Alert.alert('Optimization', 'AI optimization process initiated.');
      }
    } catch (error) {
      console.error('Error optimizing study plan:', error.response?.data || error.message);
      Alert.alert('Optimization Error', 'Failed to optimize study plan. ' + (error.response?.data?.message || error.message));
    } finally {
      setOptimizing(false);
    }
  };

  // Render components
  const renderHeader = () => (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6', '#A855F7']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView>
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back-ios" size={24} color={DESIGN_TOKENS.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {studyPlan?.title || 'Study Plan'}
          </Text>
          <TouchableOpacity onPress={handleOptimizePlan} style={styles.optimizeHeaderButton} disabled={optimizing}>
            {optimizing ? (
              <ActivityIndicator size="small" color={DESIGN_TOKENS.colors.text.inverse} />
            ) : (
              <MaterialIcons name="auto-awesome" size={24} color={DESIGN_TOKENS.colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderProgressCard = () => {
    const progress = getProgressPercentage();
    const daysRemaining = getDaysRemaining();
    const completedTasks = studyPlan?.tasks?.filter(task => task.status === 'completed').length || 0;
    const totalTasks = studyPlan?.tasks?.length || 0;

    return (
      <Animated.View
        style={[
          styles.progressCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.progressCardHeader}>
          <Text style={styles.progressCardTitle}>Progress Overview</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{progress}%</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <MaterialIcons name="check-circle" size={20} color={DESIGN_TOKENS.colors.success} />
            <Text style={styles.progressStatText}>{completedTasks} completed</Text>
          </View>
          <View style={styles.progressStat}>
            <MaterialIcons name="schedule" size={20} color={DESIGN_TOKENS.colors.warning} />
            <Text style={styles.progressStatText}>{totalTasks - completedTasks} remaining</Text>
          </View>
          {daysRemaining !== null && (
            <View style={styles.progressStat}>
              <MaterialIcons name="event" size={20} color={DESIGN_TOKENS.colors.info} />
              <Text style={styles.progressStatText}>{daysRemaining} days left</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderAISuggestions = () => {
    if (!studyPlan?.aiSuggestions && !aiOptimizedSuggestions) return null;

    return (
      <Animated.View
        style={[
          styles.aiSuggestionCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.aiSuggestionHeader}>
          <MaterialIcons name="lightbulb" size={24} color={DESIGN_TOKENS.colors.accent} />
          <Text style={styles.aiSuggestionTitle}>AI Insights</Text>
        </View>
        
        {studyPlan?.aiSuggestions && (
          <Text style={styles.aiSuggestionText}>{studyPlan.aiSuggestions}</Text>
        )}
        
        {aiOptimizedSuggestions && (
          <View style={styles.optimizedSuggestionContainer}>
            <View style={styles.optimizedSuggestionHeader}>
              <MaterialIcons name="auto-awesome" size={20} color={DESIGN_TOKENS.colors.success} />
              <Text style={styles.optimizedSuggestionTitle}>Latest Optimization</Text>
            </View>
            <Text style={styles.optimizedSuggestionText}>{aiOptimizedSuggestions}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderTaskItem = ({ item, index }) => {
    const isCompleted = item.status === 'completed';
    const isOverdue = item.dueDate && isAfter(new Date(), new Date(item.dueDate)) && !isCompleted;
    
    return (
      <Animated.View
        style={[
          styles.taskCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 30 + index * 10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleTaskStatus(item._id, item.status)}
          style={styles.taskStatusContainer}
        >
          <View style={[styles.taskStatusIcon, isCompleted && styles.taskStatusIconCompleted]}>
            {isCompleted ? (
              <MaterialIcons name="check" size={16} color={DESIGN_TOKENS.colors.text.inverse} />
            ) : (
              <View style={styles.taskStatusIconEmpty} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          
          {item.description && (
            <Text style={styles.taskDescription}>{item.description}</Text>
          )}

          <View style={styles.taskMeta}>
            {item.dueDate && (
              <View style={[styles.taskMetaItem, isOverdue && styles.taskMetaItemOverdue]}>
                <MaterialIcons
                  name="schedule"
                  size={14}
                  color={isOverdue ? DESIGN_TOKENS.colors.error : DESIGN_TOKENS.colors.text.tertiary}
                />
                <Text style={[styles.taskMetaText, isOverdue && styles.taskMetaTextOverdue]}>
                  {format(new Date(item.dueDate), 'MMM dd')}
                </Text>
              </View>
            )}
            
            {item.estimatedHours && (
              <View style={styles.taskMetaItem}>
                <MaterialIcons name="timer" size={14} color={DESIGN_TOKENS.colors.text.tertiary} />
                <Text style={styles.taskMetaText}>{item.estimatedHours}h</Text>
              </View>
            )}
            
            <View style={[styles.taskPriorityBadge, { backgroundColor: getTaskStatusColor(item) }]}>
              <Text style={styles.taskPriorityText}>
                {isCompleted ? 'Done' : isOverdue ? 'Overdue' : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity onPress={() => openTaskModal(item)} style={styles.taskActionButton}>
            <MaterialIcons name="edit" size={20} color={DESIGN_TOKENS.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteTask(item._id)} style={styles.taskActionButton}>
            <MaterialIcons name="delete" size={20} color={DESIGN_TOKENS.colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderTaskModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isTaskModalVisible}
      onRequestClose={() => setIsTaskModalVisible(false)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{currentTask ? 'Edit Task' : 'Add New Task'}</Text>
            <TouchableOpacity onPress={() => setIsTaskModalVisible(false)} style={styles.modalCloseButton}>
              <MaterialIcons name="close" size={24} color={DESIGN_TOKENS.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter task title"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholderTextColor={DESIGN_TOKENS.colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Add task description (optional)"
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={DESIGN_TOKENS.colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Date</Text>
              <TouchableOpacity onPress={showDatepickerMode} style={styles.datePickerButton}>
                <MaterialIcons name="event" size={20} color={DESIGN_TOKENS.colors.primary} />
                <Text style={styles.datePickerText}>
                  {newTaskDueDate ? format(new Date(newTaskDueDate), 'MMM dd, yyyy') : 'Select due date (optional)'}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={datePickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeDate}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Hours</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 2.5"
                value={newTaskEstimatedHours}
                onChangeText={setNewTaskEstimatedHours}
                keyboardType="numeric"
                placeholderTextColor={DESIGN_TOKENS.colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsTaskModalVisible(false)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveTask}>
              <Text style={styles.modalSaveButtonText}>{currentTask ? 'Save Changes' : 'Add Task'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Loading state
  if (loading && !refreshing && !studyPlan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.primary} />
        <Text style={styles.loadingText}>Loading study plan...</Text>
      </View>
    );
  }

  // Error state
  if (!studyPlan) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={DESIGN_TOKENS.colors.text.tertiary} />
        <Text style={styles.errorTitle}>Study Plan Not Found</Text>
        <Text style={styles.errorMessage}>The study plan could not be loaded. Please try again.</Text>
        <TouchableOpacity onPress={fetchStudyPlanDetail} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN_TOKENS.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {renderProgressCard()}
        {renderAISuggestions()}

        <Animated.View
          style={[
            styles.tasksSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.tasksSectionHeader}>
            <Text style={styles.tasksSectionTitle}>
              Tasks ({studyPlan.tasks?.length || 0})
            </Text>
            <TouchableOpacity onPress={() => openTaskModal()} style={styles.addTaskButton}>
              <MaterialIcons name="add" size={20} color={DESIGN_TOKENS.colors.primary} />
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {studyPlan.tasks && studyPlan.tasks.length > 0 ? (
            <FlatList
              data={studyPlan.tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item._id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tasksList}
            />
          ) : (
            <View style={styles.emptyTasksContainer}>
              <MaterialIcons name="assignment" size={48} color={DESIGN_TOKENS.colors.text.tertiary} />
              <Text style={styles.emptyTasksTitle}>No Tasks Yet</Text>
              <Text style={styles.emptyTasksMessage}>Start by adding your first task to this study plan.</Text>
              <TouchableOpacity onPress={() => openTaskModal()} style={styles.emptyTasksButton}>
                <MaterialIcons name="add" size={20} color={DESIGN_TOKENS.colors.text.inverse} />
                <Text style={styles.emptyTasksButtonText}>Add First Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {renderTaskModal()}

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => openTaskModal()} style={styles.fabButton}>
          <MaterialIcons name="add" size={28} color={DESIGN_TOKENS.colors.text.inverse} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },

  // Header Styles
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingTop: DESIGN_TOKENS.spacing.md,
  },
  backButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: DESIGN_TOKENS.typography.sizes.xl,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
  },
  optimizeHeaderButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },

  // ScrollView Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DESIGN_TOKENS.spacing.md,
    paddingBottom: 100, // Space for FAB
  },

  // Progress Card Styles
  progressCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    padding: DESIGN_TOKENS.spacing.lg,
    marginBottom: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.md,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  progressCardTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.lg,
    fontWeight: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  progressBadge: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderRadius: DESIGN_TOKENS.borderRadius.full,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
  },
  progressBadgeText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.inverse,
  },
  progressBarContainer: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: DESIGN_TOKENS.colors.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressStatText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },

  // AI Suggestions Styles
  aiSuggestionCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    padding: DESIGN_TOKENS.spacing.lg,
    marginBottom: DESIGN_TOKENS.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: DESIGN_TOKENS.colors.accent,
    ...DESIGN_TOKENS.shadows.sm,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  aiSuggestionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontWeight: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },
  aiSuggestionText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    color: DESIGN_TOKENS.colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  optimizedSuggestionContainer: {
    marginTop: DESIGN_TOKENS.spacing.md,
    paddingTop: DESIGN_TOKENS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.divider,
  },
  optimizedSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  optimizedSuggestionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontWeight: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.success,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },
  optimizedSuggestionText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    color: DESIGN_TOKENS.colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Tasks Section Styles
  tasksSection: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  tasksSectionTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.xl,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surfaceElevated,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  addTaskButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.primary,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },

  // Task Card Styles
  tasksList: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  taskCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    padding: DESIGN_TOKENS.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...DESIGN_TOKENS.shadows.sm,
  },
  taskStatusContainer: {
    marginRight: DESIGN_TOKENS.spacing.md,
    paddingTop: 2,
  },
  taskStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DESIGN_TOKENS.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskStatusIconCompleted: {
    backgroundColor: DESIGN_TOKENS.colors.success,
    borderColor: DESIGN_TOKENS.colors.success,
  },
  taskStatusIconEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: DESIGN_TOKENS.colors.text.tertiary,
  },
  taskDescription: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaItemOverdue: {
    opacity: 1,
  },
  taskMetaText: {
    fontSize: DESIGN_TOKENS.typography.sizes.xs,
    color: DESIGN_TOKENS.colors.text.tertiary,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },
  taskMetaTextOverdue: {
    color: DESIGN_TOKENS.colors.error,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
  },
  taskPriorityBadge: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: 2,
    borderRadius: DESIGN_TOKENS.borderRadius.sm,
    marginLeft: 'auto',
  },
  taskPriorityText: {
    fontSize: DESIGN_TOKENS.typography.sizes.xs,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.inverse,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },
  taskActionButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },

  // Empty States
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: DESIGN_TOKENS.spacing.xl,
  },
  emptyTasksTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.lg,
    fontWeight: DESIGN_TOKENS.typography.weights.semibold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginTop: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  emptyTasksMessage: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  emptyTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
  },
  emptyTasksButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.inverse,
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: DESIGN_TOKENS.spacing.lg,
  },
  modalContent: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.xl,
    padding: DESIGN_TOKENS.spacing.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...DESIGN_TOKENS.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  modalTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes['2xl'],
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  modalCloseButton: {
    padding: DESIGN_TOKENS.spacing.sm,
  },
  modalForm: {
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  inputGroup: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  inputLabel: {
    fontSize: DESIGN_TOKENS.typography.sizes.sm,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.primary,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  modalInput: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceElevated,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    color: DESIGN_TOKENS.colors.text.primary,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surfaceElevated,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  datePickerText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    color: DESIGN_TOKENS.colors.text.primary,
    marginLeft: DESIGN_TOKENS.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  modalCancelButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.secondary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  modalSaveButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.inverse,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    right: DESIGN_TOKENS.spacing.lg,
    bottom: DESIGN_TOKENS.spacing.lg,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...DESIGN_TOKENS.shadows.lg,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  loadingText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    color: DESIGN_TOKENS.colors.text.secondary,
    marginTop: DESIGN_TOKENS.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.background,
    padding: DESIGN_TOKENS.spacing.lg,
  },
  errorTitle: {
    fontSize: DESIGN_TOKENS.typography.sizes.xl,
    fontWeight: DESIGN_TOKENS.typography.weights.bold,
    color: DESIGN_TOKENS.colors.text.primary,
    marginTop: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  errorMessage: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    color: DESIGN_TOKENS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  retryButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
  },
  retryButtonText: {
    fontSize: DESIGN_TOKENS.typography.sizes.base,
    fontWeight: DESIGN_TOKENS.typography.weights.medium,
    color: DESIGN_TOKENS.colors.text.inverse,
  },
});

export default StudyPlanDetailScreen;
