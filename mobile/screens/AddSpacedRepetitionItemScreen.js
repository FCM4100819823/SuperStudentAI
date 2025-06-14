import React, { useState, useEffect } from 'react'; // Added useEffect
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Expo for icons
import { API_BASE_URL } from '../config/appConfig.js'; // Added .js extension
import firebase from 'firebase/app'; // Import Firebase app
import 'firebase/auth'; // Import Firebase auth

const AddSpacedRepetitionItemScreen = ({ navigation, route }) => {
  // Added route
  const [originalContent, setOriginalContent] = useState(''); // Renamed from front
  const [answerContent, setAnswerContent] = useState(''); // Renamed from back
  // const [deck, setDeck] = useState(''); // Optional: for categorizing items - Removing for now, can be added later if needed
  const [tags, setTags] = useState(''); // Optional: comma-separated tags
  const [studyPlanId, setStudyPlanId] = useState(null); // Added studyPlanId
  const [taskId, setTaskId] = useState(null); // Added taskId
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null); // State to hold the auth token

  useEffect(() => {
    // If studyPlanId or taskId are passed via route params, set them
    if (route.params?.studyPlanId) {
      setStudyPlanId(route.params.studyPlanId);
    }
    if (route.params?.taskId) {
      setTaskId(route.params.taskId);
    }

    const fetchToken = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          setAuthToken(token);
        } else {
          // Handle case where user is not logged in, if necessary
          console.log('No user logged in to fetch token.');
          // You might want to navigate to a login screen or show an alert
        }
      } catch (error) {
        console.error('Error fetching auth token:', error);
        Alert.alert(
          'Authentication Error',
          'Could not fetch authentication token. Please try logging in again.',
        );
      }
    };

    fetchToken();
    // Listen for auth state changes to update token if user logs in/out
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleAddItem = async () => {
    if (!originalContent.trim() || !answerContent.trim()) {
      // Changed from front and back
      Alert.alert(
        'Missing Information',
        'Please provide at least the front (original content) and back (answer content) for the item.', // Updated message
      );
      return;
    }
    if (!authToken) {
      Alert.alert(
        'Authentication Error',
        'You are not authenticated. Please log in.',
      );
      return;
    }
    setIsLoading(true);
    try {
      const newItem = {
        originalContent: originalContent.trim(), // Changed from front
        answerContent: answerContent.trim(), // Changed from back
        // deck: deck.trim() || 'Default', // Removing deck for now
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        // Conditionally add studyPlanId and taskId
        ...(studyPlanId && { studyPlanId }),
        ...(taskId && { taskId }),
        // userId will be added by the backend via authMiddleware
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/srs/items`, // Corrected endpoint
        newItem,
        {
          headers: { Authorization: `Bearer ${authToken}` }, // Include auth token
        },
      );

      if (response.status === 201) {
        Alert.alert(
          'Success',
          'New item added to your Spaced Repetition System.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        setOriginalContent(''); // Changed from setFront
        setAnswerContent(''); // Changed from setBack
        // setDeck(''); // Removing deck
        setTags('');
      } else {
        Alert.alert('Error', 'Could not add the item. Please try again.');
      }
    } catch (error) {
      console.error(
        'Error adding SRS item:',
        error.response ? error.response.data : error.message,
      );
      Alert.alert(
        'Error',
        `An error occurred: ${error.response ? error.response.data.message : error.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add New SRS Item</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Front (Question/Prompt)</Text>
          <TextInput
            style={styles.input}
            value={originalContent} // Changed from front
            onChangeText={setOriginalContent} // Changed from setFront
            placeholder="e.g., What is the capital of France?"
            placeholderTextColor={'#A0A0A0'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Back (Answer/Details)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={answerContent} // Changed from back
            onChangeText={setAnswerContent} // Changed from setBack
            placeholder="e.g., Paris"
            placeholderTextColor={'#A0A0A0'}
            multiline
          />
        </View>

        {/* Removing Deck input for now
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Deck (Optional)</Text>
          <TextInput
            style={styles.input}
            value={deck}
            onChangeText={setDeck}
            placeholder="e.g., Geography, Programming"
            placeholderTextColor={'#A0A0A0'}
          />
        </View>
        */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tags (Optional, comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g., europe, capitals, javascript"
            placeholderTextColor={'#A0A0A0'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={handleAddItem}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Adding...' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    color: '#333333',
    borderColor: '#CCCCCC',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333333',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default AddSpacedRepetitionItemScreen;
