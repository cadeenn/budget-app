import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { COLORS } from '../utils/config';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'light', 'dark', or 'auto'
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference to AsyncStorage
  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  // Set specific theme mode
  const setTheme = (mode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  // Determine the actual theme based on preference and device setting
  const getActiveThemeMode = () => {
    if (themeMode === 'auto') {
      return deviceTheme || 'light';
    }
    return themeMode;
  };

  const activeThemeMode = getActiveThemeMode();
  
  // Create custom theme based on active mode
  const theme = {
    ...(activeThemeMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(activeThemeMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: COLORS.primary,
      background: activeThemeMode === 'dark' ? '#121212' : COLORS.background,
      card: activeThemeMode === 'dark' ? '#1e1e1e' : COLORS.surface,
      text: activeThemeMode === 'dark' ? '#ffffff' : COLORS.text,
      border: activeThemeMode === 'dark' ? '#2c2c2c' : COLORS.border,
      notification: COLORS.error,
    },
    dark: activeThemeMode === 'dark',
  };

  // Paper theme
  const paperTheme = {
    colors: {
      primary: COLORS.primary,
      accent: COLORS.secondary,
      background: theme.colors.background,
      surface: theme.colors.card,
      text: theme.colors.text,
      disabled: activeThemeMode === 'dark' ? '#666666' : '#9e9e9e',
      placeholder: activeThemeMode === 'dark' ? '#666666' : '#9e9e9e',
      backdrop: 'rgba(0, 0, 0, 0.5)',
      onSurface: theme.colors.text,
      notification: COLORS.error,
    },
    dark: activeThemeMode === 'dark',
    mode: 'adaptive',
    roundness: 8,
  };

  const value = {
    theme,
    paperTheme,
    themeMode,
    isLoading,
    isDark: activeThemeMode === 'dark',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 