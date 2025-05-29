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
import { db as firestoreDb, auth } from '../config/firebase'; // Corrected import: db as firestoreDb
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo for icons
import { LinearGradient } from 'expo-linear-gradient'; 

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
  xxl: 48, // Added for larger spacing if needed
};

const AppSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    darkMode: false, 
    dataSync: true,
    language: 'English',
    aiPersonalization: true, // New setting
    studyReminders: 'default', // New setting: 'default', 'custom', 'off'
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState(''); // Store user email

  const userId = auth.currentUser?.uid;

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated.");
      setLoading(false);
      navigation.replace('Auth'); 
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
          aiPersonalization: userData.appSettings?.aiPersonalization !== undefined ? userData.appSettings.aiPersonalization : true,
          studyReminders: userData.appSettings?.studyReminders || 'default',
        }));
        setUserName(userData.name || 'User');
        setUserEmail(auth.currentUser?.email || ''); // Get email from auth object
      } else {
        console.log("No such user document! Using default settings.");
        setUserEmail(auth.currentUser?.email || '');
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
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings); // Optimistically update UI

    setIsSaving(true);
    try {
      const userDocRef = doc(firestoreDb, 'users', userId);
      await updateDoc(userDocRef, {
        appSettings: newSettings, // Save the whole appSettings object
        lastUpdated: serverTimestamp(),
      });
      // Optionally, show a success toast/message here: e.g., Toast.show('Settings saved!');
    } catch (error) {
      console.error("Error updating setting: ", error);
      Alert.alert("Error", `Could not save ${key}. ` + error.message);
      // Revert UI change on error by fetching settings again or storing previous state
      fetchSettings(); 
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
    navigation.navigate('Profile'); 
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

  // New function to navigate to a generic "Coming Soon" or specific feature screen
  const handleNavigateToFeature = (featureName, screenName) => {
    if (screenName) {
      navigation.navigate(screenName);
    } else {
      Alert.alert(featureName, "This feature is under development and will be available soon!");
    }
  };


  const renderSettingItem = ({ title, value, onValueChange, type = 'switch', iconName, onPress, description, isLastInSection }) => (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={!onPress && type !== 'switch'} // Allow press for switches even if no explicit onPress
      style={[styles.settingItemContainer, isLastInSection && styles.settingItemContainerLast]}
    >
      <View style={styles.settingItemContent}>
        {iconName && <Ionicons name={iconName} size={24} color={STATIC_COLORS.primary} style={styles.settingIcon} />}
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}\
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
      <LinearGradient
        colors={[STATIC_COLORS.primary, STATIC_COLORS.primaryDark]}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="settings-outline" size={40} color={STATIC_COLORS.textOnPrimary} />
        <Text style={[styles.headerTitle, { color: STATIC_COLORS.textOnPrimary }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: STATIC_COLORS.textOnPrimary }]}>Tailor SuperStudentAI to your needs</Text>
      </LinearGradient>

      {/* Account Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>My Account</Text>
        {renderSettingItem({
          title: userName,
          description: userEmail, // Show email here
          iconName: 'person-circle-outline',
          type: 'navigation',
          onPress: handleNavigateToProfile,
        })}
        {renderSettingItem({
          title: 'Manage Subscription',
          description: "View or update your plan",
          iconName: 'card-outline',
          type: 'navigation',
          onPress: () => handleNavigateToFeature("Subscription Management"), // Placeholder
          isLastInSection: true,
        })}
      </View>

      {/* General Settings Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Preferences</Text>
        {renderSettingItem({
          title: 'Dark Mode',
          description: "Reduce eye strain in low light",
          value: settings.darkMode,
          onValueChange: (val) => handleSettingChange('darkMode', val),
          iconName: settings.darkMode ? 'moon' : 'moon-outline',
        })}
        {renderSettingItem({
          title: 'Enable Notifications',
          description: "Receive important updates",
          value: settings.notificationsEnabled,
          onValueChange: (val) => handleSettingChange('notificationsEnabled', val),
          iconName: settings.notificationsEnabled ? 'notifications' : 'notifications-off-outline',
        })}
        {renderSettingItem({
          title: 'Study Reminders',
          description: "Stay on track with your goals", // Customize later based on 'studyReminders' value
          value: settings.studyReminders, // This won't be a boolean for a picker
          iconName: 'alarm-outline',
          type: 'navigation', // To open a picker/modal or new screen
          onPress: () => handleNavigateToFeature("Study Reminders Customization"), // Placeholder
        })}
        {renderSettingItem({
          title: 'AI Personalization',
          description: "Allow AI to tailor content for you",
          value: settings.aiPersonalization,
          onValueChange: (val) => handleSettingChange('aiPersonalization', val),
          iconName: 'bulb-outline',
        })}
        {renderSettingItem({
          title: 'Data Sync',
          description: "Keep data synced across devices",
          value: settings.dataSync,
          onValueChange: (val) => handleSettingChange('dataSync', val),
          iconName: 'sync-circle-outline', 
        })}
         {renderSettingItem({
          title: 'Language',
          value: settings.language,
          description: "Select your preferred language",
          iconName: 'language-outline',
          type: 'navigation', 
          onPress: () => handleNavigateToFeature("Language Selection"), // Placeholder
          isLastInSection: true,
        })}
      </View>

      {/* Support & Feedback Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Support & Feedback</Text>
        {renderSettingItem({
          title: 'Help Center & FAQ',
          description: "Find answers and tutorials",
          iconName: 'help-buoy-outline',
          type: 'navigation',
          onPress: () => Linking.openURL('YOUR_FAQ_URL').catch(err => Alert.alert("Error", "Could not open Help Center.")),
        })}
        {renderSettingItem({
          title: 'Report an Issue',
          description: "Let us know about a problem",
          iconName: 'bug-outline',
          type: 'navigation',
          onPress: () => handleNavigateToFeature("Report an Issue"), // Placeholder
        })}
        {renderSettingItem({
          title: 'Suggest a Feature',
          description: "Share your ideas with us",
          iconName: 'chatbubbles-outline',
          type: 'navigation',
          onPress: () => handleNavigateToFeature("Suggest a Feature"), // Placeholder
        })}
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
          isLastInSection: true,
        })}
      </View>
      
      {/* Legal Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Legal</Text>
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
          isLastInSection: true,
        })}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={STATIC_COLORS.danger} style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SuperStudentAI v1.0.0</Text>
        {isSaving && (
          <View style={styles.savingIndicatorContainer}>
            <ActivityIndicator size="small" color={STATIC_COLORS.primary} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
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
    paddingBottom: SPACING.xl, // Increased bottom padding
  },
  headerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl + 10 : SPACING.xxl, // Adjust for status bar
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 25, // Slightly larger radius
    borderBottomRightRadius: 25,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 30, // Slightly larger
    color: STATIC_COLORS.textOnPrimary, 
    marginTop: SPACING.sm,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: STATIC_COLORS.textOnPrimary, 
    opacity: 0.9, // Slight opacity for subtitle
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATIC_COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.bodyBold, // Bolder loading text
    color: STATIC_COLORS.primary,
    marginTop: SPACING.md,
  },
  sectionContainer: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 15, // Consistent rounded corners
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.xs, 
    shadowColor: STATIC_COLORS.shadow, // Softer shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, // Slightly more pronounced shadow
    shadowRadius: 12,
    elevation: 5, // Android shadow
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // Fix for Android shadow clipping
  },
  sectionHeader: {
    ...TYPOGRAPHY.h3,
    fontSize: 16, // Slightly smaller section header
    fontWeight: 'bold', // Ensure it's bold
    color: STATIC_COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md, 
    paddingBottom: SPACING.sm, 
    // borderBottomWidth: 1, // Removing border for a cleaner look, sections are distinct enough
    // borderBottomColor: STATIC_COLORS.borderLight,
  },
  settingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md + 2, // Slightly more vertical padding
    paddingHorizontal: SPACING.md,
    backgroundColor: STATIC_COLORS.surface, // Ensure background for touchable area
    borderBottomWidth: 1,
    borderBottomColor: STATIC_COLORS.borderLight,
  },
  settingItemContainerLast: { 
    borderBottomWidth: 0, // No border for the last item in a section
    borderBottomLeftRadius: 15, // Apply border radius if it's the last item
    borderBottomRightRadius: 15,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
    marginRight: SPACING.sm, // Add margin to prevent content touching switch/chevron
  },
  settingIcon: {
    marginRight: SPACING.md,
    width: 24, // Ensure consistent icon alignment
    textAlign: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    ...TYPOGRAPHY.listItem,
    fontSize: 16, // Slightly smaller list item title
    color: STATIC_COLORS.text,
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    fontSize: 13, // Slightly smaller caption
    color: STATIC_COLORS.textMuted,
    marginTop: SPACING.xs / 2,
  },
  settingValue: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textMuted,
  },
  logoutButtonContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg, // Space above logout button
    marginBottom: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row', // Align icon and text
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STATIC_COLORS.surface, // Make it look like other items but with danger text
    paddingVertical: SPACING.md,
    borderRadius: 12, // Consistent border radius
    borderWidth: 1,
    borderColor: STATIC_COLORS.danger, // Danger border
    shadowColor: STATIC_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: SPACING.sm,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.button,
    color: STATIC_COLORS.danger, // Danger color for text
    fontSize: 17,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: STATIC_COLORS.borderLight,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.textMuted,
  },
  savingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  savingText: {
    ...TYPOGRAPHY.caption,
    color: STATIC_COLORS.primary,
    marginLeft: SPACING.xs,
  },
});

export default AppSettingsScreen;
