import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Slot } from 'expo-router';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

console.log('Tab Layout yükleniyor...');

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const { user, isLoading, isAdmin } = useAuth();
  const pathname = usePathname();

  console.log('TabLayout - Kullanıcı:', user?.email || 'Yok');
  console.log('TabLayout - Admin mi?:', isAdmin ? 'Evet' : 'Hayır');
  console.log('TabLayout - Kullanıcı rolü:', user?.role || 'Yok');
  console.log('TabLayout - Yükleniyor:', isLoading);
  console.log('TabLayout - Şu anki yol:', pathname);

  // Kimlik doğrulaması gerektirir, kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('Kullanıcı giriş yapmamış, login sayfasına yönlendiriliyor');
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    console.log('Yükleniyor ekranı gösteriliyor');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  console.log('Tab bar oluşturuluyor');
  
  // Admin olmayan kullanıcı admin sayfasına doğrudan erişirse ana sayfaya yönlendir
  if (!isAdmin && pathname.includes('/admin')) {
    console.log('UYARI: Admin olmayan kullanıcı admin sayfasına erişmeye çalışıyor!');
    console.log('Kullanıcı:', user?.email, 'Rol:', user?.role);
    console.log('Yönlendiriliyor -> /(tabs)');
    router.replace('/(tabs)');
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ürünler',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Yönetim',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          // Admin olmayan kullanıcılar için sekmeyi gizle
          href: isAdmin ? undefined : null,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
