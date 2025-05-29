import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image, SafeAreaView } from 'react-native'; // Added Image and SafeAreaView
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios'; // Import axios
import * as DocumentPicker from 'expo-document-picker'; // Import DocumentPicker

const API_BASE_URL = 'http://172.20.10.2:3000/api/ai'; // Ensure this is your computer's IP address
const NLP_API_ENDPOINT = `${API_BASE_URL}/nlp`;
const SYLLABUS_TEXT_ANALYSIS_ENDPOINT = `${API_BASE_URL}/syllabus/analyze-text`;
const SYLLABUS_FILE_ANALYSIS_ENDPOINT = `${API_BASE_URL}/syllabus/analyze-file`;

const AIScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! How can I help you study today? You can ask me to analyze syllabus text or upload a syllabus file.', sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const scrollViewRef = useRef(null);

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
      // Remove model from payload, backend will handle model selection
      let payload = { text: currentInput };

      if (isSyllabusTextAnalysis) {
        endpoint = SYLLABUS_TEXT_ANALYSIS_ENDPOINT;
        const syllabusText = currentInput.substring(currentInput.toLowerCase().indexOf('syllabus text:') + 'syllabus text:'.length).trim();
      }

      console.log(`Sending to ${endpoint} with payload:`, payload);

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: isSyllabusTextAnalysis ? 30000 : 13000,
      });
      
      let aiResponseText = '';

      if (isSyllabusTextAnalysis && response.data.analysis) {
        const { assignments, topics, dates } = response.data.analysis;
        aiResponseText = `Syllabus Text Analysis Complete:\n\nAssignments (${assignments.length}):\n${assignments.map(a => `- ${a.name}${a.dueDate ? ` (Due: ${a.dueDate.dateString})` : ''}`).join('\n')}\n\nTopics (${topics.length}):\n${topics.map(t => `- ${t.name}`).join('\n')}\n\nKey Dates Found (${dates.length}):\n${dates.map(d => `- ${d.dateString}${d.parsedDate ? ` (Parsed: ${new Date(d.parsedDate).toLocaleDateString()})` : ''}`).join('\n')}`;
      } else if (response.data.result && typeof response.data.result === 'string') { // Check for string first
        aiResponseText = response.data.result;
      } else if (response.data.result && Array.isArray(response.data.result) && response.data.result[0]?.generated_text) { // Then check for the array structure
        aiResponseText = response.data.result[0].generated_text;
      } else if (response.data.generated_text && typeof response.data.generated_text === 'string') { // Check for top-level generated_text (OpenRouter direct response)
        aiResponseText = response.data.generated_text;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F0F0' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: '#F0F0F0' }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {messages.map((entry, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                entry.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={[
                styles.messageText, // Base text style
                entry.sender === 'user' ? styles.userMessageText : styles.aiMessageText // Conditional text style
              ]}>
                {entry.text}
              </Text>
            </View>
          ))}
          {isTyping && (
            <View style={styles.typingIndicatorContainer}>
              <Image source={require('../assets/superstudentlogo.png')} style={styles.typingAvatar} />
              <Text style={styles.typingIndicator}>AI is typing...</Text>
              {/* ActivityIndicator was previously commented out, keeping it that way */}
            </View>
          )}
        </ScrollView>
        <View style={[styles.inputContainer, { borderTopColor: '#CCCCCC' }]}>
          <TextInput
            style={styles.input} // Simplified style array for clarity during debugging
            value={input}
            onChangeText={setInput}
            placeholder="Ask SuperStudent AI..."
            placeholderTextColor="#A0A0A0"
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: '#007AFF' }]}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="send" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 20,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF', // User bubble background
  },
  aiBubble: {
    backgroundColor: '#E5E5EA', // AI bubble background
  },
  messageText: { // Base style for message text
    fontSize: 16,
    padding: 2, // Add slight padding inside the text component if needed
  },
  userMessageText: { // Style for user message text
    color: '#FFFFFF',
  },
  aiMessageText: { // Style for AI message text
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF', 
    color: '#333333', 
    borderColor: '#CCCCCC',
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  typingIndicator: {
    fontSize: 16,
    color: '#333333',
  },
});

export default AIScreen;
