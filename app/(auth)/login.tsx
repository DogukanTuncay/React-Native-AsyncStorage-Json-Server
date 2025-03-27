import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme as usePaperTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const paperTheme = usePaperTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen e-posta ve şifre girin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await login(email, password);
      
      if (success) {
        router.replace('/(tabs)');
      } else {
        setError('Geçersiz e-posta veya şifre.');
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: paperTheme.colors.primary }]}>
          Ürün Yönetim Uygulaması
        </Text>
        
        <View style={styles.formContainer}>
          <TextInput
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
          />
          
          <TextInput
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={secureTextEntry}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
            style={styles.input}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
          >
            Giriş Yap
          </Button>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Deneme için kullanıcı bilgileri:
            </Text>
            <Text style={styles.credentials}>
              Admin: admin@example.com / adminpass123
            </Text>
            <Text style={styles.credentials}>
              Kullanıcı: user@example.com / userpass123
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  credentials: {
    textAlign: 'center',
    marginBottom: 4,
  },
}); 