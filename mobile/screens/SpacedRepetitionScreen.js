// c:\Users\USER\Desktop\SuperStudentAI\SuperStudentAI\mobile\screens\SpacedRepetitionScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

// Replace with your actual backend URL and endpoint
const API_URL = 'http://172.20.10.3:5000/api'; // Ensure this is your backend URL
const SRS_ENDPOINT = `${API_URL}/srs`;

const SpacedRepetitionScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors);

    const auth = getAuth();

    const [dueItems, setDueItems] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isReviewing, setIsReviewing] = useState(false); // To manage review session state
    const [showAnswer, setShowAnswer] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const fetchDueItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert("Authentication Error", "No user logged in.");
                setIsLoading(false);
                return;
            }
            const token = await user.getIdToken();
            const response = await axios.get(`${SRS_ENDPOINT}/items/due`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDueItems(response.data || []);
            setCurrentItemIndex(0);
            setShowAnswer(false);
            setFeedbackGiven(false);
            setIsReviewing(response.data && response.data.length > 0);
        } catch (error) {
            console.error("Error fetching due SRS items:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to fetch review items. " + (error.response?.data?.message || error.message));
            setDueItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [auth]);

    useFocusEffect(fetchDueItems);

    const handleReviewAction = async (itemId, quality) => {
        if (!itemId) return;
        setFeedbackGiven(true); // Indicate feedback has been processed for the current view

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            await axios.put(`${SRS_ENDPOINT}/items/${itemId}/review`, 
                { quality },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Optimistically move to next or refresh if it was the last item
            if (currentItemIndex >= dueItems.length - 1) {
                Alert.alert("Review Complete", "You've reviewed all due items for now!");
                fetchDueItems(); // Refresh list, might be empty now
            } else {
                // Wait a brief moment before moving to the next card to allow user to see feedback registered
                setTimeout(() => {
                    setCurrentItemIndex(prevIndex => prevIndex + 1);
                    setShowAnswer(false);
                    setFeedbackGiven(false);
                }, 700); 
            }

        } catch (error) {
            console.error("Error submitting SRS review:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to submit review. " + (error.response?.data?.message || error.message));
            setFeedbackGiven(false); // Reset if error
        }
    };

    const currentItem = dueItems.length > 0 && currentItemIndex < dueItems.length ? dueItems[currentItemIndex] : null;

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading Review Items...</Text>
            </View>
        );
    }

    if (!isReviewing || !currentItem) {
        return (
            <View style={styles.container}>
                 <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back-ios" size={24} color={theme.colors.headerText} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Spaced Repetition</Text>
                </View>
                <View style={styles.centered}>
                    <FontAwesome5 name="check-circle" size={60} color={theme.colors.primary} style={{ marginBottom: 20 }} />
                    <Text style={styles.emptyMessage}>No items due for review right now!</Text>
                    <Text style={styles.subEmptyMessage}>Check back later or add new items to your review queue.</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={fetchDueItems}>
                        <MaterialIcons name="refresh" size={20} color={theme.colors.buttonText} />
                        <Text style={styles.primaryButtonText}>Refresh</Text>
                    </TouchableOpacity>
                     {/* Placeholder for Add New Item Button */}
                    <TouchableOpacity style={[styles.primaryButton, styles.secondaryButton]} onPress={() => Alert.alert("Navigate", "Go to Add SRS Item screen (TODO)")}>
                        <MaterialIcons name="add" size={20} color={theme.colors.primary} />
                        <Text style={[styles.primaryButtonText, styles.secondaryButtonText]}>Add New Item</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
    
    // Review Session UI
    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={24} color={theme.colors.headerText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Session ({currentItemIndex + 1}/{dueItems.length})</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardHint}>Recall the answer to:</Text>
                    <Text style={styles.cardContentQuestion}>{currentItem.originalContent}</Text>
                    
                    {showAnswer && (
                        <View style={styles.answerSection}>
                            <Text style={styles.cardHint}>Correct Answer:</Text>
                            <Text style={styles.cardContentAnswer}>{currentItem.answerContent || "No answer provided."}</Text>
                        </View>
                    )}

                    {!showAnswer && !feedbackGiven && (
                        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowAnswer(true)}>
                            <FontAwesome5 name="eye" size={18} color={theme.colors.buttonText} />
                            <Text style={styles.primaryButtonText}>Show Answer</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {showAnswer && !feedbackGiven && (
                    <View style={styles.feedbackContainer}>
                        <Text style={styles.feedbackPrompt}>How well did you recall the answer?</Text>
                        <View style={styles.feedbackButtons}>
                            {[
                                { label: "Forgot", quality: 1, color: "#E74C3C", icon: "brain" }, // Red
                                { label: "Hard", quality: 3, color: "#F39C12", icon: "dumbbell" }, // Orange
                                { label: "Good", quality: 4, color: "#2ECC71", icon: "thumbs-up" }, // Green
                                { label: "Easy", quality: 5, color: "#3498DB", icon: "check-circle" }, // Blue
                            ].map((feedback) => (
                                <TouchableOpacity
                                    key={feedback.quality}
                                    style={[styles.feedbackButton, { backgroundColor: feedback.color }]}
                                    onPress={() => handleReviewAction(currentItem._id, feedback.quality)}
                                >
                                    <FontAwesome5 name={feedback.icon} size={16} color={theme.colors.buttonText} style={{marginRight: 5}}/>
                                    <Text style={styles.feedbackButtonText}>{feedback.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
                {feedbackGiven && (
                     <View style={styles.feedbackGivenMessage}>
                        <MaterialIcons name="check-circle-outline" size={24} color={theme.colors.primary} />
                        <Text style={styles.feedbackGivenText}>Feedback recorded. Moving to next card shortly...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.text,
    },
    emptyMessage: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    subEmptyMessage: {
        fontSize: 15,
        color: colors.subtext,
        textAlign: 'center',
        marginBottom: 30,
    },
    headerBar: {
        backgroundColor: colors.primary,
        paddingTop: Platform.OS === 'android' ? 25 : 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 15,
        padding: 25,
        marginVertical: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        minHeight: Platform.OS === 'web' ? 300 : 250, // Ensure card has a decent height
        justifyContent: 'space-between', // Distribute content within card
    },
    cardHint: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    cardContentQuestion: {
        fontSize: 22,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 20,
        lineHeight: 30,
    },
    answerSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    cardContentAnswer: {
        fontSize: 18,
        color: colors.text,
        lineHeight: 26,
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: colors.buttonText,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    secondaryButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    secondaryButtonText: {
        color: colors.primary,
    },
    feedbackContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    feedbackPrompt: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 15,
        fontWeight: '500',
    },
    feedbackButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap', // Allow buttons to wrap on smaller screens
        width: '100%',
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 25,
        margin: 5,
        minWidth: Platform.OS === 'web' ? 100 : 80, // Ensure buttons have a minimum width
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    feedbackButtonText: {
        color: colors.buttonText,
        fontSize: 14,
        fontWeight: 'bold',
    },
    feedbackGivenMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        marginTop: 20,
        backgroundColor: colors.successLight, // A light green for success
        borderRadius: 10,
    },
    feedbackGivenText: {
        marginLeft: 10,
        fontSize: 15,
        color: colors.successDark, // Darker green text
        fontWeight: '500',
    },
});

export default SpacedRepetitionScreen;
