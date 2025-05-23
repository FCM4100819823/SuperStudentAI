import React, { createContext, useState, useEffect, useContext } from 'react';
import { Appearance, Platform } from 'react-native'; // Added Platform
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define app fonts
const appFonts = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', // Used for fontWeight: '500' or '600'
  light: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
  thin: Platform.OS === 'ios' ? 'System' : 'sans-serif-thin',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

// Base color definitions
const baseLightColors = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  primary: '#6A11CB',
  secondary: '#2575FC',
  text: '#1A2B4D',
  subtext: '#5A6B7C',
  placeholder: '#A0A0A0',
  border: '#E0E6F0',
  accent: '#FF6B6B',
  success: '#28A745',
  error: '#D32F2F',
  disabled: '#B0B0B0',
  tabBarBackground: '#FFFFFF',
  tabBarActiveTint: '#6A11CB',
  tabBarInactiveTint: '#8E8E93', // Explicitly define here
  inputBackground: '#F7F9FC',
  inputBorder: '#E0E6F0',
  inputIcon: '#A0A0A0',
  focusedInputIcon: '#007AFF',
  buttonText: '#FFFFFF',
  buttonTextDark: '#1A2B4D', // For light buttons
  link: '#007AFF',
  cardHeader: '#6A11CB',
  cardText: '#1A2B4D',
  gradientStart: '#6A11CB',
  gradientEnd: '#2575FC',
  shadow: '#000000',
};

const navigationLightColors = {
  primary: baseLightColors.primary,
  background: baseLightColors.background,
  card: baseLightColors.surface,
  text: baseLightColors.text,
  border: baseLightColors.border,
  notification: baseLightColors.accent,
};

export const lightTheme = {
  dark: false,
  themeName: 'light',
  colors: {
    ...baseLightColors,
    ...navigationLightColors,
  },
  fonts: appFonts,
};

const baseDarkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#BB86FC',
  secondary: '#3700B3',
  text: '#E0E0E0',
  subtext: '#A0A0A0',
  placeholder: '#757575',
  border: '#333333',
  accent: '#CF6679',
  success: '#4CAF50',
  error: '#EF5350',
  disabled: '#505050',
  tabBarBackground: '#1E1E1E',
  tabBarActiveTint: '#BB86FC',
  tabBarInactiveTint: '#9E9E9E',
  inputBackground: '#2C2C2C',
  inputBorder: '#424242',
  inputIcon: '#757575',
  focusedInputIcon: '#BB86FC',
  buttonText: '#FFFFFF', // For dark buttons (primary button on dark theme)
  buttonTextDark: '#E0E0E0', // For light buttons on dark theme (e.g. secondary button)
  link: '#BB86FC',
  cardHeader: '#BB86FC',
  cardText: '#E0E0E0',
  gradientStart: '#BB86FC',
  gradientEnd: '#3700B3',
  shadow: '#000000', // Shadow color might need to be lighter or less opaque in dark mode
};

const navigationDarkColors = {
  primary: baseDarkColors.primary,
  background: baseDarkColors.background,
  card: baseDarkColors.surface,
  text: baseDarkColors.text,
  border: baseDarkColors.border,
  notification: baseDarkColors.accent,
};

export const darkTheme = {
  dark: true,
  themeName: 'dark',
  colors: {
    ...baseDarkColors,
    ...navigationDarkColors,
  },
  fonts: appFonts,
};

export const ThemeContext = createContext({
  ...lightTheme, // Default context value uses the light theme structure
  setTheme: (themeName) => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme) {
          setCurrentThemeName(savedTheme);
        } else {
          const systemTheme = Appearance.getColorScheme();
          setCurrentThemeName(systemTheme || 'light');
          await AsyncStorage.setItem('appTheme', systemTheme || 'light');
        }
      } catch (error) {
        console.error('Failed to load theme from storage', error);
        setCurrentThemeName('light');
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (themeName) => {
    try {
      await AsyncStorage.setItem('appTheme', themeName);
      setCurrentThemeName(themeName);
    } catch (error) {
      console.error('Failed to save theme to storage', error);
    }
  };
  
  const toggleTheme = () => {
    const newThemeName = currentThemeName === 'dark' ? 'light' : 'dark';
    setTheme(newThemeName);
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // This logic can be enhanced to respect user's explicit choice vs system theme
      // For now, if no theme was manually saved, follow system.
      AsyncStorage.getItem('appTheme').then(savedTheme => {
        if (!savedTheme && colorScheme) { // Or some other logic to decide if system should override
             // setCurrentThemeName(colorScheme); // Potentially update if app should follow system dynamically
        }
      });
    });
    return () => subscription.remove();
  }, []);

  const currentAppliedTheme = currentThemeName === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      ...currentAppliedTheme, // Spread all properties: dark, themeName, colors, fonts
      setTheme,
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
