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
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.stepTitle}>Create Your Account</Text>
            <Text style={styles.stepSubtitle}>Let's start with the basics.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#A0A0A0"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase());
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleNextStep}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.stepTitle}>About You</Text>
            <Text style={styles.stepSubtitle}>Tell us a bit more to personalize your experience.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.inputContainer, errors.age && styles.inputError]}>
                <Ionicons name="calendar-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <Text style={[styles.input, age ? {} : { color: '#A0A0A0' }]}>
                  {age || "Select your date of birth"}
                </Text>
              </TouchableOpacity>
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>University/Institution</Text>
              <View style={[styles.inputContainer, errors.university && styles.inputError]}>
                <Ionicons name="school-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Harvard University"
                  placeholderTextColor="#A0A0A0"
                  value={university}
                  onChangeText={(text) => {
                    setUniversity(text);
                    if (errors.university) setErrors({ ...errors, university: undefined });
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => majorInputRef.current?.focus()}
                />
              </View>
              {errors.university && <Text style={styles.errorText}>{errors.university}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field of Study/Major</Text>
              <View style={[styles.inputContainer, errors.major && styles.inputError]}>
                <Ionicons name="book-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  ref={majorInputRef}
                  style={styles.input}
                  placeholder="e.g., Computer Science"
                  placeholderTextColor="#A0A0A0"
                  value={major}
                  onChangeText={(text) => {
                    setMajor(text);
                    if (errors.major) setErrors({ ...errors, major: undefined });
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleNextStep}
                />
              </View>
              {errors.major && <Text style={styles.errorText}>{errors.major}</Text>}
            </View>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.stepTitle}>Academic Details</Text>
            <Text style={styles.stepSubtitle}>Almost there! Just a few more details.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Level (e.g., 100, 200)</Text>
              <View style={[styles.inputContainer, errors.level && styles.inputError]}>
                <Ionicons name="bar-chart-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 200"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="number-pad"
                  value={level}
                  onChangeText={(text) => {
                    setLevel(text);
                    if (errors.level) setErrors({ ...errors, level: undefined });
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => graduationYearInputRef.current?.focus()}
                />
              </View>
              {errors.level && <Text style={styles.errorText}>{errors.level}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Graduation Year</Text>
              <View style={[styles.inputContainer, errors.graduationYear && styles.inputError]}>
                <Ionicons name="calendar-number-outline" size={22} color={styles.inputIcon.color} style={styles.inputIcon} />
                <TextInput
                  ref={graduationYearInputRef}
                  style={styles.input}
                  placeholder="e.g., 2023"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="number-pad"
                  value={graduationYear}
                  onChangeText={(text) => {
                    setGraduationYear(text);
                    if (errors.graduationYear) setErrors({ ...errors, graduationYear: undefined });
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>
              {errors.graduationYear && <Text style={styles.errorText}>{errors.graduationYear}</Text>}
            </View>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  // Refs for input fields
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const majorInputRef = useRef(null);
  const graduationYearInputRef = useRef(null);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {!isKeyboardVisible && (
              <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back-outline" size={28} color="#333" />
                </TouchableOpacity>
                <Image
                  source={require('../assets/superstudentlogo.png')} // Ensure this path is correct
                  style={styles.logo}
                />
              </View>
            )}

            <View style={styles.progressBarContainer}>
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, currentStep >= 1 && styles.progressDotActive]} />
                <Text style={[styles.progressLabel, currentStep >= 1 && styles.progressLabelActive]}>Account</Text>
              </View>
              <View style={[styles.progressLine, currentStep > 1 && styles.progressLineActive]} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, currentStep >= 2 && styles.progressDotActive]} />
                <Text style={[styles.progressLabel, currentStep >= 2 && styles.progressLabelActive]}>About</Text>
              </View>
              <View style={[styles.progressLine, currentStep > 2 && styles.progressLineActive]} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, currentStep >= 3 && styles.progressDotActive]} />
                <Text style={[styles.progressLabel, currentStep >= 3 && styles.progressLabelActive]}>Details</Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {renderStep()}
            </ScrollView>

            <View style={styles.buttonContainer}>
              {currentStep > 1 && (
                <TouchableOpacity onPress={handlePrevStep} style={[styles.button, styles.prevButton]}>
                  <Ionicons name="chevron-back-outline" size={24} color="#6A11CB" />
                  <Text style={[styles.buttonText, styles.prevButtonText]}>Previous</Text>
                </TouchableOpacity>
              )}
              {currentStep < 3 ? (
                <TouchableOpacity onPress={handleNextStep} style={[styles.button, styles.nextButton, currentStep === 1 && {flex: 1} ]}>
                  <Text style={[styles.buttonText, styles.nextButtonText]}>Next</Text>
                  <Ionicons name="chevron-forward-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleRegister} style={[styles.button, styles.registerButton]} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={[styles.buttonText, styles.registerButtonText]}>Register</Text>
                      <Ionicons name="checkmark-done-outline" size={24} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.datePickerModalBackground}>
              <View style={styles.datePickerContainer}>
                {Platform.OS === 'ios' && (
                    <View style={styles.datePickerHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.datePickerDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/* DateTimePicker will be rendered here, ensure it's imported and used correctly */}
                {/* For simplicity, assuming DateTimePicker is handled as before or replaced by a custom component */}
                 <Text>DateTimePicker Placeholder - Implement with @react-native-community/datetimepicker</Text>
                 {/* Example:
                 <DateTimePicker
                    value={datePickerValue}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDatePicker}
                    maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 10))} // Min 10 years old
                    minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 80))} // Max 80 years old
                  />
                */}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const getStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA', // Light background for the entire screen
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20, // Adjust bottom padding
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center logo if back button is absolute
    paddingVertical: 15,
    position: 'relative', // For absolute positioning of back button
  },
  backButton: {
    position: 'absolute',
    left: 0, // Align to the left of headerContainer
    top: 15, // Adjust to vertically align with logo or title
    padding: 5, // Add padding for easier touch
    zIndex: 1,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.15, // Adjust height to maintain aspect ratio
    resizeMode: 'contain',
    alignSelf: 'center', // Center the logo
    marginBottom: 5, // Reduced margin
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20, // Add some horizontal margin
    marginBottom: 30, // Increased space below progress bar
  },
  progressStep: {
    alignItems: 'center',
    flexShrink: 1, // Allow steps to shrink if needed
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D1D6', // Inactive dot color
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: '#6A11CB', // Primary color
    transform: [{ scale: 1.1 }], // Slightly larger active dot
  },
  progressLabel: {
    fontSize: 13,
    color: '#8E8E93', // Inactive label color
    fontWeight: '500',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#6A11CB', // Primary color
    fontWeight: '700',
  },
  progressLine: {
    flexGrow: 1, // Take up available space
    height: 3,
    backgroundColor: '#D1D1D6', // Inactive line color
    marginHorizontal: 8, // Space between dot and line
    borderRadius: 2,
  },
  progressLineActive: {
    backgroundColor: '#6A11CB', // Primary color
  },
  scrollContent: {
    paddingBottom: 20, // Space for the buttons at the bottom
  },
  stepContainer: {
    paddingVertical: 10, // Add some vertical padding
    backgroundColor: '#FFFFFF', // White background for step content
    borderRadius: 15, // Rounded corners for the card effect
    paddingHorizontal: 20,
    marginBottom: 20, // Space between step card and buttons
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333333', // Darker title
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666666', // Medium gray for subtitle
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20, // Increased space between input groups
  },
  inputLabel: {
    fontSize: 15,
    color: '#4F4F4F', // Slightly darker label
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Lighter input background
    borderRadius: 12, // More rounded inputs
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Subtle border
  },
  inputError: {
    borderColor: '#FF6B6B', // Error color
    borderWidth: 1.5, // Slightly thicker border for error
  },
  inputIcon: {
    marginRight: 12,
    color: '#828282', // Icon color
  },
  input: {
    flex: 1,
    height: 50, // Standard height
    fontSize: 16,
    color: '#333333',
  },
  eyeIcon: {
    padding: 8, // Easier to tap
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 5, // Align with input text
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto', // Push buttons to the bottom
    paddingTop: 10, // Add some space above buttons
    gap: 15, // Space between buttons if both are visible
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12, // Rounded buttons
    minHeight: 50, // Ensure consistent button height
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.0,
    elevation: 3,
  },
  prevButton: {
    backgroundColor: '#FFFFFF', // White background for previous
    borderColor: '#6A11CB', // Primary color border
    borderWidth: 1.5,
    flex: 1, // Take half width
  },
  prevButtonText: {
    color: '#6A11CB', // Primary color text
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    backgroundColor: '#6A11CB', // Primary color
    flex: 1, // Take half width, or full if only button
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
  registerButton: {
    backgroundColor: '#27AE60', // Success green for register
    flex: 1, // Take full width
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonText: { // General button text styling (can be overridden)
    fontSize: 17,
    fontWeight: '600',
  },
  // Date Picker Modal Styles
  datePickerModalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Safe area for bottom
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  datePickerDoneText: {
    color: '#6A11CB', // Primary color
    fontSize: 17,
    fontWeight: '600',
  },
  // ... any other styles
});

export default RegisterScreen;
