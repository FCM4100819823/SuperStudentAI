// ThemeSettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Appearance } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import { Ionicons } from '@expo/vector-icons'; // For icons

const ThemeSettingsScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const { theme: themeName, colors, setTheme } = themeContext; // Fix: Properly destructure theme as themeName
  const styles = getStyles(colors); // Using colors from theme context

  const themeOptions = [
    { key: 'light', label: 'Light Mode', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
    { key: 'system', label: 'System Default', icon: 'cog-outline' },
  ];

  const handleSetTheme = (selectedThemeKey) => {
    if (selectedThemeKey === 'system') {
      const systemTheme = Appearance.getColorScheme() || 'light';
      setTheme(systemTheme);
    } else {
      setTheme(selectedThemeKey);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme Settings</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Choose your preferred theme</Text>
        
        {themeOptions.map((option) => {
          // Determine if this option is currently active
          let isActive = false;
          if (option.key === 'system') {
            // This is a bit tricky; we don't store 'system' as the theme directly
            // We could check if the current theme matches the system's current theme
            // Or, more simply, if the user last *selected* 'system'.
            // For now, let's assume if current theme matches system, it could be system default.
            // A more robust way would be to store the *choice* ('light', 'dark', 'system') separately.
            const systemTheme = Appearance.getColorScheme() || 'light';
            isActive = themeName === systemTheme; // Fix: Use themeName instead of theme
          } else {
            isActive = themeName === option.key; // Fix: Use themeName instead of theme
          }

          return (
            <TouchableOpacity 
              key={option.key} 
              style={styles.optionButton} 
              onPress={() => handleSetTheme(option.key)}
            >
              <Ionicons name={option.icon} size={24} color={isActive ? colors.primary : colors.subtext} />
              <Text style={[styles.optionText, isActive && { color: colors.primary, fontWeight: '600' }]}>
                {option.label}
              </Text>
              {isActive && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.activeIcon} />
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.footerText}>
          Selecting 'System Default' will automatically adjust the theme based on your device's settings.
        </Text>
      </View>
    </ScrollView>
  );
};

// Fixed: Remove the dependency on theme in getStyles - it already uses colors
const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background, // Themed
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 15,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 20, // Adjusted size
    fontWeight: '600',
    color: colors.text,
    marginBottom: 25,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: colors.text, // Use a subtle shadow based on text color or a fixed shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1, // Fixed: removed conditional based on theme
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: {
    fontSize: 17,
    color: colors.text,
    marginLeft: 15,
    flex: 1, // Allow text to take available space
  },
  activeIcon: {
    // Style for the checkmark icon if the option is active
  },
  footerText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
  },
});

export default ThemeSettingsScreen;
