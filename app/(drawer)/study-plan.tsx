import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Context ve Supabase importları (yollarınızı kontrol edin)
import { useUserData } from '../../contexts/UserDataContext';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';

// --- TİPLER VE YARDIMCI FONKSİYONLAR ---

const dayIndexMap: { [key: string]: number } = {
  'Pazartesi': 1, 'Salı': 2, 'Çarşamba': 3, 'Perşembe': 4, 'Cuma': 5, 'Cumartesi': 6, 'Pazar': 0
};

const getDateOfSelectedDay = (selectedDayLabel: string): Date => {
  const today = new Date();
  const currentDayNumber = today.getDay(); // 0 (Sun) to 6 (Sat)
  const targetDayNumber = dayIndexMap[selectedDayLabel];

  // Calculate the difference in days from today
  // If today is Wednesday (3) and target is Monday (1), difference is 1 - 3 = -2
  // If today is Wednesday (3) and target is Friday (5), difference is 5 - 3 = 2
  const differenceInDays = targetDayNumber - currentDayNumber;
  
  const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + differenceInDays);
  targetDate.setHours(0,0,0,0); // Normalize to the beginning of the day for consistency
  return targetDate;
};

const YKS_SUBJECT_CATEGORIES: Record<string, string[]> = {
  'FEN BİLİMLERİ': ['FİZİK', 'KİMYA', 'BİYOLOJİ'],
  'SOSYAL BİLİMLER': ['TARİH', 'COĞRAFYA', 'SOSYAL', 'FELSEFE', 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ'],
  'MATEMATİK': ['MATEMATİK', 'GEOMETRİ'],
  'TÜRKÇE': ['TÜRKÇE', 'EDEBİYAT', 'TÜRK DİLİ VE EDEBİYATI'],
};

const getMainCategory = (subject: string): string => {
  const upperSubject = subject.trim().toLocaleUpperCase('tr-TR');
  for (const category in YKS_SUBJECT_CATEGORIES) {
    if (YKS_SUBJECT_CATEGORIES[category].map(s => s.toLocaleUpperCase('tr-TR')).includes(upperSubject)) {
      return category;
    }
  }
  // If subject is a main category itself or not found, return it capitalized.
  if (Object.keys(YKS_SUBJECT_CATEGORIES).map(k => k.toLocaleUpperCase('tr-TR')).includes(upperSubject)) {
      return upperSubject;
  }
  return subject.trim().toLocaleUpperCase('tr-TR'); // Fallback to subject name if no category matches
};

interface AggregatedStudyItem {
  category: string;
  totalDuration: number; // in minutes
  tasks: AutomaticScheduleItem[];
}

interface AutomaticScheduleItem {
  topic_details?: string;
  id: string;
  user_id: string;
  created_at: string;
  day_label: string;
  subject: string;
  time_slot: string;
  status: string;
}

type AddSessionData = {
  subjectId: string;
  duration: number;
  notes: string;
};

const getDayString = (dateString: string): string => {
  const daysOfWeek = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const date = new Date(dateString);
  return daysOfWeek[date.getDay()];
};

const parseDurationFromTimeSlot = (timeSlot: string): number => {
    try {
        const [startTimeStr, endTimeStr] = timeSlot.split(' - ');
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
        const startDate = new Date(0);
        startDate.setHours(startHours, startMinutes, 0, 0);
        const endDate = new Date(0);
        endDate.setHours(endHours, endMinutes, 0, 0);
        let durationMs = endDate.getTime() - startDate.getTime();
        if (durationMs < 0) {
            durationMs += 24 * 60 * 60 * 1000;
        }
        return Math.round(durationMs / (1000 * 60));
    } catch (e) {
        console.error("Zaman aralığı ayrıştırılamadı:", timeSlot, e);
        return 0;
    }
};

// --- ANA BİLEŞEN ---
const StudyPlanScreen: React.FC = () => {
  // --- STATE'LER VE MANTIK ---
  const { userData, addStudySession, user } = useUserData();
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const today = new Date().getDay();
  const currentDay = days[today === 0 ? 6 : today - 1];
  
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [showAddSession, setShowAddSession] = useState(false);
  const [addSessionData, setAddSessionData] = useState<AddSessionData>({
    subjectId: userData.subjects[0]?.id || '',
    duration: 60,
    notes: '',
  });

  const [automaticSchedule, setAutomaticSchedule] = useState<AutomaticScheduleItem[]>([]);
  const [loadingAutomaticSchedule, setLoadingAutomaticSchedule] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AutomaticScheduleItem | null>(null);
  const [currentTopicDetailInput, setCurrentTopicDetailInput] = useState('');
  const [aggregatedScheduleForSelectedDay, setAggregatedScheduleForSelectedDay] = useState<AggregatedStudyItem[]>([]);

  const fetchAutomaticSchedule = useCallback(async () => {
    if (!user) return;
    setLoadingAutomaticSchedule(true);
    try {
      const { data, error } = await supabase.from('study_schedule_items').select('*').eq('user_id', user.id).order('time_slot', { ascending: true });
      if (error) {
        console.error('Error fetching automatic schedule:', error);
        Alert.alert("Hata", "Otomatik plan yüklenirken bir hata oluştu: " + error.message);
        setAutomaticSchedule([]); // Clear schedule on error
      } else {
        setAutomaticSchedule(data || []);
      }
    } catch (err: any) {
      console.error('Catch fetching automatic schedule:', err);
      Alert.alert("Hata", "Otomatik plan yüklenirken bir hata oluştu (catch): " + err.message);
      setAutomaticSchedule([]); // Clear schedule on error
    } finally {
      setLoadingAutomaticSchedule(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchAutomaticSchedule();
    }, [fetchAutomaticSchedule])
  );

  useEffect(() => {
    const currentDayItems = automaticSchedule.filter(item => item.day_label === selectedDay);

    if (currentDayItems.length > 0) {
        const categoryMap: Record<string, { totalDuration: number; tasks: AutomaticScheduleItem[] }> = {};

        currentDayItems.forEach(item => {
            const mainCat = getMainCategory(item.subject);
            const duration = parseDurationFromTimeSlot(item.time_slot);

            if (!categoryMap[mainCat]) {
                categoryMap[mainCat] = { totalDuration: 0, tasks: [] };
            }
            categoryMap[mainCat].totalDuration += duration;
            categoryMap[mainCat].tasks.push(item);
        });

        const newAggregatedDayData = Object.entries(categoryMap).map(([category, data]) => ({
            category,
            totalDuration: data.totalDuration,
            tasks: data.tasks.sort((a, b) => a.time_slot.localeCompare(b.time_slot)), // Sort tasks by time
        })).sort((a, b) => a.category.localeCompare(b.category)); // Sort categories alphabetically

        setAggregatedScheduleForSelectedDay(newAggregatedDayData);
    } else {
        setAggregatedScheduleForSelectedDay([]);
    }
  }, [automaticSchedule, selectedDay]);

  const handleAddSession = async () => {
    if (!addSessionData.subjectId) {
      Alert.alert("Hata", "Lütfen bir ders seçin.");
      return;
    }
    try {
      await addStudySession({
        date: new Date().toISOString(),
        subjectId: addSessionData.subjectId,
        duration: addSessionData.duration,
        notes: addSessionData.notes,
      });
      setShowAddSession(false);
      setAddSessionData({ subjectId: userData.subjects[0]?.id || '', duration: 60, notes: '' });
      Alert.alert("Başarılı", "Çalışma oturumu eklendi!");
    } catch (error: any) {
      Alert.alert("Hata", "Oturum eklenemedi: " + error.message);
    }
  };

  const handleMarkAsCompleted = async (task: AutomaticScheduleItem) => {
    setAutomaticSchedule(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    const { error } = await supabase.from('study_schedule_items').update({ status: 'completed' }).eq('id', task.id);
    if (error) {
        Alert.alert("Hata", "Görev güncellenemedi.");
        setAutomaticSchedule(prev => prev.map(t => t.id === task.id ? { ...t, status: 'pending' } : t));
        return;
    }
    const duration = parseDurationFromTimeSlot(task.time_slot);
    const mainCategoryOfTask = getMainCategory(task.subject);
    const subject = userData.subjects.find(s => s.name.trim().toLowerCase() === task.subject.trim().toLowerCase());
    if (duration > 0 && subject) {
        const dateForSession = getDateOfSelectedDay(task.day_label).toISOString();
        await addStudySession({
            date: dateForSession,
            subjectId: subject.id,
            duration: duration,
            notes: `Otomatik plan: ${task.subject} tamamlandı.`,
        });
    }
  };

  const handleSaveTopicDetail = async () => {
    if (!editingTask) return;
    setAutomaticSchedule(prev => prev.map(t => t.id === editingTask.id ? { ...t, topic_details: currentTopicDetailInput } : t));
    const { error } = await supabase.from('study_schedule_items').update({ topic_details: currentTopicDetailInput }).eq('id', editingTask.id);
    if (error) {
        Alert.alert("Hata", "Detay güncellenemedi.");
        setAutomaticSchedule(prev => prev.map(t => t.id === editingTask.id ? { ...t, topic_details: editingTask.topic_details } : t));
    }
    setIsEditModalOpen(false);
    setEditingTask(null);
  };
  
  const tasksForSelectedDay = userData.studySessions.map(session => ({...session, day: getDayString(session.date) })).filter(task => task.day === selectedDay);
  const automaticTasksForSelectedDay = automaticSchedule.filter(task => task.day_label === selectedDay);

  const completedDurationBySubject = userData.subjects.reduce((acc, subject) => {
    const totalDuration = userData.studySessions
      .filter(s => s.subjectId === subject.id)
      .reduce((sum, s) => sum + s.duration, 0);
    return { ...acc, [subject.id]: totalDuration };
  }, {} as Record<string, number>);

  const totalCompletedDuration = Object.values(completedDurationBySubject).reduce((sum, duration) => sum + duration, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Haftalık Çalışma Planı</Text>
            <TouchableOpacity onPress={() => setShowAddSession(true)} style={styles.addButton}>
              <Ionicons name="add" color="white" size={20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.aiCard}>
            <Ionicons name="bulb-outline" size={24} color="#4f46e5" />
            <Text style={styles.aiText}>Bu hafta Matematik ve Türkçe'ye ağırlık ver.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
          {days.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, selectedDay === day && styles.dayButtonSelected]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextSelected]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Planlanmış görevler veya boş durum mesajı (Otomatik Plan) */}
        {loadingAutomaticSchedule ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginVertical: 20 }} />
        ) : aggregatedScheduleForSelectedDay.length > 0 ? (
          aggregatedScheduleForSelectedDay.map((aggItem, index) => (
            <View key={`agg-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>{aggItem.category}</Text>
              <Text style={styles.durationText}>Toplam Süre: {Math.floor(aggItem.totalDuration / 60)} saat {aggItem.totalDuration % 60} dakika</Text>
              {aggItem.tasks.map(task => (
                <View key={task.id} style={[styles.taskRow, { marginTop: 8, paddingTop: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskSubject}>{task.subject} <Text style={styles.taskTime}>({task.time_slot})</Text></Text>
                    {task.topic_details ? (
                      <Text style={styles.taskNote}>{task.topic_details}</Text>
                    ) : (
                      <Text style={[styles.taskNote, { fontStyle: 'italic' }]}>Konu detayı eklenmemiş.</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => {
                    setEditingTask(task);
                    setCurrentTopicDetailInput(task.topic_details || '');
                    setIsEditModalOpen(true);
                  }} style={{ padding: 4, marginRight: 12 }}>
                    <Ionicons name="create-outline" size={22} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, task.status === 'completed' ? styles.completedButton : styles.pendingButton]}
                    onPress={() => handleMarkAsCompleted(task)}
                  >
                    <Ionicons name={task.status === 'completed' ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.status === 'completed' ? '#10b981' : '#60a5fa'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Seçili gün için planlanmış ders bulunmamaktadır.</Text>
          </View>
        )}

        {/* Manuel Eklenen Çalışma Görevleri */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Eklenen Çalışmalar: {selectedDay}</Text>
            {tasksForSelectedDay.length > 0 ? (
              tasksForSelectedDay.map(task => (
                <View key={task.id} style={[styles.taskRow, {backgroundColor: '#f0fdf4'}]}>
                  <View style={{flex: 1}}>
                      <Text style={styles.taskSubject}>
                          {userData.subjects.find(s => s.id === task.subjectId)?.name || 'Bilinmeyen Ders'}
                      </Text>
                      <Text style={styles.taskTime}>{task.duration} dakika</Text>
                  </View>
                  <Text style={styles.taskNote} numberOfLines={2}>{task.notes || '-'}</Text>
                  <View style={[styles.statusButton, styles.completedButton]}>
                      <Ionicons name="checkmark-done" size={18} color="#166534"/>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Bugün için eklenmiş çalışma yok.</Text>
            )}
        </View>

          {/* Haftalık Özet */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Haftalık Özet</Text>
            <Text style={styles.subHeader}>Ders Dağılımı</Text>
            {userData.subjects.map(subject => {
                const totalMinutes = completedDurationBySubject[subject.id] || 0;
                const percent = totalCompletedDuration > 0 ? Math.round((totalMinutes / totalCompletedDuration) * 100) : 0;
                return (
                    <View key={subject.id} style={{marginBottom: 12}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                            <Text style={styles.subjectNameText}>{subject.name}</Text>
                            <Text style={styles.durationText}>{totalMinutes} dk ({percent}%)</Text>
                        </View>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarForeground, {width: `${percent}%`}]} />
                        </View>
                    </View>
                )
            })}
          </View>
        </View>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={showAddSession} transparent={true} animationType="slide" onRequestClose={() => setShowAddSession(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Çalışma Oturumu Ekle</Text>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={addSessionData.subjectId} onValueChange={itemValue => setAddSessionData({...addSessionData, subjectId: itemValue})} itemStyle={{ color: '#1f2937' }}>
                        {userData.subjects.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
                    </Picker>
                </View>
                <TextInput placeholder="Süre (dk)" keyboardType="numeric" value={String(addSessionData.duration)} onChangeText={text => setAddSessionData({...addSessionData, duration: Number(text)})} style={styles.modalInput} />
                <TextInput placeholder="Notlar" multiline value={addSessionData.notes} onChangeText={text => setAddSessionData({...addSessionData, notes: text})} style={[styles.modalInput, {height: 100, textAlignVertical: 'top'}]}/>
                <TouchableOpacity onPress={handleAddSession} style={[styles.modalButton, {backgroundColor: '#22c55e'}]}>
                    <Text style={styles.modalButtonText}>Kaydet</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAddSession(false)} style={[styles.modalButton, {backgroundColor: '#e5e7eb', marginTop: 10}]}>
                    <Text style={[styles.modalButtonText, {color: '#374151'}]}>İptal</Text>
                </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={isEditModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalContainer}>
             <View style={styles.modalContent}>
                 <Text style={styles.modalTitle}>Konu Detayı Düzenle</Text>
                 <TextInput multiline value={currentTopicDetailInput} onChangeText={setCurrentTopicDetailInput} placeholder="Bugün bu derste neler yaptın?" style={[styles.modalInput, {height: 120, textAlignVertical: 'top'}]}/>
                 <TouchableOpacity onPress={handleSaveTopicDetail} style={[styles.modalButton, {backgroundColor: '#4f46e5'}]}>
                    <Text style={styles.modalButtonText}>Kaydet</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={[styles.modalButton, {backgroundColor: '#e5e7eb', marginTop: 10}]}>
                    <Text style={[styles.modalButtonText, {color: '#374151'}]}>İptal</Text>
                 </TouchableOpacity>
             </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    addButton: { backgroundColor: '#4f46e5', padding: 8, borderRadius: 999 },
    aiCard: { backgroundColor: '#e0e7ff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    aiText: { color: '#3730a3', marginLeft: 12, flex: 1, fontSize: 14 },
    daySelector: { marginHorizontal: -16, paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    dayButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 4 },
    dayButtonSelected: { backgroundColor: '#e0e7ff' },
    dayText: { fontSize: 16, color: '#4b5563' },
    dayTextSelected: { color: '#4f46e5', fontWeight: '600' },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
    taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    taskSubject: { fontSize: 16, fontWeight: '500' },
    taskTime: { fontSize: 12, color: '#6b7280' },
    taskNote: { flex: 1, marginHorizontal: 8, color: '#6b7280', fontStyle: 'italic' },
    statusButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    pendingButton: { backgroundColor: '#dbeafe' },
    completedButton: { backgroundColor: '#dcfce7' },
    emptyText: { color: '#6b7280', textAlign: 'center', paddingVertical: 20 },
    subHeader: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 12 },
    subjectNameText: { color: '#374151', fontWeight: '500'},
    durationText: { color: '#6b7280' },
    progressBarBackground: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
    progressBarForeground: { height: '100%', backgroundColor: '#4f46e5', borderRadius: 4 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', width: '90%', borderRadius: 12, padding: 20, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 16 },
    modalInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 16 },
    modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    modalButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default StudyPlanScreen;