import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { firestoreDb, auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo for icons

// Enhanced Design System (consistent with FinanceScreen)
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green (used for toggles, positive actions)
  accent: '#F59E0B', // Amber (for highlights or secondary actions)
  danger: '#EF4444', // Red (for destructive actions like logout)
  success: '#4CAF50',
  warning: '#F59E0B',

  background: '#F4F6F8', // Light, clean background
  surface: '#FFFFFF', // For cards and interactive elements
  
  text: '#1A202C', // Darker text for better contrast
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.05)',
  disabled: '#CBD5E0',
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: STATIC_COLORS.text },
  h2: { fontSize: 22, fontWeight: 'bold', color: STATIC_COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: STATIC_COLORS.text },
  body: { fontSize: 16, fontWeight: '400', color: STATIC_COLORS.textSecondary, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', color: STATIC_COLORS.text, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', color: STATIC_COLORS.textMuted, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
  listItem: { fontSize: 17, fontWeight: '500', color: STATIC_COLORS.text },
};

const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

const AppSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    darkMode: false, // Assuming a light mode default
    dataSync: true,
    language: 'English',
    // Add more settings as needed
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState('User');

  const userId = auth.currentUser?.uid;

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      setLoading(false);
      navigation.replace('Login'); // Or your main auth flow
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(firestoreDb, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setSettings(prevSettings => ({
          ...prevSettings,
          notificationsEnabled: userData.appSettings?.notificationsEnabled !== undefined ? userData.appSettings.notificationsEnabled : true,
          darkMode: userData.appSettings?.darkMode !== undefined ? userData.appSettings.darkMode : false,
          dataSync: userData.appSettings?.dataSync !== undefined ? userData.appSettings.dataSync : true,
          language: userData.appSettings?.language || 'English',
        }));
        setUserName(userData.name || 'User');
      } else {
        // Initialize with default settings if no doc exists (or handle as error)
        console.log("No such user document! Using default settings.");
      }
    } catch (error) {
      console.error("Error fetching settings: ", error);
      Alert.alert("Error", "Could not load settings. " + error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = async (key, value) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated. Cannot save settings.");
      return;
    }
    
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsSaving(true);
    try {
      const userDocRef = doc(firestoreDb, 'users', userId);
      await updateDoc(userDocRef, {
        appSettings: { // Store settings under an 'appSettings' map
          ...settings, // current settings state
          [key]: value,   // the updated key-value pair
        },
        lastUpdated: serverTimestamp(),
      });
      // Optionally, show a success toast/message here
    } catch (error) {
      console.error("Error updating setting: ", error);
      Alert.alert("Error", `Could not save ${key}. ` + error.message);
      // Revert UI change on error
      setSettings(prev => ({ ...prev, [key]: !value })); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Auth'); // Navigate to your Auth stack or Login screen
            } catch (error) {
              console.error("Logout Error: ", error);
              Alert.alert("Logout Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleNavigateToProfile = () => {
    navigation.navigate('Profile'); // Ensure 'Profile' route exists in your navigator
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out SuperStudentAI! Your personal AI study companion. Download now: [App Store Link] or [Play Store Link]',
        // url: 'YOUR_APP_URL', // Optional: if you have a website for the app
        title: 'SuperStudentAI'
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the app. " + error.message);
    }
  };

  const handleRateApp = () => {
    // This is a placeholder. Replace with actual store links.
    const storeUrl = Platform.OS === 'ios' 
      ? 'itms-apps://itunes.apple.com/app/YOUR_APP_ID' 
      : 'market://details?id=YOUR_PACKAGE_NAME';
    Linking.canOpenURL(storeUrl).then(supported => {
      if (supported) {
        Linking.openURL(storeUrl);
      } else {
        Alert.alert("Error", "Could not open the app store.");
      }
    });
  };

  const renderSettingItem = ({ title, value, onValueChange, type = 'switch', iconName, onPress, description }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.settingItemContainer}>
      <View style={styles.settingItemContent}>
        {iconName && <Ionicons name={iconName} size={24} color={STATIC_COLORS.primary} style={styles.settingIcon} />}
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      {type === 'switch' && (
        <Switch
          trackColor={{ false: STATIC_COLORS.border, true: STATIC_COLORS.secondary }}
          thumbColor={value ? STATIC_COLORS.primaryLight : STATIC_COLORS.surface}
          ios_backgroundColor={STATIC_COLORS.border}
          onValueChange={onValueChange}
          value={value}
          disabled={isSaving}
        />
      )}
      {type === 'navigation' && onPress && (
        <Ionicons name="chevron-forward-outline" size={22} color={STATIC_COLORS.textMuted} />
      )}
      {type === 'info' && value && (
         <Text style={styles.settingValue}>{value}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.headerContainer}>
        <Ionicons name="settings-outline" size={36} color={STATIC_COLORS.primary} />
        <Text style={styles.headerTitle}>App Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your preferences for SuperStudentAI</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Account</Text>
        {renderSettingItem({
          title: userName,
          description: "View and edit your profile",
          iconName: 'person-circle-outline',
          type: 'navigation',
          onPress: handleNavigateToProfile,
        })}
      </View>

      {/* General Settings Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>General</Text>
        {renderSettingItem({
          title: 'Enable Notifications',
          description: "Receive study reminders and updates",
          value: settings.notificationsEnabled,
          onValueChange: (val) => handleSettingChange('notificationsEnabled', val),
          iconName: 'notifications-outline',
        })}
        {renderSettingItem({
          title: 'Dark Mode',
          description: "Toggle between light and dark themes",
          value: settings.darkMode,
          onValueChange: (val) => handleSettingChange('darkMode', val),
          iconName: 'moon-outline',
        })}
        {renderSettingItem({
          title: 'Data Sync',
          description: "Keep your data synced across devices",
          value: settings.dataSync,
          onValueChange: (val) => handleSettingChange('dataSync', val),
          iconName: 'cloud-sync-outline', // Custom icon, ensure it exists or use 'sync-circle-outline'
        })}
         {renderSettingItem({
          title: 'Language',
          value: settings.language,
          description: "Select your preferred language (feature coming soon)",
          iconName: 'language-outline',
          type: 'info', // Or 'navigation' if you build a language selection screen
          // onPress: () => Alert.alert("Language", "Language selection feature is under development.")
        })}
      </View>

      {/* About & Support Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Support & Feedback</Text>
        {renderSettingItem({
          title: 'Rate SuperStudentAI',
          description: "Enjoying the app? Let us know!",
          iconName: 'star-outline',
          type: 'navigation',
          onPress: handleRateApp,
        })}
        {renderSettingItem({
          title: 'Share with Friends',
          description: "Help others discover SuperStudentAI",
          iconName: 'share-social-outline',
          type: 'navigation',
          onPress: handleShareApp,
        })}
        {renderSettingItem({
          title: 'Help & FAQ',
          description: "Find answers to common questions",
          iconName: 'help-circle-outline',
          type: 'navigation',
          onPress: () => Linking.openURL('YOUR_FAQ_URL').catch(err => Alert.alert("Error", "Could not open FAQ page.")),
        })}
        {renderSettingItem({
          title: 'Privacy Policy',
          iconName: 'shield-checkmark-outline',
          type: 'navigation',
          onPress: () => Linking.openURL('YOUR_PRIVACY_POLICY_URL').catch(err => Alert.alert("Error", "Could not open privacy policy.")),
        })}
        {renderSettingItem({
          title: 'Terms of Service',
          iconName: 'document-text-outline',
          type: 'navigation',
          onPress: () => Linking.openURL('YOUR_TERMS_OF_SERVICE_URL').catch(err => Alert.alert("Error", "Could not open terms of service.")),
        })}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={STATIC_COLORS.danger} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SuperStudentAI v1.0.0</Text>
        {isSaving && <ActivityIndicator size="small" color={STATIC_COLORS.primary} style={{marginLeft: SPACING.xs}}/>}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.xl,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.primary,
    marginTop: SPACING.sm,
  },
  headerContainer: {
    backgroundColor: STATIC_COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.lg + 20 : SPACING.xl + 20,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: STATIC_COLORS.border,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: STATIC_COLORS.primary,
    marginTop: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm, // Add some vertical padding inside the card
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden', // Ensures border radius is respected by children
  },
  sectionHeader: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm, // Give header a bit more space from top of card
    paddingBottom: SPACING.sm, // Space between header and first item
    borderBottomWidth: 1,
    borderBottomColor: STATIC_COLORS.borderLight,
  },
  settingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: STATIC_COLORS.borderLight,
  },
  settingItemContainerLast: { // To remove border for the last item in a section
    borderBottomWidth: 0,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow text to take available space
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingTextContainer: {
    flex: 1, // Allow text to wrap if needed
  },
  settingTitle: {
    ...TYPOGRAPHY.listItem,
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textMuted,
    marginTop: 2,
  },
  settingValue: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textSecondary,
  },
  logoutButtonContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md, // Space above logout
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STATIC_COLORS.surface, // Match card style
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STATIC_COLORS.danger, // Use danger color for border
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.button,
    color: STATIC_COLORS.danger,
    marginLeft: SPACING.xs,
    fontSize: 17, // Slightly larger for emphasis
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textMuted,
  },
});

export default AppSettingsScreen;
