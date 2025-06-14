import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db as firestoreDb } from '../config/firebase';

const STATIC_COLORS = {
  primary: '#6A1B9A',
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50',
  accent: '#F59E0B',
  background: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0',
  error: '#D32F2F',
  disabled: '#BDBDBD',
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
};

const JournalEntryModal = ({ visible, onClose, prompt }) => {
  const [entryText, setEntryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert(
        'Authentication Error',
        'You must be logged in to save an entry.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(
        collection(
          firestoreDb,
          'users',
          auth.currentUser.uid,
          'journalEntries',
        ),
        {
          prompt: prompt,
          text: entryText.trim(),
          timestamp: serverTimestamp(),
        },
      );
      Alert.alert(
        'Entry Saved',
        'Your journal entry has been saved successfully.',
      );
      setEntryText('');
      onClose();
    } catch (error) {
      console.error('Error saving journal entry: ', error);
      Alert.alert('Error', 'Could not save your entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Journal Entry</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons
                    name="close-circle-outline"
                    size={30}
                    color={STATIC_COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {prompt && (
                <View style={styles.promptContainer}>
                  <Text style={styles.promptLabel}>Today's Prompt:</Text>
                  <Text style={styles.promptText}>{prompt}</Text>
                </View>
              )}

              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Write your thoughts here..."
                placeholderTextColor={STATIC_COLORS.textMuted}
                value={entryText}
                onChangeText={setEntryText}
                textAlignVertical="top" // for Android
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSaveEntry}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={STATIC_COLORS.textOnPrimary} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 15,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: STATIC_COLORS.border,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: STATIC_COLORS.primaryDark,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  promptContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: STATIC_COLORS.background,
    borderRadius: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: STATIC_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  promptText: {
    fontSize: 16,
    color: STATIC_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  textInput: {
    flexGrow: 1, // Make text input take available space
    minHeight: 150, // Ensure a decent minimum height
    maxHeight: 300, // Prevent it from becoming too large
    backgroundColor: STATIC_COLORS.background,
    borderColor: STATIC_COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: STATIC_COLORS.text,
    marginBottom: SPACING.lg,
  },
  saveButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: STATIC_COLORS.disabled,
  },
});

export default JournalEntryModal;
