import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const backendUrl = 'http://172.20.10.3:5000';

const FileUploadScreen = ({ navigation, route }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors); // Get styles based on theme

  const { studyPlanId } = route.params || {}; // Get studyPlanId if passed
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

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

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
      formData.append('userId', user.uid);
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

  const uploadSyllabus = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'image/jpeg',
      });
      formData.append('userId', user.uid);
      const response = await fetch(`${backendUrl}/file/syllabus-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Syllabus upload failed');
      setResult(data);
      // Navigate to CreateStudyPlanScreen on successful syllabus OCR
      if (data.syllabusAnalysisId && data.syllabusTitle) {
        navigation.navigate('CreateStudyPlan', { 
          syllabusAnalysisId: data.syllabusAnalysisId,
          syllabusTitle: data.syllabusTitle 
        });
      }
    } catch (e) {
      setError(e.message || 'Syllabus upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Files</Text>
      </View>

      <View style={styles.contentContainer}>
        <Image source={require('../assets/superstudentlogo.png')} style={styles.logo} />
        <Text style={styles.title}>Share Your Study Materials</Text>
        <Text style={styles.subtitle}>
          Upload documents, notes, or presentations.
          {studyPlanId ? " They will be linked to your study plan." : ""}
        </Text>

        <TouchableOpacity style={styles.uploadButton} onPress={pickFile} disabled={uploading}>
          <Ionicons name="cloud-upload-outline" size={28} color={colors.buttonText} style={styles.uploadIcon} />
          <Text style={styles.uploadButtonText}>Select File to Upload</Text>
        </TouchableOpacity>

        {uploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Uploading: {progress.toFixed(2)}%</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {result && !uploading && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color={colors.success} /> {/* Fix: Use colors.success instead of theme.colors.success */}
            <Text style={styles.successText}>File uploaded successfully!</Text>
            <TouchableOpacity onPress={() => Alert.alert("File URL", result.url)}>
              <Text style={styles.linkText}>View Uploaded File (URL)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadAnotherButton} onPress={pickFile}>
              <Text style={styles.uploadAnotherButtonText}>Upload Another File</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && !uploading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={colors.error} /> {/* Fix: Use colors.error instead of theme.colors.error */}
            <Text style={styles.errorText}>Upload Failed: {error}</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
              <Text style={styles.uploadButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap StyleSheet.create
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'android' ? 25 : 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center title
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'android' ? 28 : 53, // Adjust to align with centered title
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.headerText,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
    tintColor: colors.primary, // Tint logo with primary color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadButtonText: {
    color: colors.buttonText,
    fontSize: 17,
    fontWeight: '600',
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressText: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: 20,
    width: '90%',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 15,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  uploadAnotherButton: {
    backgroundColor: colors.secondary, // Or another appropriate color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  uploadAnotherButtonText: {
    color: colors.buttonText, // Ensure contrast if secondary is light
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: 20,
    width: '90%',
  },
  errorText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default FileUploadScreen;
