import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView, // Added SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePickerModal from 'react-native-modal-datetime-picker'; // Removed
import DateTimePicker from '@react-native-community/datetimepicker'; // Added
import { format } from 'date-fns';
import {LinearGradient} from 'expo-linear-gradient';
import { auth } from '../config/firebase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Consistent Design System
const COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  background: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#4CAF50',
  disabled: '#CBD5E0',
  gradientPrimary: ['#6A1B9A', '#4A0072'],
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  h2: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  body: { fontSize: 16, color: COLORS.textSecondary },
  button: { fontSize: 16, fontWeight: 'bold', color: COLORS.textOnPrimary },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
};

const CreateStudyPlanScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState('');
  const [startDate, setStartDate] = useState(new Date()); // Initialize with a default date
  const [endDate, setEndDate] = useState(new Date()); // Initialize with a default date
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const API_URL = 'http://172.20.10.3.2:3000'; // Updated IP Address

  const onChangeStartDate = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    if (endDate && currentDate > endDate) {
      setEndDate(currentDate); // Adjust end date if it's before new start date
    }
  };

  const onChangeEndDate = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  const showStartDatepickerModal = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatepickerModal = () => {
    setShowEndDatePicker(true);
  };


  const getApiUrl = async () => {
    return API_URL;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your study plan.');
      return;
    }
    if (!startDate) {
      Alert.alert('Validation Error', 'Please select a start date.');
      return;
    }
    if (!endDate) {
      Alert.alert('Validation Error', 'Please select an end date.');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Validation Error', 'End date cannot be before the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'No user logged in. Please log in again.');
        setIsSubmitting(false);
        navigation.replace('Login'); // Or your Auth stack
        return;
      }
      const token = await user.getIdToken();
      const apiUrl = await getApiUrl();

      const planData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      
      const response = await axios.post(`${apiUrl}/study-plans`, planData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Study plan created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Creation Failed', response.data?.message || 'Could not create study plan. Please try again.');
      }
    } catch (error) {
      console.error('Error creating study plan:', error.response ? error.response.data : error.message);
      Alert.alert('Error', `An error occurred: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <LinearGradient colors={COLORS.gradientPrimary} style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.h2, styles.headerTitle, { color: COLORS.textOnPrimary }]}>
          Create Study Plan
        </Text>
        <View style={{ width: SPACING.xl }} />{/* Placeholder for balance */}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Title*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Midterm Exam Prep"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Briefly describe your study plan (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Subjects/Topics</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Algebra, Calculus, Physics (comma-separated)"
              placeholderTextColor={COLORS.textMuted}
              value={subjects}
              onChangeText={setSubjects}
            />
          </View>

          <View style={styles.dateRow}>
            <View style={[styles.inputGroup, styles.dateInputGroup]}>
              <Text style={TYPOGRAPHY.label}>Start Date*</Text>
              <TouchableOpacity onPress={showStartDatepickerModal} style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.dateIcon} />
                <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
                  {startDate ? format(startDate, 'MMMM dd, yyyy') : 'Select Start Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.dateInputGroup]}>
              <Text style={TYPOGRAPHY.label}>End Date*</Text>
              <TouchableOpacity onPress={showEndDatepickerModal} style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.dateIcon} />
                <Text style={[styles.dateText, !endDate && styles.datePlaceholder]}>
                  {endDate ? format(endDate, 'MMMM dd, yyyy') : 'Select End Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={startDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeStartDate}
              minimumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={endDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeEndDate}
              minimumDate={startDate || new Date()}
            />
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.textOnPrimary} />
            ) : (
              <Text style={TYPOGRAPHY.button}>Create Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? SPACING.md + 10 : SPACING.md + 30, // Adjust for status bar
    backgroundColor: COLORS.primary, // Fallback if gradient fails
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textOnPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  form: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 16,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  dateInputGroup: {
    flex: 1,
    marginRight: SPACING.sm, // Add some space between date inputs
  },
  dateInputGroupLast: { // In case you need to remove margin for the last item
    marginRight: 0,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  dateIcon: {
    marginRight: SPACING.sm,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
  },
  datePlaceholder: {
    color: COLORS.textMuted,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled,
    elevation: 0,
  },
});

export default CreateStudyPlanScreen;
