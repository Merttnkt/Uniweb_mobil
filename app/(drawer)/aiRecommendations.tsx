import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../../contexts/UserDataContext'; // Yolu doğrulayın
import { getStudyRecommendations, getExamStrategy, getErrorAnalysis, setApiKey } from '../../lib/aiService'; // Yolu doğrulayın
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// --- ANA BİLEŞEN ---
const AiRecommendationsScreen: React.FC = () => {
  const { userData, getSubjectPerformance, getSubjectNetPerformance } = useUserData();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'study' | 'exam' | 'error'>('study');
  const [recommendations, setRecommendations] = useState<{
    study: string | null;
    exam: string | null;
    error: string | null;
    lastUpdated: { study: Date | null; exam: Date | null; error: Date | null; }
  }>({ study: null, exam: null, error: null, lastUpdated: { study: null, exam: null, error: null } });
  
  const [hasApiKey, setHasApiKey] = useState(false);

  // API anahtarını AsyncStorage'den ve .env'den kontrol eden fonksiyon
  const checkApiKey = useCallback(async () => {
    try {
      const storedKey = await AsyncStorage.getItem('OPENAI_API_KEY');
      if (storedKey) {
        setApiKey(storedKey); // aiService'deki anahtarı ayarla
        setHasApiKey(true);
        return true;
      }
      const envKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (envKey && envKey.length > 10) {
        setApiKey(envKey);
        setHasApiKey(true);
        return true;
      }
      setHasApiKey(false);
      return false;
    } catch (e) {
      console.error('API anahtarı kontrol hatası:', e);
      setHasApiKey(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const getStudyRecommendation = async () => {
    if (!(await checkApiKey())) {
      Alert.alert('API Anahtarı Eksik', 'Lütfen devam etmek için bir API anahtarı girin.');
      return;
    }
    setLoading(true);
    try {
      if (!userData.subjects || userData.subjects.length === 0 || !userData.exams || userData.exams.length === 0) {
        Alert.alert('Veri Yetersiz', 'Çalışma önerisi oluşturmak için yeterli ders ve sınav verisi bulunmuyor.');
        setLoading(false);
        return;
      }
      
      const allSubjectsPerformance = userData.subjects.map(subject => {
        const performance = getSubjectPerformance(subject.id);
        return { name: subject.name, ...performance };
      });

      const response = await getStudyRecommendations(allSubjectsPerformance, null);
      setRecommendations(prev => ({ ...prev, study: response, lastUpdated: { ...prev.lastUpdated, study: new Date() } }));
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Öneri alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getExamRecommendation = async () => {
    if (!(await checkApiKey())) {
      Alert.alert('API Anahtarı Eksik', 'Lütfen devam etmek için bir API anahtarı girin.');
      return;
    }
    setLoading(true);
    try {
        if (!userData.subjects || userData.subjects.length === 0 || !userData.exams || userData.exams.length < 2) {
            Alert.alert('Veri Yetersiz', 'Sınav stratejisi oluşturmak için en az 2 sınav ve ders verisi gereklidir.');
            setLoading(false);
            return;
        }

        const allSubjectsNetPerformance = userData.subjects.map(subject => {
            const performance = getSubjectNetPerformance(subject.id);
            return { name: subject.name, ...performance };
        });

        const response = await getExamStrategy(userData.exams, allSubjectsNetPerformance);
        setRecommendations(prev => ({ ...prev, exam: response, lastUpdated: { ...prev.lastUpdated, exam: new Date() } }));
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Sınav stratejisi alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getErrorRecommendation = async () => {
    if (!(await checkApiKey())) {
      Alert.alert('API Anahtarı Eksik', 'Lütfen devam etmek için bir API anahtarı girin.');
      return;
    }
    setLoading(true);
    try {
      const sortedExams = userData.exams ? [...userData.exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
      const lastExam = sortedExams.length > 0 ? sortedExams[0] : null;

      if (!lastExam) {
        Alert.alert('Veri Eksik', 'Hata analizi için en az bir sınav verisi gereklidir.');
        setLoading(false);
        return;
      }
      const response = await getErrorAnalysis(lastExam);
      setRecommendations(prev => ({ ...prev, error: response, lastUpdated: { ...prev.lastUpdated, error: new Date() } }));
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Hata analizi alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Arayüzde gösterilecek içerik
  const renderContent = () => {
    const recommendationText = recommendations[activeTab];
    const buttonAction = activeTab === 'study' ? getStudyRecommendation : activeTab === 'exam' ? getExamRecommendation : getErrorRecommendation;
    
    return (
      <View>
        <TouchableOpacity onPress={buttonAction} disabled={loading || !hasApiKey} style={[styles.button, (loading || !hasApiKey) && styles.buttonDisabled]}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{recommendationText ? 'Yeniden Oluştur' : 'Analiz Oluştur'}</Text>}
        </TouchableOpacity>
        
        {recommendationText ? (
          <View style={styles.recommendationBox}>
             {/* HTML yerine Markdown render ediyoruz */}
            <Markdown style={{ body: { color: '#333' } }}>{recommendationText}</Markdown>
          </View>
        ) : (
          <View style={styles.emptyStateBox}>
            <Ionicons name={activeTab === 'study' ? 'book-outline' : activeTab === 'exam' ? 'school-outline' : 'bug-outline'} size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analizi</Text>
            <Text style={styles.emptyStateText}>Kişiselleştirilmiş öneriler almak için "Analiz Oluştur" butonuna dokunun.</Text>
          </View>
        )}
      </View>
    );
  };

  // API Anahtarı eksikse gösterilecek uyarı ve ekleme formu
  const ApiKeyMissingAlert = () => {
    const [apiKeyInput, setApiKeyInput] = useState('');
    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) return;
        try {
            await AsyncStorage.setItem('OPENAI_API_KEY', apiKeyInput.trim());
            Alert.alert('Başarılı', 'API Anahtarı kaydedildi. Uygulama yeniden başlatıldığında geçerli olacak.');
            checkApiKey();
        } catch (e) {
            Alert.alert('Hata', 'API Anahtarı kaydedilemedi.');
        }
    };
    return (
        <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={24} color="#f59e0b" />
            <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.warningTitle}>API Anahtarı Eksik</Text>
                <Text style={styles.warningText}>Kişiselleştirilmiş AI önerileri için lütfen .env dosyanızı veya aşağıdaki alanı kullanarak API anahtarınızı girin.</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        value={apiKeyInput}
                        onChangeText={setApiKeyInput}
                        placeholder="sk-..."
                        style={styles.apiKeyInput}
                    />
                    <TouchableOpacity onPress={handleSaveApiKey} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>Yapay Zeka Tavsiyeleri</Text>
          
          {!hasApiKey && <ApiKeyMissingAlert />}

          {/* Tab Menüsü */}
          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setActiveTab('study')} style={[styles.tabButton, activeTab === 'study' && styles.tabButtonActive]}>
              <Ionicons name="book-outline" size={18} color={activeTab === 'study' ? '#4f46e5' : '#6b7280'}/>
              <Text style={[styles.tabText, activeTab === 'study' && styles.tabTextActive]}>Çalışma</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('exam')} style={[styles.tabButton, activeTab === 'exam' && styles.tabButtonActive]}>
              <Ionicons name="school-outline" size={18} color={activeTab === 'exam' ? '#4f46e5' : '#6b7280'}/>
              <Text style={[styles.tabText, activeTab === 'exam' && styles.tabTextActive]}>Sınav</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('error')} style={[styles.tabButton, activeTab === 'error' && styles.tabButtonActive]}>
              <Ionicons name="bug-outline" size={18} color={activeTab === 'error' ? '#4f46e5' : '#6b7280'}/>
              <Text style={[styles.tabText, activeTab === 'error' && styles.tabTextActive]}>Hata Analizi</Text>
            </TouchableOpacity>
          </View>
          
          {/* Aktif Tab içeriği */}
          <View style={{ marginTop: 16 }}>
            {renderContent()}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// StyleSheet API'si ile stilleri tanımlıyoruz
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
    tabContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tabButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 2, borderColor: 'transparent' },
    tabButtonActive: { borderColor: '#4f46e5' },
    tabText: { marginLeft: 8, fontSize: 14, color: '#6b7280', fontWeight: '500' },
    tabTextActive: { color: '#4f46e5' },
    button: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 16 },
    buttonDisabled: { backgroundColor: '#a5b4fc' },
    buttonText: { color: 'white', fontWeight: 'bold' },
    recommendationBox: { backgroundColor: 'white', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    emptyStateBox: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#f3f4f6', borderRadius: 8 },
    emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 12 },
    emptyStateText: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },
    warningBox: { backgroundColor: '#fffbeb', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', marginBottom: 16 },
    warningTitle: { fontWeight: 'bold', color: '#b45309' },
    warningText: { color: '#92400e', marginTop: 4, fontSize: 13 },
    inputContainer: { flexDirection: 'row', marginTop: 12 },
    apiKeyInput: { flex: 1, borderWidth: 1, borderColor: '#fcd34d', backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 6, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
    saveButton: { backgroundColor: '#f59e0b', paddingHorizontal: 12, justifyContent: 'center', borderTopRightRadius: 6, borderBottomRightRadius: 6 },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
});


export default AiRecommendationsScreen;