import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds
const SESSIONS_BEFORE_LONG_BREAK = 4;

const FocusTimerScreen = () => {
    const navigation = useNavigation();
    const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [sessionType, setSessionType] = useState('Work'); // 'Work', 'Short Break', 'Long Break'
    const [sessionCount, setSessionCount] = useState(0); // Number of work sessions completed

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            clearInterval(interval);
            Vibration.vibrate(); // Vibrate on session end
            handleSessionEnd();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleSessionEnd = () => {
        setIsActive(false);
        if (sessionType === 'Work') {
            const newSessionCount = sessionCount + 1;
            setSessionCount(newSessionCount);
            if (newSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                setSessionType('Long Break');
                setTimeLeft(LONG_BREAK_DURATION);
            } else {
                setSessionType('Short Break');
                setTimeLeft(SHORT_BREAK_DURATION);
            }
        } else { // Break ended
            setSessionType('Work');
            setTimeLeft(WORK_DURATION);
        }
        // Optionally, prompt user to start next session
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        // Reset to the current session type's default duration
        if (sessionType === 'Work') setTimeLeft(WORK_DURATION);
        else if (sessionType === 'Short Break') setTimeLeft(SHORT_BREAK_DURATION);
        else if (sessionType === 'Long Break') setTimeLeft(LONG_BREAK_DURATION);
        // Consider resetting sessionCount if resetting during a work session or based on specific logic
    };
    
    const skipSession = () => {
        handleSessionEnd();
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getNextSessionType = () => {
        if (sessionType === 'Work') {
            const nextSessionCount = sessionCount + 1;
            if (nextSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                return 'Long Break';
            } else {
                return 'Short Break';
            }
        } else {
            return 'Work';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Focus Timer</Text>
            </View>

            <View style={styles.timerContainer}>
                <Text style={styles.sessionTypeLabel}>{sessionType} Session</Text>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <View style={styles.sessionInfoContainer}>
                    <Text style={styles.sessionCountText}>Completed Work Sessions: {sessionCount}</Text>
                    {!isActive && timeLeft > 0 && ( // Show next session type when paused or ready to start
                        <Text style={styles.nextSessionText}>Next: {getNextSessionType()}</Text>
                    )}
                </View>
            </View>

            <View style={styles.controlsContainer}>
                <TouchableOpacity 
                    style={[
                        styles.controlButton, 
                        styles.resetButton, 
                        (isActive && timeLeft === 0) && styles.disabledButton, // Example of disabling
                        styles.controlButtonIconOnly // Making it circular
                    ]} 
                    onPress={resetTimer} 
                    disabled={isActive && timeLeft === 0}
                >
                    <MaterialIcons name="replay" size={36} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.controlButton, 
                        isActive ? styles.pauseButton : styles.startButton,
                        (timeLeft === 0 && !isActive) && styles.disabledButton,
                        { width: 100, height: 100, borderRadius: 50 } // Larger main button
                    ]} 
                    onPress={toggleTimer}
                    disabled={timeLeft === 0 && !isActive}
                >
                    <MaterialIcons name={isActive ? "pause" : "play-arrow"} size={60} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.controlButton, 
                        styles.skipButton, 
                        (isActive && timeLeft === 0) && styles.disabledButton,
                        styles.controlButtonIconOnly // Making it circular
                    ]} 
                    onPress={skipSession} 
                    disabled={isActive && timeLeft === 0}
                >
                    <MaterialIcons name="skip-next" size={36} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8', // Light, calming background
    },
    headerBar: {
        backgroundColor: '#6A1B9A', // Deep Purple - Professional and motivating
        paddingTop: Platform.OS === 'android' ? 25 : 50, // Standard padding for status bar
        paddingBottom: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        // Modern shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5, // For Android
    },
    backButton: {
        marginRight: 15,
        padding: 5, // Easier to tap
    },
    headerTitle: {
        fontSize: 22, // Slightly larger for emphasis
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', // Professional font
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sessionTypeLabel: {
        fontSize: 32, // More prominent
        fontWeight: '600', // Bolder
        color: '#4A148C', // Darker shade of purple for contrast
        marginBottom: 20,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
    },
    timerText: {
        fontSize: Platform.OS === 'web' ? 110 : 90, // Larger for impact
        fontWeight: 'bold',
        color: '#6A1B9A', // Main theme color
        marginBottom: 15,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
        // Adding a subtle text shadow for depth, if desired (optional)
        // textShadowColor: 'rgba(0, 0, 0, 0.1)',
        // textShadowOffset: { width: 0, height: 1 },
        // textShadowRadius: 2,
    },
    sessionInfoContainer: { // Container for session count and next session
        alignItems: 'center',
        marginTop: 20,
    },
    sessionCountText: {
        fontSize: 18, // Clearer display
        color: '#7B1FA2', // Complementary purple
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    nextSessionText: { // Styling for "Next: Short Break"
        fontSize: 16,
        color: '#8E8E93', // Softer color for secondary info
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: Platform.OS === 'web' ? 40 : 30, // More padding on web
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        // Enhanced shadow for a floating effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 8,
    },
    controlButton: {
        alignItems: 'center',
        justifyContent: 'center', // Center icon and text
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 25, // More rounded buttons
        minWidth: 90, // Minimum width
        height: 90, // Make buttons circular by ensuring width/height are similar if only icon
        // Transition for smooth hover effects (web)
        transitionDuration: '0.3s',
    },
    controlButtonIconOnly: { // Style for buttons that might only have an icon
        width: 70,
        height: 70,
        borderRadius: 35, // Perfectly circular
        paddingVertical: 0, // Adjust padding if text is removed
        paddingHorizontal: 0,
    },
    controlButtonText: {
        color: '#FFFFFF',
        marginTop: 8, // Space between icon and text
        fontSize: 14,
        fontWeight: '600', // Bolder text
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
    // Specific button styling for a modern, professional look
    startButton: {
        backgroundColor: '#4CAF50', // Vibrant Green
        // Add a subtle gradient or shadow on press for better UX
    },
    pauseButton: {
        backgroundColor: '#FF9800', // Warning Orange
    },
    resetButton: {
        backgroundColor: '#757575', // Neutral Grey
    },
    skipButton: {
        backgroundColor: '#03A9F4', // Action Blue
    },
    // Disabled state for buttons
    disabledButton: {
        backgroundColor: '#BDBDBD', // Lighter grey for disabled state
        opacity: 0.7,
    }
});

export default FocusTimerScreen;
