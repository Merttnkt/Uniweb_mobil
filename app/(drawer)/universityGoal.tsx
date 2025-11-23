import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUserData } from '../../contexts/UserDataContext';

// --- Types --- //
type UniversityType = {
  id: number;
  uni: string;
  bolum: string;
  taban: number;
  son_siralama: number;
};

type NetHedefleriType = {
  turkce: number;
  matematik: number;
  fen: number;
  sosyal: number;
};

type GoalFormDataType = {
  selectedTargetId: number;
  university: UniversityType;
  hedef_net: NetHedefleriType;
  sinav_tarih: string;
  notlar: string;
};

interface ExamResult {
  id: string;
  date: string;
  title: string;
  subjects: {
    id: string;
    subjectId: string;
    name: string;
    correct: number;
    incorrect: number;
    net: number;
    total: number;
  }[];
}

// --- Static Data --- //
const universityTargets: UniversityType[] = [
    { id: 1, uni: 'Boğaziçi Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 530.12, son_siralama: 458 },
    { id: 2, uni: 'İstanbul Teknik Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 526.84, son_siralama: 1250 },
    { id: 3, uni: 'ODTÜ', bolum: 'Bilgisayar Mühendisliği', taban: 525.78, son_siralama: 1320 },
    { id: 4, uni: 'Koç Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 522.95, son_siralama: 1580 },
    { id: 5, uni: 'Sabancı Üniversitesi', bolum: 'Bilgisayar Bilimi ve Mühendisliği', taban: 519.23, son_siralama: 2240 },
    { id: 6, uni: 'Bilkent Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 515.67, son_siralama: 3150 },
    { id: 7, uni: 'Yıldız Teknik Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 505.45, son_siralama: 5800 },
    { id: 8, uni: 'Marmara Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 495.32, son_siralama: 9740 },
    { id: 9, uni: 'Ege Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 485.76, son_siralama: 14500 },
    { id: 10, uni: 'Ankara Üniversitesi', bolum: 'Bilgisayar Mühendisliği', taban: 482.45, son_siralama: 17250 },
];

const UniversityGoal = () => {
  const { userData, fetchData: refreshUserData, user } = useUserData();
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [latestExam, setLatestExam] = useState<ExamResult | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);

  const [goalData, setGoalData] = useState<Omit<GoalFormDataType, 'sinav_tarih'>>({
    selectedTargetId: 1,
    university: universityTargets[0],
    hedef_net: { turkce: 36.5, matematik: 37, fen: 18, sosyal: 20 },
    notlar: 'YKS için özellikle Matematik ve Fen konularında daha fazla çalışmam gerekiyor.'
  });

  // editingData will hold the sinav_tarih for the form
  const [editingData, setEditingData] = useState<GoalFormDataType>({
    ...goalData, // spread existing goalData (which doesn't have sinav_tarih)
    sinav_tarih: userData?.targetExamDate || '', // Initialize with context or empty
    // Ensure other fields of GoalFormDataType are present if not in Omit<GoalFormDataType, 'sinav_tarih'>
    selectedTargetId: goalData.selectedTargetId,
    university: goalData.university,
    hedef_net: goalData.hedef_net,
    notlar: goalData.notlar,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchGoalData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('university_goals')
        .select('*, goal_net_targets(*)')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const targetNets = {
          turkce: data.goal_net_targets.find((n: any) => n.subject === 'Türkçe')?.target_net || 36.5,
          matematik: data.goal_net_targets.find((n: any) => n.subject === 'Matematik')?.target_net || 37,
          fen: data.goal_net_targets.find((n: any) => n.subject === 'Fen Bilimleri')?.target_net || 18, // Standardized name
          sosyal: data.goal_net_targets.find((n: any) => n.subject === 'Sosyal Bilgiler')?.target_net || 20 // Standardized name
        };

        const targetUniversity = universityTargets.find(uni => uni.uni === data.uni && uni.bolum === data.bolum) || universityTargets[0];
        const selectedTargetId = targetUniversity.id;

        const loadedGoalData = {
          selectedTargetId: selectedTargetId,
          university: targetUniversity,
          hedef_net: targetNets,
          notlar: data.notlar || ''
          // sinav_tarih is no longer part of goalData directly from here
        };
        setGoalData(loadedGoalData);
        // Initialize editingData's sinav_tarih from context when data loads
        setEditingData({
            ...loadedGoalData, // spread other goal data
            sinav_tarih: userData?.targetExamDate || (data.sinav_tarih_fallback_from_university_goals || ''), // Keep existing editingData structure
        });
      }
    } catch (err: any) {
      console.error('Üniversite hedefi yüklenirken hata:', err);
      setLoadError('Üniversite hedefi yüklenirken bir hata oluştu.');
    }
  };

  const fetchLatestExam = async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('exams')
        .select('*, exam_subjects(*, subjects(name))') // Ensure 'subjects(name)' is correct if 'name' is on the 'subjects' table
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Supabase fetch error in fetchLatestExam:', fetchError);
        throw fetchError;
      }

      if (data && data.length > 0 && data[0]) {
        const examData = data[0];
        
        // Ensure exam_subjects is an array, default to empty if not or if examData is problematic
        const examSubjects = (examData && Array.isArray(examData.exam_subjects)) ? examData.exam_subjects : [];

        const formattedExam: ExamResult = {
          id: examData.id,
          date: examData.date,
          title: examData.name, 
          subjects: examSubjects.map((res: any) => {
            const correct = res.correct || 0;
            const incorrect = res.incorrect || 0;
            const empty = res.empty || 0;
            // Safely access nested subject name
            const subjectName = (res.subjects && typeof res.subjects.name === 'string') ? res.subjects.name : 'Bilinmeyen Ders';
            return {
              id: res.id, 
              subjectId: res.subject_id, 
              name: subjectName, 
              correct: correct,
              incorrect: incorrect,
              net: res.net ?? (correct - incorrect * 0.25), 
              total: correct + incorrect + empty,
            };
          }),
        };
        setLatestExam(formattedExam);
      } else {
        setLatestExam(null); // No exam found
      }
    } catch (err: any) {
      console.error('Son sınav yüklenirken hata (fetchLatestExam):', err.message || err);
      setLatestExam(null); // Clear latest exam on error
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) {
        throw new Error('Kullanıcı kimliği alınamadı');
      }
      await fetchGoalData(userId);
      await fetchLatestExam(userId);
    } catch (err: any) {
      console.error('Veri yüklenirken hata:', err);
      setLoadError(err.message || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchData();
    // updateDaysLeft will be replaced by a useEffect hook listening to userData.targetExamDate
  }, [fetchData]));

  useEffect(() => {
    if (userData && userData.targetExamDate) {
      const targetDate = new Date(userData.targetExamDate);
      if (!isNaN(targetDate.getTime())) {
        const today = new Date();
        const targetExamStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.ceil((targetExamStartOfDay.getTime() - todayStartOfDay.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(diffDays >= 0 ? diffDays : 0);
      } else {
        setDaysLeft(0); // Invalid date from context
      }
    } else {
      // If targetExamDate is null/undefined from context (after context's own default logic)
      setDaysLeft(0); 
    }
  }, [userData?.targetExamDate]);


  const currentNets = useMemo(() => {
    if (!latestExam || !latestExam.subjects) return { turkce: 0, matematik: 0, fen: 0, sosyal: 0 };
    const findNet = (name: string) => latestExam.subjects.find(s => s.name.toLowerCase() === name)?.net || 0;
    return {
      turkce: findNet('türkçe'),
      matematik: findNet('matematik'),
      fen: findNet('fen bilimleri'),
      sosyal: findNet('sosyal bilimler')
    };
  }, [latestExam]);

  const currentTotalScore = useMemo(() => {
    const { turkce, matematik, fen, sosyal } = currentNets;
    return 100 + (turkce * 3.3) + (matematik * 3.3) + (fen * 3.4) + (sosyal * 3.4);
  }, [currentNets]);

  const progress = Math.min(Math.round((currentTotalScore / (goalData.university.taban || 1)) * 100), 100);

  const subjectProgress = [
    { name: 'Türkçe', current: currentNets.turkce, target: goalData.hedef_net.turkce, color: '#EF4444' },
    { name: 'Matematik', current: currentNets.matematik, target: goalData.hedef_net.matematik, color: '#3B82F6' },
    { name: 'Fen', current: currentNets.fen, target: goalData.hedef_net.fen, color: '#22C55E' },
    { name: 'Sosyal', current: currentNets.sosyal, target: goalData.hedef_net.sosyal, color: '#F97316' }
  ];

  const handleInputChange = (name: string, value: string | number) => {
    setEditingData(prev => {
      if (name === 'selectedTargetId') {
        const newUniversity = universityTargets.find(uni => uni.id === value);
        return {
          ...prev,
          selectedTargetId: value as number,
          university: newUniversity || prev.university, // Fallback to previous if not found
        };
      }
      if (name.startsWith('hedef_net.')) {
        return {
          ...prev,
          hedef_net: { ...prev.hedef_net, [name.split('.')[1]]: parseFloat(value as string) || 0 }
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const saveToDatabase = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      // Yetkilendirilmiş kullanıcı ID'sini al (university_goals için)
      const userAuthResponse = await supabase.auth.getUser();
      const currentAuthUserId = userAuthResponse.data.user?.id;
      if (!currentAuthUserId) throw new Error('Kullanıcı kimliği alınamadı');

      // editingData'dan sınav tarihini ve diğer detayları ayır
      const { sinav_tarih: newExamDate, ...universityGoalDetailsFromEditingData } = editingData;

      // 1. 'university_goals' tablosu için veriyi hazırla
      const goalDataForDB = {
        uni: universityGoalDetailsFromEditingData.university.uni,
        bolum: universityGoalDetailsFromEditingData.university.bolum,
        taban: universityGoalDetailsFromEditingData.university.taban,
        son_siralama: universityGoalDetailsFromEditingData.university.son_siralama,
        notlar: universityGoalDetailsFromEditingData.notlar,
        user_id: currentAuthUserId,
      };

      // 2. 'university_goals' tablosuna upsert yap ve goalId'yi al
      let goalId: number;
      const { data: upsertedGoalData, error: upsertError } = await supabase
        .from('university_goals')
        .upsert(goalDataForDB, { onConflict: 'user_id' })
        .select('id')
        .single();

      if (upsertError) {
        console.error('Error upserting university_goals:', upsertError);
        throw upsertError;
      }
      if (!upsertedGoalData || !upsertedGoalData.id) {
        throw new Error('Hedef ID alınamadı (upsert sonrası).');
      }
      goalId = upsertedGoalData.id;

      // 3. Eski 'goal_net_targets' kayıtlarını sil
      const { error: deleteNetsError } = await supabase
        .from('goal_net_targets')
        .delete()
        .eq('goal_id', goalId);

      if (deleteNetsError) {
        console.error('Error deleting old goal_net_targets:', deleteNetsError);
        // Kritik bir hata değilse logla ve devam et
      }

      // 4. Yeni 'goal_net_targets' kayıtlarını ekle
      const targetNetsToSave = Object.entries(universityGoalDetailsFromEditingData.hedef_net).map(([subject, target_net_value]) => ({
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        target_net: typeof target_net_value === 'number' ? target_net_value : parseFloat(target_net_value as string) || 0,
        goal_id: goalId,
      }));

      if (targetNetsToSave.length > 0) {
        const { error: insertNetsError } = await supabase
          .from('goal_net_targets')
          .insert(targetNetsToSave);
        if (insertNetsError) {
          console.error('Error inserting new goal_net_targets:', insertNetsError);
          throw insertNetsError;
        }
      }

      // 5. 'profiles' tablosundaki target_exam_date'i güncelle
      // 'user' objesi useUserData context'inden geliyor ve profil ID'sini içeriyor
      if (user && user.id && newExamDate) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ target_exam_date: newExamDate })
          .eq('id', user.id); // Context'ten gelen user.id'yi kullan

        if (profileError) {
          console.error('Error updating target_exam_date in profiles:', profileError);
          Alert.alert('Hata', 'Sınav tarihi profilde güncellenirken bir sorun oluştu: ' + profileError.message);
        }
      } else if (newExamDate && (!user || !user.id)) {
         console.warn("Sınav tarihi ('" + newExamDate + "') var ama güncellenecek kullanıcı profili ID'si context'te bulunamadı.");
      }
      
      // 6. Lokal UI state'lerini güncelle
      // goalData, sinav_tarih içermemeli
      const { sinav_tarih: _excludedExamDate, ...displayGoalData } = editingData; 
      setGoalData(displayGoalData);
      setEditing(false);
      setMessage({ text: 'Hedef başarıyla kaydedildi!', type: 'success' });

      // 7. UserDataContext'i yenile (tüm uygulama güncel tarihi alır)
      if (refreshUserData) {
        await refreshUserData();
      }

    } catch (err: any) {
      console.error('Hedef kaydedilirken hata:', err);
      setMessage({ text: `Hata: ${err.message || 'Bilinmeyen bir hata oluştu'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /><Text style={styles.loadingText}>Hedefleriniz yükleniyor...</Text></View>;
  }

  if (loadError) {
    return <View style={styles.centered}><Text style={styles.errorText}>{loadError}</Text><TouchableOpacity onPress={() => fetchData()} style={styles.retryButton}><Text style={styles.retryButtonText}>Yeniden Dene</Text></TouchableOpacity></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {message && (
        <View style={[styles.messageBox, message.type === 'success' ? styles.successBox : styles.errorBox]}>
          <Text style={message.type === 'success' ? styles.successText : styles.errorText}>{message.text}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}><Feather name="target" size={24} color="#2563EB" /> Üniversite Hedefim</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={[styles.button, editing ? styles.cancelButton : styles.editButton]}>
          <Feather name={editing ? 'x' : 'edit'} size={16} color={editing ? '#374151' : '#FFFFFF'} />
          <Text style={[styles.buttonText, editing ? styles.cancelButtonText : {}]}>{editing ? 'İptal' : 'Düzenle'}</Text>
        </TouchableOpacity>
      </View>

      {editing ? (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Hedef Üniversite</Text>
          <View style={styles.pickerContainer}>
            <Picker
                selectedValue={editingData.selectedTargetId}
                onValueChange={(itemValue) => handleInputChange('selectedTargetId', itemValue)}
                prompt="Hedef Üniversite Seçin"
                style={{ height: Platform.OS === 'ios' ? 200 : 60, width: '100%' }} 
                itemStyle={{ color: '#000000', fontSize: 16 }} 
              >
                {universityTargets.map(uni => (
                  <Picker.Item key={uni.id} label={`${uni.uni} - ${uni.bolum}`} value={uni.id} color="#000000" /> 
                ))}
              </Picker>
          </View>

          <Text style={styles.label}>Sınav Tarihi</Text>
          <TextInput style={styles.input} value={editingData.sinav_tarih} onChangeText={(val) => handleInputChange('sinav_tarih', val)} placeholder="YYYY-AA-GG" />

          <Text style={styles.label}>Hedef Netler</Text>
          <View style={styles.netsGrid}>
            {Object.keys(editingData.hedef_net).map(key => (
              <View key={key} style={styles.netInputContainer}>
                <Text style={styles.netLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <TextInput style={styles.input} value={String(editingData.hedef_net[key as keyof NetHedefleriType])} onChangeText={(val) => handleInputChange(`hedef_net.${key}`, val)} keyboardType="numeric" />
              </View>
            ))}
          </View>

          <Text style={styles.label}>Notlar</Text>
          <TextInput style={[styles.input, styles.textArea]} value={editingData.notlar} onChangeText={(val) => handleInputChange('notlar', val)} multiline={true} numberOfLines={4} />

          <TouchableOpacity onPress={saveToDatabase} disabled={loading} style={[styles.button, styles.saveButton]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="save" size={16} color="#FFFFFF" />}
            <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
            {/* University Info and Progress */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}><Feather name="award" size={18} color="#2563EB" /> Hedef Üniversite</Text>
                    <Text style={styles.rankPill}>{goalData.university.son_siralama}. sıralama</Text>
                </View>
                <Text style={styles.uniName}>{goalData.university.uni}</Text>
                <Text style={styles.uniDept}>{goalData.university.bolum}</Text>
                <View style={styles.scoreRow}>
                    <Text>Taban Puan:</Text>
                    <Text style={{fontWeight: 'bold'}}>{goalData.university.taban}</Text>
                </View>

                <Text style={styles.progressLabel}>Hedefe İlerleme: {progress}%</Text>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                 <Text style={styles.progressSubLabel}>
                    Mevcut puanın: <Text style={{fontWeight: 'bold'}}>{currentTotalScore.toFixed(2)}</Text>. 
                    Hedefe <Text style={{fontWeight: 'bold'}}>{(goalData.university.taban - currentTotalScore).toFixed(2)}</Text> puan kaldı.
                </Text>
            </View>

            {/* Countdown */}
            <View style={[styles.card, styles.countdownCard]}>
                <Text style={styles.countdownTitle}>Sınava Kalan Süre</Text>
                <Text style={styles.countdownDays}>{daysLeft}</Text>
                <Text style={styles.countdownUnit}>Gün</Text>
            </View>

            {/* Subject Progress */}
            <View style={styles.card}>
                 <Text style={styles.cardTitle}><Feather name="bar-chart-2" size={18} /> Ders Bazlı İlerleme</Text>
                 <View style={styles.subjectGrid}>
                    {Object.entries(goalData.hedef_net).map(([key, targetNet]) => {
        const subjectNameMap: Record<string, string> = {
          turkce: 'Türkçe',
          matematik: 'Matematik',
          fen: 'Fen Bilimleri',
          sosyal: 'Sosyal Bilgiler',
        };
        const canonicalName = subjectNameMap[key as keyof NetHedefleriType] || key;
        const actualNet = latestExam?.subjects.find(s => s.name === canonicalName)?.net;
        const progress = targetNet > 0 && actualNet ? (actualNet / targetNet) * 100 : 0;

        return (
            <View key={key} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                    <Text style={styles.label}>{canonicalName}</Text>
                    <Text style={styles.progressSubLabel}>
                        Hedef: {targetNet.toFixed(1)} / Son Sınav: {actualNet !== undefined ? actualNet.toFixed(1) : 'N/A'}
                    </Text>
                </View>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
                {actualNet !== undefined && targetNet > 0 && (
                    <Text style={styles.progressSubLabel}>
                        {actualNet >= targetNet ? 'Hedefe ulaşıldı!' : `Hedefe ${ (targetNet - actualNet).toFixed(1)} net kaldı.`}
                    </Text>
                )}
            </View>
        );
    })}
                 </View>
            </View>

            {/* Notes */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}><Feather name="book-open" size={18} /> Notlar</Text>
                <Text style={styles.notesText}>{goalData.notlar || 'Henüz not eklenmemiş.'}</Text>
            </View>
        </View>
      )}
    </ScrollView>
  );
};

// --- Styles --- //
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#4B5563' },
  errorText: { color: '#DC2626', textAlign: 'center' },
  retryButton: { marginTop: 15, backgroundColor: '#DC2626', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  messageBox: { padding: 15, borderRadius: 8, marginBottom: 15 },
  successBox: { backgroundColor: '#D1FAE5' },
  errorBox: { backgroundColor: '#FEE2E2' },
  successText: { color: '#065F46' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', flexDirection: 'row', alignItems: 'center' },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { marginLeft: 5, color: '#FFFFFF', fontWeight: '600' },
  editButton: { backgroundColor: '#2563EB' },
  cancelButton: { backgroundColor: '#E5E7EB' },
  cancelButtonText: { color: '#374151' },
  saveButton: { backgroundColor: '#2563EB', justifyContent: 'center' },
  formContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 15, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  netsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  netInputContainer: { width: '48%', marginBottom: 10 },
  netLabel: { marginBottom: 5, color: '#4B5563' },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flexDirection: 'row', alignItems: 'center' },
  rankPill: { backgroundColor: '#DBEAFE', color: '#1E40AF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '500' },
  uniName: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
  uniDept: { color: '#1F2937', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  progressLabel: { marginTop: 15, marginBottom: 5, fontWeight: '500' },
  progressBarBackground: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  progressSubLabel: { marginTop: 5, color: '#4B5563', fontSize: 12 },
  countdownCard: { backgroundColor: '#F59E0B' },
  countdownTitle: { color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  countdownDays: { color: 'white', fontSize: 48, fontWeight: 'bold', textAlign: 'center', marginVertical: 5 },
  countdownUnit: { color: '#FEF3C7', textAlign: 'center' },
  subjectGrid: { marginTop: 10 },
  subjectItem: { marginBottom: 15 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  notesText: { color: '#111827', lineHeight: 22, fontSize: 15 },
});

export default UniversityGoal;
