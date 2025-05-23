import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';

const NLP_API_ENDPOINT = 'http://localhost:3000/api/ai/nlp';
const SYLLABUS_TEXT_ANALYSIS_ENDPOINT = 'http://localhost:3000/api/ai/syllabus/analyze-text';
const SYLLABUS_FILE_ANALYSIS_ENDPOINT = 'http://localhost:3000/api/ai/syllabus/analyze-file';

const AIScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors);
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! How can I help you study today? You can ask me to analyze syllabus text or upload a syllabus file.', sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'], // Allow PDFs and images
        copyToCacheDirectory: true,
      });

      // console.log('Document Picker Result:', result); // Log the entire result

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileAsset = result.assets[0];
        
        if (!fileAsset.uri || !fileAsset.name || !fileAsset.mimeType) {
          Alert.alert('Error', 'Failed to get file details. Please try again.');
          console.error('File asset is missing crucial properties:', fileAsset);
          return;
        }

        setLoading(true);
        setIsTyping(true);
        const userMessage = { id: Date.now().toString(), text: `Uploaded file: ${fileAsset.name}`, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, userMessage]);

        const formData = new FormData();
        formData.append('syllabusFile', {
          uri: fileAsset.uri,
          name: fileAsset.name,
          type: fileAsset.mimeType,
        });

        const response = await axios.post(SYLLABUS_FILE_ANALYSIS_ENDPOINT, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Increased timeout for file upload and OCR
        });
        
        let aiResponseText = '';
        if (response.data && response.data.analysis) {
          const { analysis, ocrText } = response.data;
          const { assignments, topics, dates } = analysis;
          aiResponseText = `Syllabus File Analysis Complete:\n\nOCR Extracted Text (Snippet):\n"${ocrText.substring(0, 200)}..."\n\nAssignments (${assignments.length}):\n${assignments.map(a => `- ${a.name}${a.dueDate ? ` (Due: ${a.dueDate.dateString})` : ''}`).join('\n')}\n\nTopics (${topics.length}):\n${topics.map(t => `- ${t.name}`).join('\n')}\n\nKey Dates Found (${dates.length}):\n${dates.map(d => `- ${d.dateString}${d.parsedDate ? ` (Parsed: ${new Date(d.parsedDate).toLocaleDateString()})` : ''}`).join('\n')}`;
        } else if (response.data.message) {
          aiResponseText = response.data.message;
        } else {
          aiResponseText = "Received a response, but couldn't format it.";
        }
        const aiResponse = { id: Date.now().toString() + 'ai_file', text: aiResponseText, sender: 'ai' };
        setMessages(prevMessages => [...prevMessages, aiResponse]);

      } else if (result.canceled) {
        // console.log('User cancelled document picker');
      } else {
        // console.log('Document picker result was not successful or assets are missing:', result);
        Alert.alert('File Upload Failed', 'Could not select the file. Please try again.');
      }
    } catch (error) {
      console.error("File Upload or Analysis Error:", error.response ? error.response.data : error);
      Alert.alert('Error', `File upload or analysis failed: ${error.message}`);
      const errorResponse = { id: Date.now().toString() + 'err_file', text: 'Sorry, I encountered an error processing your file.', sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const newMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      const isSyllabusTextAnalysis = currentInput.toLowerCase().includes('analyze syllabus text:') || currentInput.toLowerCase().startsWith('syllabus text:');
      
      let endpoint = NLP_API_ENDPOINT;
      let payload = { text: currentInput, model: 'mistralai/Mistral-7B-Instruct-v0.1' };

      if (isSyllabusTextAnalysis) {
        endpoint = SYLLABUS_TEXT_ANALYSIS_ENDPOINT;
        const syllabusText = currentInput.substring(currentInput.toLowerCase().indexOf('syllabus text:') + 'syllabus text:'.length).trim();
        payload = { syllabusText: syllabusText }; 
      }

      console.log(`Sending to ${endpoint} with payload:`, payload);

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: isSyllabusTextAnalysis ? 30000 : 15000,
      });
      
      let aiResponseText = '';

      if (isSyllabusTextAnalysis && response.data.analysis) {
        const { assignments, topics, dates } = response.data.analysis;
        aiResponseText = `Syllabus Text Analysis Complete:\n\nAssignments (${assignments.length}):\n${assignments.map(a => `- ${a.name}${a.dueDate ? ` (Due: ${a.dueDate.dateString})` : ''}`).join('\n')}\n\nTopics (${topics.length}):\n${topics.map(t => `- ${t.name}`).join('\n')}\n\nKey Dates Found (${dates.length}):\n${dates.map(d => `- ${d.dateString}${d.parsedDate ? ` (Parsed: ${new Date(d.parsedDate).toLocaleDateString()})` : ''}`).join('\n')}`;
      } else if (response.data.result && Array.isArray(response.data.result) && response.data.result[0]?.generated_text) {
        aiResponseText = response.data.result[0].generated_text;
      } else if (response.data.result && typeof response.data.result === 'string') {
        aiResponseText = response.data.result;
      } else if (response.data.message) {
        aiResponseText = response.data.message;
      } else {
        aiResponseText = "Received a response, but couldn't format it.";
        console.log("Unexpected AI response structure:", response.data);
      }

      const aiResponse = { id: Date.now().toString() + 'ai_text', text: aiResponseText, sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

    } catch (error) {
      console.error("AI Chat Error:", error.response ? error.response.data : error);
      const errorResponse = { id: Date.now().toString() + 'err_text', text: 'Sorry, I encountered an error. Please try again.', sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUserMessage = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUserMessage ? styles.userMessage : styles.aiMessage]}>
        {!isUserMessage && (
          <Image source={require('../assets/superstudentlogo.png')} style={styles.aiAvatar} />
        )}
        <View> 
          <Text style={[
            styles.messageText, // Common base style
            isUserMessage ? styles.userMessageText : styles.aiMessageText // Conditional color
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Adjust as needed
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SuperStudent AI Assistant</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={{ paddingBottom: 10 }} // Add padding to bottom of content
        // The following two are often helpful for auto-scrolling, but test behavior
        // onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        // onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      {isTyping && (
        <View style={styles.typingIndicatorContainer}>
          <Image source={require('../assets/superstudentlogo.png')} style={styles.typingAvatar} />
          <Text style={styles.typingIndicator}>AI is typing...</Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 5 }} />
        </View>
      )}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleFileUpload} disabled={loading}>
          <Ionicons name="attach" size={28} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask SuperStudent AI..."
          placeholderTextColor={colors.subtext}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <Ionicons name="send" size={24} color={colors.buttonText} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors) => StyleSheet.create({ 
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Adjust for status bar
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.headerText,
  },
  messageList: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  aiMessage: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 2,
    backgroundColor: colors.cardLight || '#F0F4F8',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: { // Base style for all message text
    fontSize: 16,
  },
  userMessageText: { // Specific style for user message text
    color: colors.buttonText, 
  },
  aiMessageText: { // Specific style for AI message text
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Adjusted for attach button
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card, // Input area background
  },
  attachButton: {
    padding: 5,
    marginRight: 5,
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120, // Allow for multi-line input
    backgroundColor: colors.inputBackground,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    placeholderTextColor: colors.subtext,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  typingIndicator: {
    fontSize: 14,
    color: colors.subtext,
    fontStyle: 'italic',
  },
});

export default AIScreen;
