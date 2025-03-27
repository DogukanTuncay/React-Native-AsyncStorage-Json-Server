import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// API URL'ini cihaza göre ayarlayalım
let API_URL = 'http://10.0.2.2:3000'; // Android emülatör için varsayılan

if (Platform.OS === 'ios') {
  API_URL = 'http://localhost:3000'; // iOS emülatör için
}

// Gerçek cihaz için bilgisayarınızın IP adresini kullanın
// API_URL = 'http://192.168.1.X:3000'; 

console.log('Auth Context - API URL:', API_URL);

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  checkIsAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin kontrolü için güçlü bir yöntem ekleyelim
  const checkIsAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'admin';
  };

  // API'den kullanıcı bilgisini doğrula
  const validateUserWithApi = async (storedUser: User): Promise<boolean> => {
    if (!storedUser || !storedUser.id) return false;
    
    try {
      // API'den kullanıcı verilerini kontrol et
      const response = await axios.get(`${API_URL}/users/${storedUser.id}`, { timeout: 3000 });
      
      if (response.data && response.data.id === storedUser.id) {
        console.log('Kullanıcı API üzerinden doğrulandı');
        
        // Kullanıcı rolünü güncelle - eğer API'deki rol değiştiyse bunu yansıt
        if (response.data.role !== storedUser.role) {
          console.log('Kullanıcı rolü güncellendi:', response.data.role);
          setUser({...storedUser, role: response.data.role});
          await AsyncStorage.setItem('user', JSON.stringify({...storedUser, role: response.data.role}));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.log('API doğrulaması başarısız, kayıtlı kullanıcı bilgileri kullanılıyor');
      return true; // API çalışmıyorsa, mevcut kullanıcı bilgilerine güven
    }
  };

  useEffect(() => {
    // AsyncStorage'dan kullanıcı bilgisini yükle
    const loadUser = async () => {
      try {
        console.log('Kullanıcı bilgisi AsyncStorage\'dan yükleniyor...');
        const userJson = await AsyncStorage.getItem('user');
        
        if (userJson) {
          const parsedUser = JSON.parse(userJson);
          console.log('Kullanıcı bulundu:', parsedUser.email);
          
          // API ile doğrulama yap
          const isValid = await validateUserWithApi(parsedUser);
          
          if (isValid) {
            setUser(parsedUser);
            console.log('Kullanıcı admin mi?', parsedUser.role === 'admin' ? 'Evet' : 'Hayır');
          } else {
            console.log('Kullanıcı doğrulanamadı, oturum kapatılıyor');
            await AsyncStorage.removeItem('user');
          }
        } else {
          console.log('Kayıtlı kullanıcı bulunamadı');
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi yüklenirken hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log(`Giriş yapılıyor: ${email}`);
      setIsLoading(true);
      
      let foundUser = null;
      
      try {
        // JSON Server'dan kullanıcıları getir
        console.log(`Kullanıcılar alınıyor: ${API_URL}/users`);
        const response = await axios.get(`${API_URL}/users`, { timeout: 5000 });
        const users = response.data;
        
        // Email ve şifreye göre kullanıcıyı bul
        foundUser = users.find(
          (u: any) => u.email === email && u.password === password
        );
        
        console.log('Kullanıcı sorgulama sonucu:', foundUser ? 'Bulundu' : 'Bulunamadı');
      } catch (error) {
        console.error('API erişimi sırasında hata:', error);
        
        // Offline mod - API'ye erişilemiyorsa demo kullanıcılarla devam et
        console.log('Offline mod etkinleştiriliyor - Demo kullanıcılar kullanılacak');
        
        // Demo kullanıcılar
        const demoUsers = [
          {
            id: 1,
            email: "admin@example.com",
            password: "adminpass123",
            name: "Admin",
            role: "admin"
          },
          {
            id: 2,
            email: "user@example.com",
            password: "userpass123",
            name: "Kullanıcı",
            role: "user"
          }
        ];
        
        foundUser = demoUsers.find(u => u.email === email && u.password === password);
        console.log('Demo kullanıcı sorgulama sonucu:', foundUser ? 'Bulundu' : 'Bulunamadı');
      }
      
      if (foundUser) {
        // Şifreyi kullanıcı nesnesinden çıkar
        const { password: pwd, ...userWithoutPassword } = foundUser;
        
        // Kullanıcı bilgisini güncelle
        console.log('Kullanıcı girişi başarılı, bilgiler kaydediliyor');
        console.log('Kullanıcı rolü:', userWithoutPassword.role);
        
        setUser(userWithoutPassword);
        
        // AsyncStorage'a kullanıcı bilgisini kaydet
        await AsyncStorage.setItem('user', JSON.stringify(userWithoutPassword));
        
        return true;
      }
      
      console.log('Giriş başarısız: Kullanıcı bulunamadı veya şifre yanlış');
      return false;
    } catch (error) {
      console.error('Giriş yapılırken beklenmeyen hata oluştu:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Çıkış yapılıyor');
      // AsyncStorage'dan kullanıcı bilgisini sil
      await AsyncStorage.removeItem('user');
      setUser(null);
      console.log('Çıkış başarılı');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const isAdmin = checkIsAdmin();

  const authContextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAdmin,
    checkIsAdmin
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 