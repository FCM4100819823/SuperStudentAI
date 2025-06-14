import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestoreDb } from '../config/firebase';
import DateTimePicker from '@react-native-community/datetimepicker'; // For date picking

// Define STATIC_COLORS and SPACING (should be from a global theme ideally)
const STATIC_COLORS = {
  primary: '#6A1B9A',
  primaryDark: '#4A148C',
  secondary: '#4CAF50',
  accent: '#F59E0B',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#757575',
  textOnPrimary: '#FFFFFF',
  error: '#D32F2F',
  disabled: '#BDBDBD',
  placeholder: '#A0A0A0',
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

const AddTaskScreen = ({ navigation, route }) => {
  const { task: existingTask } = route.params || {}; // Task to edit, if any

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(
    existingTask?.description || '',
  );
  const [dueDate, setDueDate] = useState(
    existingTask?.dueDate
      ? new Date(existingTask.dueDate.seconds * 1000)
      : new Date(),
  );
  const [priority, setPriority] = useState(existingTask?.priority || 'medium'); // Default to medium
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleSaveTask = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save tasks.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title cannot be empty.');
      return;
    }

    setLoading(true);
    const taskData = {
      userId: user.uid,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate, // Firestore will convert to Timestamp
      priority: priority,
      status: existingTask?.status || 'pending', // Keep existing status or default to pending
      updatedAt: serverTimestamp(),
    };

    try {
      if (existingTask && existingTask.id) {
        // Update existing task
        const taskRef = doc(firestoreDb, 'tasks', existingTask.id);
        await updateDoc(taskRef, taskData);
        Alert.alert('Success', 'Task updated successfully!');
      } else {
        // Add new task
        await addDoc(collection(firestoreDb, 'tasks'), {
          ...taskData,
          createdAt: serverTimestamp(), // Add createdAt for new tasks
        });
        Alert.alert('Success', 'Task added successfully!');
      }
      navigation.goBack();
    } catch (e) {
      console.error('Error saving task: ', e);
      Alert.alert('Error', 'Could not save task: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  const priorityOptions = ['low', 'medium', 'high'];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={STATIC_COLORS.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingTask ? 'Edit Task' : 'Add New Task'}
        </Text>
        <View style={{ width: SPACING.lg }} />
        {/* Placeholder for balance */}
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Title*</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Complete Math Assignment"
          placeholderTextColor={STATIC_COLORS.placeholder}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., Chapter 3, exercises 1-5"
          placeholderTextColor={STATIC_COLORS.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Due Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.datePickerButton}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={STATIC_COLORS.primary}
            style={{ marginRight: SPACING.sm }}
          />
          <Text style={styles.datePickerText}>
            {dueDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={dueDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()} // Optional: prevent past dates
          />
        )}

        <Text style={styles.label}>Priority</Text>
        <View style={styles.prioritySelector}>
          {priorityOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.priorityButton,
                priority === option && styles.priorityButtonSelected,
                option === 'low' && styles.priorityLow,
                option === 'medium' && styles.priorityMedium,
                option === 'high' && styles.priorityHigh,
                priority === option &&
                  option === 'low' &&
                  styles.priorityLowSelected,
                priority === option &&
                  option === 'medium' &&
                  styles.priorityMediumSelected,
                priority === option &&
                  option === 'high' &&
                  styles.priorityHighSelected,
              ]}
              onPress={() => setPriority(option)}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  priority === option && styles.priorityButtonTextSelected,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSaveTask}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={STATIC_COLORS.textOnPrimary} />
          ) : (
            <>
              <Ionicons
                name={existingTask ? 'save-outline' : 'add-circle-outline'}
                size={22}
                color={STATIC_COLORS.textOnPrimary}
                style={{ marginRight: SPACING.sm }}
              />
              <Text style={styles.saveButtonText}>
                {existingTask ? 'Save Changes' : 'Add Task'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
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
  formContainer: {
    padding: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.primaryDark,
    fontSize: 16,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: STATIC_COLORS.surface,
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2, // Adjust for better text centering
    fontSize: 16,
    color: STATIC_COLORS.text,
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.surface,
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  datePickerText: {
    fontSize: 16,
    color: STATIC_COLORS.text,
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    marginTop: SPACING.xs,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: STATIC_COLORS.disabled,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  priorityButtonSelected: {
    // General selected style, specific colors below
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: STATIC_COLORS.textSecondary,
  },
  priorityButtonTextSelected: {
    color: STATIC_COLORS.textOnPrimary,
  },
  priorityLow: { borderColor: STATIC_COLORS.secondary },
  priorityMedium: { borderColor: STATIC_COLORS.accent },
  priorityHigh: { borderColor: STATIC_COLORS.error },
  priorityLowSelected: { backgroundColor: STATIC_COLORS.secondary },
  priorityMediumSelected: { backgroundColor: STATIC_COLORS.accent },
  priorityHighSelected: { backgroundColor: STATIC_COLORS.error },
  saveButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  saveButtonText: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: STATIC_COLORS.disabled,
  },
});

export default AddTaskScreen;
