import React, { createContext, useState, useEffect, useContext } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  theme: 'light',
  colors: {
    background: '#F0F4F8', // Light grey background
    surface: '#FFFFFF', // White surfaces like cards, modals
    primary: '#6A11CB', // Primary purple
    secondary: '#2575FC', // Secondary blue
    text: '#1A2B4D', // Dark blue-grey text
    subtext: '#5A6B7C', // Lighter grey text
    placeholder: '#A0A0A0',
    border: '#E0E6F0',
    accent: '#FF6B6B', // Accent color (e.g., for notifications or errors)
    success: '#28A745',
    error: '#D32F2F',
    disabled: '#B0B0B0',
    // Specific component colors
    tabBarBackground: '#FFFFFF',
    tabBarActiveTint: '#6A11CB',
    tabBarInactiveTint: 'gray',
    inputBackground: '#F7F9FC',
    inputBorder: '#E0E6F0',
    inputIcon: '#A0A0A0',
    focusedInputIcon: '#007AFF',
    buttonText: '#FFFFFF',
    link: '#007AFF',
    cardHeader: '#6A11CB', // Example for card headers
    cardText: '#1A2B4D',
    gradientStart: '#6A11CB',
    gradientEnd: '#2575FC',
  },
  // Add other theme-specific properties like font sizes, spacing if needed
};

export const darkTheme = {
  theme: 'dark',
  colors: {
    background: '#121212', // Very dark grey, almost black
    surface: '#1E1E1E', // Dark grey for cards, modals
    primary: '#BB86FC', // Lighter purple for dark mode
    secondary: '#3700B3', // Darker purple variant
    text: '#E0E0E0', // Light grey text
    subtext: '#A0A0A0', // Medium grey text
    placeholder: '#757575',
    border: '#333333',
    accent: '#CF6679', // Accent color for dark mode
    success: '#4CAF50',
    error: '#EF5350',
    disabled: '#505050',
    // Specific component colors
    tabBarBackground: '#1E1E1E',
    tabBarActiveTint: '#BB86FC',
    tabBarInactiveTint: '#9E9E9E',
    inputBackground: '#2C2C2C',
    inputBorder: '#424242',
    inputIcon: '#757575',
    focusedInputIcon: '#BB86FC',
    buttonText: '#121212', // Dark text on light buttons, or light text on dark buttons
    link: '#BB86FC',
    cardHeader: '#BB86FC',
    cardText: '#E0E0E0',
    gradientStart: '#BB86FC',
    gradientEnd: '#3700B3',
  },
};

export const ThemeContext = createContext({
  theme: 'light',
  colors: lightTheme.colors,
  setTheme: (themeName) => {},
});

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light'); // Default to light

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme) {
          setCurrentTheme(savedTheme);
        } else {
          // If no saved theme, use system preference
          const systemTheme = Appearance.getColorScheme();
          setCurrentTheme(systemTheme || 'light');
          await AsyncStorage.setItem('appTheme', systemTheme || 'light');
        }
      } catch (error) {
        console.error('Failed to load theme from storage', error);
        setCurrentTheme('light'); // Fallback to light
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (themeName) => {
    try {
      await AsyncStorage.setItem('appTheme', themeName);
      setCurrentTheme(themeName);
    } catch (error) {
      console.error('Failed to save theme to storage', error);
    }
  };
  
  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if no theme is explicitly set by user, or handle as per app logic
      // For now, let's assume user preference overrides system unless reset
      // console.log('System theme changed to:', colorScheme);
      // If you want the app to always follow system theme unless user explicitly sets one:
      // async function updateThemeIfSystem() {
      //   const savedTheme = await AsyncStorage.getItem('userSetTheme'); // Need a different flag
      //   if (!savedTheme && colorScheme) {
      //     setTheme(colorScheme);
      //   }
      // }
      // updateThemeIfSystem();
    });
    return () => subscription.remove();
  }, []);


  const themeData = currentTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, colors: themeData.colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
