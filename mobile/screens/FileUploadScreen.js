import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth'; // Import getAuth

const backendUrl = 'http://172.20.10.2:3000'; // Ensure this is your correct backend URL

const FileUploadScreen = ({ navigation, route }) => {
  const { uploadType, nextPage, studyPlanId } = route.params || {}; // Get uploadType and nextPage
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const auth = getAuth(); // Get auth instance
  const user = auth.currentUser; // Get current user

  const pickFile = async () => {
    setError('');
    setResult(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (res.type === 'success') {
        setFile(res);
      }
    } catch (e) {
      setError('Failed to pick file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!user) {
      Alert.alert("Authentication Error", "You must be logged in to upload files.");
      setUploading(false);
      return;
    }

    if (uploadType === 'syllabus') {
      await uploadSyllabusInternal();
    } else {
      await uploadGenericFileInternal();
    }
  };

  // Renamed original uploadFile to uploadGenericFileInternal
  const uploadGenericFileInternal = async () => {
    setUploading(true);
    setError('');
    setResult(null);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name, // Ensure file.name is used
        type: file.mimeType || 'application/octet-stream',
      });
      if (user && user.uid) { // Check if user and user.uid exist
        formData.append('userId', user.uid);
      } else {
        setError('User not authenticated.');
        setUploading(false);
        return;
      }
      if (studyPlanId) { // If studyPlanId is available, append it
        formData.append('studyPlanId', studyPlanId);
      }
      const response = await fetch(`${backendUrl}/file/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      setResult(data);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Renamed original uploadSyllabus to uploadSyllabusInternal
  const uploadSyllabusInternal = async () => {
    setUploading(true);
    setError('');
    setResult(null);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name, // Ensure file.name is used
        type: file.mimeType || 'application/pdf', // Default to PDF for syllabus, or use detected type
      });
      if (user && user.uid) { // Check if user and user.uid exist
        formData.append('userId', user.uid);
      } else {
        setError('User not authenticated.');
        setUploading(false);
        return;
      }
      const response = await fetch(`${backendUrl}/file/syllabus-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || 'Syllabus upload failed');
      setResult(data);
      // Navigate to the specified nextPage (SyllabusAnalysisResult) on successful syllabus OCR
      if (nextPage && data.analysisId) { // Use a generic analysisId from backend
        navigation.navigate(nextPage, {
          analysisId: data.analysisId,
          fileName: file.name, // Pass file name for display
        });
      } else if (data.message) { // Handle cases where analysisId might not be present but a message is
        Alert.alert("Syllabus Processing", data.message);
      }
    } catch (e) {
      setError(e.message || 'Syllabus upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainerScroll}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {uploadType === 'syllabus' ? 'Upload Syllabus' : 'Upload File'}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <Image
          source={uploadType === 'syllabus' ? require('../assets/adaptive-icon.png') : require('../assets/superstudentlogo.png')} // Different icon for syllabus
          style={styles.logo}
        />
        <Text style={styles.title}>
          {uploadType === 'syllabus' ? 'Syllabus Analyzer' : 'Share Your Study Materials'}
        </Text>
        <Text style={styles.subtitle}>
          {uploadType === 'syllabus' 
            ? 'Upload your course syllabus (PDF, DOCX, JPG, PNG). We\'ll extract key dates and topics.'
            : 'Upload documents, notes, or presentations.'}
          {studyPlanId && uploadType !== 'syllabus' ? ' They will be linked to your study plan.' : ''}
        </Text>

        <TouchableOpacity
          style={[styles.uploadButton, !file ? styles.disabledButton : {}]}
          onPress={handleUpload} // Changed to handleUpload
          disabled={!file || uploading}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={28}
            color="#FFFFFF"
            style={styles.uploadIcon}
          />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : (uploadType === 'syllabus' ? 'Analyze Syllabus' : 'Upload File')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectFileButton} // New style for select file button
          onPress={pickFile}
          disabled={uploading}
        >
          <Ionicons
            name="document-attach-outline"
            size={24}
            color={STATIC_COLORS.primary} // Use primary color
            style={styles.selectFileIcon}
          />
          <Text style={styles.selectFileButtonText}>
            {file ? `Selected: ${file.name}` : 'Select a File'}
          </Text>
        </TouchableOpacity>
        
        {file && !uploading && ( // Show clear file button if a file is selected and not uploading
          <TouchableOpacity onPress={() => setFile(null)} style={styles.clearFileButton}>
            <Ionicons name="close-circle-outline" size={20} color={STATIC_COLORS.error} />
            <Text style={styles.clearFileButtonText}>Clear Selection</Text>
          </TouchableOpacity>
        )}

        {uploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Uploading: {progress.toFixed(2)}%
            </Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        )}

        {result && !uploading && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color={STATIC_COLORS.green} />
            <Text style={styles.successText}>
              {uploadType === 'syllabus' && result.message ? result.message : 'File uploaded successfully!'}
            </Text>
            {uploadType !== 'syllabus' && result.url && (
                <TouchableOpacity
                onPress={() => Alert.alert('File URL', result.url)}
              >
                <Text style={styles.linkText}>View Uploaded File (URL)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.uploadAnotherButton}
              onPress={() => {
                setFile(null);
                setResult(null);
                setError('');
                pickFile();
              }}
            >
              <Text style={styles.uploadAnotherButtonText}>
                {uploadType === 'syllabus' ? 'Upload Another Syllabus' : 'Upload Another File'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error && !uploading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={STATIC_COLORS.error} />
            <Text style={styles.errorText}>Upload Failed: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={pickFile}> 
              <Text style={styles.retryButtonText}>Select Different File</Text>
            </TouchableOpacity>
            {file && // Offer to retry upload of the same file if one was selected
                <TouchableOpacity style={[styles.retryButton, {marginTop: SPACING.sm}]} onPress={handleUpload}>
                    <Text style={styles.retryButtonText}>Retry Upload</Text>
                </TouchableOpacity>
            }
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Define STATIC_COLORS and SPACING if not already globally available or imported
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A148C',
  secondary: '#4CAF50', // Green
  background: '#F5F5F5', // Light grey background
  surface: '#FFFFFF', // White for cards
  text: '#333333', // Dark grey for text
  textSecondary: '#757575', // Medium grey for secondary text
  textOnPrimary: '#FFFFFF',
  error: '#D32F2F', // Red for errors
  green: '#388E3C', // Green for success
  shadow: '#000000',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background, // Updated background
  },
  contentContainerScroll: { // Added for ScrollView content
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: STATIC_COLORS.surface, // White header
    paddingTop: Platform.OS === 'android' ? 25 + SPACING.sm : 50 + SPACING.sm, // Adjusted padding
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center', // Removed to allow back button to be on left easily
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Light border
  },
  backButton: {
    position: 'absolute', // Keeps it to the left
    left: SPACING.md,
    top: Platform.OS === 'android' ? 25 + SPACING.sm : 50 + SPACING.sm, // Align with paddingTop
    zIndex: 1,
    padding: SPACING.xs, // Add some padding for easier touch
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: STATIC_COLORS.text, // Dark text
    textAlign: 'center', // Center title
    flex: 1, // Allow title to take available space for centering
    marginLeft: -SPACING.lg, // Adjust for back button if it pushes title
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg, // Increased padding
  },
  logo: {
    width: 120, // Slightly larger logo
    height: 120,
    resizeMode: 'contain',
    marginBottom: SPACING.lg,
    // tintColor: STATIC_COLORS.primary, // Apply primary color tint
  },
  title: {
    fontSize: 26, // Larger title
    fontWeight: '600', // Semi-bold
    color: STATIC_COLORS.primaryDark, // Use primary dark color
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: STATIC_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl, // More space before buttons
    paddingHorizontal: SPACING.sm,
  },
  selectFileButton: { // Styles for the new select file button
    backgroundColor: STATIC_COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: STATIC_COLORS.primary,
    borderWidth: 1,
    marginBottom: SPACING.md, // Space before the upload button
    width: '100%', // Full width
  },
  selectFileIcon: {
    marginRight: SPACING.sm,
  },
  selectFileButtonText: {
    color: STATIC_COLORS.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: STATIC_COLORS.primary, // Use primary color
    paddingVertical: SPACING.md, // Standardized padding
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 }, // Slightly more shadow
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4, // Standard elevation
    marginBottom: SPACING.md,
    width: '100%', // Full width
  },
  disabledButton: {
    backgroundColor: '#BDBDBD', // Grey out button when disabled (e.g., no file selected)
    elevation: 0,
    shadowOpacity: 0,
  },
  uploadIcon: {
    marginRight: SPACING.sm,
  },
  uploadButtonText: {
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  clearFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  clearFileButtonText: {
    marginLeft: SPACING.xs,
    color: STATIC_COLORS.error,
    fontSize: 14,
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressText: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    width: '100%',
    backgroundColor: '#E0E0E0', // Lighter grey for progress bar background
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: STATIC_COLORS.primary, // Use primary color for progress fill
    borderRadius: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: SPACING.lg,
    width: '100%', // Full width
  },
  successText: {
    fontSize: 18, // Larger success text
    fontWeight: '500',
    color: STATIC_COLORS.green, // Use defined green color
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  linkText: {
    color: STATIC_COLORS.primary, // Use primary color for links
    fontSize: 15,
    textDecorationLine: 'underline',
    marginBottom: SPACING.lg,
  },
  uploadAnotherButton: {
    backgroundColor: STATIC_COLORS.secondary, // Use secondary color
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%', // Slightly less than full width
  },
  uploadAnotherButtonText: {
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: SPACING.lg,
    width: '100%', // Full width
  },
  errorText: {
    fontSize: 18, // Larger error text
    fontWeight: '500',
    color: STATIC_COLORS.error, // Use defined error color
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: { // Style for retry/try again button
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  retryButtonText: {
    color: STATIC_COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FileUploadScreen;
