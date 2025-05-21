import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Replace placeholder Icon component with MaterialIcons
const Icon = ({ name, size = 24, color = "#4A5568" }) => <MaterialIcons name={name} size={size} color={color} style={{ marginRight: 10 }} />;

const Register = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState(''); // Added age
  const [level, setLevel] = useState(''); // Added level
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(''); // Added error state

  const handleRegister = async () => {
    if (!name || !email || !password || !university || !major || !graduationYear || !age || !level) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const userLevel = parseInt(level, 10);
    if (isNaN(userLevel) || userLevel < 100 || userLevel > 600) {
      setError('Invalid level. Level must be a number between 100 and 600.');
      return;
    }
    const userAge = parseInt(age, 10);
    if (isNaN(userAge) || userAge <= 0) {
      setError('Invalid age.');
      return;
    }

    setLoading(true);
    setError('');
    console.log(`Attempting to register user with email: ${email}`);
    try {
      const response = await fetch('http://172.20.10.4:3000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, age: parseInt(age), level: parseInt(level), university, major, graduationYear: parseInt(graduationYear) })
      });
      
      const responseText = await response.text(); // Get raw response text for debugging
      console.log('Raw signup response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText); // Try to parse as JSON
      } catch (parseError) {
        console.error('Error parsing signup response JSON:', parseError);
        setError(`Registration failed: Invalid response from server. Status: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = data.message || 'Registration failed. Please try again.';
        // More specific error handling based on backend response
        if (data.errorCode === 'auth/email-already-in-use' || (data.error && data.error.includes('E11000 duplicate key error collection: SuperStudentAI.users index: email_1'))) {
          errorMessage = 'This email is already registered.';
        } else if (data.errorCode === 'FIRESTORE_SAVE_FAILED') {
            errorMessage = 'Account created, but profile save failed. Please contact support.';
        } else if (data.error) {
            errorMessage = data.error; // Use backend error message directly if available
        }
        console.error('Signup API Error:', errorMessage, 'Full response data:', data);
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      console.log('Registration successful! User data:', data.user);
      // Alert.alert('Success', 'Registration successful! Please log in.'); // Keep or remove based on preference
      setLoading(false);
      // navigation.navigate('Login'); // Navigate to Login screen - Original call
      // Replace with a more explicit navigation reset to Login screen
      console.log('Navigating to Login screen by resetting the stack.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });

    } catch (networkError) {
      console.error('Network or unexpected error during registration:', networkError);
      // Check if it's a TypeError related to network request failure
      if (networkError instanceof TypeError && networkError.message === 'Network request failed') {
        setError('Network request failed. Please check your connection and ensure the server is reachable.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const WebWrapper = Platform.OS === 'web' ? View : React.Fragment;
  const webWrapperProps = Platform.OS === 'web' ? { style: styles.webScrollContainer } : {};

  return (
    <WebWrapper {...webWrapperProps}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image source={require('../assets/superstudentlogo.png')} style={{ width: 60, height: 60, marginBottom: 10 }} resizeMode="contain" />
            <Text style={styles.appName}>SuperStudentAI</Text>
            <Text style={styles.tagline}>Your Academic Success Partner</Text>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Your Account</Text>

            {/* Personal Information */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Personal Information</Text>
              <View style={styles.inputWithIcon}>
                <Icon name="person" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="email" />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="cake" />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="lock" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="lock" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>

            {/* Academic Information */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Academic Details</Text>
              <View style={styles.inputWithIcon}>
                <Icon name="leaderboard" />{/* Changed from bar-chart to leaderboard for level */}
                <TextInput
                  style={styles.input}
                  placeholder="Current Level (e.g., 100, 200)"
                  value={level}
                  onChangeText={setLevel}
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="school" />
                <TextInput
                  style={styles.input}
                  placeholder="University / School"
                  value={university}
                  onChangeText={setUniversity}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="menu-book" />{/* Changed from book to menu-book */}
                <TextInput
                  style={styles.input}
                  placeholder="Major / Field of Study"
                  value={major}
                  onChangeText={setMajor}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWithIcon}>
                <Icon name="calendar-today" />{/* Changed from calendar to calendar-today */}
                <TextInput
                  style={styles.input}
                  placeholder="Expected Graduation Year (YYYY)"
                  value={graduationYear}
                  onChangeText={setGraduationYear}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              <Text style={styles.registerButtonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </WebWrapper>
  );
};

const styles = StyleSheet.create({
  webScrollContainer: { // New style for the web wrapper
    height: '100vh',
    overflowY: 'auto',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#E8F0FE', // Light blue-ish background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#1A237E', // Darker, professional blue
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed', // Example professional font
  },
  tagline: {
    fontSize: 16,
    color: '#4A5568', // Softer grey for tagline
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50', // Dark grey/blue
    marginBottom: 25,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495E',
    marginBottom: 10,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Very light grey for input background
    borderColor: '#D1D5DB', // Light border
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10, // Ensure text is vertically centered
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#3498DB', // A vibrant, trustworthy blue
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2980B9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  loginText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Register;
