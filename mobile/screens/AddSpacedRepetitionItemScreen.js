import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Expo for icons
import { API_BASE_URL } from '../config'; // Assuming you have a config file for your API base URL

const AddSpacedRepetitionItemScreen = ({ navigation }) => {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [deck, setDeck] = useState(''); // Optional: for categorizing items
    const [tags, setTags] = useState(''); // Optional: comma-separated tags
    const [isLoading, setIsLoading] = useState(false);

    const handleAddItem = async () => {
        if (!front.trim() || !back.trim()) {
            Alert.alert('Missing Information', 'Please provide at least the front and back content for the item.');
            return;
        }
        setIsLoading(true);
        try {
            // Assuming you have a way to get the userId, e.g., from auth context
            // For now, let's hardcode or assume it's handled by backend session/token
            // const userId = "some-user-id"; 

            const newItem = {
                front: front.trim(),
                back: back.trim(),
                deck: deck.trim() || 'Default', // Default deck if not specified
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Process tags
                // userId will be added by the backend via authMiddleware
            };

            const response = await axios.post(`${API_BASE_URL}/api/srs/add`, newItem, {
                // headers: { Authorization: `Bearer YOUR_AUTH_TOKEN` } // Include if auth is token-based
            });

            if (response.status === 201) {
                Alert.alert('Success', 'New item added to your Spaced Repetition System.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
                setFront('');
                setBack('');
                setDeck('');
                setTags('');
            } else {
                Alert.alert('Error', 'Could not add the item. Please try again.');
            }
        } catch (error) {
            console.error('Error adding SRS item:', error.response ? error.response.data : error.message);
            Alert.alert('Error', `An error occurred: ${error.response ? error.response.data.message : error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Add New SRS Item</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Front (Question/Prompt)</Text>
                    <TextInput
                        style={styles.input}
                        value={front}
                        onChangeText={setFront}
                        placeholder="e.g., What is the capital of France?"
                        placeholderTextColor={'#A0A0A0'}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Back (Answer/Details)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={back}
                        onChangeText={setBack}
                        placeholder="e.g., Paris"
                        placeholderTextColor={'#A0A0A0'}
                        multiline
                    />
                </View>

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
                    <Text style={styles.buttonText}>{isLoading ? 'Adding...' : 'Add Item'}</Text>
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
