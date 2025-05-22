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
        size={22} 
        color={error ? colors.error : (isFocused || hasValue ? colors.focusedInputIcon : colors.inputIcon)} 
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
    width: width * 0.25, 
    height: width * 0.25,
    resizeMode: 'contain',
    marginBottom: 25,
    // Tint color for dark mode if logo is not transparent or needs adjustment
    // tintColor: theme === 'dark' ? colors.text : null, 
  },
  welcomeTitle: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: colors.text, // Use theme color
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  catchyPhrase: {
    fontSize: width * 0.04,
    color: colors.subtext, // Use theme color
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  formContainer: { 
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 20,
    backgroundColor: colors.surface, // Use theme color
    alignItems: 'center',
    shadowColor: colors.text, // Shadow color can be theme-dependent
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: colors.inputBackground, // Use theme color
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: colors.border, // Use theme color
  },
  inputContainerFocused: {
    borderColor: colors.primary, // Use theme color
    // shadowColor: colors.primary,
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 3, 
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
    fontSize: 16,
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
    height: 55,
    backgroundColor: colors.primary, // Use theme color
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.primary, // Use theme color
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
  buttonText: {
    color: colors.buttonText, // Use theme color
    fontSize: 18,
    fontWeight: '600',
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
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? height * 0.03 : height * 0.04,
    paddingTop: 10,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: colors.background, // Ensure footer matches background
  },
  footerText: {
    color: colors.subtext, // Use theme color
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  signupLink: {
    fontWeight: 'bold',
    marginLeft: 5,
    color: colors.link, // Use theme color for consistency
  }
});

export default LoginScreen;
