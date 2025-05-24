import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

// Define static colors and fonts directly
const STATIC_COLORS = {
  background: '#F0F4F8', // Light grey-blue
  surface: '#FFFFFF', // White
  primary: '#6A11CB', // Deep Purple
  secondary: '#2575FC', // Bright Blue
  text: '#1A2B4D', // Dark Blue-Grey
  subtext: '#5A6B7C', // Medium Grey-Blue
  placeholder: '#A0A0A0', // Grey
  border: '#E0E6F0', // Light Grey
  error: '#D32F2F', // Red
  success: '#28A745', // Green
  buttonText: '#FFFFFF', // White
  inputBackground: '#FFFFFF', // White for input fields
  icon: '#1A2B4D', // Dark Blue-Grey for icons
  shadow: 'rgba(0, 0, 0, 0.1)', // Soft shadow
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

const ForgotPasswordScreen = ({ navigation }) => {
  const colors = STATIC_COLORS; // USE STATIC
  const fonts = STATIC_FONTS; // USE STATIC
  const styles = getStyles(colors, fonts); // Pass fonts if needed by styles
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Input Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Check Your Email',
        "A password reset link has been sent to your email address if it's associated with an account.",
      );
      navigation.goBack();
    } catch (error) {
      console.error('Password Reset Error: ', error);
      Alert.alert(
        'Error',
        'Could not send password reset email. Please ensure the email is correct or try again later.',
      );
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Ionicons name="key-outline" size={80} color={colors.primary} />
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address below and we'll send you a link to reset
            your password.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={22}
            color={colors.icon}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={colors.placeholder} // UPDATED from colors.textSecondary
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handlePasswordReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <>
              <Ionicons
                name="send-outline"
                size={20}
                color={colors.buttonText}
                style={styles.buttonIcon}
              />
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>
            Remembered your password?{' '}
            <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors, fonts) =>
  StyleSheet.create({
    // Added fonts parameter
    keyboardAvoidingContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      zIndex: 1,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
      marginTop: 30,
    },
    title: {
      fontSize: 28,
      // fontWeight: 'bold', // Handled by font family
      fontFamily: fonts.bold, // USE STATIC FONT
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      fontFamily: fonts.regular, // USE STATIC FONT
      color: colors.subtext,
      textAlign: 'center',
      marginBottom: 30,
      paddingHorizontal: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      fontFamily: fonts.regular, // USE STATIC FONT
      color: colors.text,
    },
    resetButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      width: '100%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: 25,
    },
    buttonIcon: {
      marginRight: 10,
    },
    resetButtonText: {
      color: colors.buttonText,
      fontSize: 17,
      // fontWeight: '600', // Handled by font family
      fontFamily: fonts.medium, // USE STATIC FONT
    },
    loginLinkText: {
      fontSize: 15,
      fontFamily: fonts.regular, // USE STATIC FONT
      color: colors.subtext,
    },
    loginLink: {
      color: colors.primary,
      // fontWeight: 'bold', // Handled by font family
      fontFamily: fonts.bold, // USE STATIC FONT
    },
  });

export default ForgotPasswordScreen;
