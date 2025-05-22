import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // For a smoother gradient
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { key: '1', icon: 'school-outline', text: 'Syllabus Analysis & Smart Study Planning' },
  { key: '2', icon: 'pencil-outline', text: 'AI-Powered Writing & Research Tools' },
  { key: '3', icon: 'heart-outline', text: 'Wellbeing & Mindfulness Support' },
  { key: '4', icon: 'people-outline', text: 'Community & Peer Collaboration' },
];

const SplashScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const appNameAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  // const bgAnim = useRef(new Animated.Value(0)).current; // Replaced with LinearGradient for now

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(appNameAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(featuresAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.bounce, // Bounce effect for buttons
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = () => navigation.replace('Login');
  const handleSignup = () => navigation.replace('Register');

  const renderFeatureItem = ({ item, index }) => (
    <Animated.View style={[styles.featureItemContainer, {
      opacity: featuresAnim,
      transform: [{
        translateY: featuresAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20 * (index + 1), 0]
        })
      }]
    }]}>
      <Ionicons name={item.icon} size={22} color="#4A90E2" style={styles.featureIcon} />
      <Text style={styles.featureText}>{item.text}</Text>
    </Animated.View>
  );

  const styles = getStyles(colors); // Get styles based on theme

  return (
    <LinearGradient
      colors={['#E0EFFF', '#F2F7FF', '#E0EFFF']} // Subtle blueish gradient
      style={styles.absoluteFill}
    >
      <Animated.View style={[styles.container, { opacity: appNameAnim }]}>
        <Animated.Image
          source={require('../assets/superstudentlogo.png')}
          style={[
            styles.logo,
            {
              transform: [{
                scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              }, {
                translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] })
              }],
              opacity: logoAnim,
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: appNameAnim, transform: [{ translateY: appNameAnim.interpolate({ inputRange: [0,1], outputRange: [20,0]}) }] }]}>
          SuperStudent AI
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineAnim, transform: [{ translateY: taglineAnim.interpolate({ inputRange: [0,1], outputRange: [20,0]}) }] }]}>
          Your AI-powered Academic Success Partner
        </Animated.Text>

        <View style={styles.featuresListContainer}>
          <FlatList
            data={FEATURES}
            renderItem={renderFeatureItem}
            keyExtractor={item => item.key}
            scrollEnabled={false} // Not scrollable for this short list
          />
        </View>

        <Animated.View style={[styles.buttonRow, { opacity: buttonsAnim, transform: [{ scale: buttonsAnim }] }]}>
          <TouchableOpacity style={styles.splashButton} onPress={handleLogin}>
            <Text style={styles.splashButtonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.splashButton, styles.signupButton]} onPress={handleSignup}>
            <Text style={styles.splashButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.footer}>© {new Date().getFullYear()} SuperStudentAI</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap styles in a function
  absoluteFill: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50, // Space for footer
    backgroundColor: colors.background, // Use theme background
  },
  logo: {
    width: Platform.OS === 'web' ? 130 : 110,
    height: Platform.OS === 'web' ? 130 : 110,
    marginBottom: 20,
    // Removed shadow from here, can be added if desired with platform specifics
  },
  appName: {
    fontSize: Platform.OS === 'web' ? 40 : 32,
    fontWeight: 'bold', // Using bold for more impact
    color: colors.primary, // Use theme primary color
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'sans-serif-condensed',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Platform.OS === 'web' ? 20 : 17,
    color: colors.subtext, // Use theme secondary text color
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '600', // Semi-bold
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Medium' : 'sans-serif-medium',
    paddingHorizontal: 10,
  },
  featuresListContainer: {
    marginBottom: 35,
    width: '100%',
    maxWidth: 400, // Max width for larger screens
  },
  featureItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: Platform.OS === 'web' ? 16 : 14.5,
    color: '#5D6D7E', // Softer color for feature text
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'sans-serif',
    flexShrink: 1, // Allow text to wrap
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons a bit more
    width: '100%',
    maxWidth: 380,
    marginTop: 20,
  },
  splashButton: {
    backgroundColor: '#4A90E2', // A slightly more modern blue
    paddingVertical: Platform.OS === 'web' ? 16 : 14,
    paddingHorizontal: 30,
    borderRadius: 30, // More rounded buttons
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 130, // Ensure buttons have a decent width
    alignItems: 'center', // Center text in button
  },
  signupButton: {
    backgroundColor: '#34C759', // A vibrant green for signup
  },
  splashButtonText: {
    color: '#fff',
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: '600', // Semi-bold
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-DemiBold' : 'sans-serif-medium',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 30,
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#AEB6BF', // Lighter grey for footer
    textAlign: 'center',
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'sans-serif',
  },
  activityIndicator: {
    marginTop: 30,
  }
});

export default SplashScreen;
