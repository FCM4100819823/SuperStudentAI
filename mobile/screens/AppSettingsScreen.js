// Placeholder for AppSettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const AppSettingsScreen = ({ navigation }) => {
  const { theme, themeName, toggleTheme } = useTheme();
  const styles = getStyles(theme);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSyncEnabled, setDataSyncEnabled] = useState(true);

  const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);
  const toggleDataSync = () => setDataSyncEnabled(previousState => !previousState);

  const handleNavigateToThemeSettings = () => {
    navigation.navigate('ThemeSettingsScreen');
  };

  const SettingItem = ({ label, value, onValueChange, type = 'switch', onPress, iconName }) => (
    <View style={styles.settingItem}>
      <Ionicons name={iconName} size={24} color={theme.colors.icon} style={styles.settingIcon} />
      <Text style={styles.settingLabel}>{label}</Text>
      {type === 'switch' && (
        <Switch
          trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
          thumbColor={value ? theme.colors.card : theme.colors.background} 
          ios_backgroundColor={theme.colors.disabled}
          onValueChange={onValueChange}
          value={value}
        />
      )}
      {type === 'button' && (
        <TouchableOpacity onPress={onPress} style={styles.navigateButton}>
          <Text style={styles.navigateButtonText}>{value}</Text>
          <Ionicons name="chevron-forward-outline" size={22} color={theme.colors.subtext} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>App Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingItem
          label="Dark Mode"
          value={themeName === 'dark'}
          onValueChange={toggleTheme}
          iconName="moon-outline"
        />
        <SettingItem
          label="Customize Theme"
          value="Edit"
          type="button"
          onPress={handleNavigateToThemeSettings}
          iconName="color-palette-outline"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          label="Enable Notifications"
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          iconName="notifications-outline"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        <SettingItem
          label="Enable Data Sync"
          value={dataSyncEnabled}
          onValueChange={toggleDataSync}
          iconName="sync-circle-outline"
        />
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Clear Cache", "Cache cleared successfully!")}>
          <Ionicons name="trash-bin-outline" size={20} color={theme.colors.primary} style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={[styles.actionButton, styles.firstActionButton]} onPress={() => navigation.navigate('ProfileEdit')}>
          <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Logout", "Are you sure you want to logout?", [{ text: "Cancel" }, { text: "Logout", onPress: () => console.log("User logged out") }])}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} style={styles.actionButtonIcon} />
          <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SuperStudent AI v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  section: {
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginRight: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    // No border by default, add it if it's not the last one
  },
  firstActionButton: { // Style for the first action button in a group that needs a separator
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
  },
  actionButtonIcon: {
    marginRight: 15,
  },
  actionButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
});

export default AppSettingsScreen;
