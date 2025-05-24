import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig'; // Ensure this path is correct
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define static colors and fonts directly
const STATIC_COLORS = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  primary: '#6A11CB',
  secondary: '#2575FC',
  text: '#1A2B4D',
  subtext: '#5A6B7C',
  placeholder: '#A0A0A0',
  border: '#E0E6F0',
  error: '#D32F2F',
  buttonText: '#FFFFFF',
  disabled: '#BDBDBD',
  inputBackground: '#F7F9FC',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

const ProfileEditScreen = ({ navigation }) => {
  const colors = STATIC_COLORS; // USE STATIC
  const fonts = STATIC_FONTS; // USE STATIC
  const styles = getStyles(colors, fonts);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    bio: '',
    profilePicture: null,
  });
  const [newProfilePic, setNewProfilePic] = useState(null); // URI of the new image
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({
          name: data.name || '',
          email: data.email || '',
          bio: data.bio || '',
          profilePicture: data.profilePicture || null,
        });
      } else {
        setError('No profile data found. Please complete your profile.');
      }
    } else {
      setError('User not logged in.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewProfilePic(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    if (!uri) return null;
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated for image upload.');
      return null;
    }

    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const storageRef = ref(
      storage,
      `profile_pictures/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}`,
    );
    const uploadTask = uploadBytes(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (uploadError) => {
          console.error('Upload failed:', uploadError);
          reject(uploadError);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (e) {
            console.error('Failed to get download URL:', e);
            reject(e);
          }
        },
      );
    });
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    if (!userData.name) {
      setError('Please enter your name.');
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to update your profile');
        setSaving(false);
        return;
      }

      let profilePictureUrl = userData.profilePicture;
      if (newProfilePic && newProfilePic !== userData.profilePicture) {
        const uploadedUrl = await uploadImageAsync(newProfilePic);
        if (uploadedUrl) {
          profilePictureUrl = uploadedUrl;
        } else {
          if (!error)
            setError(
              'Failed to upload new profile picture. Previous picture retained.',
            );
        }
      }

      const userDocRef = doc(db, 'users', user.uid);

      const updatedData = {
        name: userData.name,
        bio: userData.bio,
        profilePicture: profilePictureUrl,
      };

      await updateDoc(userDocRef, updatedData);

      setSuccess('Profile updated successfully!');
      setUserData((prev) => ({ ...prev, profilePicture: profilePictureUrl }));

      setTimeout(() => {
        navigation.navigate('Settings', {
          screen: 'ProfileScreen',
          params: { refreshTimestamp: Date.now() },
        });
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 28 }} />
        {/* Spacer */}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.profilePicContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.profilePicButton}>
          <Image
            source={
              newProfilePic
                ? { uri: newProfilePic }
                : userData.profilePicture
                  ? { uri: userData.profilePicture }
                  : require('../assets/default-avatar.png')
            }
            style={styles.profilePic}
          />
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color={colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.placeholder}
          value={userData.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]} // Apply disabled style
          placeholder="Enter your email"
          placeholderTextColor={colors.placeholder}
          value={userData.email}
          editable={false} // Email is not editable
          selectTextOnFocus={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell us about yourself"
          placeholderTextColor={colors.placeholder}
          value={userData.bio}
          onChangeText={(text) => handleInputChange('bio', text)}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSaveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.buttonText} />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStyles = (colors, fonts) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingBottom: 30,
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
      color: colors.primary,
      fontFamily: fonts.medium,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'android' ? 30 : 40,
      paddingBottom: 20,
      marginBottom: 10,
    },
    backButton: {
      padding: 5, // Easier to tap
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    profilePicContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    profilePicButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.border, // Placeholder background
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    profilePic: {
      width: '100%',
      height: '100%',
      borderRadius: 60,
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: Platform.OS === 'ios' ? 15 : 12,
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    bioInput: {
      height: 100, // For multiline
      textAlignVertical: 'top', // Android specific
    },
    disabledInput: {
      backgroundColor: colors.border, // Slightly different background for disabled
      color: colors.subtext,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    disabledButton: {
      backgroundColor: colors.disabled,
    },
    saveButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontFamily: fonts.bold,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      fontFamily: fonts.regular,
      textAlign: 'center',
      marginBottom: 15,
    },
  });

export default ProfileEditScreen;
