import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATIC_COLORS } from '../config/appConfig'; // Adjust path as necessary

const NoteInputModal = ({
  isVisible,
  onClose,
  onSave,
  projectTitle,
  initialNote,
}) => {
  const [noteText, setNoteText] = useState('');
  const colors = STATIC_COLORS;

  useEffect(() => {
    if (initialNote && initialNote.text) {
      setNoteText(initialNote.text);
    } else {
      setNoteText('');
    }
  }, [initialNote]);

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim());
      setNoteText(''); // Clear text after saving
      onClose(); // Close modal
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      backgroundColor: colors.background,
      borderRadius: 15,
      padding: 25,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      flex: 1, // Allow title to take space
      marginRight: 10, // Space before close button
    },
    closeButton: {
      padding: 5,
    },
    input: {
      backgroundColor: colors.inputBackground || colors.lightGray, // Added fallback
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      color: colors.text,
      minHeight: 120, // For multi-line input
      textAlignVertical: 'top', // Align text to top for multiline
      marginBottom: 25,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    saveButtonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
    },
  });

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text
              style={styles.modalTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {initialNote ? 'Edit Note' : 'Add Note'} to{' '}
              {projectTitle || 'Project'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close-circle-outline"
                size={28}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your note here..."
            placeholderTextColor={colors.textLight}
            multiline
            value={noteText}
            onChangeText={setNoteText}
            autoFocus={true}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={22} color={colors.white} />
            <Text style={styles.saveButtonText}>
              {initialNote ? 'Update Note' : 'Save Note'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default NoteInputModal;
