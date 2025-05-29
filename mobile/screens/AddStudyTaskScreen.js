import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { auth } from '../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // For date picking

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
    inputBackground: '#F3F4F6', // Cool Gray 100
  },
  typography: {
    h1: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    h2: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    h3: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
    body: { fontSize: 16, color: '#374151' },
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

const AddStudyTaskScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { planId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'No user logged in.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.toISOString(), // Send as ISO string
        status: 'pending', // Default status
      };

      await axios.post(
        `${API_URL}/study-plans/${planId}/tasks`,
        taskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Task added successfully!');
      navigation.goBack(); // Go back to the detail screen, which should refresh
    } catch (err) {
      console.error('Error adding task:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to add task. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={DESIGN_TOKENS.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Task</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Task Title <Text style={styles.requiredIndicator}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title (e.g., Chapter 1 Review)"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={DESIGN_TOKENS.colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add more details about the task..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={DESIGN_TOKENS.colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Due Date (Optional)</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Ionicons name="calendar-outline" size={20} color={DESIGN_TOKENS.colors.primary} style={styles.dateIcon} />
            <Text style={styles.datePickerText}>{dueDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={dueDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeDate}
              minimumDate={new Date()} // Optional: prevent past dates
            />
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleAddTask} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={DESIGN_TOKENS.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add Task</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  contentContainer: {
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? DESIGN_TOKENS.spacing.md : DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
    paddingTop: Platform.OS === 'android' ? DESIGN_TOKENS.spacing.lg : DESIGN_TOKENS.spacing.xl, 
  },
  backButton: {
    padding: DESIGN_TOKENS.spacing.sm,
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  headerTitle: {
    ...DESIGN_TOKENS.typography.h2,
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  formContainer: {
    padding: DESIGN_TOKENS.spacing.md,
  },
  inputGroup: {
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  label: {
    ...DESIGN_TOKENS.typography.body,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  requiredIndicator: {
    color: DESIGN_TOKENS.colors.error,
  },
  input: {
    backgroundColor: DESIGN_TOKENS.colors.inputBackground,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
    color: DESIGN_TOKENS.colors.textPrimary,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.inputBackground,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  dateIcon: {
    marginRight: DESIGN_TOKENS.spacing.sm,
  },
  datePickerText: {
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  submitButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
  },
  submitButtonText: {
    ...DESIGN_TOKENS.typography.button,
  },
});

export default AddStudyTaskScreen;
