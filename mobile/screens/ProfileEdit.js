import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';

const ProfileEdit = ({ route, navigation }) => {
  // Get profile data passed from Dashboard
  const { profileData: initialProfileData } = route.params || {};
  
  // Form state
  const [name, setName] = useState(initialProfileData?.name || '');
  const [email, setEmail] = useState(initialProfileData?.email || '');
  const [age, setAge] = useState(initialProfileData?.age?.toString() || '');
  const [level, setLevel] = useState(initialProfileData?.level?.toString() || '');
  const [university, setUniversity] = useState(initialProfileData?.university || '');
  const [major, setMajor] = useState(initialProfileData?.major || '');
  const [graduationYear, setGraduationYear] = useState(initialProfileData?.graduationYear?.toString() || '');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async () => {
    // Reset messages
    setError('');
    setSuccess('');
    
    // Validate form
    if (!name || !email || !age || !level || !university || !major || !graduationYear) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate level (Ghana university levels: 100 to 600)
    const userLevel = parseInt(level, 10);
    if (isNaN(userLevel) || userLevel < 100 || userLevel > 600) {
      setError('Invalid level. Level must be between 100 and 600.');
      return;
    }
    
    // Validate age
    const userAge = parseInt(age, 10);
    if (isNaN(userAge) || userAge <= 0) {
      setError('Invalid age.');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in to update your profile');
        setLoading(false);
        return;
      }
      
      const idToken = await user.getIdToken();
      
      // Replace with your actual backend URL
      const backendUrl = 'http://172.20.10.4:5000'; // Use LAN IP for physical device
      const response = await fetch(`${backendUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name,
          email,
          age: userAge,
          level: userLevel,
          university,
          major,
          graduationYear
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred while updating your profile');
      }
      
      setSuccess('Profile updated successfully!');
      
      // Update local state with the returned data
      setTimeout(() => {
        // Navigate back to dashboard and pass the updated profile data
        navigation.navigate('Dashboard', { refreshProfile: true });
      }, 1500);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.formContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="cake" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Enter your age"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
          
          {/* Academic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>University / School</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="school" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={university}
                  onChangeText={setUniversity}
                  placeholder="Enter your university/school"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Major / Field of Study</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="menu-book" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={major}
                  onChangeText={setMajor}
                  placeholder="Enter your major/field of study"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Level (100-600)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="leaderboard" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={level}
                  onChangeText={setLevel}
                  placeholder="Enter your level (e.g., 100, 200)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Graduation Year</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="event" size={22} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={graduationYear}
                  onChangeText={setGraduationYear}
                  placeholder="Enter your graduation year"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
          
          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#4169E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: '#333',
    paddingRight: 10,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  successText: {
    color: '#388E3C',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  updateButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileEdit;
