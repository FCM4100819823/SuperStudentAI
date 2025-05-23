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
import { useTheme } from '../context/ThemeContext';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  // Safely access theme with fallback values
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {
    primary: '#4A90E2',
    background: '#FFFFFF',
    card: '#F8F9FA',
    text: '#212121',
    border: '#E0E0E0',
    placeholder: '#9E9E9E',
    error: '#FF6B6B',
    success: '#4CAF50'
  };

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
  
  // University picker
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0.333)).current;

  // Sample university list
  const universities = [
    { label: "Select University", value: "" },
    { label: "University of Ghana", value: "University of Ghana" },
    { label: "Kwame Nkrumah University of Science and Technology", value: "Kwame Nkrumah University of Science and Technology" },
    { label: "University of Cape Coast", value: "University of Cape Coast" },
    { label: "Ghana Institute of Management and Public Administration", value: "Ghana Institute of Management and Public Administration" },
    { label: "Ashesi University", value: "Ashesi University" },
    { label: "University of Education, Winneba", value: "University of Education, Winneba" },
    { label: "University for Development Studies", value: "University for Development Studies" },
    { label: "Accra Technical University", value: "Accra Technical University" },
    { label: "Central University", value: "Central University" },
    { label: "Other", value: "Other" }
  ];

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
      
      if (!university) {
        stepErrors.university = 'University is required';
        isValid = false;
      }
      
      if (!major) {
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
      const auth = getAuth();
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with name
      await updateProfile(user, { displayName: name });
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        age: parseInt(age),
        level: parseInt(level),
        university,
        major,
        graduationYear: parseInt(graduationYear),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert(
        "Registration Successful", 
        "Your account has been created successfully!",
        [{ text: "Continue", onPress: () => console.log("Registration successful") }]
      );
      // Navigation will be handled by auth state listener
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
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
    setShowDatePicker(Platform.OS === 'ios');
    
    if (event.type === 'set') {
      setDatePickerValue(currentDate);
      // Calculate age from date of birth
      const today = new Date();
      let ageValue = today.getFullYear() - currentDate.getFullYear();
      const m = today.getMonth() - currentDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < currentDate.getDate())) {
        ageValue--;
      }
      setAge(ageValue.toString());
    }
  };

  const styles = getStyles(colors);

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
                <Ionicons name="person-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={colors.placeholder}
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
                <Ionicons name="mail-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor={colors.placeholder}
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
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.icon || colors.placeholder} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.icon || colors.placeholder} />
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
                <Ionicons name="calendar-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
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
              <TouchableOpacity 
                style={[styles.inputContainer, errors.university && styles.inputError]}
                onPress={() => setShowUniversityPicker(true)}
              >
                <Ionicons name="school-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <Text style={[styles.input, !university && styles.placeholderText]}>
                  {university || "Select your university"}
                </Text>
              </TouchableOpacity>
              {errors.university && <Text style={styles.errorText}>{errors.university}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field of Study / Major</Text>
              <View style={[styles.inputContainer, errors.major && styles.inputError]}>
                <Ionicons name="book-outline" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your field of study or major"
                  placeholderTextColor={colors.placeholder}
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
                <MaterialIcons name="grade" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your current level (e.g., 100, 200)"
                  placeholderTextColor={colors.placeholder}
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
                <Ionicons name="calendar" size={20} color={colors.icon || colors.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Year of expected graduation"
                  placeholderTextColor={colors.placeholder}
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
                color={colors.primary} 
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

  // University picker modal
  const renderUniversityPicker = () => (
    <Modal
      visible={showUniversityPicker}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setShowUniversityPicker(false)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select University</Text>
            <TouchableOpacity onPress={() => setShowUniversityPicker(false)}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={university}
              onValueChange={(itemValue) => {
                setUniversity(itemValue);
                if (errors.university) setErrors({ ...errors, university: undefined });
              }}
            >
              {universities.map((item, index) => (
                <Picker.Item key={index} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient 
        colors={[colors.background, colors.background, colors.backgroundSecondary || colors.background]} 
        style={styles.gradientBackground}
      >
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
                <Ionicons name="arrow-back" size={24} color={colors.text} />
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
                      <Ionicons name="arrow-back" size={20} color={colors.primary} />
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
        
        {renderUniversityPicker()}
      </LinearGradient>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
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
    backgroundColor: colors.card,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow || '#000',
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
    color: colors.text,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  subtitleText: {
    fontSize: 16,
    color: colors.subtext || colors.placeholder,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeStepIndicator: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.border,
  },
  activeStepConnector: {
    backgroundColor: colors.primary,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  stepDescription: {
    fontSize: 16,
    color: colors.subtext || colors.placeholder,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground || colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    height: 56,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    height: '100%',
  },
  placeholderText: {
    color: colors.placeholder,
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: colors.error,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
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
    backgroundColor: colors.success || '#4CAF50',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    width: '100%',
    shadowColor: colors.success || '#4CAF50',
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
    color: colors.subtext || colors.placeholder,
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  loginLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight || '#F5F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  termsIcon: {
    marginRight: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  pickerCancel: {
    fontSize: 16,
    color: colors.subtext || colors.placeholder,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pickerDone: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  pickerContainer: {
    paddingVertical: 10,
  },
});

export default RegisterScreen;
