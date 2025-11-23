import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Reuse the same colors from login
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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Lütfen tüm alanları doldurun');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      // Use the provided name or fallback to the part before @ in email
      const fullName = name || email.split('@')[0];
      
      // Register the user
      await signUp(email, password, fullName);
      
      // Show success message and redirect to login
      // AuthGate will handle the redirection to /(tabs) after successful login
      Alert.alert(
        'Kayıt Başarılı',
        'Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      setErrorMessage(
        error.error_description || error.message || 'Kayıt sırasında bir hata oluştu'
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>StudyZone</Text>
            <Text style={styles.subtitle}>Yeni Hesap Oluştur</Text>
            <Text style={styles.description}>
              Hesap oluşturarak sınav hazırlık sürecinizi takip etmeye başlayın
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
              
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color={colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre (en az 6 karakter)"
                  placeholderTextColor={colors.gray400}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              
              <View style={[styles.inputContainer, styles.passwordContainer]}>
                <Feather name="lock" size={20} color={colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre (Tekrar)"
                  placeholderTextColor={colors.gray400}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Feather 
                  name="user-plus" 
                  size={20} 
                  color={colors.white} 
                  style={styles.buttonIcon} 
                />
              )}
              <Text style={styles.buttonText}>
                {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı?{' '}</Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
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
    position: 'relative',
  },
  buttonDisabled: {
    opacity: 0.7,
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
