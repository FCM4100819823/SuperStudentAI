import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase'; // Ensure this path is correct
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

// Define static colors and fonts directly
const STATIC_COLORS = {
  background: '#F0F4F8', // Lightest grey for a very clean look
  surface: '#FFFFFF',
  primary: '#6A11CB', // Deep, motivating purple
  secondary: '#2575FC', // Vibrant blue for accents
  text: '#121212', // Darker text for better contrast
  subtext: '#5A6B7C', // Softer grey for less emphasis
  border: '#E0E6F0',
  error: '#D32F2F',
  buttonText: '#FFFFFF',
  icon: '#6A11CB', // Primary color for icons in menu items
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)', // Softer shadow
  // headerBackground: '#6A11CB', // Will be replaced by gradient
  headerText: '#FFFFFF',
  profileStatsBackground: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white for stats
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

const ProfileScreen = ({ navigation }) => {
  const colors = STATIC_COLORS; // USE STATIC
  const fonts = STATIC_FONTS; // USE STATIC
  const styles = getStyles(colors, fonts);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    tasksCompleted: 0,
    studyHours: 0,
  });

  // Capture currentUser at the beginning of the render
  const currentUser = auth.currentUser;

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const userId = currentUser?.uid; // Use the captured currentUser's uid

    if (!userId) {
      setLoading(false);
      setUserData(null); // Clear user data if no user
      setUserStats({ tasksCompleted: 0, studyHours: 0 }); // Reset stats
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        const fetchedStats = {
          tasksCompleted: data.tasksCompleted || 0,
          studyHours: data.studyHours || 0,
        };
        setUserStats(fetchedStats);
      } else {
        console.log('No such document for userId:', userId);
        setUserData(null);
        setUserStats({ tasksCompleted: 0, studyHours: 0 });
      }
    } catch (error) {
      console.error('Error fetching user data for userId:', userId, error);
      setUserData(null);
      setUserStats({ tasksCompleted: 0, studyHours: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, db]); // Added currentUser?.uid and db to dependencies. State setters are stable.

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserProfile().then(() => setRefreshing(false));
  }, [fetchUserProfile]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Navigation to Auth stack is handled by the main AppNavigator logic
    } catch (error) {
      console.error('Logout Error: ', error);
      alert('Logout failed: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userDocRef = doc(db, 'users', userId);
    const userStorageRef = ref(storage, `profilePictures/${userId}`);

    try {
      // Delete user document from Firestore
      await deleteDoc(userDocRef);
      // Delete user profile picture from Storage
      await deleteObject(userStorageRef);
      // Sign out the user
      await auth.signOut();
      // Navigate to Auth screen or show a logged-out state
      navigation.navigate('Auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account: ' + error.message);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Confirm Delete Account',
      'This action cannot be undone. Do you really want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteAccount },
      ],
    );
  };

  const handleShareProfile = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const shareOptions = {
      message: `Check out my profile on SuperStudent AI! ${userData?.bio || ''}`,
      url: `https://www.superstudentai.com/profile/${userId}`, // Assuming this is the profile URL
    };

    try {
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing profile:', error);
      alert('Error sharing profile: ' + error.message);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!userData && !loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Could not load profile. Please try again.
        </Text>
        <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <LinearGradient
        colors={['#6A11CB', '#2575FC']} // Gradient colors
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }} // Gradient start point
        end={{ x: 1, y: 1 }} // Gradient end point
      >
        <Image
          source={
            userData?.profilePicture
              ? { uri: userData.profilePicture }
              : require('../assets/default-avatar.png')
          }
          style={styles.profilePic}
        />
        <Text style={styles.userName}>{userData?.name || 'Super Student'}</Text>
        <Text style={styles.userEmail}>
          {userData?.email || 'No email provided'}
        </Text>
        {userData?.bio && <Text style={styles.userBio}>{userData.bio}</Text>}

        {/* User Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.tasksCompleted}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.studyHours}</Text>
            <Text style={styles.statLabel}>Study Hours</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.menuContainer}>
        <MenuItem
          icon="person-circle-outline"
          text="Edit Profile"
          onPress={() => navigation.navigate('ProfileEdit')}
          colors={colors}
          fonts={fonts}
        />
        <MenuItem
          icon="settings-outline"
          text="App Settings"
          onPress={() => navigation.navigate('SettingsTab')} // Corrected: Navigate to SettingsTab
          colors={colors}
          fonts={fonts}
        />
        <MenuItem
          icon="share-social-outline"
          text="Share Profile"
          onPress={handleShareProfile}
          colors={colors}
          fonts={fonts}
        />
        <MenuItem
          icon="information-circle-outline"
          text="About SuperStudent AI"
          onPress={() =>
            Alert.alert(
              'About',
              'SuperStudent AI v1.0.0\nYour ultimate study companion.',
            )
          }
          colors={colors}
          fonts={fonts}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={colors.buttonText}
            style={styles.actionButtonIcon}
          />
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={confirmDeleteAccount}
        >
          <Ionicons
            name="trash-bin-outline"
            size={22}
            color={colors.buttonText}
            style={styles.actionButtonIcon}
          />
          <Text style={styles.actionButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MenuItem = ({ icon, text, onPress, colors, fonts }) => (
  <TouchableOpacity
    style={getMenuItemStyles(colors).menuItem}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={24}
      color={colors.primary}
      style={getMenuItemStyles(colors).menuItemIcon}
    />
    <Text style={getMenuItemStyles(colors, fonts).menuItemText}>{text}</Text>
    <Ionicons name="chevron-forward-outline" size={22} color={colors.subtext} />
  </TouchableOpacity>
);

const getMenuItemStyles = (colors, fonts) =>
  StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20, // Increased padding
      paddingHorizontal: 20, // Increased padding
      backgroundColor: colors.surface,
      borderRadius: 12, // Slightly more rounded
      marginBottom: 12, // Increased spacing
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 }, // Adjusted shadow
      shadowOpacity: 0.1, // Adjusted shadow
      shadowRadius: 4, // Adjusted shadow
      elevation: 3, // Adjusted elevation
    },
    menuItemIcon: {
      marginRight: 18, // Increased spacing
      color: colors.icon, // Use defined icon color
    },
    menuItemText: {
      flex: 1,
      fontSize: 17,
      fontFamily: fonts?.medium || 'sans-serif-medium',
      color: colors.text,
    },
  });

const getStyles = (colors, fonts) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingBottom: 40, // Increased bottom padding
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
    errorText: {
      fontSize: 16,
      color: colors.error,
      fontFamily: fonts.regular,
      textAlign: 'center',
      marginBottom: 15,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontFamily: fonts.medium,
    },
    headerContainer: {
      // backgroundColor: colors.headerBackground, // Removed as LinearGradient is used
      alignItems: 'center',
      paddingTop: Platform.OS === 'android' ? 50 : 70, // Increased top padding
      paddingBottom: 40, // Increased bottom padding
      borderBottomLeftRadius: 35, // More pronounced curve
      borderBottomRightRadius: 35, // More pronounced curve
      marginBottom: 25, // Increased spacing
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 }, // Enhanced shadow
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    profilePic: {
      width: 130, // Larger pic
      height: 130, // Larger pic
      borderRadius: 65, // Keep it circular
      borderWidth: 4, // Thicker border
      borderColor: colors.surface,
      marginBottom: 18, // Increased spacing
    },
    userName: {
      fontSize: 28, // Larger name
      fontFamily: fonts.bold,
      color: colors.headerText,
      marginBottom: 6, // Adjusted spacing
    },
    userEmail: {
      fontSize: 17, // Slightly larger email
      fontFamily: fonts.regular,
      color: colors.headerText,
      opacity: 0.9, // Slightly more opaque
      marginBottom: 12, // Increased spacing
    },
    userBio: {
      fontSize: 15, // Slightly larger bio
      fontFamily: fonts.regular,
      color: colors.headerText,
      opacity: 0.8,
      textAlign: 'center',
      paddingHorizontal: 25, // Increased padding
      fontStyle: 'italic',
      lineHeight: 22, // Improved readability
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: colors.profileStatsBackground,
      borderRadius: 15,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginTop: 20,
      width: '90%',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.headerText,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.headerText,
      opacity: 0.85,
      textTransform: 'uppercase',
    },
    statSeparator: {
      width: 1,
      height: '60%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    menuContainer: {
      paddingHorizontal: 20,
      marginTop: 15,
    },
    actionsContainer: {
      marginTop: 35, // Increased spacing
      paddingHorizontal: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16, // Increased padding
      borderRadius: 12, // More rounded
      marginBottom: 18, // Increased spacing
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 }, // Adjusted shadow
      shadowOpacity: 0.15, // Adjusted shadow
      shadowRadius: 5, // Adjusted shadow
      elevation: 3, // Adjusted elevation
    },
    actionButtonIcon: {
      marginRight: 12, // Increased spacing
    },
    actionButtonText: {
      fontSize: 18, // Larger text
      fontFamily: fonts.medium,
      color: colors.buttonText,
    },
    logoutButton: {
      backgroundColor: colors.secondary,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
  });

export default ProfileScreen;
