// filepath: c:\\Users\\USER\\Desktop\\SuperStudentAI\\mobile\\screens\\AIOutlineGeneratorScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { firestore, auth } from '../config/firebase'; // Assuming you might want to save generated outlines or associate with user

// Consistent styling (can be imported from a shared styles file or defined here)
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  background: '#F4F6F8', // Light Gray
  surface: '#FFFFFF', // White
  text: '#1A202C', // Dark Gray / Black
  textSecondary: '#4A5568', // Medium Gray
  textMuted: '#718096', // Light Gray
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0', // Light Border
  placeholder: '#A0AEC0',
  danger: '#E53E3E', // Red for delete
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: STATIC_COLORS.primaryDark },
  h2: { fontSize: 24, fontWeight: 'bold', color: STATIC_COLORS.text, marginBottom: 16 },
  h3: { fontSize: 20, fontWeight: '600', color: STATIC_COLORS.primary, marginBottom: 8 },
  body: { fontSize: 16, color: STATIC_COLORS.textSecondary, lineHeight: 24 },
  caption: { fontSize: 14, color: STATIC_COLORS.textMuted },
  button: { fontSize: 16, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const AIOutlineGeneratorScreen = ({ navigation }) => {
  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const userId = auth.currentUser?.uid;
  const [error, setError] = useState(''); // Added for displaying errors

  const generateOutlineWithAI = async (inputText) => {
    setIsLoading(true);
    setError(''); // Clear previous errors
    setOutline(''); // Clear previous outline

    try {
      // Assuming your backend is running on localhost:3000 or your configured port
      // You might want to put this URL in a config file
      const backendUrl = 'http://172.20.10.3.2:3000'; // Replace with your actual backend URL if different
      const response = await fetch(`${backendUrl}/api/ai/generate-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You might need to add an Authorization header if your backend requires it
          // 'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`,
        },
        body: JSON.stringify({ topic: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);
      if (data.outline) {
        return data.outline;
      } else {
        setError('Received an empty outline from the AI.');
        return 'Could not generate outline. No content received.';
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error generating outline:", err);
      setError(err.message || "An unexpected error occurred while generating the outline.");
      return `Failed to generate outline: ${err.message}`;
    }
  };

  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      Alert.alert("Input Required", "Please enter a topic or a brief description for your outline.");
      return;
    }
    const generatedOutline = await generateOutlineWithAI(topic);
    setOutline(generatedOutline);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={STATIC_COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Outline Generator</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Topic or Subject:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., The impact of AI on modern education"
            value={topic}
            onChangeText={setTopic}
            multiline
          />
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateOutline} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={STATIC_COLORS.textOnPrimary} />
            ) : (
              <Text style={styles.generateButtonText}>Generate Outline</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {outline ? (
          <View style={styles.outlineContainer}>
            <Text style={styles.outlineHeader}>Generated Outline:</Text>
            <ScrollView style={styles.outlineScrollView} nestedScrollEnabled={true}>
                <Text style={styles.outlineText}>{outline}</Text>
            </ScrollView>
            {/* Add options to copy, save, or refine outline later */}
          </View>
        ) : (
          !isLoading && <Text style={styles.placeholderText}>Your generated outline will appear here.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: STATIC_COLORS.primaryDark,
  },
  inputContainer: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: STATIC_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: STATIC_COLORS.background,
    borderColor: STATIC_COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body.fontSize,
    color: STATIC_COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top', // For multiline
    marginBottom: SPACING.md,
  },
  generateButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  generateButtonText: {
    ...TYPOGRAPHY.button,
  },
  errorContainer: { // Added error container style
    backgroundColor: '#FFEBEE', // Light red
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderColor: STATIC_COLORS.danger,
    borderWidth: 1,
  },
  errorText: { // Added error text style
    color: STATIC_COLORS.danger,
    fontSize: 15,
    textAlign: 'center',
  },
  outlineContainer: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 400, // Constrain height for scrollability
  },
  outlineHeader: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: STATIC_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  outlineScrollView: {
    maxHeight: 300, // Ensure text area is scrollable
  },
  outlineText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    lineHeight: 22,
    color: STATIC_COLORS.textSecondary,
  },
  placeholderText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: STATIC_COLORS.textMuted,
    marginTop: SPACING.xl,
  },
});

export default AIOutlineGeneratorScreen;
