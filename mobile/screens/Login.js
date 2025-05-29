import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

// Define static colors and fonts directly
const STATIC_COLORS = {
  background: '#F0F4F8', // Light, clean background
  surface: '#FFFFFF', // For cards and modals
  primary: '#6A11CB', // Vibrant purple for primary actions
  secondary: '#2575FC', // Bright blue for secondary accents
  text: '#1A2B4D', // Dark, readable text
  subtext: '#5A6B7C', // Softer text for less emphasis
  placeholder: '#A0B0C0', // Clear placeholder text
  border: '#D8E0E8', // Subtle border color
  error: '#E74C3C', // Clear error indication
  buttonText: '#FFFFFF', // White text for buttons
  inputBackground: '#FFFFFF', // Clean white for input fields
  shadow: 'rgba(0, 0, 0, 0.08)', // Softer shadow
  link: '#6A11CB', // Primary color for links for consistency
  icon: '#5A6B7C', // Icon color
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  logo:
    Platform.OS === 'ios'
      ? 'HelveticaNeue-CondensedBold'
      : 'sans-serif-condensed-bold', // Example for a distinct logo font
};

const LoginScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const fonts = STATIC_FONTS;
  const styles = getStyles(colors, fonts);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null); // Added ref for email input

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation to the main app will be handled by the auth state listener in App.js or AppNavigator.js
      // Alert.alert('Login Success', 'Welcome back!'); // Usually not needed if navigation handles it
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      // Updated to include auth/invalid-credential
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {!isKeyboardVisible && (
                <Animated.View
                  style={styles.logoContainer /* Add animation if desired */}
                >
                  <Image
                    source={require('../assets/superstudentlogo.png')} // Ensure path is correct
                    style={styles.logo}
                  />
                  <Text style={styles.appName}>SuperStudent AI</Text>
                </Animated.View>
              )}

              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your journey.
              </Text>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={22}
                      color={colors.icon}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={emailInputRef}
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCompleteType="email"
                      textContentType="emailAddress"
                      value={email}
                      onChangeText={setEmail}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ForgotPassword')}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color={colors.icon}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showPassword}
                      autoCompleteType="password"
                      textContentType="password"
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.showPasswordButton}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={24}
                        color={colors.icon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.buttonText} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors, fonts) => {
  const { width: screenWidth } = Dimensions.get('window'); // Get screen width

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center', // Centers content when it's smaller than the screen
      paddingVertical: 20, // Add padding for scrollable content
    },
    container: {
      flex: 1, // Takes available space within ScrollView
      justifyContent: 'center', // Vertically center content
      alignItems: 'center',
      paddingHorizontal: 25,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 30, // Space below logo and app name
    },
    logo: {
      width: screenWidth * 0.3, // Responsive width using screenWidth
      height: screenWidth * 0.3, // Responsive height using screenWidth
      resizeMode: 'contain',
      marginBottom: 10,
    },
    appName: {
      fontSize: 24,
      fontFamily: fonts.bold, // Use a distinct bold font
      color: colors.primary,
      textAlign: 'center',
    },
    title: {
      fontSize: 28,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.subtext,
      marginBottom: 35, // Increased space
      textAlign: 'center',
      maxWidth: '90%', // Prevent text from being too wide
    },
    formContainer: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 15,
      padding: 25, // Ample padding inside the form card
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 8, // Android shadow
      marginBottom: 25,
    },
    inputGroup: {
      marginBottom: 20, // Space between input groups
    },
    inputLabel: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: 8,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 10, // Slightly less rounded than form card
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 15,
    },
    inputIcon: {
      marginRight: 12, // Space between icon and text input
    },
    input: {
      flex: 1,
      height: 52, // Slightly taller inputs
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    showPasswordButton: {
      padding: 8, // Make touch target larger
    },
    forgotPasswordText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.link,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16, // Taller button
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center', // Center text and loader
      width: '100%',
      marginTop: 10, // Space above the button
      minHeight: 52, // Ensure consistent height with inputs
      shadowColor: colors.primary, // Shadow with button color for a glow effect
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6,
    },
    loginButtonDisabled: {
      backgroundColor: '#B084E4', // Lighter shade of primary when disabled
    },
    loginButtonText: {
      color: colors.buttonText,
      fontSize: 17, // Slightly larger button text
      fontFamily: fonts.bold,
    },
    footerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25, // Space above the footer
      paddingBottom: 10, // Ensure it's not too close to the edge
    },
    footerText: {
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.subtext,
    },
    signUpText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.primary, // Use primary color for sign up link
      marginLeft: 6,
    },
  });
};

export default LoginScreen;
