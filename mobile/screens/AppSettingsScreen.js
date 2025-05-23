import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define default colors directly in the component or import from a central non-theme style file if you have one
const defaultColors = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  primary: '#6A11CB',
  text: '#1A2B4D',
  subtext: '#5A6B7C',
  border: '#E0E6F0',
  error: '#D32F2F',
  disabled: '#B0B0B0',
  icon: '#1A2B4D',
  headerText: '#FFFFFF',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  borderMuted: '#DDE2E8',
};

const AppSettingsScreen = ({ navigation }) => {
  const colors = defaultColors; // Use the locally defined defaults
  const styles = getStyles(colors);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSyncEnabled, setDataSyncEnabled] = useState(true);

  const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);
  const toggleDataSync = () => setDataSyncEnabled(previousState => !previousState);

  const SettingItem = ({ label, value, onValueChange, type = 'switch', onPress, iconName }) => (
    <View style={styles.settingItem}>
      {iconName && <Ionicons name={iconName} size={24} color={colors.icon} style={styles.settingIcon} />}
      <Text style={styles.settingLabel}>{label}</Text>
      {type === 'switch' && (
        <Switch
          trackColor={{ false: colors.disabled, true: colors.primary }}
          thumbColor={value ? colors.primary : colors.surface}
          ios_backgroundColor={colors.disabled}
          onValueChange={onValueChange}
          value={value}
        />
      )}
      {type === 'button' && (
        <TouchableOpacity onPress={onPress} style={styles.navigateButton}>
          <Text style={styles.navigateButtonText}>{value}</Text>
          <Ionicons name="chevron-forward-outline" size={22} color={colors.subtext} />
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
          <Ionicons name="trash-bin-outline" size={20} color={colors.primary} style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={[styles.actionButton, styles.firstActionButton]} onPress={() => navigation.navigate('ProfileEdit')}>
          <Ionicons name="person-circle-outline" size={20} color={colors.primary} style={styles.actionButtonIcon} />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Logout", "Are you sure you want to logout?", [{ text: "Cancel" }, { text: "Logout", onPress: () => console.log("User logged out") }])}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.actionButtonIcon} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SuperStudent AI v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.headerText,
  },
  section: {
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  settingIcon: {
    marginRight: 15,
    color: colors.icon,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  firstActionButton: { 
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  actionButtonIcon: {
    marginRight: 15,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: colors.subtext,
  },
});

export default AppSettingsScreen;
