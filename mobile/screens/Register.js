import React, { useState, useRef, useContext } from 'react'; // Added useContext
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView, // Ensure ScrollView is imported
  KeyboardAvoidingView,
  Platform,
  Animated, // Added Animated
  Modal, // Added Modal
  SafeAreaView // Ensure SafeAreaView is imported
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const RegisterScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors); // Pass only colors to getStyles

  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // New field
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [dobPlaceholder, setDobPlaceholder] = useState(true); // Flag for DOB placeholder
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date()); // Temporary date for iOS modal
  const [gender, setGender] = useState(''); // New field (string for now)
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  
  const [university, setUniversity] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [expectedGraduationYear, setExpectedGraduationYear] = useState('');
  const [studyGoals, setStudyGoals] = useState('');
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  // Animation for screen load
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        delay: 100,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateFields = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full Name is required.';
    if (!username.trim()) newErrors.username = 'Username is required.';
    else if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    // Note: Date of Birth is currently optional as per validation logic.
    // if (dobPlaceholder) newErrors.dateOfBirth = 'Date of Birth is required.'; // Example if it were required
    if (!gender) newErrors.gender = 'Gender is required.';

    if (!university.trim()) newErrors.university = 'University is required.';
    if (!fieldOfStudy.trim()) newErrors.fieldOfStudy = 'Field of Study is required.';
    if (!currentYear.trim()) newErrors.currentYear = 'Current Year/Level is required.';
    if (!expectedGraduationYear.trim()) newErrors.expectedGraduationYear = 'Expected Graduation Year is required.';
    // studyGoals & preferredLearningStyle can be optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateFields()) {
      Alert.alert('Validation Error', 'Please check the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name.trim(),
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth: dobPlaceholder ? null : dateOfBirth.toISOString().split('T')[0],
        gender: gender.trim(),
        university: university.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        currentYear: currentYear.trim(),
        expectedGraduationYear: expectedGraduationYear.trim(),
        studyGoals: studyGoals.trim(),
        preferredLearningStyle: preferredLearningStyle.trim(),
        createdAt: new Date().toISOString(),
        studyPlans: [],
        profilePictureUrl: null,
      });

      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );

    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            setErrors(prevErrors => ({ ...prevErrors, email: errorMessage }));
            break;
          case 'auth/invalid-email':
            errorMessage = 'That email address is invalid.';
            setErrors(prevErrors => ({ ...prevErrors, email: errorMessage }));
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. It must be at least 6 characters long.';
            setErrors(prevErrors => ({ ...prevErrors, password: errorMessage }));
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      Alert.alert('Registration Error', errorMessage);
      if (!errors.email && !errors.password) { // Avoid overwriting specific field errors
        setErrors(prevErrors => ({ ...prevErrors, general: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || (Platform.OS === 'ios' ? tempDate : dateOfBirth);

    if (Platform.OS === 'android') {
      setShowDatePicker(false); 
      if (event.type === 'set' && currentDate) { 
        setDateOfBirth(currentDate);
        setDobPlaceholder(false);
      }
    } else { // iOS
      if (currentDate) { 
        setTempDate(currentDate);
      }
    }
  };

  const handleDoneIOSDate = () => {
    setDateOfBirth(tempDate);
    setDobPlaceholder(false);
    setShowDatePicker(false);
  };

  const handleCancelIOSDate = () => {
    setShowDatePicker(false);
  };

  const genderOptions = [
    { label: 'Select Gender', value: '' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non-binary' },
    { label: 'Prefer not to say', value: 'prefer-not-to-say' },
    { label: 'Other', value: 'other' },
  ];

  // Helper to render input fields with icons and error messages
  const renderInput = (field, placeholder, value, setter, keyboardType = 'default', secureTextEntry = false, iconName, multiline = false, numberOfLines = 1) => (
    <View style={styles.inputWrapper}>
      <View style={[
        styles.inputContainer,
        errors[field] && styles.inputErrorBorder,
        focusedField === field && styles.inputFocusedBorder
      ]}>
        {iconName && <Ionicons name={iconName} size={20} color={focusedField === field ? colors.primary : colors.inputIcon} style={styles.inputIcon} />}
        <TextInput
          style={[styles.input, multiline && styles.textAreaInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={setter}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
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
            paddingBottom: 30,
            backgroundColor: colors.background,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
        >
          <View style={styles.formContainer}>
            <Image source={require('../assets/superstudentlogo.png')} style={styles.logo} />
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Let's get you started on your academic journey!</Text>

            {renderInput('name', 'Full Name', name, setName, 'default', false, 'person-outline')}
            {renderInput('username', 'Username', username, setUsername, 'default', false, 'at-outline')}
            {renderInput('email', 'Email Address', email, setEmail, 'email-address', false, 'mail-outline')}
            {renderInput('password', 'Password (min. 6 characters)', password, setPassword, 'default', true, 'lock-closed-outline')}
            {renderInput('confirmPassword', 'Confirm Password', confirmPassword, setConfirmPassword, 'default', true, 'lock-closed-outline')}

            {/* Date of Birth Picker */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity 
                style={[
                  styles.inputContainer, 
                  styles.pickerInputContainer, 
                  errors.dateOfBirth && styles.inputErrorBorder,
                  focusedField === 'dateOfBirth' && styles.inputFocusedBorder
                ]} 
                onPress={() => {
                  setShowDatePicker(true);
                  setFocusedField('dateOfBirth');
                  if (Platform.OS === 'ios') setTempDate(new Date(dateOfBirth)); // Initialize tempDate for iOS
                }}
                onBlur={() => setFocusedField(null)} // This won't work directly on TouchableOpacity, handle focus via state
              >
                <Ionicons name="calendar-outline" size={20} color={focusedField === 'dateOfBirth' ? colors.primary : colors.inputIcon} style={styles.inputIcon} />
                <Text style={[styles.pickerInputText, dobPlaceholder && styles.placeholderText]}>
                  {dobPlaceholder ? 'Date of Birth' : dateOfBirth.toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color={colors.inputIcon} />
              </TouchableOpacity>
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="spinner" // Or "default"
                onChange={onDateChange}
                maximumDate={new Date()} // Users can't be born in the future
                // themeVariant={theme.theme} // Pass theme variant if supported
              />
            )}

            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.iosPickerModalContainer}>
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner" // Spinner is often better for modals
                      onChange={onDateChange}
                      maximumDate={new Date()}
                      textColor={theme.colors.text} // Style for iOS picker text
                      style={{ width: '100%'}} // Ensure picker takes full width
                    />
                    <View style={styles.iosPickerButtons}>
                      <TouchableOpacity style={[styles.iosPickerButton, styles.iosPickerCancelButton]} onPress={handleCancelIOSDate}>
                        <Text style={[styles.iosPickerButtonText, styles.iosPickerCancelButtonText]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.iosPickerButton, styles.iosPickerDoneButton]} onPress={handleDoneIOSDate}>
                        <Text style={styles.iosPickerButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {/* Gender Picker */}
            <View style={styles.inputWrapper}>
              <TouchableOpacity 
                style={[
                  styles.inputContainer, 
                  styles.pickerInputContainer, 
                  errors.gender && styles.inputErrorBorder,
                  focusedField === 'gender' && styles.inputFocusedBorder
                ]} 
                onPress={() => {
                  setShowGenderPicker(true);
                  setFocusedField('gender');
                }}
                onBlur={() => setFocusedField(null)}
              >
                <Ionicons name="transgender-outline" size={20} color={focusedField === 'gender' ? colors.primary : colors.inputIcon} style={styles.inputIcon} />
                <Text style={[styles.pickerInputText, !gender && styles.placeholderText]}>
                  {gender ? genderOptions.find(opt => opt.value === gender)?.label : 'Select Gender'}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color={colors.inputIcon} />
              </TouchableOpacity>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>
            
            <Modal
              transparent={true}
              animationType="slide"
              visible={showGenderPicker}
              onRequestClose={() => setShowGenderPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.pickerModalContainer}>
                  <Text style={styles.modalTitle}>Select Gender</Text>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => setGender(itemValue)}
                    style={styles.pickerStyle}
                    itemStyle={styles.pickerItemStyle} // For iOS
                  >
                    {genderOptions.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} color={theme.colors.text} />
                    ))}
                  </Picker>
                  <TouchableOpacity style={styles.modalDoneButton} onPress={() => setShowGenderPicker(false)}>
                    <Text style={styles.modalDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Academic Information */}
            <Text style={styles.sectionTitle}>Academic Information</Text>
            {renderInput('university', 'University/Institution', university, setUniversity, 'default', false, 'school-outline')}
            {renderInput('fieldOfStudy', 'Field of Study (e.g., Computer Science)', fieldOfStudy, setFieldOfStudy, 'default', false, 'book-outline')}
            {renderInput('currentYear', 'Current Year/Level (e.g., 2nd Year, Sophomore)', currentYear, setCurrentYear, 'default', false, 'bar-chart-outline')}
            {renderInput('expectedGraduationYear', 'Expected Graduation Year (e.g., 2025)', expectedGraduationYear, setExpectedGraduationYear, 'numeric', false, 'calendar-number-outline')}
            
            <Text style={styles.sectionTitle}>Personalization (Optional)</Text>
            {renderInput('studyGoals', 'Primary Study Goals (e.g., Improve grades, Learn new skills)', studyGoals, setStudyGoals, 'default', false, 'flag-outline', true, 3)}
            {renderInput('preferredLearningStyle', 'Preferred Learning Style (e.g., Visual, Auditory, Kinesthetic)', preferredLearningStyle, setPreferredLearningStyle, 'default', false, 'bulb-outline')}


            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.buttonText} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRedirect}>
              <Text style={styles.loginRedirectText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginRedirectLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20, // Space for the last element
  },
  formContainer: {
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40, // Adjust top padding
    paddingBottom: 20,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    resizeMode: 'contain',
    marginBottom: height * 0.02,
  },
  title: {
    fontSize: width * 0.07, // Responsive font size
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: height * 0.01,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width * 0.04, // Responsive font size
    color: colors.subtext,
    marginBottom: height * 0.03,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: height * 0.015, // Adjusted spacing
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    height: Platform.OS === 'ios' ? 50 : 50, // Consistent height
  },
  inputErrorBorder: {
    borderColor: colors.error,
  },
  inputFocusedBorder: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: width * 0.04,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, // Adjusted padding
  },
  textAreaInput: {
    height: height * 0.12, // Larger area for multiline
    textAlignVertical: 'top',
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
  },
  pickerInputContainer: {
    justifyContent: 'space-between', // For icon alignment in picker touchable
  },
  pickerInputText: {
    flex: 1,
    fontSize: width * 0.04,
    color: colors.text,
  },
  placeholderText: {
    color: colors.placeholder,
  },
  errorText: {
    color: colors.error,
    fontSize: width * 0.035,
    marginTop: 5,
    marginLeft: 10, // Align with input fields
    textAlign: 'left', // Ensure errors are aligned to the start
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 15,
    alignSelf: 'flex-start', // Align to the left
  },
  registerButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  registerButtonText: {
    color: colors.buttonText,
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  loginRedirect: {
    flexDirection: 'row',
    marginTop: 25,
    marginBottom: 20, // Add some bottom margin
    alignItems: 'center',
  },
  loginRedirectText: {
    fontSize: width * 0.038,
    color: colors.subtext,
  },
  loginRedirectLink: {
    fontSize: width * 0.038,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // iOS DateTimePicker Modal Styles
  iosPickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Position at the bottom
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent overlay
  },
  iosPickerContainer: {
    backgroundColor: colors.surface, // Use surface color for picker background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10, // Added horizontal padding
    marginHorizontal: 20, // Margin for the modal content
    width: width * 0.9, // Control width
    alignSelf: 'center', // Center the wrapper
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  iosPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    marginTop: 15,
    paddingHorizontal: 10, // Padding for controls container
  },
  iosPickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 25, // Make buttons wider
    borderRadius: 8,
    backgroundColor: colors.primary, // Use primary color for buttons
  },
  iosPickerButtonText: {
    color: colors.buttonText,
    fontSize: width * 0.04,
    fontWeight: '600',
  },

  // Styles for Gender Picker Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker backdrop
  },
  pickerModalContainer: {
    width: width * 0.85, // Control width of the modal
    backgroundColor: colors.surface,
    borderRadius: 15, // Rounded corners
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15, // Increased padding
    marginBottom: 10, // Space below header
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: width * 0.05, // Responsive font size
    fontWeight: 'bold',
    color: colors.text,
  },
  pickerDoneButton: { // For the "Done" button in Gender Picker
    paddingVertical: 8, // Adjusted padding
    paddingHorizontal: 18, // Adjusted padding
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  pickerDoneButtonText: {
    color: colors.buttonText,
    fontSize: width * 0.038, // Responsive font size
    fontWeight: '600', // Slightly bolder
  },
  picker: {
    width: '100%',
    // height: Platform.OS === 'ios' ? 180 : 50, // Adjust height as needed
    color: colors.text, // Ensure picker text is visible
  },
  pickerItem: { // For iOS Picker item styling
    fontSize: width * 0.045,
    color: colors.text,
    // height: 120, // May need to adjust
  },
  // ... any other styles
});

export default RegisterScreen;
