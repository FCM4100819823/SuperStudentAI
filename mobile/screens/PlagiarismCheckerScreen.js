// filepath: c:\\Users\\USER\\Desktop\\SuperStudentAI\\mobile\\screens\\PlagiarismCheckerScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../config/firebase'; // For potential user-specific API usage or logging

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
  warning: '#FFA000', // Orange for warning scores
  success: '#388E3C', // Darker Green for success scores
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

const API_URL = 'http://172.20.10.2:3000/api/ai/check-plagiarism';

const PlagiarismCheckerScreen = ({ navigation }) => {
  const [textToCheck, setTextToCheck] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const userId = auth.currentUser?.uid;

  const handleCheckPlagiarism = async () => {
    if (!textToCheck.trim()) {
      Alert.alert("Input Required", "Please paste or type the text you want to check.");
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToCheck, userId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to check plagiarism.');
      }
      setResult({
        percentage: data.score * 100,
        sources: data.sources || [],
        details: data.details || '',
      });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage < 5) return STATIC_COLORS.success;
    if (percentage < 15) return STATIC_COLORS.warning;
    return STATIC_COLORS.danger;
  };

  const renderSourceItem = ({ item }) => (
    <TouchableOpacity onPress={() => item.url && Linking.openURL(item.url)} style={styles.sourceItem}>
      <Ionicons name="link-outline" size={20} color={STATIC_COLORS.primary} style={{marginRight: SPACING.sm}} />
      <View style={{flex: 1}}>
        <Text style={styles.sourceTitle}>{item.title}</Text>
        {item.url && <Text style={styles.sourceUrl} numberOfLines={1}>{item.url}</Text>}
        <Text style={styles.sourceSimilarity}>Similarity: {item.similarity}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={STATIC_COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plagiarism Checker</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Paste Text to Check:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter or paste your text here..."
            value={textToCheck}
            onChangeText={setTextToCheck}
            multiline
            scrollEnabled={true}
          />
          <TouchableOpacity style={styles.actionButton} onPress={handleCheckPlagiarism} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={STATIC_COLORS.textOnPrimary} />
            ) : (
              <><Ionicons name="scan-outline" size={20} color={STATIC_COLORS.textOnPrimary} style={{marginRight: SPACING.sm}} /><Text style={styles.actionButtonText}>Check for Plagiarism</Text></>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result && !isLoading && (
          <View style={styles.resultSection}>
            <Text style={styles.resultHeader}>Plagiarism Report</Text>
            <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Similarity Score:</Text>
                <Text style={[styles.scorePercentage, { color: getScoreColor(result.percentage) }]}>
                    {result.percentage.toFixed(2)}%
                </Text>
            </View>
            {result.percentage > 0 && result.sources && result.sources.length > 0 && (
                <>
                    <Text style={styles.sourcesHeader}>Potential Sources Found:</Text>
                    <FlatList
                        data={result.sources}
                        renderItem={renderSourceItem}
                        keyExtractor={item => item.id}
                        nestedScrollEnabled={true}
                        style={styles.sourceList}
                    />
                </>
            )}
            {result.percentage === 0 && (
                <Text style={styles.noPlagiarismText}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={STATIC_COLORS.success} /> No significant plagiarism detected.
                </Text>
            )}
          </View>
        )}
        {!result && !isLoading && !error && (
            <Text style={styles.placeholderText}>Results will appear here after checking.</Text>
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
    fontSize: 26, // Slightly smaller for this screen
  },
  inputSection: {
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
    minHeight: 150, // Increased height
    maxHeight: 300, // Max height before scroll
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  actionButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderColor: STATIC_COLORS.danger,
    borderWidth: 1,
  },
  errorText: {
    color: STATIC_COLORS.danger,
    fontSize: 15,
    textAlign: 'center',
  },
  resultSection: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    textAlign: 'center',
    color: STATIC_COLORS.primaryDark,
    marginBottom: SPACING.md,
  },
  scoreCard: {
    backgroundColor: STATIC_COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreLabel: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    fontSize: 16,
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  sourcesHeader: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: STATIC_COLORS.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sourceList: {
    maxHeight: 250, // Limit height and make scrollable if many sources
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
    padding: SPACING.sm,
    borderRadius: 6,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: STATIC_COLORS.border,
  },
  sourceTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: STATIC_COLORS.text,
    flexShrink: 1, 
  },
  sourceUrl: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.primaryLight,
    textDecorationLine: 'underline',
    marginBottom: SPACING.xs,
  },
  sourceSimilarity: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
  },
  noPlagiarismText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.success,
    textAlign: 'center',
    paddingVertical: SPACING.md,
    fontSize: 16,
  },
  placeholderText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: STATIC_COLORS.textMuted,
    marginTop: SPACING.xl,
    fontStyle: 'italic',
  },
});

export default PlagiarismCheckerScreen;
