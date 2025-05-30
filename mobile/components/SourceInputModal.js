import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATIC_COLORS } from '../config/appConfig'; // Adjust path as necessary
// If you have a Picker component, import it here. Otherwise, we'll use a simple TextInput for type for now.
// import { Picker } from '@react-native-picker/picker';

const SourceInputModal = ({ isVisible, onClose, onSave, projectTitle, initialSource }) => {
  const colors = STATIC_COLORS;
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState(''); // e.g., Website, Book, Journal Article
  const [notes, setNotes] = useState('');

  const sourceTypes = ["Website", "Book", "Journal Article", "Report", "Other"]; // Example types

  useEffect(() => {
    if (initialSource) {
      setTitle(initialSource.title || '');
      setAuthor(initialSource.author || '');
      setUrl(initialSource.url || '');
      setSourceType(initialSource.sourceType || '');
      setNotes(initialSource.notes || '');
    } else {
      setTitle('');
      setAuthor('');
      setUrl('');
      setSourceType('');
      setNotes('');
    }
  }, [initialSource]);

  const handleSave = () => {
    if (title.trim()) {
      onSave({
        title: title.trim(),
        author: author.trim(),
        url: url.trim(),
        sourceType: sourceType.trim(),
        notes: notes.trim(),
      });
      onClose(); // Close modal after saving
    } else {
      // Optionally, show an alert if the title is missing
      alert('Please enter at least a title for the source.');
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
      maxHeight: '80%', // Ensure modal doesn't get too tall
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
      flex: 1,
      marginRight: 10,
    },
    closeButton: {
      padding: 5,
    },
    scrollViewContent: {
      paddingBottom: 20, // Space for the save button if content is long
    },
    inputLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.inputBackground || colors.lightGray,
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      color: colors.text,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 10, // Add some margin at the top
    },
    saveButtonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    // Basic picker style - replace with a proper picker component if available
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 15,
      backgroundColor: colors.inputBackground || colors.lightGray,
    },
    picker: {
      height: 50, 
      width: '100%',
      color: colors.text,
    }
  });

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
              {initialSource ? 'Edit Source' : 'Add New Source'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle-outline" size={28} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.inputLabel}>Title*</Text>
            <TextInput
              style={styles.input}
              placeholder="Source Title (e.g., Article Name, Book Title)"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
              autoFocus={true}
            />

            <Text style={styles.inputLabel}>Author(s)</Text>
            <TextInput
              style={styles.input}
              placeholder="Author or Organization (e.g., John Doe, WHO)"
              placeholderTextColor={colors.textLight}
              value={author}
              onChangeText={setAuthor}
            />

            <Text style={styles.inputLabel}>URL/Link</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/source"
              placeholderTextColor={colors.textLight}
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
            />
            
            <Text style={styles.inputLabel}>Type of Source</Text>
            {/* Basic TextInput for type. For a better UX, replace with a Picker */}
            <TextInput
              style={styles.input}
              placeholder="e.g., Website, Book, Journal Article"
              placeholderTextColor={colors.textLight}
              value={sourceType}
              onChangeText={setSourceType}
            />
            {/* 
            // Example of using a Picker if you have one installed:
            // <View style={styles.pickerContainer}>
            //   <Picker
            //     selectedValue={sourceType}
            //     style={styles.picker}
            //     onValueChange={(itemValue) => setSourceType(itemValue)}
            //   >
            //     <Picker.Item label="Select a type..." value="" />
            //     {sourceTypes.map(type => (
            //       <Picker.Item key={type} label={type} value={type} />
            //     ))}
            //   </Picker>
            // </View>
            */}

            <Text style={styles.inputLabel}>Notes/Summary</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief summary or key takeaways..."
              placeholderTextColor={colors.textLight}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name={initialSource ? "checkmark-circle-outline" : "add-circle-outline"} size={22} color={colors.white} />
            <Text style={styles.saveButtonText}>{initialSource ? 'Update Source' : 'Save Source'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SourceInputModal;
