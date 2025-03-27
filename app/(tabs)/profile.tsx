import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  List,
  Switch,
  Divider,
  useTheme,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const paperTheme = useTheme();
  const { theme, isDarkMode, setTheme } = useAppTheme();
  const { user, logout } = useAuth();
  const [storageData, setStorageData] = useState<{[key: string]: string}>({});
  const [isStorageDialogVisible, setStorageDialogVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Çıkış yap
  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Tema değiştirme fonksiyonları
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const useSystemTheme = () => {
    setTheme('system');
  };

  // AsyncStorage içeriğini oku
  const readStorageData = async () => {
    setIsLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      const data: {[key: string]: string} = {};
      items.forEach(([key, value]) => {
        data[key] = value || 'null';
      });
      
      setStorageData(data);
    } catch (error) {
      console.error('AsyncStorage verileri okunurken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // AsyncStorage diyaloğunu aç
  const openStorageDialog = () => {
    readStorageData();
    setStorageDialogVisible(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* Profil kartı */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar.Icon size={80} icon="account" />
          <View style={styles.profileInfo}>
            <Text variant="headlineSmall">{user?.name}</Text>
            <Text variant="bodyMedium">{user?.email}</Text>
            <Text variant="bodySmall" style={{ color: paperTheme.colors.primary }}>
              {user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Ayarlar kartı */}
      <Card style={styles.settingsCard}>
        <Card.Title title="Uygulama Ayarları" />
        <Card.Content>
          <List.Section>
            <List.Subheader>Tema</List.Subheader>
            <List.Item
              title="Karanlık Mod"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  color={paperTheme.colors.primary}
                />
              )}
            />
            <List.Item
              title="Sistem Temasını Kullan"
              left={(props) => <List.Icon {...props} icon="cellphone-cog" />}
              right={() => (
                <Switch
                  value={theme === 'system'}
                  onValueChange={useSystemTheme}
                  color={paperTheme.colors.primary}
                />
              )}
            />
            <Divider />
            <List.Subheader>Hesap</List.Subheader>
            <List.Item
              title="Şifremi Değiştir"
              description="Hesap şifrenizi güncelleyin"
              left={(props) => <List.Icon {...props} icon="lock" />}
              onPress={() => {/* Şifre değiştirme işlevi */}}
            />
            <List.Item
              title="Bildirim Ayarları"
              description="Bildirim tercihlerinizi yönetin"
              left={(props) => <List.Icon {...props} icon="bell" />}
              onPress={() => {/* Bildirim ayarları işlevi */}}
            />
            <Divider />
            <List.Subheader>Geliştirici Seçenekleri</List.Subheader>
            <List.Item
              title="AsyncStorage Verileri"
              description="Cihazda saklanan verileri görüntüleyin"
              left={(props) => <List.Icon {...props} icon="database" />}
              onPress={openStorageDialog}
            />
            <Divider />
            <List.Subheader>Uygulama Hakkında</List.Subheader>
            <List.Item
              title="Sürüm"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="Gizlilik Politikası"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              onPress={() => {/* Gizlilik politikası işlevi */}}
            />
            <List.Item
              title="Kullanım Koşulları"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => {/* Kullanım koşulları işlevi */}}
            />
          </List.Section>

          <Button
            mode="contained"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Çıkış Yap
          </Button>
        </Card.Content>
      </Card>

      {/* Uygulama bilgisi */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          © 2023 Ürün Yönetimi Uygulaması
        </Text>
        <Text variant="bodySmall" style={styles.footerText}>
          Tüm hakları saklıdır.
        </Text>
      </View>

      {/* AsyncStorage İçeriği Diyaloğu */}
      <Portal>
        <Dialog 
          visible={isStorageDialogVisible} 
          onDismiss={() => setStorageDialogVisible(false)}
          style={{ maxHeight: '80%' }}
        >
          <Dialog.Title>AsyncStorage Verileri</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400 }}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={{ marginTop: 16 }}>Veriler yükleniyor...</Text>
              </View>
            ) : Object.keys(storageData).length === 0 ? (
              <Text style={styles.noDataText}>Veri bulunamadı</Text>
            ) : (
              <View style={styles.storageDataContainer}>
                {Object.entries(storageData).map(([key, value]) => (
                  <View key={key} style={styles.storageItem}>
                    <Text style={styles.storageKey}>{key}</Text>
                    <Text style={styles.storageValue}>
                      {value.length > 300 ? value.substring(0, 300) + '...' : value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setStorageDialogVisible(false)}>Kapat</Button>
            <Button onPress={readStorageData}>Yenile</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 20,
  },
  settingsCard: {
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 16,
  },
  footer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    marginVertical: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    padding: 20,
    textAlign: 'center',
  },
  storageDataContainer: {
    padding: 10,
  },
  storageItem: {
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  storageKey: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
  },
  storageValue: {
    fontSize: 14,
  },
}); 