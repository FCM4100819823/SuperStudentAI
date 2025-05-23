// Placeholder for ProfileScreen.js
import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo for icons
import { useTheme } from '../context/ThemeContext'; // Import useTheme

// A default profile image if user has no image or it fails to load
const defaultProfileImage = require('../assets/superstudentlogo.png'); // Replace with a generic user icon if you have one

const ProfileScreen = ({ navigation, route }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors); // Get styles based on theme
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true); // Set loading true at the start of fetch
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.log("No such user document!");
            setUserData(null); // Clear data if not found
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null); // Clear data on error
        }
      }
      setLoading(false);
    };

    fetchUserData(); // Initial fetch

    // Refresh data when the screen comes into focus or when refreshTimestamp changes
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchUserData();
    });

    return () => {
      unsubscribeFocus();
    };
  }, [navigation, route.params?.refreshTimestamp]); // Added route.params?.refreshTimestamp to dependencies

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Navigation to Auth stack is handled by the main AppNavigator logic
    } catch (error) {
      console.error("Logout Error: ", error);
      alert("Logout failed: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} /> {/* Fix: Use colors.primary instead of theme.colors.primary */}
      </View>
    );
  }

  const ProfileInfoItem = ({ icon, label, value }) => (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={22} color={colors.icon} style={styles.infoIcon} /> {/* Fix: Use colors.icon instead of theme.colors.icon */}
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        <Image 
          source={userData?.profilePictureUrl ? { uri: userData.profilePictureUrl } : defaultProfileImage} 
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userData?.name || 'Super Student'}</Text>
        <Text style={styles.userEmail}>{userData?.email || 'No email'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Academic Information</Text>
        <ProfileInfoItem icon="school-outline" label="University" value={userData?.university} />
        <ProfileInfoItem icon="book-outline" label="Field of Study" value={userData?.fieldOfStudy} />
        <ProfileInfoItem icon="calendar-outline" label="Current Year" value={userData?.currentYear} />
        <ProfileInfoItem icon="ribbon-outline" label="Expected Graduation" value={userData?.expectedGraduationYear} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Study Preferences</Text>
        <ProfileInfoItem icon="bulb-outline" label="Study Goals" value={userData?.studyGoals} />
        <ProfileInfoItem icon="options-outline" label="Learning Style" value={userData?.preferredLearningStyle} />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ProfileEdit', { userData })}>
        <Ionicons name="pencil-outline" size={20} color={theme.colors.buttonText} />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.buttonText} />
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background, 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background, // Added for consistency
  },
  headerContainer: {
    backgroundColor: colors.card, // Use theme color
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: colors.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary, // Use theme color
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text, // Use theme color
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textSecondary, // Use theme color
  },
  card: {
    backgroundColor: colors.card, // Use theme color
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: colors.shadow, // Use theme color
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text, // Use theme color
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Use theme color
    paddingBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
    marginTop: 2, // Align icon with first line of text
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary, // Use theme color
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text, // Use theme color
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary, // Use theme color
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: colors.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: colors.buttonText, // Use theme color
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: colors.error, // Use theme color for error/destructive action
  },
  container: { // Kept for loading state, ensure it uses theme background
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  text: { // General text style if needed, ensure it uses theme text color
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
});

export default ProfileScreen;
