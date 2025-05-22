import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  StatusBar,
  TextInput, 
  ScrollView 
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const logo = require('../assets/superstudentlogo.png');
const { width, height } = Dimensions.get('window');

// Reusable InputField Component
const InputField = ({ iconName, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'none', textContentType, error, onFocus, onBlur, isFocused, hasValue, colors }) => {
  // Added colors prop
  return (
    <View style={[
      dynamicStyles(colors).inputContainer, // Use dynamic styles
      error && dynamicStyles(colors).inputContainerError,
      isFocused && dynamicStyles(colors).inputContainerFocused
    ]}>
      <Ionicons 
        name={iconName} 
        size={24} // Increased icon size
        color={error ? colors.error : (isFocused || hasValue ? colors.primary : colors.inputIcon)} 
        style={dynamicStyles(colors).inputIcon} 
      />
      <TextInput
        style={dynamicStyles(colors).input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textContentType={textContentType}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={colors.primary}
      />
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null); // To track which field is focused

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        delay: 200,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateFields = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format.';
    if (!password) newErrors.password = 'Password is required.';
    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateFields()) {
      Alert.alert('Login Error', 'Please check the highlighted fields and try again.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation is handled by AppNavigator's auth state listener
    } catch (error) {
      setError('Invalid email or password. Please try again.');
      // Optionally, set field-specific errors if distinguishable
      // e.g., setErrors({ email: 'Invalid email or password.', password: ' ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={dynamicStyles(colors).safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            minHeight: height,
            justifyContent: 'center',
            backgroundColor: colors.background,
            paddingBottom: 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
        >
          <View style={dynamicStyles(colors).formContainer}>
            <Animated.View style={[dynamicStyles(colors).formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Image source={logo} style={dynamicStyles(colors).logo} />
              <Text style={dynamicStyles(colors).welcomeTitle}>Welcome Back!</Text>
              <Text style={dynamicStyles(colors).catchyPhrase}>Log in to supercharge your studies.</Text>

              {error ? <Text style={dynamicStyles(colors).errorText}>{error}</Text> : null}

              <InputField
                iconName="mail-outline"
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => { setEmail(text); if(error) setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                error={error}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'email'}
                hasValue={!!email}
                colors={colors} // Pass colors to InputField
              />
              {error && <Text style={dynamicStyles(colors).errorText}>{error}</Text>}

              <InputField
                iconName="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); if(error) setError(null); }}
                secureTextEntry
                textContentType="password"
                error={error}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'password'}
                hasValue={!!password}
                colors={colors} // Pass colors to InputField
              />
              {error && <Text style={dynamicStyles(colors).errorText}>{error}</Text>}

              <TouchableOpacity style={dynamicStyles(colors).button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.buttonText} />
                ) : (
                  <Text style={dynamicStyles(colors).buttonText}>Log In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={dynamicStyles(colors).linkButton}>
                <Text style={dynamicStyles(colors).linkText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              {/* Divider */}
              <View style={dynamicStyles(colors).divider}>
                <View style={dynamicStyles(colors).dividerLine} />
                <Text style={dynamicStyles(colors).dividerText}>OR</Text>
                <View style={dynamicStyles(colors).dividerLine} />
              </View>
              
              {/* Social login buttons (visual only) */}
              <View style={dynamicStyles(colors).socialButtonsContainer}>
                <TouchableOpacity style={dynamicStyles(colors).socialButton}>
                  <Ionicons name="logo-google" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles(colors).socialButton}>
                  <Ionicons name="logo-apple" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles(colors).socialButton}>
                  <Ionicons name="logo-facebook" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {/* Sign up option */}
              <View style={dynamicStyles(colors).footer}>
                <Text style={dynamicStyles(colors).footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={dynamicStyles(colors).signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles are now a function that accepts colors from the theme
const dynamicStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background, // Use theme color
  },
  screenContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, 
  },
  logo: {
    width: width * 0.28, // Slightly larger logo 
    height: width * 0.28,
    resizeMode: 'contain',
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: width * 0.075, // Slightly bigger welcome title
    fontWeight: 'bold',
    color: colors.text, // Use theme color
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  catchyPhrase: {
    fontSize: width * 0.045,
    color: colors.subtext, // Use theme color
    textAlign: 'center',
    marginBottom: 35, // More space before input fields
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  formContainer: { 
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 20,
    backgroundColor: colors.surface, // Use theme color
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15, 
    shadowRadius: 15,
    elevation: 8,
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 60, // Taller input fields
    backgroundColor: colors.inputBackground, 
    borderRadius: 15, // More rounded corners
    paddingHorizontal: 18, // More horizontal padding
    marginBottom: 15, // More space between inputs
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, 
  },
  inputContainerError: {
    borderColor: colors.error, // Use theme color
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 17, // Larger font size
    color: colors.text, // Use theme color
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorText: {
    width: '100%',
    color: colors.error, // Use theme color
    fontSize: 12,
    marginTop: 1,
    marginBottom: 10,
    paddingLeft: 5,
  },
  button: {
    width: '100%',
    height: 58, // Slightly taller button
    backgroundColor: colors.primary, // Use theme color
    borderRadius: 15, // More rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20, // More space above button
    shadowColor: colors.primary, // Use theme color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 7,
  },
  buttonText: {
    color: colors.buttonText, // Use theme color
    fontSize: 18,
    fontWeight: '700', // Bolder text
    letterSpacing: 0.5, // Letter spacing for better readability
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  linkButton: {
    marginTop: 20,
    padding: 5,
  },
  linkText: {
    color: colors.link, // Use theme color
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.subtext,
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 25,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    paddingVertical: 10,
    width: '100%',
  },
  footerText: {
    color: colors.subtext, // Use theme color
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  signupLink: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.primary, // Changed to primary color for better visibility
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  }
});

export default LoginScreen;
