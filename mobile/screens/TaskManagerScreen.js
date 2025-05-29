import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestoreDb } from '../config/firebase'; // Assuming firestoreDb is your initialized Firestore instance

// Define STATIC_COLORS and SPACING for consistent styling (should be from a global theme ideally)
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
  info: '#1976D2',
  disabled: '#BDBDBD',
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

const TaskManagerScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const fetchTasks = useCallback(() => {
    if (!user) {
      setError("User not authenticated. Please login.");
      setLoading(false);
      setRefreshing(false);
      return null;
    }

    setLoading(true);
    setError(null);

    const tasksCollection = collection(firestoreDb, 'tasks');
    const q = query(
      tasksCollection,
      where('userId', '==', user.uid),
      orderBy('dueDate', 'asc') // Sort by due date
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedTasks = [];
        querySnapshot.forEach((doc) => {
          fetchedTasks.push({ id: doc.id, ...doc.data() });
        });
        setTasks(fetchedTasks);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Error fetching tasks: ", err);
        setError("Failed to fetch tasks. " + err.message);
        setLoading(false);
        setRefreshing(false);
      }
    );
    return unsubscribe; // Return the unsubscribe function to be called on unmount
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchTasks();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks(); // This will reset loading and refreshing states internally
  };
  
  const toggleTaskStatus = async (task) => {
    if (!user) return;
    const taskRef = doc(firestoreDb, 'tasks', task.id);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      // Optimistic update or rely on onSnapshot
    } catch (e) {
      Alert.alert("Error", "Could not update task status: " + e.message);
    }
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            const taskRef = doc(firestoreDb, 'tasks', taskId);
            try {
              await deleteDoc(taskRef);
              // Optimistic update or rely on onSnapshot
            } catch (e) {
              Alert.alert("Error", "Could not delete task: " + e.message);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return STATIC_COLORS.error;
      case 'medium':
        return STATIC_COLORS.accent;
      case 'low':
        return STATIC_COLORS.secondary;
      default:
        return STATIC_COLORS.textSecondary;
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={[styles.taskItem, item.status === 'completed' && styles.completedTaskItem]}>
      <TouchableOpacity onPress={() => toggleTaskStatus(item)} style={styles.statusIndicator}>
        <Ionicons 
          name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
          size={26} 
          color={item.status === 'completed' ? STATIC_COLORS.secondary : STATIC_COLORS.primary} 
        />
      </TouchableOpacity>
      <View style={styles.taskDetails}>
        <Text style={[styles.taskTitle, item.status === 'completed' && styles.completedTaskText]}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={[styles.taskDescription, item.status === 'completed' && styles.completedTaskText]}>
            {item.description}
          </Text>
        )}
        <Text style={styles.taskDueDate}>
          Due: {item.dueDate ? new Date(item.dueDate.seconds * 1000).toLocaleDateString() : 'Not set'}
        </Text>
      </View>
      <View style={styles.taskActions}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority || 'N/A'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AddTask', { task: item })} style={styles.actionButton}>
          <Ionicons name="create-outline" size={24} color={STATIC_COLORS.info} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={24} color={STATIC_COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredMessage}>
        <Ionicons name="alert-circle-outline" size={60} color={STATIC_COLORS.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
         <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={20} color={STATIC_COLORS.textOnPrimary} style={{marginRight: SPACING.sm}}/>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={STATIC_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Manager</Text>
        <TouchableOpacity 
            onPress={() => navigation.navigate('AddTask', { task: null })} // Pass null for new task
            style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={32} color={STATIC_COLORS.primary} />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 && !loading ? (
        <View style={styles.centeredMessage}>
          <Ionicons name="file-tray-stacked-outline" size={60} color={STATIC_COLORS.textSecondary} />
          <Text style={styles.emptyTasksTitle}>No Tasks Yet!</Text>
          <Text style={styles.emptyTasksSubtitle}>Tap the '+' button to add your first task.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[STATIC_COLORS.primary]} />
          }
        />
      )}
    </View>
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.text,
    fontWeight: 'bold',
  },
  addButton: {
    padding: SPACING.xs,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.primary,
    marginTop: SPACING.md,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    backgroundColor: STATIC_COLORS.background,
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textOnPrimary,
    fontWeight: '600',
  },
  emptyTasksTitle: {
    ...TYPOGRAPHY.h2,
    color: STATIC_COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyTasksSubtitle: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    textAlign: 'center',
  },
  listContentContainer: {
    padding: SPACING.md,
  },
  taskItem: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  completedTaskItem: {
    backgroundColor: '#E8F5E9', // Light green for completed
    opacity: 0.8,
  },
  statusIndicator: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.text,
    fontSize: 17,
  },
  taskDescription: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  taskDueDate: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: STATIC_COLORS.textSecondary,
  },
  taskActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 70, // Ensure enough space for actions
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginBottom: SPACING.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  actionButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs, // For spacing between edit/delete
  },
});

export default TaskManagerScreen;
