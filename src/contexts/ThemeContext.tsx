import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../utils/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof THEME.light;
  setTheme: (theme: ThemeType) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FORCE LIGHT MODE - Dark mode disabled for production
  const [theme] = useState<ThemeType>('light');
  const isDark = false; // Always false - dark mode disabled

  const setTheme = async (newTheme: ThemeType) => {
    // No-op - theme changes disabled
    console.log('Theme changes are disabled - app is locked to light mode');
  };

  const toggleTheme = async () => {
    // No-op - theme toggle disabled
    console.log('Theme toggle is disabled - app is locked to light mode');
  };

  const colors = THEME.light; // Always use light colors

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
