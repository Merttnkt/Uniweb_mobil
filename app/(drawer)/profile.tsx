import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={40} color="#4F46E5" />
        </View>
        <Text style={styles.userName}>Kullanıcı Adı</Text>
        <Text style={styles.userEmail}>kullanici@example.com</Text>
      </View>
      
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Feather name="user" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>Profil Bilgileri</Text>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Feather name="settings" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ayarlar</Text>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Feather name="help-circle" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>Yardım & Destek</Text>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]}>
          <Feather name="log-out" size={24} color="#EF4444" style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: '#EF4444' }]}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.versionText}>Versiyon 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuContainer: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  logoutButton: {
    marginTop: 24,
    borderBottomWidth: 0,
  },
  versionText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 24,
    marginBottom: 16,
  },
});
