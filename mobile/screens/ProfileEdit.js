import React, { useState, useEffect, useContext } from 'react'; // Added useContext
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
  Alert,
  Image,
  Modal // Added Modal
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker'; // Added DateTimePicker
import { Picker } from '@react-native-picker/picker'; // Added Picker
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const ProfileEditScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    dateOfBirth: new Date(0), // Initialize with a default or null, handle string conversion for display
    gender: '',
    university: '',
    fieldOfStudy: '',
    currentYear: '',
    expectedGraduationYear: '',
    studyGoals: '',
    preferredLearningStyle: '',
    profilePictureUrl: null,
  });
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false); // For the overall update process
  const [imageUploading, setImageUploading] = useState(false); // Specifically for image upload progress
  const [loading, setLoading] = useState(true); // For initial data load
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date()); // Temporary date for iOS modal
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || '',
            email: data.email || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(0), // Convert string to Date
            gender: data.gender || '',
            university: data.university || '',
            fieldOfStudy: data.fieldOfStudy || '',
            currentYear: data.currentYear?.toString() || '',
            expectedGraduationYear: data.expectedGraduationYear?.toString() || '',
            studyGoals: data.studyGoals || '',
            preferredLearningStyle: data.preferredLearningStyle || '',
            profilePictureUrl: data.profilePictureUrl || null,
          });
          if (data.profilePictureUrl) {
            setImageUri(data.profilePictureUrl);
          }
        } else {
          setError("No profile data found. Please complete your profile.");
        }
      } else {
        setError("User not logged in.");
        // Consider navigating to Login if critical, or let ProfileScreen handle it
        // navigation.navigate('Login'); 
      }
      setLoading(false);
    };
    fetchUserData();
  }, []); // Removed navigation from deps as it's stable, add if lint complains

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    if (!uri) return null;
    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated for image upload.");
      return null;
    }
    setImageUploading(true);

    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const storageRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}`);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      const handleProgress = (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        // Optionally, update a progress state here
      };

      const handleError = (uploadError) => {
        console.error("Upload failed:", uploadError);
        // It's important to close the blob if the XHR request created it and it's still open,
        // but XHR blobs are typically managed by the browser/runtime.
        // For React Native, direct manipulation like blob.close() is not standard for XHR responses.
        setImageUploading(false);
        reject(uploadError);
      };

      const handleComplete = async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImageUploading(false);
          resolve(downloadURL);
        } catch (e) {
          console.error("Failed to get download URL:", e);
          setImageUploading(false);
          reject(e);
        }
      };

      uploadTask.on("state_changed", handleProgress, handleError, handleComplete);
    });
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    
    if (!profileData.name || !profileData.university || !profileData.fieldOfStudy || !profileData.currentYear || !profileData.expectedGraduationYear) {
      setError('Please fill in all required fields (Name, University, Field of Study, Current Year, Expected Graduation Year).');
      return;
    }
    
    setUploading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to update your profile');
        setUploading(false);
        return;
      }

      let newProfilePictureUrl = profileData.profilePictureUrl;
      // Check if a new image was selected AND it's different from the current one
      if (imageUri && imageUri !== profileData.profilePictureUrl) {
        const uploadedUrl = await uploadImageAsync(imageUri);
        if (uploadedUrl) {
          newProfilePictureUrl = uploadedUrl;
        } else {
          // Error during image upload would have been set by uploadImageAsync or caught here
          if (!error) setError("Failed to upload new profile picture. Previous picture retained.");
          // Decide if to proceed without new image or stop
        }
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      const currentYearNum = parseInt(profileData.currentYear, 10);
      const gradYearNum = parseInt(profileData.expectedGraduationYear, 10);

      if (isNaN(currentYearNum) || currentYearNum <= 0) {
        setError("Invalid Current Year of Study.");
        setUploading(false);
        return;
      }
      if (isNaN(gradYearNum) || gradYearNum <= 2000) { // Basic validation for grad year
        setError("Invalid Expected Graduation Year.");
        setUploading(false);
        return;
      }

      const updatedData = {
        name: profileData.name,
        dateOfBirth: profileData.dateOfBirth.toISOString().split('T')[0], // Store as YYYY-MM-DD string
        gender: profileData.gender,
        university: profileData.university,
        fieldOfStudy: profileData.fieldOfStudy,
        currentYear: currentYearNum,
        expectedGraduationYear: gradYearNum,
        studyGoals: profileData.studyGoals,
        preferredLearningStyle: profileData.preferredLearningStyle,
        profilePictureUrl: newProfilePictureUrl,
        // email is updated via Firebase Auth methods, not directly in Firestore profile usually
      };

      await updateDoc(userDocRef, updatedData);
      
      setSuccess('Profile updated successfully!');
      setProfileData(prev => ({...prev, profilePictureUrl: newProfilePictureUrl}));
      
      setTimeout(() => {
        // Navigate back to ProfileScreen, passing a param to trigger refresh
        navigation.navigate('Settings', { 
          screen: 'ProfileScreen', 
          params: { refreshTimestamp: Date.now() } 
        });
      }, 1500);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setUploading(false);
      setImageUploading(false); // Ensure this is reset
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || (Platform.OS === 'ios' ? tempDate : profileData.dateOfBirth);
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) { // 'set' means a date was selected
        setProfileData(prev => ({ ...prev, dateOfBirth: currentDate }));
      }
    } else { // For iOS, we update a temporary date
      if (selectedDate) {
        setTempDate(currentDate);
      }
    }
  };

  const handleDoneIOSDate = () => {
    setProfileData(prev => ({ ...prev, dateOfBirth: tempDate }));
    setShowDatePicker(false);
  };

  const handleCancelIOSDate = () => {
    setTempDate(profileData.dateOfBirth); // Reset temp date to original if cancelled
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => console.log("Change profile picture")} style={styles.avatarContainer}>
            <Image 
              source={{ uri: profileData.profilePictureUrl || 'https://via.placeholder.com/150' }} 
              style={styles.avatar}
            />
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera-outline" size={20} color={theme.colors.buttonText} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={profileData.name}
          onChangeText={(val) => handleInputChange('name', val)}
          placeholder="Enter your full name"
          placeholderTextColor={theme.colors.subtext}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={profileData.email}
          onChangeText={(val) => handleInputChange('email', val)}
          keyboardType="email-address"
          placeholder="Enter your email address"
          placeholderTextColor={theme.colors.subtext}
          // editable={false} // If email is not editable after creation
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.bio}
          onChangeText={(val) => handleInputChange('bio', val)}
          placeholder="Tell us a bit about yourself"
          multiline
          numberOfLines={4}
          placeholderTextColor={theme.colors.subtext}
        />

        {/* Add more fields as needed, e.g., change password */} 

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={theme.colors.buttonText} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap styles in a function
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingBottom: 30, // Space for save button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    backgroundColor: colors.primary, // Use primary color for header background
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.card, // Border color for avatar
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: colors.secondary, // Or primary, depending on desired look
    padding: 8,
    borderRadius: 15,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 20,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen;
