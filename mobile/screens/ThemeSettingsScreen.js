// ThemeSettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Appearance } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import { Ionicons } from '@expo/vector-icons'; // For icons

const ThemeSettingsScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors);

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

  // Dynamic styles based on theme
  const dynamicStyles = getStyles(theme);

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Theme Settings</Text>
      </View>

      <View style={dynamicStyles.contentContainer}>
        <Text style={dynamicStyles.title}>Choose your preferred theme</Text>
        
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
            isActive = theme === systemTheme; // This might not be perfectly accurate if user manually set to match system
          } else {
            isActive = theme === option.key;
          }

          return (
            <TouchableOpacity 
              key={option.key} 
              style={dynamicStyles.optionButton} 
              onPress={() => handleSetTheme(option.key)}
            >
              <Ionicons name={option.icon} size={24} color={isActive ? colors.primary : colors.subtext} />
              <Text style={[dynamicStyles.optionText, isActive && { color: colors.primary, fontWeight: '600' }]}>
                {option.label}
              </Text>
              {isActive && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={dynamicStyles.activeIcon} />
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={dynamicStyles.footerText}>
          Selecting 'System Default' will automatically adjust the theme based on your device's settings.
        </Text>
      </View>
    </ScrollView>
  );
};

// Wrap the existing StyleSheet.create in a function that accepts theme
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
    shadowOpacity: colors === 'dark' ? 0.3 : 0.1, // Adjust opacity for dark/light
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
