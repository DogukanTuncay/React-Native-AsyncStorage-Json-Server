import React from 'react';
import { StatusBar } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';

// Özel tema renkleri
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#ff4081',
    background: '#f8f9fa',
    surface: '#ffffff',
    error: '#dc3545',
    text: '#212529',
    onSurface: '#212529',
    disabled: '#ced4da',
    placeholder: '#6c757d',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f8f9fa',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#0d6efd',
    secondary: '#6c757d',
    accent: '#ff4081',
    background: '#212529',
    surface: '#343a40',
    error: '#dc3545',
    text: '#f8f9fa',
    onSurface: '#f8f9fa',
    disabled: '#495057',
    placeholder: '#adb5bd',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#343a40',
  },
};

// Ana tema bileşeni
export const AppTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {children}
    </PaperProvider>
  );
}; 