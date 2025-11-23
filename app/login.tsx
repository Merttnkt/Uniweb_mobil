import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator } from 'react-native';

// Colors
const colors = {
  primary: '#4F46E5',
  primaryLight: '#818cf8',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red500: '#ef4444',
  red600: '#dc2626',
  white: '#ffffff',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMessage('Lütfen email ve şifrenizi girin');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      await signIn(email, password);
      // AuthGate will automatically redirect to /(tabs) on success
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      setErrorMessage(
        error.error_description || error.message || 'Giriş sırasında bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {authLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>StudyZone</Text>
              <Text style={styles.subtitle}>Giriş Yap</Text>
              <Text style={styles.description}>
                Hesabınıza giriş yaparak sınav hazırlık sürecinizi takip edin
              </Text>
            </View>
            
            <View style={styles.form}>
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={20} color={colors.red600} style={styles.errorIcon} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
            
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color={colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email adresi"
                  placeholderTextColor={colors.gray400}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              
              <View style={[styles.inputContainer, styles.passwordContainer]}>
                <Feather name="lock" size={20} color={colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor={colors.gray400}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.options}>
              <TouchableOpacity 
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Feather 
                  name={rememberMe ? 'check-square' : 'square'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.rememberMeText}>Beni hatırla</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => Alert.alert('Bilgi', 'Şifre sıfırlama özelliği yakında eklenecek.')}
              >
                <Text style={styles.forgotPassword}>Şifremi unuttum</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Feather 
                name="log-in" 
                size={20} 
                color={colors.white} 
                style={styles.buttonIcon} 
              />
              <Text style={styles.buttonText}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Henüz hesabınız yok mı?{' '}</Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Kayıt ol</Text>
                </TouchableOpacity>
              </Link>
            </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray700,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red50,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: colors.red600,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: colors.white,
    shadowColor: colors.gray200,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: 12,
  },
  passwordContainer: {
    borderBottomWidth: 0,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: colors.gray900,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 8,
    color: colors.gray700,
  },
  forgotPassword: {
    color: colors.primary,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  buttonIcon: {
    position: 'absolute',
    left: 16,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.gray600,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '500',
  },
});
