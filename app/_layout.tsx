import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { AppTheme } from '../components/theme/AppTheme';

console.log('Ana layout yükleniyor...');

// Uygulama hazır olana kadar splash screen'i göster
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Fontlar yüklendiğinde splash screen'i gizle
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      console.log('Fontlar yüklendi ve Splash Screen kapatıldı');
    }
    if (error) {
      console.error('Font yükleme hatası:', error);
    }
  }, [loaded, error]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log('Root Layout Navigation oluşturuluyor');
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppTheme>
          <Stack
            screenOptions={{
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="(auth)/login" 
              options={{ 
                headerShown: false,
                // Auth sayfaları için geri dolaşım engellenmiş
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                // Ana sayfalarda geri dolaşım yok
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen 
              name="product/[id]" 
              options={{
                headerShown: true,
                headerTitle: "Ürün Detayı",
                headerBackTitle: "Geri",
                animation: "slide_from_right"
              }} 
            />
          </Stack>
        </AppTheme>
      </AuthProvider>
    </ThemeProvider>
  );
}
