import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image, // Added Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons
import { signOut } from 'firebase/auth'; // For logout
import { auth, db, storage } from '../firebaseConfig'; // Ensure db and storage are correctly imported if needed for other settings
import { doc, getDoc } from 'firebase/firestore'; // For fetching user data
import { useFocusEffect } from '@react-navigation/native';

// Define static colors and fonts for a professional look
const STATIC_COLORS = {
  background: '#F0F4F8', // Light, clean background
  surface: '#FFFFFF', // For cards and surfaces
  primary: '#6A11CB', // Deep purple - primary brand color
  secondary: '#2575FC', // Vibrant blue - secondary accent
  text: '#1A2B4D', // Dark, readable text
  subtext: '#5A6B7C', // Lighter text for secondary info
  border: '#E0E6F0',
  error: '#D32F2F',
  success: '#28A745',
  disabled: '#B0B0B0',
  icon: '#1A2B4D',
  white: '#FFFFFF',
  headerText: '#FFFFFF',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  borderMuted: '#DDE2E8',
  // ... add more as needed
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System-Medium' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System-Bold' : 'sans-serif-bold',
  // ... add more specific font weights if available and needed
};

const AppSettingsScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const fonts = STATIC_FONTS;
  const styles = getStyles(colors, fonts);

  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSyncEnabled, setDataSyncEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Example: Dark mode toggle

  const fetchUserProfile = useCallback(async () => {
    setLoadingProfile(true);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoadingProfile(false);
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.log('No such document for user profile in settings!');
        // Optionally set an error or default state
      }
    } catch (error) {
      console.error('Error fetching user data for settings:', error);
      // Optionally set an error
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      // Potentially load other settings from AsyncStorage or backend here
    }, [fetchUserProfile])
  );

  const toggleNotifications = () => setNotificationsEnabled((prev) => !prev);
  const toggleDataSync = () => setDataSyncEnabled((prev) => !prev);
  const toggleDarkMode = () => setDarkModeEnabled((prev) => !prev); // Example handler

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            // Navigation to Auth stack is usually handled by a top-level navigator
            // based on auth state. If not, explicitly navigate:
            // navigation.replace('Login'); // Or your auth entry screen
          } catch (err) {
            Alert.alert('Logout Failed', err.message);
          }
        },
      },
    ]);
  };

  const SettingItem = ({
    label,
    value,
    onValueChange,
    type = 'switch',
    onPress,
    iconName,
    iconColor = colors.icon,
    isDestructive = false,
  }) => (
    <TouchableOpacity onPress={onPress || onValueChange} style={styles.settingItem} disabled={!onPress && type !== 'switch'}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={24}
          color={isDestructive ? colors.error : iconColor}
          style={styles.settingIcon}
        />
      )}
      <Text style={[styles.settingLabel, isDestructive && { color: colors.error }]}>{label}</Text>
      {type === 'switch' && (
        <Switch
          trackColor={{ false: colors.disabled, true: colors.primary + 'aa' }}
          thumbColor={value ? colors.primary : colors.surface}
          ios_backgroundColor={colors.disabled}
          onValueChange={onValueChange}
          value={value}
        />
      )}
      {type === 'button' && !isDestructive && (
         <Ionicons name="chevron-forward-outline" size={22} color={colors.subtext} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Section */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileEdit')} style={styles.avatarContainer}>
          <Image
            source={userData?.profilePicture ? { uri: userData.profilePicture } : require('../assets/default-avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.editIconContainer}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.profileName}>{userData?.name || 'Super Student'}</Text>
        <Text style={styles.profileEmail}>{userData?.email || 'No email provided'}</Text>
        <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('ProfileEdit')}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <SettingItem
          label="Enable Notifications"
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          iconName="notifications-outline"
        />
        <SettingItem
          label="Dark Mode"
          value={darkModeEnabled}
          onValueChange={toggleDarkMode} // Placeholder
          iconName="moon-outline"
        />
      </View>

      {/* Data & Sync Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        <SettingItem
          label="Enable Data Sync"
          value={dataSyncEnabled}
          onValueChange={toggleDataSync}
          iconName="sync-circle-outline"
        />
        <SettingItem
          label="Manage Storage"
          type="button"
          onPress={() => Alert.alert('Manage Storage', 'Functionality to be implemented.')}
          iconName="server-outline"
        />
        <SettingItem
          label="Clear Cache"
          type="button"
          onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully!')}
          iconName="trash-bin-outline"
        />
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          label="Account Information"
          type="button"
          onPress={() => navigation.navigate('ProfileScreen')} // Navigate to a detailed Profile View if different from Edit
          iconName="person-circle-outline"
        />
        <SettingItem
          label="Change Password"
          type="button"
          onPress={() => navigation.navigate('ForgotPassword', { fromSettings: true })}
          iconName="lock-closed-outline"
        />
         <SettingItem
          label="Privacy Policy"
          type="button"
          onPress={() => Alert.alert('Privacy Policy', 'Link to privacy policy here.')}
          iconName="shield-checkmark-outline"
        />
        <SettingItem
          label="Terms of Service"
          type="button"
          onPress={() => Alert.alert('Terms of Service', 'Link to terms of service here.')}
          iconName="document-text-outline"
        />
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <SettingItem
          label="Logout"
          type="button"
          onPress={handleLogout}
          iconName="log-out-outline"
          iconColor={colors.error} // Custom color for logout icon
          isDestructive={true}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SuperStudent AI v1.0.0</Text>
        <Text style={styles.footerSubText}>© 2025 SuperStudent Technologies</Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors, fonts) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    profileHeader: {
      backgroundColor: colors.primary,
      paddingVertical: 30,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: 10, // Space before the first settings section
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 10,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: colors.white,
    },
    editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.secondary,
      padding: 6,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: colors.white,
    },
    profileName: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.white,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.white + 'dd',
      marginBottom: 15,
    },
    editProfileButton: {
        backgroundColor: colors.white + '30', // Semi-transparent white
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    editProfileButtonText: {
        color: colors.white,
        fontFamily: fonts.medium,
        fontSize: 14,
    },
    section: {
      marginBottom: 10, // Reduced margin between sections
      backgroundColor: colors.card,
      borderRadius: 10,
      marginHorizontal: 15,
      paddingVertical: 5, // Reduced padding for a tighter look
      // Removed shadow for a flatter design, or add subtle shadow if preferred
    },
    sectionTitle: {
      fontSize: 14, // Smaller section title
      fontFamily: fonts.medium,
      color: colors.subtext,
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 8, // Space before first item in section
      textTransform: 'uppercase', // Uppercase for distinction
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15, // Standard padding for items
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    settingItemNoBorder: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      marginRight: 15,
      width: 24, // Ensure consistent icon alignment
      textAlign: 'center',
    },
    settingLabel: {
      flex: 1,
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    // Removed navigateButton and navigateButtonText as chevron is now part of SettingItem
    footer: {
      paddingVertical: 30,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.subtext,
    },
    footerSubText: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.subtext,
      marginTop: 4,
    },
  });

export default AppSettingsScreen;
