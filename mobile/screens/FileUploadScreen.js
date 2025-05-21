import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ScrollView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { auth } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const backendUrl = 'http://172.20.10.4:5000';

const FileUploadScreen = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigation = useNavigation(); // Initialize navigation

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
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('You must be logged in.');
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
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('You must be logged in.');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload a File</Text>
      <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
        <MaterialIcons name="attach-file" size={24} color="#fff" />
        <Text style={styles.pickButtonText}>{file ? file.name : 'Choose File'}</Text>
      </TouchableOpacity>
      {file && (
        <TouchableOpacity style={styles.uploadButton} onPress={uploadFile} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadButtonText}>Upload & Parse</Text>}
        </TouchableOpacity>
      )}
      {/* Syllabus OCR upload button */}
      {file && (
        <TouchableOpacity style={[styles.uploadButton, { backgroundColor: '#007bff' }]} onPress={uploadSyllabus} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadButtonText}>Syllabus OCR & Extract</Text>}
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>AI Result:</Text>
          <Text style={styles.resultText}>{JSON.stringify(result.aiResult, null, 2)}</Text>
          <Text style={styles.resultTitle}>File URL:</Text>
          <Text style={styles.resultText}>{result.url}</Text>
        </View>
      )}
      {result && result.ocrText && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>OCR Text:</Text>
          <Text style={styles.resultText}>{result.ocrText}</Text>
          <Text style={styles.resultTitle}>NLP Extracted Data:</Text>
          <Text style={styles.resultText}>{JSON.stringify(result.nlpResult, null, 2)}</Text>
          <Text style={styles.resultTitle}>File URL:</Text>
          <Text style={styles.resultText}>{result.url}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#4169E1' },
  pickButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4169E1', padding: 14, borderRadius: 25, marginBottom: 18 },
  pickButtonText: { color: '#fff', fontSize: 16, marginLeft: 10 },
  uploadButton: { backgroundColor: '#28a745', padding: 14, borderRadius: 25, marginBottom: 18, width: 180, alignItems: 'center' },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#FF6347', marginTop: 10, textAlign: 'center' },
  resultBox: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginTop: 20, width: '100%' },
  resultTitle: { fontWeight: 'bold', color: '#4169E1', marginBottom: 6 },
  resultText: { color: '#333', fontSize: 14, marginBottom: 10 },
});

export default FileUploadScreen;
