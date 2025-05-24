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
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig'; // Ensure this path is correct
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Define static colors and fonts directly
const STATIC_COLORS = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  primary: '#6A11CB',
  secondary: '#2575FC',
  text: '#1A2B4D',
  subtext: '#5A6B7C',
  border: '#E0E6F0',
  error: '#D32F2F',
  buttonText: '#FFFFFF',
  icon: '#1A2B4D',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  headerBackground: '#6A11CB', // Primary color for header
  headerText: '#FFFFFF',
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

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.log('No such document!');
        setUserData(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      <View style={styles.headerContainer}>
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
      </View>

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
          onPress={() => navigation.navigate('AppSettings')}
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
      paddingVertical: 18,
      paddingHorizontal: 15,
      backgroundColor: colors.surface,
      borderRadius: 10,
      marginBottom: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    menuItemIcon: {
      marginRight: 15,
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
      backgroundColor: colors.headerBackground,
      alignItems: 'center',
      paddingTop: Platform.OS === 'android' ? 40 : 60,
      paddingBottom: 30,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    },
    profilePic: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: colors.surface, // White border around pic
      marginBottom: 15,
    },
    userName: {
      fontSize: 26,
      fontFamily: fonts.bold,
      color: colors.headerText,
      marginBottom: 5,
    },
    userEmail: {
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.headerText,
      opacity: 0.85,
      marginBottom: 10,
    },
    userBio: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.headerText,
      opacity: 0.75,
      textAlign: 'center',
      paddingHorizontal: 20,
      fontStyle: 'italic',
    },
    menuContainer: {
      paddingHorizontal: 20,
      marginTop: 10, // Add some space if header is not curved or less padding
    },
    actionsContainer: {
      marginTop: 30,
      paddingHorizontal: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    actionButtonIcon: {
      marginRight: 10,
    },
    actionButtonText: {
      fontSize: 17,
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
