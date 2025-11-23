import { Ionicons } from '@expo/vector-icons'; // For icons
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUserData } from '../../contexts/UserDataContext'; // Ensure this path is correct
import { supabase } from '../../lib/supabase'; // Ensure this path is correct

interface ScheduleItem {
  id?: string;
  day_label: string;
  subject: string;
  time_slot: string;
  status?: string;
  user_id?: string;
}

const daysOfWeek = [
  { id: 'monday', label: 'Pazartesi' },
  { id: 'tuesday', label: 'Salı' },
  { id: 'wednesday', label: 'Çarşamba' },
  { id: 'thursday', label: 'Perşembe' },
  { id: 'friday', label: 'Cuma' },
  { id: 'saturday', label: 'Cumartesi' },
  { id: 'sunday', label: 'Pazar' },
];

const AutomaticSchedulerPage: React.FC = () => {
  const [preferences, setPreferences] = useState({
    studyHoursPerDay: '2',
    preferredDays: [] as string[],
    subjects: 'Matematik, Fizik, Kimya',
    startTime: new Date(new Date().setHours(9, 0, 0, 0)), // Date object for picker
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),   // Date object for picker
    breakDuration: '15',
  });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const { user } = useUserData();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleInputChange = (name: keyof typeof preferences, value: string | string[]) => {
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, type: 'startTime' | 'endTime') => {
    const currentDate = selectedDate || (type === 'startTime' ? preferences.startTime : preferences.endTime);
    setShowStartTimePicker(Platform.OS === 'ios');
    setShowEndTimePicker(Platform.OS === 'ios');
    if (event.type === 'set') {
        setPreferences(prev => ({ ...prev, [type]: currentDate }));
    }
  };

  const handlePreferredDaysChange = (dayId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(dayId)
        ? prev.preferredDays.filter(d => d !== dayId)
        : [...prev.preferredDays, dayId],
    }));
  };

  const fetchSchedule = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('study_schedule_items')
        .select('*')
        .eq('user_id', user.id)
        .order('day_label', { ascending: true })
        .order('time_slot', { ascending: true });

      if (fetchError) throw fetchError;
      setSchedule(data as ScheduleItem[] || []);
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError('Program yüklenirken bir hata oluştu: ' + err.message);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSchedule();
      }
      return () => {}; // Cleanup if needed
    }, [user, fetchSchedule])
  );

  const generateSchedule = async () => {
    setError(null);
    if (!preferences.studyHoursPerDay || preferences.preferredDays.length === 0 || !preferences.subjects) {
      setError('Lütfen tüm gerekli alanları doldurun: günlük çalışma saati, tercih edilen günler ve dersler.');
      setSchedule([]);
      return;
    }

    setGenerating(true);
    const generatedSchedule: Omit<ScheduleItem, 'id' | 'status' | 'user_id'>[] = [];
    const subjectsArray = preferences.subjects.split(',').map(s => s.trim()).filter(s => s);
    let subjectIndex = 0;

    const formatTime = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const startHour = preferences.startTime.getHours();
    const endHour = preferences.endTime.getHours();

    preferences.preferredDays.forEach(dayId => {
      const dayLabel = daysOfWeek.find(d => d.id === dayId)?.label || dayId;
      let hoursScheduledToday = 0;
      let currentHour = startHour;
      const dailyGoal = parseInt(preferences.studyHoursPerDay);

      while (hoursScheduledToday < dailyGoal && subjectsArray.length > 0 && currentHour < endHour) {
        if (subjectIndex >= subjectsArray.length) subjectIndex = 0;
        const subject = subjectsArray[subjectIndex];
        const sessionEndTime = Math.min(currentHour + 1, endHour);

        generatedSchedule.push({
          day_label: dayLabel,
          subject: subject,
          time_slot: `${String(currentHour).padStart(2, '0')}:00 - ${String(sessionEndTime).padStart(2, '0')}:00`,
        });
        subjectIndex++;
        hoursScheduledToday++;
        currentHour = sessionEndTime + (parseInt(preferences.breakDuration) / 60);
        if (parseInt(preferences.breakDuration) > 0 && hoursScheduledToday < dailyGoal) {
          currentHour = Math.ceil(currentHour);
        }
      }
    });

    if (generatedSchedule.length === 0 && subjectsArray.length > 0) {
      setError('Belirtilen kriterlere uygun bir program oluşturulamadı. Lütfen tercihlerinizi gözden geçirin.');
      setGenerating(false);
      setSchedule([]);
      return;
    }

    if (generatedSchedule.length > 0 && user) {
      try {
        const { error: deleteError } = await supabase
          .from('study_schedule_items')
          .delete()
          .eq('user_id', user.id);
        if (deleteError) throw deleteError;

        const itemsToInsert = generatedSchedule.map(item => ({
          ...item,
          user_id: user.id,
          status: 'pending',
        }));

        const { error: insertError } = await supabase
          .from('study_schedule_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
        await fetchSchedule();
        Alert.alert('Başarılı', 'Çalışma programınız başarıyla oluşturuldu ve kaydedildi.');
      } catch (err: any) {
        console.error('Error saving schedule to Supabase:', err);
        setError('Program kaydedilirken bir hata oluştu: ' + err.message);
      } finally {
        setGenerating(false);
      }
    } else if (subjectsArray.length > 0) {
      setGenerating(false);
      setSchedule([]); // Clear local schedule if nothing was generated to save
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Otomatik Ders Programı</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tercihleriniz</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.label}>Günde Kaç Saat Çalışmak İstersiniz?</Text>
        <TextInput
          style={styles.input}
          value={preferences.studyHoursPerDay}
          onChangeText={(text) => handleInputChange('studyHoursPerDay', text)}
          keyboardType="numeric"
          placeholder="Örn: 2"
        />

        <Text style={styles.label}>Çalışılacak Dersler (Virgülle Ayırın):</Text>
        <TextInput
          style={styles.input}
          value={preferences.subjects}
          onChangeText={(text) => handleInputChange('subjects', text)}
          placeholder="Örn: Matematik, Türkçe, Tarih"
        />

        <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
                <Text style={styles.label}>Başlangıç Saati:</Text>
                <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.timeButton}>
                    <Text style={styles.timeButtonText}>{`${String(preferences.startTime.getHours()).padStart(2, '0')}:${String(preferences.startTime.getMinutes()).padStart(2, '0')}`}</Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                    <DateTimePicker
                    value={preferences.startTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => handleTimeChange(event, date, 'startTime')}
                    />
                )}
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.label}>Bitiş Saati:</Text>
                <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.timeButton}>
                    <Text style={styles.timeButtonText}>{`${String(preferences.endTime.getHours()).padStart(2, '0')}:${String(preferences.endTime.getMinutes()).padStart(2, '0')}`}</Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                    <DateTimePicker
                    value={preferences.endTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => handleTimeChange(event, date, 'endTime')}
                    />
                )}
            </View>
        </View>

        <Text style={styles.label}>Mola Süresi (Dakika):</Text>
        <TextInput
          style={styles.input}
          value={preferences.breakDuration}
          onChangeText={(text) => handleInputChange('breakDuration', text)}
          keyboardType="numeric"
          placeholder="Örn: 15"
        />

        <Text style={styles.label}>Hangi Günler Çalışmak İstersiniz?</Text>
        <View style={styles.daysContainer}>
          {daysOfWeek.map(day => (
            <TouchableOpacity
              key={day.id}
              style={[styles.dayButton, preferences.preferredDays.includes(day.id) && styles.dayButtonSelected]}
              onPress={() => handlePreferredDaysChange(day.id)}
            >
              <Ionicons 
                name={preferences.preferredDays.includes(day.id) ? "checkbox" : "square-outline"} 
                size={22} 
                color={preferences.preferredDays.includes(day.id) ? '#FFFFFF' : '#4A5568'}
              />
              <Text style={[styles.dayButtonText, preferences.preferredDays.includes(day.id) && styles.dayButtonTextSelected]}>{day.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={generateSchedule} disabled={generating}>
          {generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>Program Oluştur</Text>}
        </TouchableOpacity>
      </View>

      {loading && !generating && <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 20}} />}
      
      {schedule.length > 0 && !generating && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Çalışma Programınız</Text>
          <ScrollView horizontal>
            <View>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.dayColumn]}>Gün</Text>
                    <Text style={[styles.tableHeaderText, styles.subjectColumn]}>Ders</Text>
                    <Text style={[styles.tableHeaderText, styles.timeColumn]}>Saat</Text>
                    <Text style={[styles.tableHeaderText, styles.statusColumn]}>Durum</Text>
                </View>
                {schedule.map((item, index) => (
                <View key={item.id || `${item.day_label}-${item.time_slot}-${index}`} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                    <Text style={[styles.tableCell, styles.dayColumn]}>{item.day_label}</Text>
                    <Text style={[styles.tableCell, styles.subjectColumn]}>{item.subject}</Text>
                    <Text style={[styles.tableCell, styles.timeColumn]}>{item.time_slot}</Text>
                    <View style={[styles.tableCell, styles.statusColumn]}>
                        <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusBadgeCompleted : styles.statusBadgePending]}>
                            <Text style={styles.statusBadgeText}>
                            {item.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                            </Text>
                        </View>
                    </View>
                </View>
                ))}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contentContainer: { padding: 16 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 15 },
  label: { fontSize: 15, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#111827' },
  errorText: { color: '#DC2626', marginBottom: 10, fontSize: 14 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeContainer: { flex: 1, marginRight: 5, marginLeft: 5 },
  timeButton: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', backgroundColor: '#F9FAFB' },
  timeButtonText: { fontSize: 16, color: '#1F2937' }, 
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 15, marginTop: 5 },
  dayButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  dayButtonSelected: { backgroundColor: '#2563EB', borderColor: '#1D4ED8' },
  dayButtonText: { marginLeft: 6, fontSize: 14, color: '#374151' },
  dayButtonTextSelected: { color: '#FFFFFF', fontWeight: '500' },
  generateButton: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  generateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8, marginBottom: 8, backgroundColor: '#F9FAFB' },
  tableHeaderText: { fontWeight: '600', color: '#4B5563', fontSize: 12, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 10 },
  tableRowEven: { backgroundColor: '#FFFFFF' },
  tableRowOdd: { backgroundColor: '#F9FAFB' },
  tableCell: { fontSize: 14, color: '#1F2937', paddingVertical: 4 },
  dayColumn: { flex: 2, paddingHorizontal: 4 },
  subjectColumn: { flex: 3, paddingHorizontal: 4 },
  timeColumn: { flex: 2, paddingHorizontal: 4 },
  statusColumn: { flex: 2, paddingHorizontal: 4, alignItems: 'flex-start' }, 
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeCompleted: { backgroundColor: '#D1FAE5' },
  statusBadgePending: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 12, fontWeight: '500', color: '#065F46' }, // Default for completed, adjust if needed for pending
});

export default AutomaticSchedulerPage;

