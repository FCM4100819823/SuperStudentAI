import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [level, setLevel] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0.333)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Start animations when component mounts
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    // Animate progress bar when step changes
    Animated.timing(progressAnim, {
      toValue: currentStep === 1 ? 0.333 : currentStep === 2 ? 0.666 : 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const validateStep = (step) => {
    let stepErrors = {};
    let isValid = true;
    
    if (step === 1) {
      if (!name.trim()) {
        stepErrors.name = 'Name is required';
        isValid = false;
      }
      
      if (!email.trim()) {
        stepErrors.email = 'Email is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        stepErrors.email = 'Please enter a valid email';
        isValid = false;
      }
      
      if (!password) {
        stepErrors.password = 'Password is required';
        isValid = false;
      } else if (password.length < 6) {
        stepErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      }
      
      if (password !== confirmPassword) {
        stepErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }
    
    if (step === 2) {
      if (!age || isNaN(parseInt(age))) {
        stepErrors.age = 'Please enter a valid age';
        isValid = false;
      }
      
      if (!university.trim()) { // Changed to check trimmed university input
        stepErrors.university = 'University is required';
        isValid = false;
      }
      
      if (!major.trim()) { // Changed to check trimmed major input
        stepErrors.major = 'Field of study is required';
        isValid = false;
      }
    }
    
    if (step === 3) {
      if (!level || isNaN(parseInt(level))) {
        stepErrors.level = 'Current level is required (100-600)';
        isValid = false;
      } else if (parseInt(level) < 100 || parseInt(level) > 600) {
        stepErrors.level = 'Level must be between 100 and 600';
        isValid = false;
      }
      
      if (!graduationYear || isNaN(parseInt(graduationYear))) {
        stepErrors.graduationYear = 'Expected graduation year is required';
        isValid = false;
      } else {
        const year = parseInt(graduationYear);
        const currentYear = new Date().getFullYear();
        if (year < currentYear || year > currentYear + 7) {
          stepErrors.graduationYear = `Year must be between ${currentYear} and ${currentYear + 7}`;
          isValid = false;
        }
      }
    }
    
    setErrors(prevErrors => ({ ...prevErrors, ...stepErrors }));
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleRegister = async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    
    try {
      // Create user with email and password
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          age: parseInt(age),
          level: parseInt(level),
          university,
          major,
          graduationYear: parseInt(graduationYear),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }
      
      Alert.alert(
        "Registration Successful", 
        "Your account has been created successfully!",
        [{ text: "Continue", onPress: () => console.log("Registration successful") }]
      );
      // Navigation will be handled by auth state listener
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.message.includes('email')) {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'The email address is invalid.';
      } else if (error.message.includes('weak')) {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      Alert.alert("Registration Error", errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeDatePicker = (event, selectedDate) => {
    const currentDate = selectedDate || datePickerValue;
    // For iOS, hide the picker after selection or cancellation.
    // For Android, the picker is modal and dismissed automatically.
    if (Platform.OS === 'ios') {
        setShowDatePicker(false);
    }
    
    if (event.type === 'set' && currentDate) { // ensure currentDate is not null (if user cancels on Android)
      setDatePickerValue(currentDate);
      const today = new Date();
      let ageValue = today.getFullYear() - currentDate.getFullYear();
      const m = today.getMonth() - currentDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < currentDate.getDate())) {
        ageValue--;
      }
      setAge(ageValue.toString());
      if (errors.age) setErrors({ ...errors, age: undefined });
    } else if (event.type === 'dismissed' && Platform.OS === 'android') {
        // Handle explicit dismissal on Android if needed, though usually not required for this logic
        setShowDatePicker(false); // Ensure picker is hidden if dismissed
    }
  };

  const styles = getStyles();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create Your Account</Text>
            <Text style={styles.stepDescription}>Let's start with the basics</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#A0A0A0"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepDescription}>Tell us about yourself</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TouchableOpacity 
                style={[styles.inputContainer, errors.age && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <Text style={[styles.input, !age && styles.placeholderText]}>
                  {age ? `${age} years old` : "Select your date of birth"}
                </Text>
              </TouchableOpacity>
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

              {showDatePicker && (
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeDatePicker}
                  maximumDate={new Date()}
                  minimumDate={new Date(1950, 0, 1)}
                />
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>University</Text>
              {/* Changed from TouchableOpacity to TextInput */}
              <View style={[styles.inputContainer, errors.university && styles.inputError]}>
                <Ionicons name="school-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your university name"
                  placeholderTextColor="#A0A0A0"
                  value={university}
                  onChangeText={(text) => {
                    setUniversity(text);
                    if (errors.university) setErrors({ ...errors, university: undefined });
                  }}
                />
              </View>
              {errors.university && <Text style={styles.errorText}>{errors.university}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field of Study / Major</Text>
              <View style={[styles.inputContainer, errors.major && styles.inputError]}>
                <Ionicons name="book-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your field of study or major"
                  placeholderTextColor="#A0A0A0"
                  value={major}
                  onChangeText={(text) => {
                    setMajor(text);
                    if (errors.major) setErrors({ ...errors, major: undefined });
                  }}
                />
              </View>
              {errors.major && <Text style={styles.errorText}>{errors.major}</Text>}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Academic Information</Text>
            <Text style={styles.stepDescription}>Just a few more details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Level (100-600)</Text>
              <View style={[styles.inputContainer, errors.level && styles.inputError]}>
                <MaterialIcons name="grade" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your current level (e.g., 100, 200)"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={level}
                  onChangeText={(text) => {
                    setLevel(text);
                    if (errors.level) setErrors({ ...errors, level: undefined });
                  }}
                />
              </View>
              {errors.level && <Text style={styles.errorText}>{errors.level}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Graduation Year</Text>
              <View style={[styles.inputContainer, errors.graduationYear && styles.inputError]}>
                <Ionicons name="calendar" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Year of expected graduation"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={graduationYear}
                  onChangeText={(text) => {
                    setGraduationYear(text);
                    if (errors.graduationYear) setErrors({ ...errors, graduationYear: undefined });
                  }}
                />
              </View>
              {errors.graduationYear && <Text style={styles.errorText}>{errors.graduationYear}</Text>}
            </View>

            <View style={styles.termsContainer}>
              <Ionicons 
                name="shield-checkmark-outline" 
                size={36} 
                color="#007AFF" 
                style={styles.termsIcon} 
              />
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={'dark-content'} />
      <View style={styles.gradientBackground}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
                hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
              >
                <Ionicons name="arrow-back" size={24} color="#333333" />
              </TouchableOpacity>

              <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../assets/superstudentlogo.png')} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                  <Text style={styles.titleText}>Create Account</Text>
                  <Text style={styles.subtitleText}>Join SuperStudent AI and start learning smarter</Text>
                </View>
              </Animated.View>
              
              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar, 
                    { width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })}
                  ]}
                />
                <View style={styles.stepIndicatorsContainer}>
                  <View style={[styles.stepIndicator, currentStep >= 1 && styles.activeStepIndicator]}>
                    <Text style={[styles.stepNumber, currentStep >= 1 && styles.activeStepNumber]}>1</Text>
                  </View>
                  <View style={styles.stepConnector}>
                    <View style={[styles.stepConnectorLine, currentStep >= 2 && styles.activeStepConnector]} />
                  </View>
                  <View style={[styles.stepIndicator, currentStep >= 2 && styles.activeStepIndicator]}>
                    <Text style={[styles.stepNumber, currentStep >= 2 && styles.activeStepNumber]}>2</Text>
                  </View>
                  <View style={styles.stepConnector}>
                    <View style={[styles.stepConnectorLine, currentStep >= 3 && styles.activeStepConnector]} />
                  </View>
                  <View style={[styles.stepIndicator, currentStep >= 3 && styles.activeStepIndicator]}>
                    <Text style={[styles.stepNumber, currentStep >= 3 && styles.activeStepNumber]}>3</Text>
                  </View>
                </View>
              </View>

              <Animated.View 
                style={[
                  styles.formContainer, 
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                {renderStep()}
                
                <View style={styles.navigationButtonsContainer}>
                  {currentStep > 1 && (
                    <TouchableOpacity style={styles.prevButton} onPress={handlePrevStep}>
                      <Ionicons name="arrow-back" size={20} color="#007AFF" />
                      <Text style={styles.prevButtonText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  
                  {currentStep < 3 ? (
                    <TouchableOpacity 
                      style={[styles.nextButton, currentStep === 1 && styles.fullWidthButton]} 
                      onPress={handleNextStep}
                    >
                      <Text style={styles.nextButtonText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.registerButton} 
                      onPress={handleRegister}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.registerButtonText}>Create Account</Text>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
              
              {!isKeyboardVisible && (
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
};

const getStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subtitleText: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  stepIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeStepIndicator: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepConnector: {
    flex: 1,
    height: 2,
  },
  stepConnectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CCCCCC',
  },
  activeStepConnector: {
    backgroundColor: '#007AFF',
  },
  formContainer: {
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  stepDescription: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingHorizontal: 15,
    height: 56,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    color: '#333333',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    height: '100%',
  },
  placeholderText: {
    color: '#A0A0A0',
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  fullWidthButton: {
    marginLeft: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 16,
    color: '#555555',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  termsIcon: {
    marginRight: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});

export default RegisterScreen;
