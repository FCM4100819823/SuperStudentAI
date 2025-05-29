import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds
const SESSIONS_BEFORE_LONG_BREAK = 4;
const FOCUS_TIME_MINUTES = 25;
const BREAK_TIME_MINUTES = 5;

const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  secondary: '#4CAF50', // Green
  background: '#F5F5F5', // Light Grey
  card: '#FFFFFF', // White
  text: '#333333', // Dark Grey
  subtext: '#757575', // Medium Grey
  buttonText: '#FFFFFF', // White
  error: '#D32F2F', // Red
  success: '#388E3C', // Green
  warning: '#FFA000', // Amber
  info: '#1976D2', // Blue
  border: '#E0E0E0', // Light Grey Border
  shadow: '#000000', // Black for shadow
  // Add any other static colors your app uses
  // Specific colors used in this screen (ensure they are defined or replaced)
  headerBarBackground: '#6A1B9A',
  headerTitleColor: '#FFFFFF',
  sessionTypeLabelColor: '#4A148C',
  timerTextColor: '#6A1B9A',
  sessionCountTextColor: '#7B1FA2',
  nextSessionTextColor: '#8E8E93',
  controlsContainerBackground: '#FFFFFF',
  controlsContainerBorderTop: '#E0E0E0',
  startButtonBackground: '#4CAF50',
  pauseButtonBackground: '#FF9800',
  resetButtonBackground: '#757575',
  skipButtonBackground: '#03A9F4',
  disabledButtonBackground: '#BDBDBD',
  modeButtonBorder: '#E0E0E0', // Assuming 'colors.border' was this
};

const STATIC_FONTS = {
  // Define any static font families if needed
};

const FocusTimerScreen = ({ navigation }) => {
  // const themeContext = useTheme() || {};
  // const colors = themeContext.colors || {};
  const colors = STATIC_COLORS; // Use static colors
  const styles = getStyles(colors);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState('Work'); // 'Work', 'Short Break', 'Long Break'
  const [sessionCount, setSessionCount] = useState(0); // Number of work sessions completed
  const [sound, setSound] = useState(); // For audio playback
  const [isFocusMode, setIsFocusMode] = useState(true); // Added state for focus/break mode

  // Function to determine the next session type
  const getNextSessionType = () => {
    if (sessionType === 'Work') {
      if ((sessionCount + 1) % SESSIONS_BEFORE_LONG_BREAK === 0) {
        return 'Long Break';
      }
      return 'Short Break';
    }
    return 'Work'; // If current is break, next is Work
  };

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      Vibration.vibrate(); // Vibrate on session end
      playSound(); // Play sound on session end
      handleSessionEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Audio setup
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
           require('../assets/notification.mp3') // Ensure you have a notification sound file here
        );
        setSound(sound);
      } catch (error) {
        console.error("Failed to load sound", error);
        // Optionally, inform the user that sound notifications won't work
        // Alert.alert("Sound Error", "Could not load notification sound.");
      }
    };
    loadSound();

    return () => {
      if (sound) {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  const playSound = async () => {
    if (sound) {
      try {
        await sound.replayAsync(); // Replay the sound from the beginning
      } catch (error) {
        console.error("Failed to play sound", error);
      }
    }
  };

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
    } else {
      // Break ended
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

  const toggleModeManual = () => {
    setIsFocusMode(!isFocusMode);
    // Add logic to switch timer settings based on the new mode
    // For example, if switching to Focus mode, set timer to WORK_DURATION
    // If switching to Break mode, set timer to SHORT_BREAK_DURATION
    // This is a basic toggle, you might want more sophisticated logic
    if (!isFocusMode) { // If current mode is break, switch to focus
        setSessionType('Work');
        setTimeLeft(WORK_DURATION);
    } else { // If current mode is focus, switch to short break
        setSessionType('Short Break');
        setTimeLeft(SHORT_BREAK_DURATION);
    }
    setIsActive(false); // Pause timer on mode switch
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Timer</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.sessionTypeLabel}>{sessionType} Session</Text>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <View style={styles.sessionInfoContainer}>
          <Text style={styles.sessionCountText}>
            Completed Work Sessions: {sessionCount}
          </Text>
          {!isActive &&
            timeLeft > 0 && ( // Show next session type when paused or ready to start
              <Text style={styles.nextSessionText}>
                Next: {getNextSessionType()} 
              </Text>
            )}
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.resetButton,
            isActive && timeLeft === 0 && styles.disabledButton, // Example of disabling
            styles.controlButtonIconOnly, // Making it circular
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
            timeLeft === 0 && !isActive && styles.disabledButton,
            { width: 100, height: 100, borderRadius: 50 }, // Larger main button
          ]}
          onPress={toggleTimer}
          disabled={timeLeft === 0 && !isActive}
        >
          <MaterialIcons
            name={isActive ? 'pause' : 'play-arrow'}
            size={60}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.skipButton,
            isActive && timeLeft === 0 && styles.disabledButton,
            styles.controlButtonIconOnly, // Making it circular
          ]}
          onPress={skipSession}
          disabled={isActive && timeLeft === 0}
        >
          <MaterialIcons name="skip-next" size={36} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.modeButton} onPress={toggleModeManual}>
        <Text style={styles.modeButtonText}>
          Switch to {isFocusMode ? 'Break' : 'Focus'} {/* Ensure isFocusMode and toggleModeManual are defined if this button is kept */}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    // Wrap styles in a function
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 20,
    },
    headerBar: {
      backgroundColor: colors.headerBarBackground, // Deep Purple - Professional and motivating
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
      color: colors.headerTitleColor,
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
      color: colors.sessionTypeLabelColor, // Darker shade of purple for contrast
      marginBottom: 20,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
    },
    timerText: {
      fontSize: Platform.OS === 'web' ? 110 : 90, // Larger for impact
      fontWeight: 'bold',
      color: colors.timerTextColor, // Main theme color
      marginBottom: 15,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'monospace',
      // Adding a subtle text shadow for depth, if desired (optional)
      // textShadowColor: 'rgba(0, 0, 0, 0.1)',
      // textShadowOffset: { width: 0, height: 1 },
      // textShadowRadius: 2,
    },
    sessionInfoContainer: {
      // Container for session count and next session
      alignItems: 'center',
      marginTop: 20,
    },
    sessionCountText: {
      fontSize: 18, // Clearer display
      color: colors.sessionCountTextColor, // Complementary purple
      marginBottom: 8,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    nextSessionText: {
      // Styling for "Next: Short Break"
      fontSize: 16,
      color: colors.nextSessionTextColor, // Softer color for secondary info
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: Platform.OS === 'web' ? 40 : 30, // More padding on web
      paddingHorizontal: 20,
      backgroundColor: colors.controlsContainerBackground,
      borderTopWidth: 1,
      borderTopColor: colors.controlsContainerBorderTop,
      // Enhanced shadow for a floating effect
      shadowColor: colors.shadow,
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
    controlButtonIconOnly: {
      // Style for buttons that might only have an icon
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
      backgroundColor: colors.startButtonBackground, // Vibrant Green
      // Add a subtle gradient or shadow on press for better UX
    },
    pauseButton: {
      backgroundColor: colors.pauseButtonBackground, // Warning Orange
    },
    resetButton: {
      backgroundColor: colors.resetButtonBackground, // Neutral Grey
    },
    skipButton: {
      backgroundColor: colors.skipButtonBackground, // Action Blue
    },
    // Disabled state for buttons
    disabledButton: {
      backgroundColor: colors.disabledButtonBackground, // Lighter grey for disabled state
      opacity: 0.7,
    },
    modeButton: {
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.modeButtonBorder,
    },
    modeButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default FocusTimerScreen;
