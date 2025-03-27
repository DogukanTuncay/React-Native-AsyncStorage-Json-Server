import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('system');
  const systemColorScheme = useColorScheme() as 'light' | 'dark';
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // AsyncStorage'dan tema ayarını yükle
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setTheme(savedTheme as ThemeType);
        }
      } catch (error) {
        console.log('Tema yüklenirken hata oluştu:', error);
      }
    };
    
    loadTheme();
  }, []);

  useEffect(() => {
    // Tema değiştiğinde karanlık mod değerini güncelle
    if (theme === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(theme === 'dark');
    }
    
    // AsyncStorage'a tema ayarını kaydet
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('theme', theme);
      } catch (error) {
        console.log('Tema kaydedilirken hata oluştu:', error);
      }
    };
    
    saveTheme();
  }, [theme, systemColorScheme]);

  const themeContextValue: ThemeContextType = {
    theme,
    isDarkMode,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 