import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, SafeAreaView, AppState } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import { useTheme } from '@react-navigation/native'; // If using theme

// Static colors for now, replace with theme if available
const STATIC_COLORS = {
  primary: '#6E3BFF', // A vibrant purple
  background: '#F0F2F5', // Light grey background
  card: '#FFFFFF', // White cards
  text: '#1A1A1A', // Dark grey for text
  subtext: '#595959', // Lighter grey for subtext
  accent: '#4CAF50', // Green for positive actions
  error: '#F44336', // Red for errors or warnings
  white: '#FFFFFF',
  lightBlue: '#E3F2FD', // Light blue for accents or backgrounds
  darkText: '#333333',
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  animatedCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedCircleText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 48,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  controlButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#B0B0B0', // Grey out when disabled
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 10,
  }
});

const BREATH_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds
const INHALE_TIME = 4000; // 4 seconds
const HOLD_TIME = 4000; // 4 seconds
const EXHALE_TIME = 6000; // 6 seconds
const CYCLE_TIME = INHALE_TIME + HOLD_TIME + EXHALE_TIME;

const GuidedBreathingScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const styles = getStyles(colors);
  const [animation] = useState(new Animated.Value(0));
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BREATH_DURATION);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale, Hold, Exhale

  const animateCircle = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: INHALE_TIME / 2,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0.8, // Slight shrink for hold, or maintain
          duration: HOLD_TIME,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: EXHALE_TIME / 2,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animation]);

  useEffect(() => {
    let timerInterval;
    let phaseTimeout;

    if (isRunning && timeLeft > 0) {
      animateCircle();
      timerInterval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1000);
      }, 1000);

      const runPhase = (currentPhaseStartTime) => {
        const elapsedInCycle = (Date.now() - currentPhaseStartTime) % CYCLE_TIME;

        if (elapsedInCycle < INHALE_TIME) {
          setBreathPhase('Inhale');
          phaseTimeout = setTimeout(() => runPhase(currentPhaseStartTime), INHALE_TIME - elapsedInCycle);
        } else if (elapsedInCycle < INHALE_TIME + HOLD_TIME) {
          setBreathPhase('Hold');
          phaseTimeout = setTimeout(() => runPhase(currentPhaseStartTime), INHALE_TIME + HOLD_TIME - elapsedInCycle);
        } else {
          setBreathPhase('Exhale');
          phaseTimeout = setTimeout(() => runPhase(currentPhaseStartTime), CYCLE_TIME - elapsedInCycle);
        }
      };
      
      runPhase(Date.now());

    } else if (timeLeft <= 0) {
      setIsRunning(false);
      setTimeLeft(0);
      setBreathPhase('Done');
      animation.setValue(0); // Reset animation
      Animated.timing(animation).stop();
    }

    return () => {
      clearInterval(timerInterval);
      clearTimeout(phaseTimeout);
      Animated.timing(animation).stop();
    };
  }, [isRunning, timeLeft, animateCircle, animation]);
  
  // Handle AppState changes to pause/resume timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && isRunning) {
        setIsRunning(false); // Pause if app goes to background
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isRunning]);


  const toggleTimer = () => {
    if (timeLeft === 0) { // Reset if done
        setTimeLeft(BREATH_DURATION);
        setBreathPhase('Inhale');
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(BREATH_DURATION);
    setBreathPhase('Inhale');
    animation.setValue(0);
    Animated.timing(animation).stop();
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const animatedStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.5], // Scale up for inhale, down for exhale
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={30} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.container}>
        <Text style={styles.title}>Guided Breathing</Text>
        <Text style={styles.instructions}>
          Follow the rhythm. Inhale as the circle expands, hold, and exhale as it contracts.
        </Text>
        
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.animatedCircle, animatedStyle]}>
            <Text style={styles.animatedCircleText}>{breathPhase}</Text>
          </Animated.View>
        </View>

        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, (isRunning && timeLeft === 0) && styles.disabledButton]} 
            onPress={toggleTimer}
            disabled={isRunning && timeLeft === 0}
          >
            <Text style={styles.controlButtonText}>{isRunning && timeLeft > 0 ? 'Pause' : timeLeft === 0 ? 'Start Over' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GuidedBreathingScreen;
